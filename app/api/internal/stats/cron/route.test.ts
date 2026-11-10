import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const syncAllStats = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stats/sync-all-stats", () => ({ syncAllStats }));

import { GET } from "./route";

const configuredSecret = "test-cron-secret";
const fetchedAt = new Date("2026-10-05T12:00:00.000Z");

function request(authorization?: string): Request {
  return new Request("http://localhost/api/internal/stats/cron", {
    method: "GET",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

function successfulProvider(source: "github" | "leetcode") {
  return {
    status: "success" as const,
    snapshot: {
      id: `${source}-snapshot-id`,
      source,
      schemaVersion: 1,
      fetchedAt,
      createdAt: fetchedAt,
    },
  };
}

describe("GET /api/internal/stats/cron", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = configuredSecret;
    syncAllStats.mockReset();
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects a missing authorization header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(syncAllStats).not.toHaveBeenCalled();
  });

  it("rejects an incorrect secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(syncAllStats).not.toHaveBeenCalled();
  });

  it("returns safe metadata when both providers succeed", async () => {
    syncAllStats.mockResolvedValue({
      status: "success",
      github: successfulProvider("github"),
      leetcode: successfulProvider("leetcode"),
    });

    const response = await GET(request(`Bearer ${configuredSecret}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "success",
      github: {
        status: "success",
        snapshot: {
          id: "github-snapshot-id",
          source: "github",
          fetchedAt: fetchedAt.toISOString(),
        },
      },
      leetcode: {
        status: "success",
        snapshot: {
          id: "leetcode-snapshot-id",
          source: "leetcode",
          fetchedAt: fetchedAt.toISOString(),
        },
      },
    });
    expect(syncAllStats).toHaveBeenCalledOnce();
  });

  it("returns partial success when one provider fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    syncAllStats.mockResolvedValue({
      status: "partial",
      github: successfulProvider("github"),
      leetcode: {
        status: "failed",
        error: {
          errorClass: "LeetCodeGraphQLError",
          errorCode: "GRAPHQL_ERROR",
        },
      },
    });

    const response = await GET(request(`Bearer ${configuredSecret}`));
    const responseBody = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(responseBody)).toEqual({
      status: "partial",
      github: {
        status: "success",
        snapshot: {
          id: "github-snapshot-id",
          source: "github",
          fetchedAt: fetchedAt.toISOString(),
        },
      },
      leetcode: { status: "failed" },
    });
    expect(responseBody).not.toContain("GRAPHQL_ERROR");
    expect(errorLog).toHaveBeenCalledWith(
      "Statistics provider synchronization failed.",
      {
        provider: "leetcode",
        errorClass: "LeetCodeGraphQLError",
        errorCode: "GRAPHQL_ERROR",
      },
    );
    expect(errorLog.mock.calls.flat().join(" ")).not.toContain(configuredSecret);
    errorLog.mockRestore();
  });

  it("returns 500 when both providers fail without exposing errors", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    syncAllStats.mockResolvedValue({
      status: "failed",
      github: {
        status: "failed",
        error: { errorClass: "GitHubHttpError", errorCode: "HTTP_ERROR" },
      },
      leetcode: {
        status: "failed",
        error: { errorClass: "LeetCodeHttpError", errorCode: "HTTP_ERROR" },
      },
    });

    const response = await GET(request(`Bearer ${configuredSecret}`));
    const responseBody = await response.text();

    expect(response.status).toBe(500);
    expect(JSON.parse(responseBody)).toEqual({
      status: "failed",
      github: { status: "failed" },
      leetcode: { status: "failed" },
    });
    expect(responseBody).not.toContain("HTTP_ERROR");
    expect(responseBody).not.toContain("HttpError");
    expect(errorLog).toHaveBeenCalledTimes(2);
    errorLog.mockRestore();
  });

  it("does not return raw provider error details to the client", async () => {
    const sensitiveError = "DATABASE_URL=private-provider-response";
    syncAllStats.mockResolvedValue({
      status: "failed",
      github: {
        status: "failed",
        error: { errorClass: "UnknownError" },
      },
      leetcode: {
        status: "failed",
        error: { errorClass: "UnknownError" },
      },
      rawError: sensitiveError,
    });

    const response = await GET(request(`Bearer ${configuredSecret}`));
    const responseBody = await response.text();

    expect(responseBody).not.toContain(sensitiveError);
    expect(responseBody).not.toContain("rawError");
  });
});

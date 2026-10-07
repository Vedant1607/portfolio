import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const syncGitHubStats = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stats/sync-github", () => ({ syncGitHubStats }));

import { GET } from "./route";

const configuredSecret = "test-cron-secret";

function request(authorization?: string): Request {
  return new Request("http://localhost/api/internal/stats/cron", {
    method: "GET",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

describe("GET /api/internal/stats/cron", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = configuredSecret;
    syncGitHubStats.mockReset();
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects a missing authorization header", async () => {
    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(syncGitHubStats).not.toHaveBeenCalled();
  });

  it("rejects an incorrect secret", async () => {
    const response = await GET(request("Bearer wrong-secret"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(syncGitHubStats).not.toHaveBeenCalled();
  });

  it("runs synchronization and returns safe snapshot metadata", async () => {
    const fetchedAt = new Date("2026-10-05T12:00:00.000Z");
    syncGitHubStats.mockResolvedValue({
      id: "snapshot-id",
      source: "github",
      schemaVersion: 1,
      fetchedAt,
      createdAt: fetchedAt,
      data: { username: "must-not-be-returned" },
    });

    const response = await GET(request(`Bearer ${configuredSecret}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "snapshot-id",
      source: "github",
      fetchedAt: fetchedAt.toISOString(),
    });
    expect(syncGitHubStats).toHaveBeenCalledOnce();
  });

  it("returns a generic server error when synchronization fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    syncGitHubStats.mockRejectedValue(new Error("database credentials should not leak"));

    const response = await GET(request(`Bearer ${configuredSecret}`));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "GitHub statistics synchronization failed.",
    });
    expect(errorLog).toHaveBeenCalledWith(
      "GitHub statistics synchronization failed.",
      { error: "Error" },
    );
    expect(errorLog.mock.calls.flat().join(" ")).not.toContain("database credentials");
    errorLog.mockRestore();
  });
});

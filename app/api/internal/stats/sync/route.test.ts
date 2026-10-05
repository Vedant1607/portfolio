import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const syncGitHubStats = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/lib/stats/sync-github", () => ({ syncGitHubStats }));

import { POST } from "./route";

const configuredSecret = "test-sync-secret";

function request(authorization?: string): Request {
  return new Request("http://localhost/api/internal/stats/sync", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : undefined,
  });
}

describe("POST /api/internal/stats/sync", () => {
  beforeEach(() => {
    process.env.STATS_SYNC_SECRET = configuredSecret;
    syncGitHubStats.mockReset();
  });

  afterEach(() => {
    delete process.env.STATS_SYNC_SECRET;
  });

  it("rejects missing or malformed authorization", async () => {
    const missing = await POST(request());
    const malformed = await POST(request("Basic credentials"));

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(syncGitHubStats).not.toHaveBeenCalled();
  });

  it("rejects an incorrect secret", async () => {
    const response = await POST(request("Bearer wrong-secret"));

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
    });

    const response = await POST(request(`Bearer ${configuredSecret}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "snapshot-id",
      source: "github",
      fetchedAt: fetchedAt.toISOString(),
    });
    expect(syncGitHubStats).toHaveBeenCalledOnce();
    const [syncRequest] = syncGitHubStats.mock.calls[0];
    expect(syncRequest.from).toBeInstanceOf(Date);
    expect(syncRequest.to).toBeInstanceOf(Date);
    expect(syncRequest.from.getTime()).toBe(syncRequest.to.getTime() - 365 * 24 * 60 * 60 * 1000);
  });

  it("returns a generic server error when synchronization fails", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    syncGitHubStats.mockRejectedValue(new Error("database credentials should not leak"));

    const response = await POST(request(`Bearer ${configuredSecret}`));

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

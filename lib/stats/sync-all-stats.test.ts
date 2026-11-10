import { beforeEach, describe, expect, it, vi } from "vitest";

const syncGitHubStats = vi.hoisted(() => vi.fn());
const syncLeetCodeStats = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("./sync-github", () => ({ syncGitHubStats }));
vi.mock("./sync-leetcode", () => ({ syncLeetCodeStats }));

import { syncAllStats } from "./sync-all-stats";

const fetchedAt = new Date("2026-11-10T12:00:00.000Z");
const createdAt = new Date("2026-11-10T12:00:01.000Z");

const githubSnapshot = {
  id: "github-snapshot",
  source: "github" as const,
  schemaVersion: 1 as const,
  fetchedAt,
  createdAt,
};

const leetcodeSnapshot = {
  id: "leetcode-snapshot",
  source: "leetcode" as const,
  schemaVersion: 1 as const,
  fetchedAt,
  createdAt,
};

describe("syncAllStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports success when both providers persist snapshots", async () => {
    syncGitHubStats.mockResolvedValue(githubSnapshot);
    syncLeetCodeStats.mockResolvedValue(leetcodeSnapshot);

    await expect(syncAllStats()).resolves.toEqual({
      status: "success",
      github: { status: "success", snapshot: githubSnapshot },
      leetcode: { status: "success", snapshot: leetcodeSnapshot },
    });

    expect(syncGitHubStats).toHaveBeenCalledOnce();
    expect(syncLeetCodeStats).toHaveBeenCalledOnce();
    const [{ from, to }] = syncGitHubStats.mock.calls[0];
    expect(from).toBeInstanceOf(Date);
    expect(to).toBeInstanceOf(Date);
    expect(to.getTime() - from.getTime()).toBe(365 * 24 * 60 * 60 * 1000);
  });

  it("reports partial success when GitHub succeeds and LeetCode fails", async () => {
    const providerError = Object.assign(new Error("private provider detail"), {
      code: "GRAPHQL_ERROR",
    });
    syncGitHubStats.mockResolvedValue(githubSnapshot);
    syncLeetCodeStats.mockRejectedValue(providerError);

    await expect(syncAllStats()).resolves.toEqual({
      status: "partial",
      github: { status: "success", snapshot: githubSnapshot },
      leetcode: {
        status: "failed",
        error: { errorClass: "Error", errorCode: "GRAPHQL_ERROR" },
      },
    });
    expect(syncGitHubStats).toHaveBeenCalledOnce();
    expect(syncLeetCodeStats).toHaveBeenCalledOnce();
  });

  it("reports partial success when LeetCode succeeds and GitHub fails", async () => {
    const providerError = Object.assign(new Error("private provider detail"), {
      code: "HTTP_ERROR",
    });
    syncGitHubStats.mockRejectedValue(providerError);
    syncLeetCodeStats.mockResolvedValue(leetcodeSnapshot);

    await expect(syncAllStats()).resolves.toEqual({
      status: "partial",
      github: {
        status: "failed",
        error: { errorClass: "Error", errorCode: "HTTP_ERROR" },
      },
      leetcode: { status: "success", snapshot: leetcodeSnapshot },
    });
    expect(syncGitHubStats).toHaveBeenCalledOnce();
    expect(syncLeetCodeStats).toHaveBeenCalledOnce();
  });

  it("reports failure when both providers fail", async () => {
    syncGitHubStats.mockRejectedValue(new Error("GitHub details"));
    syncLeetCodeStats.mockRejectedValue(new Error("LeetCode details"));

    await expect(syncAllStats()).resolves.toEqual({
      status: "failed",
      github: { status: "failed", error: { errorClass: "Error" } },
      leetcode: { status: "failed", error: { errorClass: "Error" } },
    });
    expect(syncGitHubStats).toHaveBeenCalledOnce();
    expect(syncLeetCodeStats).toHaveBeenCalledOnce();
  });

  it("returns provider statuses and safe snapshot metadata only", async () => {
    syncGitHubStats.mockResolvedValue({
      ...githubSnapshot,
      data: { username: "private-payload" },
      token: "private-secret",
    });
    syncLeetCodeStats.mockResolvedValue({
      ...leetcodeSnapshot,
      data: { username: "private-payload" },
      token: "private-secret",
    });

    const result = await syncAllStats();

    expect(result).toEqual({
      status: "success",
      github: { status: "success", snapshot: githubSnapshot },
      leetcode: { status: "success", snapshot: leetcodeSnapshot },
    });
    expect(JSON.stringify(result)).not.toContain("private");
    expect(JSON.stringify(result)).not.toContain("token");
  });

  it("invokes both providers even when either provider rejects", async () => {
    syncGitHubStats.mockRejectedValue(new Error("GitHub unavailable"));
    syncLeetCodeStats.mockResolvedValue(leetcodeSnapshot);

    await syncAllStats();

    expect(syncGitHubStats).toHaveBeenCalledOnce();
    expect(syncLeetCodeStats).toHaveBeenCalledOnce();
  });
});

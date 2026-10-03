import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseInsert = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: { insert: databaseInsert } }));
vi.mock("@/db/schema", () => ({
  statsSnapshots: {
    data: "data",
    fetchedAt: "fetchedAt",
    source: "source",
  },
}));

import {
  getGitHubStatsWithFallback,
  type GitHubStatsWithFallbackOptions,
} from "./get-github-stats-with-fallback";
import {
  GitHubStatsCacheMissingError,
  GitHubStatsCacheValidationError,
  GitHubStatsFallbackDatabaseError,
  type GitHubStatsSnapshotData,
} from "./types";
import type { GitHubStats, GitHubStatsRequest } from "../github/types";

const request: GitHubStatsRequest = {
  from: new Date("2026-01-01T00:00:00.000Z"),
  to: new Date("2026-01-31T23:59:59.999Z"),
  username: "vedant",
};

const freshStats: GitHubStats = {
  username: "vedant",
  name: "Vedant",
  avatarUrl: "https://example.com/avatar.png",
  bio: "Developer",
  publicRepositories: 12,
  followers: 34,
  following: 5,
  totalContributions: 42,
  contributionCalendar: [
    {
      date: "2026-01-01",
      contributionCount: 3,
      contributionLevel: "SECOND_QUARTILE",
    },
  ],
};

const cachedStats: GitHubStatsSnapshotData = {
  ...freshStats,
  name: "Cached Vedant",
  totalContributions: 40,
};

const snapshotFetchedAt = new Date("2026-02-01T12:00:00.000Z");

function options(
  overrides: Partial<GitHubStatsWithFallbackOptions> = {},
): GitHubStatsWithFallbackOptions {
  return {
    getStats: vi.fn().mockResolvedValue(freshStats),
    getLatestSnapshot: vi.fn().mockResolvedValue({
      data: cachedStats,
      fetchedAt: snapshotFetchedAt,
    }),
    ...overrides,
  };
}

describe("getGitHubStatsWithFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns fresh GitHub data and does not read the database on success", async () => {
    const getStats = vi.fn().mockResolvedValue(freshStats);
    const getLatestSnapshot = vi.fn();
    const startedAt = Date.now();

    const result = await getGitHubStatsWithFallback(request, {
      getStats,
      getLatestSnapshot,
    });

    expect(result).toMatchObject({ source: "live", data: freshStats });
    expect(result.fetchedAt.getTime()).toBeGreaterThanOrEqual(startedAt);
    expect(result.fetchedAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(getStats).toHaveBeenCalledWith(request);
    expect(getLatestSnapshot).not.toHaveBeenCalled();
  });

  it("returns a valid snapshot when GitHub fails without writing", async () => {
    const providerError = new Error("GitHub unavailable");
    const getStats = vi.fn().mockRejectedValue(providerError);
    const getLatestSnapshot = vi.fn().mockResolvedValue({
      data: cachedStats,
      fetchedAt: snapshotFetchedAt,
    });

    const result = await getGitHubStatsWithFallback(request, {
      getStats,
      getLatestSnapshot,
    });

    expect(result).toEqual({
      source: "cache",
      data: cachedStats,
      fetchedAt: snapshotFetchedAt,
    });
    expect(getLatestSnapshot).toHaveBeenCalledOnce();
    expect(getLatestSnapshot).toHaveBeenCalledWith();
  });

  it("does not invoke the database insert path while reading a fallback", async () => {
    await getGitHubStatsWithFallback(
      request,
      options({
        getStats: vi.fn().mockRejectedValue(new Error("GitHub unavailable")),
      }),
    );

    expect(databaseInsert).not.toHaveBeenCalled();
  });

  it("throws a typed missing-cache error when no snapshot exists", async () => {
    const providerError = new Error("GitHub unavailable");

    await expect(
      getGitHubStatsWithFallback(
        request,
        options({
          getStats: vi.fn().mockRejectedValue(providerError),
          getLatestSnapshot: vi.fn().mockResolvedValue(undefined),
        }),
      ),
    ).rejects.toSatisfy((error) => {
      return (
        error instanceof GitHubStatsCacheMissingError &&
        error.cause === providerError
      );
    });
  });

  it("throws a typed validation error for a malformed snapshot", async () => {
    const result = getGitHubStatsWithFallback(
      request,
      options({
        getStats: vi.fn().mockRejectedValue(new Error("GitHub unavailable")),
        getLatestSnapshot: vi.fn().mockResolvedValue({
          data: { username: "not-a-valid-snapshot" },
          fetchedAt: snapshotFetchedAt,
        }),
      }),
    );

    await expect(result).rejects.toBeInstanceOf(
      GitHubStatsCacheValidationError,
    );
    await expect(result).rejects.toSatisfy((error) => {
      return error instanceof GitHubStatsCacheValidationError &&
        error.issues.length > 0;
    });
  });

  it("throws a typed database error when snapshot lookup fails", async () => {
    const databaseError = new Error("Database unavailable");

    await expect(
      getGitHubStatsWithFallback(
        request,
        options({
          getStats: vi.fn().mockRejectedValue(new Error("GitHub unavailable")),
          getLatestSnapshot: vi.fn().mockRejectedValue(databaseError),
        }),
      ),
    ).rejects.toSatisfy((error) => {
      return (
        error instanceof GitHubStatsFallbackDatabaseError &&
        error.cause === databaseError
      );
    });
  });
});

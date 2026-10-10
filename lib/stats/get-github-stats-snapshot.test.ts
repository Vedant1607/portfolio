import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseSelect = vi.hoisted(() => vi.fn());
const githubFetch = vi.hoisted(() => vi.fn());
const databaseInsert = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({
  db: {
    select: databaseSelect,
    insert: databaseInsert,
  },
}));
vi.mock("@/db/schema", () => ({
  statsSnapshots: {
    data: "data",
    fetchedAt: "fetchedAt",
    source: "source",
  },
}));
vi.mock("@/lib/github/client", () => ({ getGitHubStats: githubFetch }));

import { getLatestGitHubStatsSnapshot } from "./get-github-stats-snapshot";
import {
  GitHubStatsCacheValidationError,
  GitHubStatsSnapshotReadError,
} from "./types";

const validStats = {
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

function databaseQuery(result: unknown[]) {
  const query = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };

  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  databaseSelect.mockReturnValue(query);

  return query;
}

describe("getLatestGitHubStatsSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the newest GitHub snapshot", async () => {
    const fetchedAt = new Date("2026-10-11T12:00:00.000Z");
    const query = databaseQuery([{ data: validStats, fetchedAt }]);

    await expect(getLatestGitHubStatsSnapshot()).resolves.toEqual({
      data: validStats,
      fetchedAt,
    });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(query.orderBy).toHaveBeenCalledOnce();
  });

  it("validates the snapshot payload", async () => {
    databaseQuery([{ data: { username: "invalid" }, fetchedAt: new Date() }]);

    await expect(getLatestGitHubStatsSnapshot()).rejects.toBeInstanceOf(
      GitHubStatsCacheValidationError,
    );
  });

  it("returns null when no GitHub snapshot exists", async () => {
    databaseQuery([]);

    await expect(getLatestGitHubStatsSnapshot()).resolves.toBeNull();
  });

  it("does not invoke GitHub", async () => {
    databaseQuery([]);

    await getLatestGitHubStatsSnapshot();

    expect(githubFetch).not.toHaveBeenCalled();
  });

  it("does not write to the database", async () => {
    databaseQuery([]);

    await getLatestGitHubStatsSnapshot();

    expect(databaseInsert).not.toHaveBeenCalled();
  });

  it("wraps unexpected database read errors", async () => {
    const databaseError = new Error("database credentials should not leak");
    databaseSelect.mockImplementation(() => {
      throw databaseError;
    });

    await expect(getLatestGitHubStatsSnapshot()).rejects.toSatisfy((error) => {
      return (
        error instanceof GitHubStatsSnapshotReadError &&
        error.cause === databaseError
      );
    });
  });
});

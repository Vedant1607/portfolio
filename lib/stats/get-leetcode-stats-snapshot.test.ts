import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseSelect = vi.hoisted(() => vi.fn());
const leetCodeFetch = vi.hoisted(() => vi.fn());
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
vi.mock("@/lib/leetcode/client", () => ({ getLeetCodeStats: leetCodeFetch }));

import { getLatestLeetCodeStatsSnapshot } from "./get-leetcode-stats-snapshot";
import {
  LeetCodeStatsCacheValidationError,
  LeetCodeStatsSnapshotReadError,
} from "./types";

const validStats = {
  username: "vedant0705",
  totalSolved: 71,
  easySolved: 36,
  mediumSolved: 29,
  hardSolved: 6,
  ranking: 2189895,
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

describe("getLatestLeetCodeStatsSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the newest LeetCode snapshot", async () => {
    const fetchedAt = new Date("2026-11-09T12:00:00.000Z");
    const query = databaseQuery([{ data: validStats, fetchedAt }]);

    await expect(getLatestLeetCodeStatsSnapshot()).resolves.toEqual({
      data: validStats,
      fetchedAt,
    });
    expect(query.where).toHaveBeenCalledOnce();
    expect(query.orderBy).toHaveBeenCalledOnce();
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it("validates the snapshot payload", async () => {
    databaseQuery([
      { data: { ...validStats, totalSolved: -1 }, fetchedAt: new Date() },
    ]);

    await expect(getLatestLeetCodeStatsSnapshot()).rejects.toBeInstanceOf(
      LeetCodeStatsCacheValidationError,
    );
  });

  it("returns null when no LeetCode snapshot exists", async () => {
    databaseQuery([]);

    await expect(getLatestLeetCodeStatsSnapshot()).resolves.toBeNull();
  });

  it("does not invoke LeetCode", async () => {
    databaseQuery([]);

    await getLatestLeetCodeStatsSnapshot();

    expect(leetCodeFetch).not.toHaveBeenCalled();
  });

  it("does not write to the database", async () => {
    databaseQuery([]);

    await getLatestLeetCodeStatsSnapshot();

    expect(databaseInsert).not.toHaveBeenCalled();
  });

  it("wraps unexpected database read errors", async () => {
    const databaseError = new Error("database credentials should not leak");
    databaseSelect.mockImplementation(() => {
      throw databaseError;
    });

    await expect(getLatestLeetCodeStatsSnapshot()).rejects.toSatisfy((error) => {
      return (
        error instanceof LeetCodeStatsSnapshotReadError &&
        error.cause === databaseError
      );
    });
  });
});

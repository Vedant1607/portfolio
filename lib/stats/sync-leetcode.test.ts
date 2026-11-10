import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseInsert = vi.hoisted(() => vi.fn());
const getLeetCodeStats = vi.hoisted(() => vi.fn());
const getGitHubStats = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: { insert: databaseInsert } }));
vi.mock("@/db/schema", () => ({
  statsSnapshots: {
    createdAt: "createdAt",
    data: "data",
    fetchedAt: "fetchedAt",
    id: "id",
    source: "source",
  },
}));
vi.mock("@/lib/leetcode/client", () => ({ getLeetCodeStats }));
vi.mock("@/lib/github/client", () => ({ getGitHubStats }));

import { syncLeetCodeStats } from "./sync-leetcode";
import {
  LEETCODE_STATS_SCHEMA_VERSION,
  LeetCodeStatsSnapshotValidationError,
  LeetCodeStatsSnapshotWriteError,
} from "./types";
import type { LeetCodeStats } from "@/lib/leetcode/types";

const leetCodeStats: LeetCodeStats = {
  username: "vedant0705",
  totalSolved: 71,
  easySolved: 36,
  mediumSolved: 29,
  hardSolved: 6,
  ranking: 2189895,
};

function databaseInsertReturning(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const values = vi.fn().mockReturnValue({ returning });
  databaseInsert.mockReturnValue({ values });

  return { values, returning };
}

describe("syncLeetCodeStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches normalized LeetCode stats and inserts a snapshot", async () => {
    const fetchedAt = new Date("2026-11-10T12:00:00.000Z");
    const createdAt = new Date("2026-11-10T12:00:01.000Z");
    getLeetCodeStats.mockResolvedValue(leetCodeStats);
    const query = databaseInsertReturning([
      { id: "snapshot-id", fetchedAt, createdAt },
    ]);

    await expect(syncLeetCodeStats()).resolves.toEqual({
      id: "snapshot-id",
      source: "leetcode",
      schemaVersion: LEETCODE_STATS_SCHEMA_VERSION,
      fetchedAt,
      createdAt,
    });

    expect(getLeetCodeStats).toHaveBeenCalledOnce();
    expect(databaseInsert).toHaveBeenCalledOnce();
    expect(query.values).toHaveBeenCalledWith({
      source: "leetcode",
      schemaVersion: LEETCODE_STATS_SCHEMA_VERSION,
      fetchedAt: expect.any(Date),
      data: leetCodeStats,
    });
    expect(query.returning).toHaveBeenCalledOnce();
    expect(getGitHubStats).not.toHaveBeenCalled();
  });

  it("propagates provider failures without falling back or writing", async () => {
    const providerError = new Error("LeetCode unavailable");
    getLeetCodeStats.mockRejectedValue(providerError);

    await expect(syncLeetCodeStats()).rejects.toBe(providerError);

    expect(databaseInsert).not.toHaveBeenCalled();
    expect(getGitHubStats).not.toHaveBeenCalled();
  });

  it("rejects invalid normalized stats before inserting a snapshot", async () => {
    getLeetCodeStats.mockResolvedValue({
      ...leetCodeStats,
      totalSolved: -1,
    });

    await expect(syncLeetCodeStats()).rejects.toBeInstanceOf(
      LeetCodeStatsSnapshotValidationError,
    );

    expect(databaseInsert).not.toHaveBeenCalled();
  });

  it("wraps database insert failures in a safe typed error", async () => {
    const databaseError = new Error("database credentials should not leak");
    getLeetCodeStats.mockResolvedValue(leetCodeStats);
    databaseInsert.mockImplementation(() => {
      throw databaseError;
    });

    const operation = syncLeetCodeStats();

    await expect(operation).rejects.toBeInstanceOf(
      LeetCodeStatsSnapshotWriteError,
    );
    await expect(operation).rejects.toSatisfy((error) => {
      return (
        error instanceof LeetCodeStatsSnapshotWriteError &&
        !error.message.includes("database credentials") &&
        !("cause" in error)
      );
    });
    expect(getGitHubStats).not.toHaveBeenCalled();
  });
});

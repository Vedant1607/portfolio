import "server-only";

import { db } from "@/db";
import { statsSnapshots } from "@/db/schema";
import { getLeetCodeStats } from "@/lib/leetcode/client";

import {
  LEETCODE_STATS_SCHEMA_VERSION,
  LeetCodeStatsSnapshotWriteError,
  validateLeetCodeStatsSnapshotData,
  type LeetCodeStatsSyncMetadata,
} from "./types";

export async function syncLeetCodeStats(): Promise<LeetCodeStatsSyncMetadata> {
  const leetCodeStats = await getLeetCodeStats();
  const data = validateLeetCodeStatsSnapshotData(leetCodeStats);
  const fetchedAt = new Date();

  try {
    const [snapshot] = await db
      .insert(statsSnapshots)
      .values({
        source: "leetcode",
        schemaVersion: LEETCODE_STATS_SCHEMA_VERSION,
        fetchedAt,
        data: { ...data },
      })
      .returning({
        id: statsSnapshots.id,
        fetchedAt: statsSnapshots.fetchedAt,
        createdAt: statsSnapshots.createdAt,
      });

    if (!snapshot) {
      throw new Error("LeetCode statistics snapshot insert returned no row.");
    }

    return {
      id: snapshot.id,
      source: "leetcode",
      schemaVersion: LEETCODE_STATS_SCHEMA_VERSION,
      fetchedAt: snapshot.fetchedAt,
      createdAt: snapshot.createdAt,
    };
  } catch {
    throw new LeetCodeStatsSnapshotWriteError();
  }
}

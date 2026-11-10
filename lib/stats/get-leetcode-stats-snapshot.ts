import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { statsSnapshots } from "@/db/schema";
import type { LeetCodeStats } from "@/lib/leetcode/types";

import {
  LeetCodeStatsCacheValidationError,
  LeetCodeStatsSnapshotReadError,
  leetCodeStatsSnapshotDataSchema,
} from "./types";

export interface LeetCodeStatsSnapshot {
  data: LeetCodeStats;
  fetchedAt: Date;
}

export async function getLatestLeetCodeStatsSnapshot(): Promise<LeetCodeStatsSnapshot | null> {
  let snapshot: { data: unknown; fetchedAt: Date } | undefined;

  try {
    [snapshot] = await db
      .select({
        data: statsSnapshots.data,
        fetchedAt: statsSnapshots.fetchedAt,
      })
      .from(statsSnapshots)
      .where(eq(statsSnapshots.source, "leetcode"))
      .orderBy(desc(statsSnapshots.fetchedAt))
      .limit(1);
  } catch (error) {
    throw new LeetCodeStatsSnapshotReadError(error);
  }

  if (!snapshot) {
    return null;
  }

  const result = leetCodeStatsSnapshotDataSchema.safeParse(snapshot.data);

  if (!result.success) {
    throw new LeetCodeStatsCacheValidationError(
      result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String),
      })),
      result.error,
    );
  }

  return {
    data: result.data,
    fetchedAt: snapshot.fetchedAt,
  };
}

import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { statsSnapshots } from "@/db/schema";
import type { GitHubStats } from "@/lib/github/types";

import {
  GitHubStatsCacheValidationError,
  GitHubStatsSnapshotReadError,
  githubStatsSnapshotDataSchema,
} from "./types";

export interface GitHubStatsSnapshot {
  data: GitHubStats;
  fetchedAt: Date;
}

export async function getLatestGitHubStatsSnapshot(): Promise<GitHubStatsSnapshot | null> {
  let snapshot: { data: unknown; fetchedAt: Date } | undefined;

  try {
    [snapshot] = await db
      .select({
        data: statsSnapshots.data,
        fetchedAt: statsSnapshots.fetchedAt,
      })
      .from(statsSnapshots)
      .where(eq(statsSnapshots.source, "github"))
      .orderBy(desc(statsSnapshots.fetchedAt))
      .limit(1);
  } catch (error) {
    throw new GitHubStatsSnapshotReadError(error);
  }

  if (!snapshot) {
    return null;
  }

  const result = githubStatsSnapshotDataSchema.safeParse(snapshot.data);

  if (!result.success) {
    throw new GitHubStatsCacheValidationError(
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

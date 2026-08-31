import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { statsSnapshots } from "@/db/schema";
import { getGitHubStats } from "@/lib/github/client";
import type { GitHubStats, GitHubStatsRequest } from "@/lib/github/types";

import {
  GitHubStatsCacheMissingError,
  GitHubStatsCacheValidationError,
  GitHubStatsFallbackDatabaseError,
  githubStatsSnapshotDataSchema,
} from "./types";

export type GitHubStatsWithFallback =
  | { source: "live"; data: GitHubStats; fetchedAt: Date }
  | { source: "cache"; data: GitHubStats; fetchedAt: Date };

type GitHubStatsFetcher = (
  request: GitHubStatsRequest,
) => Promise<GitHubStats>;

interface GitHubStatsSnapshot {
  data: unknown;
  fetchedAt: Date;
}

type LatestGitHubSnapshot = () => Promise<GitHubStatsSnapshot | undefined>;

export interface GitHubStatsWithFallbackOptions {
  getStats?: GitHubStatsFetcher;
  getLatestSnapshot?: LatestGitHubSnapshot;
}

async function getLatestGitHubSnapshot(): Promise<
  GitHubStatsSnapshot | undefined
> {
  const [snapshot] = await db
    .select({
      data: statsSnapshots.data,
      fetchedAt: statsSnapshots.fetchedAt,
    })
    .from(statsSnapshots)
    .where(eq(statsSnapshots.source, "github"))
    .orderBy(desc(statsSnapshots.fetchedAt))
    .limit(1);

  return snapshot;
}

export async function getGitHubStatsWithFallback(
  request: GitHubStatsRequest,
  options: GitHubStatsWithFallbackOptions = {},
): Promise<GitHubStatsWithFallback> {
  const fetchStats = options.getStats ?? getGitHubStats;

  try {
    const data = await fetchStats(request);

    return {
      source: "live",
      data,
      fetchedAt: new Date(),
    };
  } catch (providerError) {
    let snapshot: GitHubStatsSnapshot | undefined;

    try {
      const findSnapshot = options.getLatestSnapshot ?? getLatestGitHubSnapshot;
      snapshot = await findSnapshot();
    } catch (databaseError) {
      throw new GitHubStatsFallbackDatabaseError(databaseError);
    }

    if (!snapshot) {
      throw new GitHubStatsCacheMissingError(providerError);
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
      source: "cache",
      data: result.data,
      fetchedAt: snapshot.fetchedAt,
    };
  }
}

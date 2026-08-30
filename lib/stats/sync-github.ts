import "server-only";

import { db } from "@/db";
import { statsSnapshots } from "@/db/schema";
import { getGitHubStats } from "@/lib/github/client";
import type { GitHubStatsRequest } from "@/lib/github/types";

import {
  GITHUB_STATS_SCHEMA_VERSION,
  GitHubStatsSnapshotValidationError,
  GitHubStatsSnapshotWriteError,
  githubStatsSnapshotDataSchema,
  type GitHubStatsSnapshotData,
  type GitHubStatsSyncMetadata,
} from "./types";

function validateSnapshotData(value: unknown): GitHubStatsSnapshotData {
  const result = githubStatsSnapshotDataSchema.safeParse(value);

  if (!result.success) {
    throw new GitHubStatsSnapshotValidationError(
      result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String),
      })),
    );
  }

  return result.data;
}

export async function syncGitHubStats(
  request: GitHubStatsRequest,
): Promise<GitHubStatsSyncMetadata> {
  const gitHubStats = await getGitHubStats(request);
  const data = validateSnapshotData(gitHubStats);
  const fetchedAt = new Date();

  try {
    const [snapshot] = await db
      .insert(statsSnapshots)
      .values({
        source: "github",
        schemaVersion: GITHUB_STATS_SCHEMA_VERSION,
        fetchedAt,
        data: {
          ...data,
          contributionCalendar: data.contributionCalendar.map((day) => ({
            ...day,
          })),
        },
      })
      .returning({
        id: statsSnapshots.id,
        fetchedAt: statsSnapshots.fetchedAt,
        createdAt: statsSnapshots.createdAt,
      });

    if (!snapshot) {
      throw new Error("GitHub statistics snapshot insert returned no row.");
    }

    return {
      id: snapshot.id,
      source: "github",
      schemaVersion: GITHUB_STATS_SCHEMA_VERSION,
      fetchedAt: snapshot.fetchedAt,
      createdAt: snapshot.createdAt,
    };
  } catch (error) {
    if (error instanceof GitHubStatsSnapshotWriteError) {
      throw error;
    }

    throw new GitHubStatsSnapshotWriteError(error);
  }
}

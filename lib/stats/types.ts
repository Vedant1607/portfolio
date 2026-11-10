import "server-only";

import { z } from "zod";
import type { LeetCodeStats } from "@/lib/leetcode/types";

export const GITHUB_STATS_SCHEMA_VERSION = 1;
export const LEETCODE_STATS_SCHEMA_VERSION = 1;

export const leetCodeStatsSnapshotDataSchema = z.object({
  username: z.string().min(1),
  totalSolved: z.number().int().nonnegative(),
  easySolved: z.number().int().nonnegative(),
  mediumSolved: z.number().int().nonnegative(),
  hardSolved: z.number().int().nonnegative(),
  ranking: z.number().int().nonnegative().nullable(),
});

export type LeetCodeStatsSnapshotData = z.infer<
  typeof leetCodeStatsSnapshotDataSchema
>;

export interface LeetCodeStatsSyncMetadata {
  id: string;
  source: "leetcode";
  schemaVersion: typeof LEETCODE_STATS_SCHEMA_VERSION;
  fetchedAt: Date;
  createdAt: Date;
}

export class LeetCodeStatsSnapshotValidationError extends Error {
  readonly code = "SNAPSHOT_VALIDATION_ERROR";

  constructor(
    readonly issues: ReadonlyArray<{
      message: string;
      path: ReadonlyArray<string | number>;
    }>,
  ) {
    super("Normalized LeetCode stats did not match the snapshot schema.");
    this.name = new.target.name;
  }
}

export class LeetCodeStatsSnapshotWriteError extends Error {
  readonly code = "SNAPSHOT_WRITE_ERROR";

  constructor() {
    super("Failed to persist the LeetCode statistics snapshot.");
    this.name = new.target.name;
  }
}

export class LeetCodeStatsSnapshotReadError extends Error {
  readonly code = "SNAPSHOT_READ_ERROR";

  constructor(readonly cause: unknown) {
    super("Failed to read the LeetCode statistics snapshot.", { cause });
    this.name = new.target.name;
  }
}

export class LeetCodeStatsCacheValidationError extends Error {
  readonly code = "CACHE_VALIDATION_ERROR";

  constructor(
    readonly issues: ReadonlyArray<{
      message: string;
      path: ReadonlyArray<string | number>;
    }>,
    readonly cause: unknown,
  ) {
    super("The cached LeetCode statistics snapshot did not match the snapshot schema.", {
      cause,
    });
    this.name = new.target.name;
  }
}

export function validateLeetCodeStatsSnapshotData(
  value: unknown,
): LeetCodeStats {
  const result = leetCodeStatsSnapshotDataSchema.safeParse(value);

  if (!result.success) {
    throw new LeetCodeStatsSnapshotValidationError(
      result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String),
      })),
    );
  }

  return result.data;
}

const contributionLevelSchema = z.enum([
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
]);

export const githubStatsSnapshotDataSchema = z.object({
  username: z.string().min(1),
  name: z.string().nullable(),
  avatarUrl: z.url(),
  bio: z.string().nullable(),
  publicRepositories: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  totalContributions: z.number().int().nonnegative(),
  contributionCalendar: z.array(
    z.object({
      date: z.iso.date(),
      contributionCount: z.number().int().nonnegative(),
      contributionLevel: contributionLevelSchema,
    }),
  ),
});

export type GitHubStatsSnapshotData = z.infer<
  typeof githubStatsSnapshotDataSchema
>;

export interface GitHubStatsSyncMetadata {
  id: string;
  source: "github";
  schemaVersion: typeof GITHUB_STATS_SCHEMA_VERSION;
  fetchedAt: Date;
  createdAt: Date;
}

export class GitHubStatsSnapshotValidationError extends Error {
  readonly code = "SNAPSHOT_VALIDATION_ERROR";

  constructor(
    readonly issues: ReadonlyArray<{
      message: string;
      path: ReadonlyArray<string | number>;
    }>,
  ) {
    super("Normalized GitHub stats did not match the snapshot schema.");
    this.name = new.target.name;
  }
}

export class GitHubStatsSnapshotWriteError extends Error {
  readonly code = "SNAPSHOT_WRITE_ERROR";

  constructor(readonly cause: unknown) {
    super("Failed to persist the GitHub statistics snapshot.");
    this.name = new.target.name;
  }
}

export class GitHubStatsSnapshotReadError extends Error {
  readonly code = "SNAPSHOT_READ_ERROR";

  constructor(readonly cause: unknown) {
    super("Failed to read the GitHub statistics snapshot.", { cause });
    this.name = new.target.name;
  }
}

export class GitHubStatsCacheMissingError extends Error {
  readonly code = "CACHE_MISSING";

  constructor(readonly cause: unknown) {
    super("GitHub statistics request failed and no cached snapshot exists.", {
      cause,
    });
    this.name = new.target.name;
  }
}

export class GitHubStatsFallbackDatabaseError extends Error {
  readonly code = "FALLBACK_DATABASE_ERROR";

  constructor(readonly cause: unknown) {
    super("GitHub statistics request failed and the cache lookup failed.", {
      cause,
    });
    this.name = new.target.name;
  }
}

export class GitHubStatsCacheValidationError extends Error {
  readonly code = "CACHE_VALIDATION_ERROR";

  constructor(
    readonly issues: ReadonlyArray<{
      message: string;
      path: ReadonlyArray<string | number>;
    }>,
    readonly cause: unknown,
  ) {
    super("The cached GitHub statistics snapshot did not match the snapshot schema.", {
      cause,
    });
    this.name = new.target.name;
  }
}

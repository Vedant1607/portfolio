import "server-only";

import { syncGitHubStats } from "./sync-github";
import { syncLeetCodeStats } from "./sync-leetcode";
import type {
  GitHubStatsSyncMetadata,
  LeetCodeStatsSyncMetadata,
} from "./types";

const ONE_YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

const SAFE_ERROR_CODES = new Set([
  "MISSING_CONFIGURATION",
  "UNKNOWN_USER",
  "HTTP_ERROR",
  "GRAPHQL_ERROR",
  "INVALID_JSON",
  "RESPONSE_VALIDATION_ERROR",
  "SNAPSHOT_VALIDATION_ERROR",
  "SNAPSHOT_WRITE_ERROR",
]);
const SAFE_ERROR_CLASSES = new Set([
  "Error",
  "GitHubGraphQLError",
  "GitHubHttpError",
  "GitHubResponseValidationError",
  "LeetCodeGraphQLError",
  "LeetCodeHttpError",
  "LeetCodeInvalidJsonError",
  "LeetCodeResponseValidationError",
  "LeetCodeUnknownUserError",
  "MissingGitHubConfigurationError",
  "MissingLeetCodeConfigurationError",
  "GitHubStatsSnapshotValidationError",
  "GitHubStatsSnapshotWriteError",
  "LeetCodeStatsSnapshotValidationError",
  "LeetCodeStatsSnapshotWriteError",
]);

export interface SafeSyncError {
  errorClass: string;
  errorCode?: string;
}

export type ProviderSyncResult<TSnapshot> =
  | { status: "success"; snapshot: TSnapshot }
  | { status: "failed"; error: SafeSyncError };

export interface SyncAllStatsResult {
  status: "success" | "partial" | "failed";
  github: ProviderSyncResult<GitHubStatsSyncMetadata>;
  leetcode: ProviderSyncResult<LeetCodeStatsSyncMetadata>;
}

function getSafeError(error: unknown): SafeSyncError {
  const errorClass =
    error instanceof Error && SAFE_ERROR_CLASSES.has(error.name)
      ? error.name
      : "UnknownError";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;

  return {
    errorClass,
    ...(typeof code === "string" && SAFE_ERROR_CODES.has(code)
      ? { errorCode: code }
      : {}),
  };
}

function toProviderResult<TSnapshot>(
  result: PromiseSettledResult<TSnapshot>,
  projectSnapshot: (snapshot: TSnapshot) => TSnapshot,
): ProviderSyncResult<TSnapshot> {
  if (result.status === "fulfilled") {
    return { status: "success", snapshot: projectSnapshot(result.value) };
  }

  return { status: "failed", error: getSafeError(result.reason) };
}

export async function syncAllStats(): Promise<SyncAllStatsResult> {
  const to = new Date();
  const from = new Date(to.getTime() - ONE_YEAR_IN_MILLISECONDS);

  const [githubResult, leetcodeResult] = await Promise.allSettled([
    Promise.resolve().then(() => syncGitHubStats({ from, to })),
    Promise.resolve().then(() => syncLeetCodeStats()),
  ]);

  const github = toProviderResult(githubResult, (snapshot) => ({
    id: snapshot.id,
    source: snapshot.source,
    schemaVersion: snapshot.schemaVersion,
    fetchedAt: snapshot.fetchedAt,
    createdAt: snapshot.createdAt,
  }));
  const leetcode = toProviderResult(leetcodeResult, (snapshot) => ({
    id: snapshot.id,
    source: snapshot.source,
    schemaVersion: snapshot.schemaVersion,
    fetchedAt: snapshot.fetchedAt,
    createdAt: snapshot.createdAt,
  }));
  const successes =
    Number(github.status === "success") + Number(leetcode.status === "success");

  return {
    status: successes === 2 ? "success" : successes === 1 ? "partial" : "failed",
    github,
    leetcode,
  };
}

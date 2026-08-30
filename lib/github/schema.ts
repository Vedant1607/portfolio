import { z } from "zod";

import type { GitHubStats } from "./types";
import { GitHubResponseValidationError } from "./types";

const contributionLevelSchema = z.enum([
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
]);

const githubGraphQLErrorSchema = z.object({
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])).optional(),
});

export const githubGraphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(githubGraphQLErrorSchema).optional(),
});

export const githubStatsResponseSchema = z.object({
  user: z.object({
    login: z.string().min(1),
    name: z.string().nullable(),
    avatarUrl: z.url(),
    bio: z.string().nullable(),
    repositories: z.object({ totalCount: z.number().int().nonnegative() }),
    followers: z.object({ totalCount: z.number().int().nonnegative() }),
    following: z.object({ totalCount: z.number().int().nonnegative() }),
    contributionsCollection: z.object({
      contributionCalendar: z.object({
        totalContributions: z.number().int().nonnegative(),
        weeks: z.array(
          z.object({
            contributionDays: z.array(
              z.object({
                date: z.iso.date(),
                contributionCount: z.number().int().nonnegative(),
                contributionLevel: contributionLevelSchema,
              }),
            ),
          }),
        ),
      }),
    }),
  }),
});

export type GitHubStatsResponse = z.infer<typeof githubStatsResponseSchema>;

function toValidationError(error: z.ZodError): GitHubResponseValidationError {
  return new GitHubResponseValidationError(
    error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.map(String),
    })),
  );
}

export function parseGitHubStatsResponse(value: unknown): GitHubStatsResponse {
  const result = githubStatsResponseSchema.safeParse(value);

  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
}

export function normalizeGitHubStats(response: GitHubStatsResponse): GitHubStats {
  const { user } = response;
  const { contributionCalendar } = user.contributionsCollection;

  return {
    username: user.login,
    name: user.name,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    publicRepositories: user.repositories.totalCount,
    followers: user.followers.totalCount,
    following: user.following.totalCount,
    totalContributions: contributionCalendar.totalContributions,
    contributionCalendar: contributionCalendar.weeks.flatMap((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        contributionCount: day.contributionCount,
        contributionLevel: day.contributionLevel,
      })),
    ),
  };
}

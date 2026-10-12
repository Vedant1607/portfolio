import { z } from "zod";

import type { LeetCodeStats } from "./types";
import {
  LeetCodeResponseValidationError,
  LeetCodeUnknownUserError,
} from "./types";

const leetCodeGraphQLErrorSchema = z.object({
  message: z.string(),
  path: z.array(z.union([z.string(), z.number()])).optional(),
});

export const leetCodeGraphQLResponseSchema = z.object({
  data: z.unknown().optional(),
  errors: z.array(leetCodeGraphQLErrorSchema).optional(),
});

const acceptedSubmissionSchema = z.object({
  difficulty: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export const leetCodeStatsResponseSchema = z.object({
  matchedUser: z
    .object({
      username: z.string().min(1),
      submitStatsGlobal: z.object({
        acSubmissionNum: z.array(acceptedSubmissionSchema),
      }),
      profile: z
        .object({ ranking: z.number().int().nonnegative() })
        .nullable(),
    })
    .nullable(),
});

export type LeetCodeStatsResponse = z.infer<typeof leetCodeStatsResponseSchema>;

function toValidationError(error: z.ZodError): LeetCodeResponseValidationError {
  return new LeetCodeResponseValidationError(
    error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path.map(String),
    })),
  );
}

export function parseLeetCodeStatsResponse(value: unknown): LeetCodeStatsResponse {
  const result = leetCodeStatsResponseSchema.safeParse(value);

  if (!result.success) {
    throw toValidationError(result.error);
  }

  return result.data;
}

export function normalizeLeetCodeStats(
  response: LeetCodeStatsResponse,
): LeetCodeStats {
  if (!response.matchedUser) {
    throw new LeetCodeUnknownUserError("unknown");
  }

  const counts = new Map<string, number>();
  for (const submission of response.matchedUser.submitStatsGlobal.acSubmissionNum) {
    if (counts.has(submission.difficulty)) {
      throw new LeetCodeResponseValidationError([
        {
          message: `Duplicate accepted-submission difficulty: ${submission.difficulty}.`,
          path: ["matchedUser", "submitStatsGlobal", "acSubmissionNum"],
        },
      ]);
    }
    counts.set(submission.difficulty, submission.count);
  }

  const requiredDifficulties = ["All", "Easy", "Medium", "Hard"] as const;
  const missing = requiredDifficulties.filter((difficulty) => !counts.has(difficulty));
  if (missing.length > 0) {
    throw new LeetCodeResponseValidationError([
      {
        message: `Missing accepted-submission difficulties: ${missing.join(", ")}.`,
        path: ["matchedUser", "submitStatsGlobal", "acSubmissionNum"],
      },
    ]);
  }

  return {
    username: response.matchedUser.username,
    totalSolved: counts.get("All")!,
    easySolved: counts.get("Easy")!,
    mediumSolved: counts.get("Medium")!,
    hardSolved: counts.get("Hard")!,
    ranking: response.matchedUser.profile?.ranking ?? null,
  };
}

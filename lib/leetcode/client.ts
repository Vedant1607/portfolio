import "server-only";

import {
  leetCodeGraphQLResponseSchema,
  normalizeLeetCodeStats,
  parseLeetCodeStatsResponse,
} from "./schema";
import {
  LeetCodeGraphQLError,
  LeetCodeHttpError,
  LeetCodeInvalidJsonError,
  LeetCodeResponseValidationError,
  LeetCodeUnknownUserError,
  MissingLeetCodeConfigurationError,
  type LeetCodeFetch,
  type LeetCodeStats,
} from "./types";

const LEETCODE_GRAPHQL_ENDPOINT = "https://leetcode.com/graphql/";

const LEETCODE_STATS_QUERY = `
  query LeetCodeStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
      }
    }
  }
`;

interface LeetCodeGraphQLRequest {
  query: string;
  variables: { username: string };
}

function getConfiguredUsername(): string {
  const username = process.env.LEETCODE_USERNAME;

  if (!username) {
    throw new MissingLeetCodeConfigurationError();
  }

  return username;
}

export async function requestLeetCodeGraphQL(
  request: LeetCodeGraphQLRequest,
  options: { fetcher?: LeetCodeFetch } = {},
): Promise<unknown> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(LEETCODE_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new LeetCodeHttpError(
      response.status,
      response.statusText,
      await response.text(),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new LeetCodeInvalidJsonError();
  }

  const envelope = leetCodeGraphQLResponseSchema.safeParse(payload);
  if (!envelope.success) {
    throw new LeetCodeResponseValidationError(
      envelope.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String),
      })),
    );
  }

  if (envelope.data.errors?.length) {
    throw new LeetCodeGraphQLError(envelope.data.errors);
  }

  return envelope.data.data;
}

export async function getLeetCodeStats(
  options: { fetcher?: LeetCodeFetch } = {},
): Promise<LeetCodeStats> {
  const username = getConfiguredUsername();
  const response = await requestLeetCodeGraphQL(
    {
      query: LEETCODE_STATS_QUERY,
      variables: { username },
    },
    options,
  );

  const parsed = parseLeetCodeStatsResponse(response);
  if (!parsed.matchedUser) {
    throw new LeetCodeUnknownUserError(username);
  }

  return normalizeLeetCodeStats(parsed);
}

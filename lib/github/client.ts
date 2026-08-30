import "server-only";

import {
  githubGraphQLResponseSchema,
  normalizeGitHubStats,
  parseGitHubStatsResponse,
} from "./schema";
import {
  GitHubGraphQLError,
  GitHubHttpError,
  GitHubResponseValidationError,
  MissingGitHubConfigurationError,
  type GitHubFetch,
  type GitHubStats,
  type GitHubStatsRequest,
} from "./types";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const GITHUB_API_VERSION = "2026-03-10";

const GITHUB_STATS_QUERY = `
  query GitHubStats($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      login
      name
      avatarUrl
      bio
      repositories(privacy: PUBLIC) {
        totalCount
      }
      followers {
        totalCount
      }
      following {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

interface GitHubGraphQLRequest<Variables extends Record<string, unknown>> {
  query: string;
  variables: Variables;
}

function requireGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new MissingGitHubConfigurationError("GITHUB_TOKEN");
  }

  return token;
}

function getGitHubUsername(username?: string): string {
  const configuredUsername = username ?? process.env.GITHUB_USERNAME;

  if (!configuredUsername) {
    throw new MissingGitHubConfigurationError("GITHUB_USERNAME");
  }

  return configuredUsername;
}

export async function requestGitHubGraphQL<
  Data,
  Variables extends Record<string, unknown>,
>(
  request: GitHubGraphQLRequest<Variables>,
  options: { fetcher?: GitHubFetch; token?: string } = {},
): Promise<Data> {
  const fetcher = options.fetcher ?? fetch;
  const token = options.token ?? requireGitHubToken();

  const response = await fetcher(GITHUB_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "User-Agent": "vedant-portfolio",
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GitHubHttpError(
      response.status,
      response.statusText,
      await response.text(),
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new GitHubResponseValidationError([
      { message: "Response was not valid JSON.", path: [] },
    ]);
  }

  const envelope = githubGraphQLResponseSchema.safeParse(payload);
  if (!envelope.success) {
    throw new GitHubResponseValidationError(
      envelope.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.map(String),
      })),
    );
  }

  if (envelope.data.errors?.length) {
    throw new GitHubGraphQLError(envelope.data.errors);
  }

  return envelope.data.data as Data;
}

export async function getGitHubStats(
  request: GitHubStatsRequest,
  options: { fetcher?: GitHubFetch } = {},
): Promise<GitHubStats> {
  const username = getGitHubUsername(request.username);
  const response = await requestGitHubGraphQL<unknown, {
    username: string;
    from: string;
    to: string;
  }>(
    {
      query: GITHUB_STATS_QUERY,
      variables: {
        username,
        from: request.from.toISOString(),
        to: request.to.toISOString(),
      },
    },
    options,
  );

  return normalizeGitHubStats(parseGitHubStatsResponse(response));
}

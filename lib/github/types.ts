export type GitHubContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: GitHubContributionLevel;
}

export interface GitHubStats {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepositories: number;
  followers: number;
  following: number;
  totalContributions: number;
  contributionCalendar: GitHubContributionDay[];
}

export interface GitHubStatsRequest {
  from: Date;
  to: Date;
  username?: string;
}

export type GitHubFetch = typeof fetch;

export type GitHubAdapterErrorCode =
  | "MISSING_CONFIGURATION"
  | "HTTP_ERROR"
  | "GRAPHQL_ERROR"
  | "RESPONSE_VALIDATION_ERROR";

export abstract class GitHubAdapterError extends Error {
  abstract readonly code: GitHubAdapterErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class MissingGitHubConfigurationError extends GitHubAdapterError {
  readonly code = "MISSING_CONFIGURATION";

  constructor(variable: "GITHUB_TOKEN" | "GITHUB_USERNAME") {
    super(`${variable} is not set.`);
  }
}

export class GitHubHttpError extends GitHubAdapterError {
  readonly code = "HTTP_ERROR";

  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly responseBody: string,
  ) {
    super(`GitHub GraphQL request failed with HTTP ${status} ${statusText}.`);
  }
}

export interface GitHubGraphQLErrorDetail {
  message: string;
  path?: ReadonlyArray<string | number>;
}

export class GitHubGraphQLError extends GitHubAdapterError {
  readonly code = "GRAPHQL_ERROR";

  constructor(readonly errors: ReadonlyArray<GitHubGraphQLErrorDetail>) {
    super(`GitHub GraphQL returned errors: ${errors.map((error) => error.message).join("; ")}`);
  }
}

export interface GitHubResponseValidationIssue {
  message: string;
  path: ReadonlyArray<string | number>;
}

export class GitHubResponseValidationError extends GitHubAdapterError {
  readonly code = "RESPONSE_VALIDATION_ERROR";

  constructor(readonly issues: ReadonlyArray<GitHubResponseValidationIssue>) {
    super("GitHub GraphQL response did not match the expected schema.");
  }
}

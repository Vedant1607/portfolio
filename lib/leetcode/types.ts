export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number | null;
}

export type LeetCodeFetch = typeof fetch;

export type LeetCodeAdapterErrorCode =
  | "MISSING_CONFIGURATION"
  | "UNKNOWN_USER"
  | "HTTP_ERROR"
  | "GRAPHQL_ERROR"
  | "INVALID_JSON"
  | "RESPONSE_VALIDATION_ERROR";

export abstract class LeetCodeAdapterError extends Error {
  abstract readonly code: LeetCodeAdapterErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class MissingLeetCodeConfigurationError extends LeetCodeAdapterError {
  readonly code = "MISSING_CONFIGURATION";

  constructor() {
    super("LEETCODE_USERNAME is not set.");
  }
}

export class LeetCodeUnknownUserError extends LeetCodeAdapterError {
  readonly code = "UNKNOWN_USER";

  constructor(readonly username: string) {
    super(`LeetCode user "${username}" was not found.`);
  }
}

export class LeetCodeHttpError extends LeetCodeAdapterError {
  readonly code = "HTTP_ERROR";

  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly responseBody: string,
  ) {
    super(`LeetCode GraphQL request failed with HTTP ${status} ${statusText}.`);
  }
}

export interface LeetCodeGraphQLErrorDetail {
  message: string;
  path?: ReadonlyArray<string | number>;
}

export class LeetCodeGraphQLError extends LeetCodeAdapterError {
  readonly code = "GRAPHQL_ERROR";

  constructor(readonly errors: ReadonlyArray<LeetCodeGraphQLErrorDetail>) {
    super(`LeetCode GraphQL returned errors: ${errors.map((error) => error.message).join("; ")}`);
  }
}

export class LeetCodeInvalidJsonError extends LeetCodeAdapterError {
  readonly code = "INVALID_JSON";

  constructor() {
    super("LeetCode GraphQL response was not valid JSON.");
  }
}

export interface LeetCodeResponseValidationIssue {
  message: string;
  path: ReadonlyArray<string | number>;
}

export class LeetCodeResponseValidationError extends LeetCodeAdapterError {
  readonly code = "RESPONSE_VALIDATION_ERROR";

  constructor(readonly issues: ReadonlyArray<LeetCodeResponseValidationIssue>) {
    super("LeetCode GraphQL response did not match the expected schema.");
  }
}

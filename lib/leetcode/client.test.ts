import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLeetCodeStats } from "./client";
import {
  LeetCodeGraphQLError,
  LeetCodeHttpError,
  LeetCodeInvalidJsonError,
  LeetCodeResponseValidationError,
  LeetCodeUnknownUserError,
  MissingLeetCodeConfigurationError,
  type LeetCodeFetch,
} from "./types";

const fetcher = vi.fn() as unknown as LeetCodeFetch;

const validPayload = {
  matchedUser: {
    username: "test-user",
    submitStatsGlobal: {
      acSubmissionNum: [
        { difficulty: "All", count: 123 },
        { difficulty: "Easy", count: 50 },
        { difficulty: "Medium", count: 60 },
        { difficulty: "Hard", count: 13 },
      ],
    },
    profile: { ranking: 4567 },
  },
};

function response(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: vi.fn().mockResolvedValue(payload),
    text: vi.fn().mockResolvedValue(""),
  } as unknown as Response;
}

function dataResponse(payload: unknown): Response {
  return response({ data: payload });
}

describe("getLeetCodeStats", () => {
  beforeEach(() => {
    process.env.LEETCODE_USERNAME = "test-user";
    vi.mocked(fetcher).mockReset();
  });

  afterEach(() => {
    delete process.env.LEETCODE_USERNAME;
  });

  it("normalizes accepted-submission counts and ranking", async () => {
    vi.mocked(fetcher).mockResolvedValue(dataResponse(validPayload));

    await expect(getLeetCodeStats({ fetcher })).resolves.toEqual({
      username: "test-user",
      totalSolved: 123,
      easySolved: 50,
      mediumSolved: 60,
      hardSolved: 13,
      ranking: 4567,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetcher).mock.calls[0];
    expect(url).toBe("https://leetcode.com/graphql/");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      query: expect.stringContaining("acSubmissionNum"),
      variables: { username: "test-user" },
    });
  });

  it("maps difficulty counts independently of response order", async () => {
    vi.mocked(fetcher).mockResolvedValue(
      dataResponse({
        ...validPayload,
        matchedUser: {
          ...validPayload.matchedUser,
          submitStatsGlobal: {
            acSubmissionNum: [
              { difficulty: "Hard", count: 3 },
              { difficulty: "All", count: 30 },
              { difficulty: "Easy", count: 12 },
              { difficulty: "Medium", count: 15 },
            ],
          },
        },
      }),
    );

    await expect(getLeetCodeStats({ fetcher })).resolves.toMatchObject({
      totalSolved: 30,
      easySolved: 12,
      mediumSolved: 15,
      hardSolved: 3,
    });
  });

  it("does not require provider fields outside the normalized model", async () => {
    vi.mocked(fetcher).mockResolvedValue(
      dataResponse({
        matchedUser: {
          username: "test-user",
          submitStatsGlobal: {
            acSubmissionNum: [
              { difficulty: "All", count: 4 },
              { difficulty: "Easy", count: 1 },
              { difficulty: "Medium", count: 2 },
              { difficulty: "Hard", count: 1 },
            ],
          },
          profile: null,
        },
      }),
    );

    await expect(getLeetCodeStats({ fetcher })).resolves.toEqual({
      username: "test-user",
      totalSolved: 4,
      easySolved: 1,
      mediumSolved: 2,
      hardSolved: 1,
      ranking: null,
    });
  });

  it("throws a typed error when the username is not configured", async () => {
    delete process.env.LEETCODE_USERNAME;

    await expect(getLeetCodeStats({ fetcher })).rejects.toBeInstanceOf(
      MissingLeetCodeConfigurationError,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("throws a typed error for an unknown user", async () => {
    vi.mocked(fetcher).mockResolvedValue(dataResponse({ matchedUser: null }));

    await expect(getLeetCodeStats({ fetcher })).rejects.toSatisfy((error) => {
      return error instanceof LeetCodeUnknownUserError && error.username === "test-user";
    });
  });

  it("rejects a malformed GraphQL response", async () => {
    vi.mocked(fetcher).mockResolvedValue(
      dataResponse({ matchedUser: { username: "test-user" } }),
    );

    await expect(getLeetCodeStats({ fetcher })).rejects.toBeInstanceOf(
      LeetCodeResponseValidationError,
    );
  });

  it("surfaces GraphQL errors", async () => {
    vi.mocked(fetcher).mockResolvedValue(
      response({ errors: [{ message: "Too many requests", path: ["matchedUser"] }] }),
    );

    await expect(getLeetCodeStats({ fetcher })).rejects.toSatisfy((error) => {
      return error instanceof LeetCodeGraphQLError && error.errors[0]?.message === "Too many requests";
    });
  });

  it("surfaces non-2xx HTTP failures", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: vi.fn().mockResolvedValue("temporarily unavailable"),
    } as unknown as Response);

    await expect(getLeetCodeStats({ fetcher })).rejects.toSatisfy((error) => {
      return error instanceof LeetCodeHttpError && error.status === 503;
    });
  });

  it("surfaces invalid JSON", async () => {
    vi.mocked(fetcher).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: vi.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
    } as unknown as Response);

    await expect(getLeetCodeStats({ fetcher })).rejects.toBeInstanceOf(
      LeetCodeInvalidJsonError,
    );
  });
});

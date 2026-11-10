import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { syncAllStats } from "@/lib/stats/sync-all-stats";

function getBearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer ([^\s]+)$/i);

  return match?.[1];
}

function secretsMatch(providedSecret: string, configuredSecret: string): boolean {
  const providedDigest = createHash("sha256").update(providedSecret).digest();
  const configuredDigest = createHash("sha256").update(configuredSecret).digest();

  return timingSafeEqual(providedDigest, configuredDigest);
}

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  const providedSecret = getBearerToken(request);

  if (!configuredSecret || !providedSecret) {
    return false;
  }

  return secretsMatch(providedSecret, configuredSecret);
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllStats();

    for (const provider of ["github", "leetcode"] as const) {
      const providerResult = result[provider];
      if (providerResult.status === "failed") {
        console.error("Statistics provider synchronization failed.", {
          provider,
          errorClass: providerResult.error.errorClass,
          ...(providerResult.error.errorCode
            ? { errorCode: providerResult.error.errorCode }
            : {}),
        });
      }
    }

    const toResponseProvider = (
      providerResult: typeof result.github | typeof result.leetcode,
    ) => {
      if (providerResult.status === "failed") {
        return { status: "failed" as const };
      }

      return {
        status: "success" as const,
        snapshot: {
          id: providerResult.snapshot.id,
          source: providerResult.snapshot.source,
          fetchedAt: providerResult.snapshot.fetchedAt,
        },
      };
    };

    return Response.json(
      {
        status: result.status,
        github: toResponseProvider(result.github),
        leetcode: toResponseProvider(result.leetcode),
      },
      { status: result.status === "failed" ? 500 : 200 },
    );
  } catch {
    console.error("Statistics synchronization orchestration failed.", {
      errorClass: "UnexpectedError",
    });

    return Response.json(
      { error: "Statistics synchronization failed." },
      { status: 500 },
    );
  }
}

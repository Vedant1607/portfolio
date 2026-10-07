import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { syncGitHubStats } from "@/lib/stats/sync-github";

const ONE_YEAR_IN_MILLISECONDS = 365 * 24 * 60 * 60 * 1000;

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

  const to = new Date();
  const from = new Date(to.getTime() - ONE_YEAR_IN_MILLISECONDS);

  try {
    const snapshot = await syncGitHubStats({ from, to });

    return Response.json({
      id: snapshot.id,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    });
  } catch (error) {
    console.error("GitHub statistics synchronization failed.", {
      error: error instanceof Error ? error.name : "UnknownError",
    });

    return Response.json(
      { error: "GitHub statistics synchronization failed." },
      { status: 500 },
    );
  }
}

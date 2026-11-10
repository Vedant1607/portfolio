import { HeroMotion } from "@/components/hero/hero-motion";
import { getLatestGitHubStatsSnapshot } from "@/lib/stats/get-github-stats-snapshot";
import { getLatestLeetCodeStatsSnapshot } from "@/lib/stats/get-leetcode-stats-snapshot";

function formatFetchedAt(date: Date) {
  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

function SnapshotTimestamp({ date }: { date: Date }) {
  return (
    <p className="mt-5 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">
      Snapshot fetched <time dateTime={date.toISOString()}>{formatFetchedAt(date)}</time>
    </p>
  );
}

function OverallSyncState({ message }: { message: string }) {
  return (
    <section
      id="stats"
      aria-labelledby="stats-title"
      className="scroll-mt-24 border-b border-white/10 px-6 py-20 sm:px-10 sm:py-28 lg:px-16"
    >
      <HeroMotion>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[9rem_minmax(0,1fr)]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-400">
            03 / Signals
          </p>
          <div className="border border-white/10 bg-white/[0.015] p-7 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">
              Developer statistics
            </p>
            <h2
              id="stats-title"
              className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-4xl"
            >
              {message}
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400">
              The latest public snapshots will appear here after the scheduled
              statistics sync completes.
            </p>
          </div>
        </div>
      </HeroMotion>
    </section>
  );
}

function ProviderSyncState({
  provider,
  failed,
}: {
  provider: "GitHub" | "LeetCode";
  failed: boolean;
}) {
  return (
    <div
      role="status"
      className="mt-6 border border-white/10 bg-white/[0.015] p-6 sm:p-8"
    >
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-cyan-300">
        {failed ? "STATISTICS UNAVAILABLE" : "SYNCING"}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {failed
          ? `${provider} statistics could not be loaded right now.`
          : `The latest ${provider} snapshot will appear after the scheduled sync.`}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 border border-white/10 bg-white/[0.015] p-4 sm:p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-3 break-words text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:mt-4 sm:text-3xl">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
    </div>
  );
}

function GitHubPanel({
  snapshot,
  failed,
}: {
  snapshot: Awaited<ReturnType<typeof getLatestGitHubStatsSnapshot>>;
  failed: boolean;
}) {
  return (
    <section
      aria-labelledby="github-stats-title"
      className="min-w-0 border border-white/10 bg-white/[0.01] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300 sm:text-xs">
            01 / Repository activity
          </p>
          <h3
            id="github-stats-title"
            className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-3xl"
          >
            GitHub
          </h3>
        </div>
        {snapshot ? (
          <p className="max-w-full break-all font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
            @{snapshot.data.username}
          </p>
        ) : null}
      </div>

      {snapshot ? (
        <>
          <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            <StatCard label="Public repositories" value={snapshot.data.publicRepositories} />
            <StatCard label="Followers" value={snapshot.data.followers} />
            <StatCard label="Following" value={snapshot.data.following} />
            <StatCard label="Total contributions" value={snapshot.data.totalContributions} />
          </div>

          <div className="mt-5 min-w-0 border border-white/10 bg-white/[0.015] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-slate-400 sm:text-xs">
                  Contribution calendar
                </p>
                <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                  Last 12 months · {snapshot.data.totalContributions.toLocaleString("en-US")} total contributions
                </p>
              </div>
              <p
                aria-label="Contribution intensity legend: no activity, low, medium, high, highest"
                className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wide text-slate-500"
              >
                <span>No activity</span>
                <span aria-hidden="true" className="text-slate-700">■</span>
                <span aria-hidden="true" className="text-violet-950">■</span>
                <span aria-hidden="true" className="text-violet-700">■</span>
                <span aria-hidden="true" className="text-cyan-500/70">■</span>
                <span aria-hidden="true" className="text-cyan-300">■</span>
                <span>More</span>
              </p>
            </div>
            <div
              role="group"
              aria-label="GitHub contribution calendar. Each day is labeled with its date and contribution count."
              className="mt-5 min-w-0 overflow-x-auto pb-2"
            >
              <div className="grid w-max auto-cols-[0.7rem] grid-flow-col grid-rows-7 gap-1">
                {snapshot.data.contributionCalendar.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.date}: ${day.contributionCount} contributions`}
                    aria-label={`${day.date}: ${day.contributionCount} contributions`}
                    role="img"
                    className={`size-3 rounded-[2px] ${
                      day.contributionLevel === "NONE"
                        ? "bg-slate-800"
                        : day.contributionLevel === "FIRST_QUARTILE"
                          ? "bg-violet-950"
                          : day.contributionLevel === "SECOND_QUARTILE"
                            ? "bg-violet-700"
                            : day.contributionLevel === "THIRD_QUARTILE"
                              ? "bg-cyan-500/70"
                              : "bg-cyan-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <SnapshotTimestamp date={snapshot.fetchedAt} />
        </>
      ) : (
        <ProviderSyncState provider="GitHub" failed={failed} />
      )}
    </section>
  );
}

function LeetCodePanel({
  snapshot,
  failed,
}: {
  snapshot: Awaited<ReturnType<typeof getLatestLeetCodeStatsSnapshot>>;
  failed: boolean;
}) {
  return (
    <section
      aria-labelledby="leetcode-stats-title"
      className="min-w-0 border border-white/10 bg-white/[0.01] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-violet-300 sm:text-xs">
            02 / Problem solving
          </p>
          <h3
            id="leetcode-stats-title"
            className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-3xl"
          >
            LeetCode
          </h3>
        </div>
        {snapshot ? (
          <p className="max-w-full break-all font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
            @{snapshot.data.username}
          </p>
        ) : null}
      </div>

      {snapshot ? (
        <>
          <div className="mt-6 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            <StatCard label="Total solved" value={snapshot.data.totalSolved} />
            <StatCard label="Easy solved" value={snapshot.data.easySolved} />
            <StatCard label="Medium solved" value={snapshot.data.mediumSolved} />
            <StatCard label="Hard solved" value={snapshot.data.hardSolved} />
            <StatCard
              label="Global ranking"
              value={snapshot.data.ranking?.toLocaleString("en-US") ?? "Unranked"}
            />
          </div>
          <SnapshotTimestamp date={snapshot.fetchedAt} />
        </>
      ) : (
        <ProviderSyncState provider="LeetCode" failed={failed} />
      )}
    </section>
  );
}

export async function Stats() {
  const [githubResult, leetcodeResult] = await Promise.allSettled([
    getLatestGitHubStatsSnapshot(),
    getLatestLeetCodeStatsSnapshot(),
  ]);

  const githubSnapshot =
    githubResult.status === "fulfilled" ? githubResult.value : null;
  const leetcodeSnapshot =
    leetcodeResult.status === "fulfilled" ? leetcodeResult.value : null;

  if (
    githubSnapshot === null &&
    leetcodeSnapshot === null &&
    githubResult.status === "fulfilled" &&
    leetcodeResult.status === "fulfilled"
  ) {
    return <OverallSyncState message="STATISTICS SYNCING" />;
  }

  if (
    githubSnapshot === null &&
    leetcodeSnapshot === null &&
    githubResult.status === "rejected" &&
    leetcodeResult.status === "rejected"
  ) {
    return <OverallSyncState message="STATISTICS UNAVAILABLE" />;
  }

  return (
    <section
      id="stats"
      aria-labelledby="stats-title"
      className="scroll-mt-24 border-b border-white/10 px-6 py-20 sm:px-10 sm:py-24 lg:px-16"
    >
      <div className="mx-auto max-w-6xl">
        <HeroMotion>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
                <span aria-hidden="true" className="h-px w-8 bg-cyan-300" />
                03 / Signals
              </p>
              <h2
                id="stats-title"
                className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-slate-50 sm:text-5xl"
              >
                PUBLIC SIGNALS
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              A snapshot of repository activity and problem solving, refreshed daily.
            </p>
          </div>
        </HeroMotion>

        <HeroMotion delay={0.08}>
          <div className="mt-10 grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-5">
            <GitHubPanel
              snapshot={githubSnapshot}
              failed={githubResult.status === "rejected"}
            />
            <LeetCodePanel
              snapshot={leetcodeSnapshot}
              failed={leetcodeResult.status === "rejected"}
            />
          </div>
        </HeroMotion>
      </div>
    </section>
  );
}

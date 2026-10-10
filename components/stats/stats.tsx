import { HeroMotion } from "@/components/hero/hero-motion";
import { getLatestGitHubStatsSnapshot } from "@/lib/stats/get-github-stats-snapshot";

const statCards = [
  ["Public repos", "publicRepositories"],
  ["Followers", "followers"],
  ["Following", "following"],
  ["Contributions", "totalContributions"],
] as const;

function formatFetchedAt(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

function SyncState({ message }: { message: string }) {
  return (
    <section id="stats" aria-labelledby="stats-title" className="scroll-mt-24 px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
      <HeroMotion>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[9rem_minmax(0,1fr)]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-400">03 / Signals</p>
          <div className="border border-white/10 bg-white/[0.015] p-7 sm:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">GitHub telemetry</p>
            <h2 id="stats-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-4xl">{message}</h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400">The latest public snapshot will appear here after the scheduled statistics sync completes.</p>
          </div>
        </div>
      </HeroMotion>
    </section>
  );
}

export async function Stats() {
  let snapshot;

  try {
    snapshot = await getLatestGitHubStatsSnapshot();
  } catch {
    return <SyncState message="STATISTICS UNAVAILABLE" />;
  }

  if (!snapshot) {
    return <SyncState message="STATISTICS SYNCING" />;
  }

  const { data, fetchedAt } = snapshot;

  return (
      <section id="stats" aria-labelledby="stats-title" className="scroll-mt-24 border-b border-white/10 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <HeroMotion>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan-300"><span aria-hidden="true" className="h-px w-8 bg-cyan-300" />03 / GitHub telemetry</p>
                <h2 id="stats-title" className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-slate-50 sm:text-5xl">PUBLIC SIGNALS</h2>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">@{data.username}</p>
            </div>
          </HeroMotion>

          <HeroMotion delay={0.08}>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(([label, key]) => (
                <div key={key} className="border border-white/10 bg-white/[0.015] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-100">{data[key].toLocaleString("en-US")}</p>
                </div>
              ))}
            </div>
          </HeroMotion>

          <HeroMotion delay={0.14}>
            <div className="mt-10 border border-white/10 bg-white/[0.015] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">Contribution activity</p>
                  <p className="mt-2 text-sm text-slate-400">Last 12 months · {data.totalContributions.toLocaleString("en-US")} total contributions</p>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">Less <span className="text-slate-500">■</span> <span className="text-violet-400">■</span> <span className="text-cyan-300">■</span> More</p>
              </div>
              <div aria-label="GitHub contribution calendar" className="mt-6 grid auto-cols-[0.7rem] grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
                {data.contributionCalendar.map((day) => (
                  <span key={day.date} title={`${day.date}: ${day.contributionCount} contributions`} aria-label={`${day.date}: ${day.contributionCount} contributions`} role="img" className={`size-3 rounded-[2px] ${day.contributionLevel === "NONE" ? "bg-slate-800" : day.contributionLevel === "FIRST_QUARTILE" ? "bg-violet-950" : day.contributionLevel === "SECOND_QUARTILE" ? "bg-violet-700" : day.contributionLevel === "THIRD_QUARTILE" ? "bg-cyan-500/70" : "bg-cyan-300"}`} />
                ))}
              </div>
            </div>
          </HeroMotion>

          <p className="mt-5 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">Snapshot fetched {formatFetchedAt(fetchedAt)}</p>
        </div>
      </section>
  );
}

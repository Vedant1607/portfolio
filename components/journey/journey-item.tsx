import type { JourneyMilestone } from "@/data/journey";

import { HeroMotion } from "@/components/hero/hero-motion";

import { JourneyTimelineNode } from "./journey-timeline-node";

type JourneyItemProps = {
  milestone: JourneyMilestone;
  delay: number;
};

const statusClasses = {
  Failure: "border-rose-300/30 text-rose-200",
  Rebuild: "border-cyan-300/30 text-cyan-200",
  Milestone: "border-cyan-300/50 text-cyan-200",
  Shift: "border-violet-300/40 text-violet-200",
  Abandoned: "border-rose-300/30 text-rose-200",
  Progression: "border-slate-300/30 text-slate-300",
  Specialization: "border-violet-300/40 text-violet-200",
  "Current mission": "border-cyan-300/50 text-cyan-200",
};

export function JourneyItem({ milestone, delay }: JourneyItemProps) {
  const isFailure = milestone.status === "Failure" || milestone.status === "Abandoned";
  const isCurrent = milestone.current === true;
  const cardColumn = milestone.side === "left" ? "md:col-start-1" : "md:col-start-3";
  const emphasisLabel =
    milestone.emphasis === "first-build"
      ? "First independent build"
      : milestone.emphasis === "turning-point"
        ? "Turning point"
        : null;

  return (
    <li className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] md:gap-x-0">
      <div className="relative col-start-1 flex justify-center md:col-start-2">
        <JourneyTimelineNode featured={milestone.featured} current={isCurrent} />
      </div>
      <HeroMotion delay={delay} className={`col-start-2 ${cardColumn}`}>
        <article
          tabIndex={0}
          aria-labelledby={`journey-${milestone.number}-title`}
          className={`group relative border bg-white/[0.015] p-5 outline-none transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-white/[0.03] hover:shadow-[0_8px_24px_rgb(0_0_0_/_0.16)] focus-visible:-translate-y-0.5 focus-visible:border-cyan-300/60 focus-visible:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#07070b] motion-reduce:transition-none md:p-6 ${
            milestone.featured ? "border-violet-300/35" : "border-white/10"
          } ${
            isCurrent
              ? "border-cyan-300/50 bg-cyan-300/[0.035] shadow-[inset_3px_0_0_rgb(103_232_249_/_0.75)]"
              : ""
          }`}
        >
          {emphasisLabel && (
            <p className="mb-5 font-mono text-[0.65rem] font-medium uppercase tracking-[0.18em] text-violet-300">
              {emphasisLabel}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
              {milestone.number} / {milestone.stage}
            </p>
            <span className={`border px-2 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.12em] ${statusClasses[milestone.status]}`}>
              {milestone.status}
            </span>
          </div>
          <h3 id={`journey-${milestone.number}-title`} className="mt-5 text-xl font-semibold tracking-[-0.035em] text-slate-100 sm:text-2xl">
            {milestone.title}
          </h3>
          <p className="mt-4 leading-7 text-slate-400">{milestone.description}</p>
          {isFailure && (
            <p className="mt-6 border-l border-rose-300/40 pl-3 font-mono text-xs leading-5 text-rose-100/80">
              Failure became useful information.
            </p>
          )}
          {isCurrent && (
            <p className="mt-6 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">
              <span aria-hidden="true" className="size-1.5 bg-cyan-300" />
              Mission in progress
            </p>
          )}
        </article>
      </HeroMotion>
    </li>
  );
}

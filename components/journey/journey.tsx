import { journeyMilestones } from "@/data/journey";

import { HeroMotion } from "@/components/hero/hero-motion";

import { JourneyItem } from "./journey-item";

export function Journey() {
  return (
    <section id="journey" aria-labelledby="journey-title" className="scroll-mt-24 border-b border-white/10 px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <HeroMotion>
          <div className="max-w-3xl">
            <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
              <span aria-hidden="true" className="h-px w-8 bg-cyan-300" />
              System log / origin sequence
            </p>
            <h2 id="journey-title" className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-slate-50 sm:text-5xl">
              THE JOURNEY
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400 sm:text-lg">
              Curiosity led to missteps, each misstep changed the next decision, and the direction became clearer through the work.
            </p>
          </div>
        </HeroMotion>

        <ol aria-label="Vedant Sinha's development journey" className="relative mt-10 space-y-4 before:absolute before:bottom-0 before:left-[1.35rem] before:top-0 before:w-px before:bg-gradient-to-b before:from-cyan-300/70 before:via-violet-400/50 before:to-cyan-300/70 md:space-y-5 md:before:left-1/2">
          {journeyMilestones.map((milestone, index) => (
            <JourneyItem key={milestone.number} milestone={milestone} delay={Math.min(index * 0.04, 0.28)} />
          ))}
        </ol>
      </div>
    </section>
  );
}

import { ArrowUpRight } from "lucide-react";

import { HeroMotion } from "@/components/hero/hero-motion";

type PlaceholderSectionProps = {
  id: "journey" | "projects" | "stats";
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  isLast?: boolean;
};

export function PlaceholderSection({
  id,
  index,
  eyebrow,
  title,
  description,
  isLast = false,
}: PlaceholderSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-24 px-6 py-20 sm:px-10 sm:py-28 lg:px-16 ${
        isLast ? "" : "border-b border-white/10"
      }`}
    >
      <HeroMotion>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[9rem_minmax(0,1fr)]">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-400">
            {index} / {eyebrow}
          </p>
          <div className="border border-white/10 bg-white/[0.015] p-7 sm:p-10">
            <div className="flex items-start justify-between gap-6">
              <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-4xl">
                {title}
              </h2>
              <ArrowUpRight aria-hidden="true" className="size-5 text-cyan-300" />
            </div>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400">{description}</p>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
              Module initializing
            </p>
          </div>
        </div>
      </HeroMotion>
    </section>
  );
}

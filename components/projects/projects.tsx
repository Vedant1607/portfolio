import { projects } from "@/data/projects";

import { HeroMotion } from "@/components/hero/hero-motion";

import { ProjectCard } from "./project-card";

export function Projects() {
  const featuredProject = projects.find((project) => project.featured);
  const supportingProjects = projects.filter((project) => project !== featuredProject);

  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-24 border-b border-white/10 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <HeroMotion>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan-300">
                <span aria-hidden="true" className="h-px w-8 bg-cyan-300" />
                Mission archive / selected work
              </p>
              <h2 id="projects-title" className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-slate-50 sm:text-5xl">
                BUILDS WITH INTENT
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-slate-400 sm:text-lg">
                A focused archive of projects that show the problem, the decisions behind the build, and what the work taught me.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
              Source-controlled records
            </p>
          </div>
        </HeroMotion>

        {projects.length > 0 ? (
          <div className="mt-12">
            {featuredProject && (
              <HeroMotion delay={0.08}>
                <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
                  Featured / main quest
                </p>
                <ProjectCard project={featuredProject} variant="featured" />
              </HeroMotion>
            )}
            {supportingProjects.length > 0 && (
              <div className={featuredProject ? "mt-10" : ""}>
                <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {featuredProject ? "Supporting missions" : "Mission archive"}
                </p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {supportingProjects.map((project, index) => (
                    <HeroMotion key={project.id} delay={Math.min(0.12 + index * 0.05, 0.3)}>
                      <ProjectCard project={project} />
                    </HeroMotion>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <HeroMotion delay={0.08}>
            <div className="relative mt-12 overflow-hidden border border-violet-300/30 bg-white/[0.015] p-7 sm:p-10">
              <div aria-hidden="true" className="absolute inset-y-0 right-0 w-2/5 bg-[linear-gradient(135deg,transparent_0%,rgb(139_92_246_/_0.1)_100%)]" />
              <div className="relative max-w-2xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
                  Archive protocol
                </p>
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-100 sm:text-3xl">
                  Selected builds, documented with context.
                </h3>
                <p className="mt-5 leading-7 text-slate-400">
                  This archive is reserved for work that can be shown honestly: the intent, implementation choices, trade-offs, and lessons behind every mission.
                </p>
                <p className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-slate-500">
                  Project records are curated in source control.
                </p>
              </div>
            </div>
          </HeroMotion>
        )}
      </div>
    </section>
  );
}

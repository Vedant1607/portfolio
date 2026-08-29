import Image from "next/image";

import type { Project } from "@/data/projects";

type ProjectCardProps = {
  project: Project;
  variant?: "featured" | "standard";
};

const categoryLabels = {
  "main-quest": "Main quest",
  "side-quest": "Side quest",
  experiment: "Experiment",
  archived: "Archived mission",
};

const statusLabels = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
  "in-progress": "In progress",
};

export function ProjectCard({ project, variant = "standard" }: ProjectCardProps) {
  const isFeatured = variant === "featured" || project.featured;

  return (
    <article
      aria-labelledby={`project-${project.id}-title`}
      className={`group relative overflow-hidden border bg-white/[0.015] p-6 outline-none transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-white/[0.03] focus-within:border-cyan-300/60 focus-within:ring-2 focus-within:ring-cyan-300/70 focus-within:ring-offset-4 focus-within:ring-offset-[#07070b] motion-reduce:transition-none sm:p-7 ${
        isFeatured ? "border-violet-300/40 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:p-0" : "border-white/10"
      }`}
    >
      {project.image && (
        <div className={`relative overflow-hidden border-white/10 ${isFeatured ? "min-h-64 border-b md:min-h-full md:border-b-0 md:border-r" : "mb-6 aspect-[16/9] border"}`}>
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            sizes={isFeatured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
            className="object-cover"
          />
        </div>
      )}
      <div className={isFeatured ? "p-6 sm:p-8" : ""}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-violet-300">
            {categoryLabels[project.category]}
          </p>
          <span className="border border-cyan-300/30 px-2 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.12em] text-cyan-200">
            {statusLabels[project.status]}
          </span>
        </div>
        <h3 id={`project-${project.id}-title`} className={`mt-6 font-semibold tracking-[-0.04em] text-slate-100 ${isFeatured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>
          {project.title}
        </h3>
        <p className="mt-4 leading-7 text-slate-400">{project.shortDescription}</p>
        {project.technologies.length > 0 && (
          <ul aria-label={`${project.title} technologies`} className="mt-6 flex flex-wrap gap-2">
            {project.technologies.map((technology) => (
              <li key={technology} className="border border-white/10 px-2 py-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-slate-400">
                {technology}
              </li>
            ))}
          </ul>
        )}
        {(project.githubUrl || project.liveUrl) && (
          <nav aria-label={`${project.title} links`} className="mt-7 flex flex-wrap gap-3">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="border border-white/20 px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-slate-200 transition-colors hover:border-cyan-300 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                GitHub
              </a>
            )}
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="border border-cyan-300 bg-cyan-300 px-3 py-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
                Live demo
              </a>
            )}
          </nav>
        )}
      </div>
    </article>
  );
}

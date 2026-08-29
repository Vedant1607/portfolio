import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { HeroMotion } from "./hero-motion";

export function HeroSection() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden px-6 py-20 sm:px-10 lg:px-16">
      <div aria-hidden="true" className="cyber-grid absolute inset-0 -z-20" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.16),transparent_68%)]" />
      <div className="mx-auto grid w-full max-w-6xl gap-14 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
        <div className="max-w-3xl">
          <HeroMotion><p className="mb-6 flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-cyan-300"><span className="h-px w-8 bg-cyan-300" />Available for meaningful work</p></HeroMotion>
          <HeroMotion delay={0.08}><h1 id="hero-title" className="text-5xl font-semibold tracking-[-0.06em] text-slate-50 sm:text-7xl lg:text-8xl">Vedant <span className="text-violet-400">Sinha</span></h1></HeroMotion>
          <HeroMotion delay={0.16}><p className="mt-7 font-mono text-sm uppercase tracking-[0.15em] text-slate-300 sm:text-base">Full-Stack Developer <span className="mx-2 text-violet-400">/</span> Future Blockchain Engineer</p></HeroMotion>
          <HeroMotion delay={0.24}><p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">I follow curiosity into unfamiliar systems, turn experiments into working ideas, and stay with the hard problems until they become clear.</p></HeroMotion>
          <HeroMotion delay={0.32}><div className="mt-10 flex flex-wrap items-center gap-4"><Link href="#projects" className="inline-flex items-center gap-2 border border-cyan-300 bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">View work <ArrowUpRight aria-hidden="true" className="size-4" /></Link><Link href="#resume" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-violet-400 hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400">Resume <ArrowUpRight aria-hidden="true" className="size-4" /></Link></div></HeroMotion>
        </div>
        <HeroMotion delay={0.4}><aside className="border-l border-white/10 pl-5 lg:pb-2" aria-label="Social links"><p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Connect</p><div className="mt-4 flex gap-3"><a href="https://github.com/Vedant1607" target="_blank" rel="noreferrer" aria-label="Visit Vedant Sinha's GitHub profile" className="inline-flex size-10 items-center justify-center border border-white/10 font-mono text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-300 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"><span aria-hidden="true">GH</span></a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn profile placeholder" className="inline-flex size-10 items-center justify-center border border-white/10 font-mono text-xs font-semibold text-slate-300 transition-colors hover:border-violet-400 hover:text-violet-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"><span aria-hidden="true">in</span></a></div></aside></HeroMotion>
      </div>
    </section>
  );
}

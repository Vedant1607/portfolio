import { HeroSection } from "@/components/hero/hero-section";
import { Journey } from "@/components/journey/journey";
import { SiteNavigation } from "@/components/navigation/site-navigation";
import { Projects } from "@/components/projects/projects";
import { PlaceholderSection } from "@/components/sections/placeholder-section";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#07070b] text-slate-100">
      <SiteNavigation />
      <main>
        <HeroSection />
        <Journey />
        <Projects />
        <PlaceholderSection id="stats" index="03" eyebrow="Signals incoming" title="Stats" description="This area is reserved for a future live and cached developer statistics system—no invented numbers in the meantime." isLast />
      </main>
      <footer id="resume" className="border-t border-white/10 px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Vedant Sinha / Developer Portfolio</p>
          <p>Resume download will be added with the complete portfolio.</p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";

const navigationItems = [
  { href: "#journey", label: "Journey" },
  { href: "#projects", label: "Projects" },
  { href: "#stats", label: "Stats" },
  { href: "#resume", label: "Resume" },
];

export function SiteNavigation() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070b]/85 backdrop-blur-md">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-5 px-6 sm:px-10 lg:px-16"
      >
        <Link
          href="#top"
          className="shrink-0 font-mono text-sm font-semibold tracking-[-0.04em] text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
        >
          VS<span className="text-cyan-300">.</span>DEV
        </Link>
        <div className="-mr-6 flex items-center gap-1 overflow-x-auto pr-6 sm:-mr-10 sm:pr-10 lg:-mr-16 lg:pr-16">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

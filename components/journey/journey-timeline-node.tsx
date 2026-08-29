"use client";

import { useEffect, useRef, useState } from "react";

type JourneyTimelineNodeProps = {
  featured?: boolean;
  current?: boolean;
};

export function JourneyTimelineNode({
  featured = false,
  current = false,
}: JourneyTimelineNodeProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const [isActive, setIsActive] = useState(current);

  useEffect(() => {
    const node = nodeRef.current;

    if (!node || isActive) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -18%", threshold: 0.25 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [isActive]);

  const nodeTone = current
    ? "border-cyan-200 bg-cyan-300 shadow-[0_0_0_4px_rgb(103_232_249_/_0.1),0_0_16px_rgb(103_232_249_/_0.28)]"
    : featured
      ? "border-violet-300 bg-violet-400 shadow-[0_0_0_4px_rgb(167_139_250_/_0.08)]"
      : "border-slate-500 bg-[#07070b]";

  return (
    <span
      ref={nodeRef}
      aria-hidden="true"
      className={`relative z-10 mt-6 size-3 border transition-[background-color,border-color,box-shadow,transform] duration-300 motion-reduce:transition-none ${
        isActive
          ? `${nodeTone} scale-110`
          : "border-slate-600 bg-[#07070b] shadow-none"
      }`}
    />
  );
}

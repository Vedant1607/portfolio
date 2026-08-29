"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type HeroMotionProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function HeroMotion({
  children,
  delay = 0,
  className,
}: HeroMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

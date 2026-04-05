"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  distance?: number;
  scaleFrom?: number;
  rotate?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  distance = 60,
  scaleFrom,
  rotate: rotateDeg,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1.1", "0.4 1"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [direction === "up" ? distance : 0, 0]
  );

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [direction === "left" ? -distance : direction === "right" ? distance : 0, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [scaleFrom ?? 1, 1]
  );

  const rotateVal = useTransform(
    scrollYProgress,
    [0, 1],
    [rotateDeg ?? 0, 0]
  );

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, x, scale, rotate: rotateVal }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollStagger({
  children,
  className,
  staggerIndex = 0,
}: {
  children: React.ReactNode;
  className?: string;
  staggerIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["0 1.1", "0.5 1"],
  });

  const start = staggerIndex * 0.15;
  const end = start + 0.6;

  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  const y = useTransform(scrollYProgress, [start, end], [50, 0]);
  const scale = useTransform(scrollYProgress, [start, end], [0.95, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, scale }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

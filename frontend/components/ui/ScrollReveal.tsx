"use client";

import { motion } from "framer-motion";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
  distance?: number;
  scaleFrom?: number;
  rotate?: number;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  distance = 60,
  scaleFrom,
  rotate: rotateDeg,
}: ScrollRevealProps) {
  const initial: Record<string, number> = { opacity: 0 };
  const animate: Record<string, number> = { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 };

  if (direction === "up") initial.y = distance;
  else if (direction === "left") initial.x = -distance;
  else if (direction === "right") initial.x = distance;
  if (scaleFrom !== undefined) initial.scale = scaleFrom;
  if (rotateDeg !== undefined) initial.rotate = rotateDeg;

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: staggerIndex * 0.12 }}
    >
      {children}
    </motion.div>
  );
}

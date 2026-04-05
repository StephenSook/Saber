"use client";

import { useEffect, useRef, useState } from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypewriterProps {
  text: string | string[];
  speed?: number;
  initialDelay?: number;
  waitTime?: number;
  deleteSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorOnType?: boolean;
  cursorChar?: string | React.ReactNode;
  cursorAnimationVariants?: {
    initial: Variants["initial"];
    animate: Variants["animate"];
  };
  cursorClassName?: string;
}

const Typewriter = ({
  text,
  speed = 50,
  initialDelay = 0,
  waitTime = 2000,
  deleteSpeed = 30,
  loop = true,
  className,
  showCursor = true,
  hideCursorOnType = false,
  cursorChar = "|",
  cursorClassName = "ml-1",
  cursorAnimationVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.01,
        repeat: Infinity,
        repeatDelay: 0.4,
        repeatType: "reverse" as const,
      },
    },
  },
}: TypewriterProps) => {
  const texts = Array.isArray(text) ? text : [text];
  const [displayText, setDisplayText] = useState("");
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Use a ref for phase to avoid stale closures: "waiting" | "typing" | "pausing" | "deleting"
  const phaseRef = useRef<"waiting" | "typing" | "pausing" | "deleting">(
    initialDelay > 0 ? "waiting" : "typing"
  );
  const charIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentText = texts[currentTextIndex] ?? "";

    const schedule = (fn: () => void, delay: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(fn, delay);
    };

    const tick = () => {
      const phase = phaseRef.current;

      if (phase === "waiting") {
        phaseRef.current = "typing";
        schedule(tick, 0);
      } else if (phase === "typing") {
        if (charIndexRef.current < currentText.length) {
          charIndexRef.current += 1;
          setDisplayText(currentText.slice(0, charIndexRef.current));
          schedule(tick, speed);
        } else {
          // Done typing — pause before deleting (only if there are multiple texts)
          if (texts.length > 1) {
            phaseRef.current = "pausing";
            schedule(tick, waitTime);
          }
        }
      } else if (phase === "pausing") {
        phaseRef.current = "deleting";
        schedule(tick, 0);
      } else if (phase === "deleting") {
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(currentText.slice(0, charIndexRef.current));
          schedule(tick, deleteSpeed);
        } else {
          // Done deleting — move to next text
          if (loop || currentTextIndex < texts.length - 1) {
            setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          }
          // Reset handled in the next effect run via currentTextIndex change
        }
      }
    };

    // Reset char index when text changes
    phaseRef.current = "typing";
    charIndexRef.current = 0;
    setDisplayText("");

    schedule(tick, currentTextIndex === 0 ? initialDelay : 0);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTextIndex]);

  const isTypingOrDeleting =
    displayText.length < (texts[currentTextIndex]?.length ?? 0) || displayText.length === 0;

  return (
    <span className={cn("inline whitespace-pre-wrap tracking-tight", className)}>
      <span>{displayText}</span>
      {showCursor && (
        <motion.span
          variants={cursorAnimationVariants}
          className={cn(
            cursorClassName,
            hideCursorOnType && isTypingOrDeleting ? "hidden" : ""
          )}
          initial="initial"
          animate="animate"
        >
          {cursorChar}
        </motion.span>
      )}
    </span>
  );
};

export { Typewriter };

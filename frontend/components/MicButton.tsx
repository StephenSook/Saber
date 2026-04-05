"use client";

import { Mic } from "lucide-react";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  floating?: boolean;
}

export default function MicButton({ isListening, onClick, floating = false }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-full transition-all duration-200 ${
        floating
          ? "fixed bottom-6 right-6 z-40 h-14 w-14 shadow-lg"
          : "h-10 w-10"
      } ${
        isListening
          ? "animate-mic-pulse bg-coral text-white"
          : "bg-teal text-white hover:scale-[1.05]"
      }`}
    >
      <Mic className={floating ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2} />
    </button>
  );
}

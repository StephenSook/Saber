"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();
  const isEs = lang === "es";

  return (
    <button
      onClick={toggleLanguage}
      className="group relative flex h-10 w-[100px] items-center rounded-full bg-navy/5 p-[3px] transition-all duration-300 hover:bg-navy/10"
      aria-label={`Switch to ${isEs ? "English" : "Español"}`}
    >
      {/* Sliding indicator with animated gradient border */}
      <div
        className={`lang-indicator absolute h-[34px] w-[48px] rounded-full transition-all duration-400 ease-out ${
          isEs ? "translate-x-[46px]" : "translate-x-0"
        }`}
      >
        <div className="h-full w-full rounded-full bg-navy" />
      </div>

      {/* EN */}
      <span
        className={`relative z-10 w-[48px] text-center text-xs font-extrabold tracking-wider transition-all duration-300 ${
          !isEs
            ? "text-white"
            : "text-gray-400 group-hover:text-gray-600"
        }`}
      >
        EN
      </span>

      {/* ES */}
      <span
        className={`relative z-10 w-[48px] text-center text-xs font-extrabold tracking-wider transition-all duration-300 ${
          isEs
            ? "text-white"
            : "text-gray-400 group-hover:text-gray-600"
        }`}
      >
        ES
      </span>
    </button>
  );
}

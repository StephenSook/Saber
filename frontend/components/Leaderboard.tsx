"use client";

import { useState } from "react";
import { mockLeaderboard, getInitials, getInitialsBgColor } from "@/lib/mockData";
import { useLanguage } from "@/components/LanguageProvider";

interface LeaderboardProps {
  currentStudentName?: string;
}

export default function Leaderboard({ currentStudentName }: LeaderboardProps) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const entries = showAll ? mockLeaderboard : mockLeaderboard.slice(0, 4);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-navy">{t("leaderboard.title")}</h3>
      <p className="mb-4 text-xs text-gray-400">{t("leaderboard.subtitle")}</p>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const initials = getInitials(entry.name);
          const bgColor = getInitialsBgColor(entry.name);
          const isCurrent = entry.name === currentStudentName;

          return (
            <div
              key={entry.name}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isCurrent ? "bg-teal/5" : ""
              }`}
            >
              <span className="w-5 text-sm font-bold text-gray-400">
                {index + 1}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${bgColor}`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-navy">
                  {entry.name.split(" ")[0]} {entry.name.split(" ")[1]?.[0]}.
                </p>
                <p className="text-xs text-gray-400">LEVEL {entry.level}</p>
              </div>
              <span className="text-sm font-bold text-teal">
                {entry.weeklyXP} XP
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAll(!showAll)}
        className="mt-3 w-full text-center text-xs font-medium text-teal hover:underline"
      >
        {showAll ? t("leaderboard.showLess") : t("leaderboard.showAll")}
      </button>
    </div>
  );
}

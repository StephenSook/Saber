"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { getInitials, getInitialsBgColor } from "@/lib/ui";

interface LeaderboardEntry {
  rank: number;
  studentId: number;
  studentName: string;
  weeklyXp: number;
  totalXp: number;
  level: number;
  streakDays: number;
  lastActive: string | null;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentStudentName?: string;
}

export default function Leaderboard({
  entries,
  currentStudentName,
}: LeaderboardProps) {
  const { t } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const visibleEntries = showAll ? entries : entries.slice(0, 4);

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-navy">{t("leaderboard.title")}</h3>
      <p className="mb-4 text-xs text-gray-400">{t("leaderboard.subtitle")}</p>

      <div className="space-y-3">
        {visibleEntries.map((entry) => {
          const initials = getInitials(entry.studentName);
          const bgColor = getInitialsBgColor(entry.studentName);
          const isCurrent = entry.studentName === currentStudentName;

          return (
            <div
              key={entry.studentId}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                isCurrent ? "bg-teal/5" : ""
              }`}
            >
              <span className="w-5 text-sm font-bold text-gray-400">
                {entry.rank}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${bgColor}`}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-navy">
                  {entry.studentName.split(" ")[0]} {entry.studentName.split(" ")[1]?.[0]}.
                </p>
                <p className="text-xs text-gray-400">LEVEL {entry.level}</p>
              </div>
              <span className="text-sm font-bold text-teal">
                {entry.weeklyXp} XP
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

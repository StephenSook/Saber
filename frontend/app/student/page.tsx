"use client";

import { Star } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import QuestCard from "@/components/QuestCard";
import Leaderboard from "@/components/Leaderboard";
import MicButton from "@/components/MicButton";
import { useLanguage } from "@/components/LanguageProvider";
import { mockStudents } from "@/lib/mockData";

// Use Maria Gonzalez as the demo student
const student = mockStudents[0];
const xpProgress = Math.round((student.xp / student.xpToNextLevel) * 100);

const days = ["M", "T", "W", "T", "F", "S", "S"];

// Extra demo quests for the quest board display
const demoQuests = [
  {
    id: "demo1",
    title: "Math Magic",
    skillTag: "Multiplication",
    totalItems: 8,
    completedItems: 3,
    xpReward: 100,
    status: "in_progress" as const,
  },
  {
    id: "demo2",
    title: "Language Lab",
    skillTag: "Reading Comprehension",
    totalItems: 12,
    completedItems: 7,
    xpReward: 200,
    status: "in_progress" as const,
  },
  {
    id: "demo3",
    title: "Science Safari",
    skillTag: "Photosynthesis",
    totalItems: 5,
    completedItems: 0,
    xpReward: 300,
    status: "not_started" as const,
  },
];

export default function StudentDashboard() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="student"
        userName={student.name}
        schoolName="Greenwood Academy"
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-offwhite">
        <div className="p-8">
          {/* Welcome Header + Streak */}
          <div className="mb-8 flex items-start justify-between">
            {/* Welcome */}
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                  {t("student.level")} {student.level}
                </span>
                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">
                  {t("student.goldRank")}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-navy">
                Hola, {student.name.split(" ")[0]}!
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {t("student.greeting")}
              </p>

              {/* XP Progress Bar */}
              <div className="mt-4 w-full max-w-md">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {t("student.progressTo")} {student.level + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {student.xp} / {student.xpToNextLevel} XP
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-600"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-gold" fill="#F2CC8F" strokeWidth={1.5} />
                <span className="text-lg font-bold text-navy">
                  {student.streakDays} {t("student.streak")}
                </span>
              </div>
              <p className="mb-3 text-xs text-gray-400">
                {t("student.dontBreak")}
              </p>
              <div className="flex gap-1.5">
                {days.map((day, i) => (
                  <div
                    key={i}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${
                      i < student.streakDays
                        ? "bg-teal text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quest Board + Leaderboard */}
          <div className="flex gap-8">
            {/* Quest Board */}
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy">{t("student.questBoard")}</h2>
                  <p className="text-xs text-gray-400">
                    {t("student.selectSkill")}
                  </p>
                </div>
                <button className="text-xs font-medium text-teal hover:underline">
                  {t("student.viewAll")}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {demoQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </div>

            {/* Leaderboard Sidebar */}
            <div className="w-72 flex-shrink-0">
              <Leaderboard currentStudentName={student.name} />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Mic Button */}
      <MicButton isListening={false} onClick={() => {}} floating />
    </div>
  );
}

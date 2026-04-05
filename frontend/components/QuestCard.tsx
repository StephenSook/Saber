"use client";

import Link from "next/link";
import { BookOpen, Globe, FlaskConical } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

const iconMap: Record<string, typeof BookOpen> = {
  Fractions: BookOpen,
  Inference: BookOpen,
  Multiplication: BookOpen,
  "Main Idea": Globe,
  "Author's Purpose": Globe,
  "Vocabulary in Context": Globe,
  "Reading Comprehension": Globe,
  Photosynthesis: FlaskConical,
  Division: BookOpen,
  "Cause and Effect": Globe,
  Geometry: FlaskConical,
  default: BookOpen,
};

interface QuestCardProps {
  quest: {
    id: number;
    title: string;
    skillTag: string;
    totalItems: number;
    completedItems: number;
    xpReward: number;
    status: "in_progress" | "not_started" | "completed";
  };
  studentId: number;
}

export default function QuestCard({ quest, studentId }: QuestCardProps) {
  const { t } = useLanguage();
  const Icon = iconMap[quest.skillTag] || iconMap.default;
  const progressPct =
    quest.totalItems > 0
      ? (quest.completedItems / quest.totalItems) * 100
      : 0;
  const isCompleted = quest.status === "completed";

  return (
    <Link
      href={`/quests?studentId=${studentId}&questId=${quest.id}`}
      className="group rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
    >
      {/* Icon */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
        <Icon className="h-5 w-5 text-teal" strokeWidth={1.5} />
      </div>

      {/* Title + Skill */}
      <h3 className="text-sm font-bold text-navy">{quest.title}</h3>
      <p className="mt-0.5 text-xs text-gray-400">
        {quest.skillTag}
      </p>

      {/* Stats */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-medium text-gray-500">
          {quest.totalItems} {t("student.exercises")}
        </span>
        <span className={`font-bold ${isCompleted ? "text-success" : "text-coral"}`}>
          +{quest.xpReward} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-600 ${
            isCompleted ? "bg-success" : "bg-teal"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Link>
  );
}

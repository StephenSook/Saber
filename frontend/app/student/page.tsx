"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import QuestCard from "@/components/QuestCard";
import Leaderboard from "@/components/Leaderboard";
import MicButton from "@/components/MicButton";
import { useLanguage } from "@/components/LanguageProvider";
import {
  getCurrentUser,
  getStudentDashboard,
  mapQuestStatus,
  type StudentProfileResponseData,
} from "@/lib/api";

const days = ["M", "T", "W", "T", "F", "S", "S"];

export default function StudentDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<StudentProfileResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllQuests, setShowAllQuests] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async (): Promise<void> => {
      try {
        const me = await getCurrentUser();

        if (!cancelled) {
          setStudentId(me.id);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load user session.");
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (studentId === null) return;

    let cancelled = false;

    const loadProfile = async (): Promise<void> => {
      try {
        const nextProfile = await getStudentDashboard(studentId);

        if (!cancelled) {
          setProfile(nextProfile);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the student dashboard.",
          );
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const xpProgress = useMemo(() => {
    if (profile === null || profile.student.nextLevelXp === 0) {
      return 0;
    }

    return Math.round((profile.student.xp / profile.student.nextLevelXp) * 100);
  }, [profile]);

  const quests =
    profile?.quests.map((quest) => ({
      id: quest.id,
      title: quest.skillTag,
      skillTag: quest.skillTag,
      totalItems: quest.totalItems,
      completedItems: quest.completedItems,
      xpReward: quest.xpReward,
      status: mapQuestStatus(quest.status),
    })) ?? [];
  const visibleQuests = showAllQuests ? quests : quests.slice(0, 3);

  if (profile === null && error === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite text-sm text-gray-500">
        Loading student dashboard...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="student"
        userName={profile?.student.name ?? "Student"}
        schoolName={profile?.student.className ?? "Saber"}
      />

      <main className="flex-1 overflow-y-auto bg-offwhite">
        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-navy">
              {error}
            </div>
          )}

          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                  {t("student.level")} {profile?.student.level ?? 1}
                </span>
                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">
                  {t("student.goldRank")}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-navy">
                Hola, {profile?.student.name.split(" ")[0] ?? "Student"}!
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {t("student.greeting")}
              </p>

              <div className="mt-4 w-full max-w-md">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    {t("student.progressTo")} {(profile?.student.level ?? 1) + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    {profile?.student.xp ?? 0} / {profile?.student.nextLevelXp ?? 100} XP
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

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-gold" fill="#F2CC8F" strokeWidth={1.5} />
                <span className="text-lg font-bold text-navy">
                  {profile?.student.streakDays ?? 0} {t("student.streak")}
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
                      i < (profile?.student.streakDays ?? 0)
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

          {/* Start Diagnostic CTA */}
          <button
            onClick={() => {
              router.push(`/test?studentId=${profile?.student.id ?? studentId ?? 1}`);
            }}
            className="mb-8 flex w-full items-center gap-4 rounded-xl bg-gradient-to-r from-teal to-teal/80 p-5 text-left text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <ClipboardList className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-base font-bold">{t("student.startDiagnostic")}</h3>
              <p className="text-sm text-white/70">{t("student.startDiagnosticDesc")}</p>
            </div>
          </button>

          <div className="flex gap-8">
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy">{t("student.questBoard")}</h2>
                  <p className="text-xs text-gray-400">
                    {t("student.selectSkill")}
                  </p>
                </div>
                {quests.length > 3 ? (
                  <button
                    onClick={() => setShowAllQuests((currentValue) => !currentValue)}
                    className="text-xs font-medium text-teal hover:underline"
                  >
                    {showAllQuests ? t("student.showLess") : t("student.viewAll")}
                  </button>
                ) : null}
              </div>

              {visibleQuests.length === 0 ? (
                <div className="rounded-xl bg-white p-6 text-sm text-gray-400 shadow-sm">
                  No quests are available for this student yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {visibleQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      studentId={profile?.student.id ?? studentId ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="w-72 flex-shrink-0">
              <Leaderboard
                entries={profile?.leaderboard ?? []}
                currentStudentName={profile?.student.name}
              />
            </div>
          </div>
        </div>
      </main>

      <MicButton
        isListening={false}
        onClick={() => {
          router.push(`/test?studentId=${profile?.student.id ?? studentId ?? 1}`);
        }}
        floating
      />
    </div>
  );
}

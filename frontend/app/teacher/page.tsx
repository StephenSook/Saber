"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload, Search, SlidersHorizontal, Copy, Check } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StudentDetailPanel, {
  type StudentDetailPanelStudent,
} from "@/components/StudentDetailPanel";
import FileUploadModal from "@/components/FileUploadModal";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  generateSpanishQuestions,
  getClassDashboard,
  getStudentDashboard,
  getCurrentUser,
  mapColorCodeToClassification,
  type DashboardResponseData,
  type AuthUser,
  uploadCsv,
} from "@/lib/api";
import {
  formatRelativeTime,
  getClassificationColor,
  getInitials,
  getInitialsBgColor,
} from "@/lib/ui";

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [classId, setClassId] = useState<number | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponseData | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentDetailPanelStudent | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async (): Promise<void> => {
      try {
        const me = await getCurrentUser();

        if (!cancelled) {
          setUser(me);
          setClassId(me.classId);
          setJoinCode(me.joinCode);
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

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (classId === null) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextDashboard = await getClassDashboard(classId);
      setDashboard(nextDashboard);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (selectedStudentId === null) {
      setSelectedStudent(null);
      return;
    }

    let cancelled = false;

    const loadStudent = async (): Promise<void> => {
      setIsDetailLoading(true);

      try {
        const studentProfile = await getStudentDashboard(selectedStudentId);

        if (cancelled) {
          return;
        }

        setSelectedStudent({
          id: studentProfile.student.id,
          name: studentProfile.student.name,
          classification:
            studentProfile.skills[0]?.classification ??
            "ontrack",
          skills: studentProfile.skills.map((skill) => ({
            skillTag: skill.skillTag,
            classification: skill.classification,
            explanation: skill.explanation,
            diagnosticCount: skill.diagnosticCount,
          })),
        });
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the student details.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadStudent();

    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  const stats = useMemo(() => {
    const total = dashboard?.classStats.totalStudents ?? 0;
    const language = dashboard?.classStats.breakdownCounts.language ?? 0;
    const content = dashboard?.classStats.breakdownCounts.content ?? 0;
    const mixed = dashboard?.classStats.breakdownCounts.mixed ?? 0;
    const ontrack = dashboard?.classStats.breakdownCounts.no_gaps ?? 0;

    return {
      total,
      languagePct: total === 0 ? 0 : Math.round((language / total) * 100),
      contentPct: total === 0 ? 0 : Math.round((content / total) * 100),
      healthPct: total === 0 ? 0 : Math.round(((ontrack + language) / total) * 100),
      mixed,
    };
  }, [dashboard]);

  const filteredStudents = useMemo(() => {
    const students = dashboard?.students ?? [];

    if (!searchQuery) {
      return students;
    }

    return students.filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [dashboard, searchQuery]);

  const handleUpload = useCallback(
    async (file: File): Promise<void> => {
      if (classId === null) {
        throw new Error(
          "Your class is not loaded yet. Wait a moment and try again, or refresh the page.",
        );
      }

      setIsUploading(true);
      setError(null);
      setUploadMessage(null);

      try {
        const uploadResult = await uploadCsv(classId, file);
        const generationResult = await generateSpanishQuestions(uploadResult.uploadId);

        setUploadMessage(
          `Processed ${uploadResult.studentsProcessed} students, created ${uploadResult.missedItemsGenerated} missed items, and generated ${generationResult.generated} Spanish questions.`,
        );
        await loadDashboard();
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload scores.",
        );
        throw uploadError;
      } finally {
        setIsUploading(false);
      }
    },
    [classId, loadDashboard],
  );

  const handleCopyJoinCode = async (): Promise<void> => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="teacher"
        userName={user?.name ?? "Teacher Dashboard"}
        schoolName={dashboard?.classroom.name ?? "Saber"}
      />

      <main className="flex-1 overflow-y-auto bg-offwhite">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-4">
          <div>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{t("nav.dashboard")}</span>
              <span>/</span>
              <span>{t("nav.resources")}</span>
              <span>/</span>
              <span>{t("nav.messages")}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {joinCode && (
              <button
                onClick={handleCopyJoinCode}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-navy transition-colors hover:bg-gray-100"
                title="Share this code with your students"
              >
                <span className="text-xs text-gray-400">Join Code:</span>
                <span className="font-mono font-bold tracking-wider">{joinCode}</span>
                {codeCopied ? (
                  <Check className="h-3.5 w-3.5 text-teal" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>
            )}
            <LanguageToggle />
          </div>
        </header>

        <div className="p-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">
                {dashboard?.classroom.name ?? t("teacher.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                {t("teacher.subtitle")} {stats.total} {t("teacher.activeStudents")}
              </p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
              {t("teacher.uploadScores")}
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-navy">
              {error}
            </div>
          )}

          {uploadMessage && (
            <div className="mb-4 rounded-xl border border-teal/20 bg-teal/5 px-4 py-3 text-sm text-navy">
              {uploadMessage}
            </div>
          )}

          <div className="mb-8 grid grid-cols-4 gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("teacher.totalEnrollment")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-navy">{stats.total}</span>
                <span className="text-sm text-gray-400">{t("teacher.students")}</span>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("teacher.languageBarrier")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-navy">
                  {stats.languagePct}%
                </span>
                <span className="text-sm text-gold">{t("teacher.goldStatus")}</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${stats.languagePct}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("teacher.contentGaps")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-navy">
                  {stats.contentPct}%
                </span>
                <span className="text-sm text-coral">{t("teacher.coralStatus")}</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-coral"
                  style={{ width: `${stats.contentPct}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border-l-4 border-success bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("teacher.classHealth")}
              </p>
              <p className="mt-2 text-xl font-bold text-success">{t("teacher.excellent")}</p>
              <p className="mt-1 text-xs text-gray-400">
                {stats.healthPct}% {t("teacher.healthDesc")}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-navy">{t("teacher.studentRoster")}</h2>
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  className="h-4 w-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    placeholder={t("teacher.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-gray-100 bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-navy placeholder:text-gray-300 focus:border-teal focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 border-b border-gray-50 px-6 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t("teacher.colName")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t("teacher.colStatus")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {t("teacher.colLastActive")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">
                {t("teacher.colAvgScore")}
              </span>
            </div>

            {isLoading ? (
              <div className="px-6 py-8 text-sm text-gray-400">Loading roster...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="px-6 py-8 text-sm text-gray-400">
                No students found for this class yet.
              </div>
            ) : (
              filteredStudents.map((student) => {
              const classification = mapColorCodeToClassification(student.color_code);
              const classInfo = getClassificationColor(classification);
              const initials = getInitials(student.name);
              const avatarBg = getInitialsBgColor(student.name);
              const totalGapCount =
                student.gap_counts.language +
                student.gap_counts.content +
                student.gap_counts.mixed;
              const score = Math.max(0, 100 - totalGapCount * 10);

              return (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setSelectedStudent(null);
                  }}
                  className={`grid w-full grid-cols-[2fr_1fr_1fr_0.5fr] items-center gap-4 border-b border-gray-50 px-6 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                    selectedStudentId === student.id ? "bg-teal/5" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBg}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {student.name.toLowerCase().replace(/ /g, ".")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classInfo.bg} ${classInfo.text}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                      {classInfo.label.toUpperCase()}
                    </span>
                  </div>

                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(student.lastActive)}
                  </span>

                  <span className="text-right text-sm font-semibold text-navy">
                    {score}%
                  </span>
                </button>
              );
            }))}
          </div>
        </div>
      </main>

      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
            setSelectedStudentId(null);
          }}
        />
      )}

      {isDetailLoading && selectedStudentId !== null && (
        <aside className="sticky top-0 flex h-screen w-80 items-center justify-center border-l border-gray-100 bg-white text-sm text-gray-400">
          Loading student details...
        </aside>
      )}

      <FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
        isSubmitting={isUploading}
        allowSubmit={classId !== null}
        submitBlockedMessage="Loading your class… try again in a moment."
      />
    </div>
  );
}


"use client";

import { useState, useMemo } from "react";
import { Upload, Search, SlidersHorizontal } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import StudentDetailPanel from "@/components/StudentDetailPanel";
import FileUploadModal from "@/components/FileUploadModal";
import { useLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  mockStudents,
  mockTeacher,
  Student,
  getClassificationColor,
  getInitials,
  getInitialsBgColor,
} from "@/lib/mockData";

function getRelativeTime(index: number): string {
  const times = ["Today", "2h ago", "Yesterday", "Today", "3h ago", "Today", "Yesterday", "5h ago", "Today", "Yesterday", "Today", "2d ago", "Today", "Yesterday", "Today"];
  return times[index % times.length];
}

// Deterministic score based on student name + classification (no Math.random)
function getAvgScore(student: Student): number {
  const seed = student.name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  if (student.classification === "ontrack") return 85 + (seed % 10);
  if (student.classification === "language") return 65 + (seed % 15);
  if (student.classification === "content") return 45 + (seed % 15);
  return 55 + (seed % 10);
}

const studentScores = mockStudents.map((s) => ({
  id: s.id,
  score: getAvgScore(s),
}));

export default function TeacherDashboard() {
  const { t } = useLanguage();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const stats = useMemo(() => {
    const total = mockStudents.length;
    const language = mockStudents.filter((s) => s.classification === "language").length;
    const content = mockStudents.filter((s) => s.classification === "content").length;
    const mixed = mockStudents.filter((s) => s.classification === "mixed").length;
    const ontrack = mockStudents.filter((s) => s.classification === "ontrack").length;
    const healthPct = Math.round(((ontrack + language) / total) * 100);
    return {
      total,
      language,
      languagePct: Math.round((language / total) * 100),
      content,
      contentPct: Math.round((content / total) * 100),
      mixed,
      healthPct,
    };
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return mockStudents;
    return mockStudents.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="teacher"
        userName={mockTeacher.name}
        schoolName={mockTeacher.school}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-offwhite">
        {/* Top Bar */}
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
          <LanguageToggle />
        </header>

        <div className="p-8">
          {/* Page Title + Upload */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-navy">
                {t("teacher.title")}
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

          {/* Stats Row */}
          <div className="mb-8 grid grid-cols-4 gap-4">
            {/* Total Enrollment */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                {t("teacher.totalEnrollment")}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-navy">{stats.total}</span>
                <span className="text-sm text-gray-400">{t("teacher.students")}</span>
              </div>
            </div>

            {/* Language Barrier */}
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

            {/* Content Gaps */}
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

            {/* Class Health */}
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

          {/* Student Roster */}
          <div className="rounded-xl bg-white shadow-sm">
            {/* Roster Header */}
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

            {/* Table Header */}
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

            {/* Student Rows */}
            {filteredStudents.map((student, index) => {
              const classInfo = getClassificationColor(student.classification);
              const initials = getInitials(student.name);
              const avatarBg = getInitialsBgColor(student.name);
              const score =
                studentScores.find((s) => s.id === student.id)?.score ?? 75;

              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`grid w-full grid-cols-[2fr_1fr_1fr_0.5fr] items-center gap-4 border-b border-gray-50 px-6 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                    selectedStudent?.id === student.id ? "bg-teal/5" : ""
                  }`}
                >
                  {/* Name */}
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

                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classInfo.bg} ${classInfo.text}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                      {classInfo.label.toUpperCase()}
                    </span>
                  </div>

                  {/* Last Active */}
                  <span className="text-sm text-gray-500">
                    {getRelativeTime(index)}
                  </span>

                  {/* Score */}
                  <span className="text-right text-sm font-semibold text-navy">
                    {score}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Student Detail Panel */}
      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={() => {}}
      />
    </div>
  );
}

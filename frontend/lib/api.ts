import type { UiClassification } from "@/lib/ui";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface DashboardStudent {
  id: number;
  name: string;
  xp: number;
  level: number;
  lastActive: string | null;
  gap_counts: {
    language: number;
    content: number;
    mixed: number;
  };
  color_code: "yellow" | "red" | "orange" | "green";
}

export interface DashboardResponseData {
  classroom: {
    id: number;
    name: string;
    gradeLevel: number;
  };
  students: DashboardStudent[];
  classStats: {
    totalStudents: number;
    breakdownCounts: {
      language: number;
      content: number;
      mixed: number;
      no_gaps: number;
    };
    subjectsWithHighestGapRates: Array<{
      subject: string;
      gapCount: number;
      gapRate: number;
    }>;
  };
}

export interface UploadResponseData {
  uploadId: number;
  studentsProcessed: number;
  missedItemsGenerated: number;
  uploadFormat: "subject_scores" | "missed_questions";
}

export interface GeneratedQuestion {
  id: string;
  subject: string;
  grade: number;
  skill_tag: string;
  question_type: "multiple_choice" | "short_answer";
  question_en: string;
  question_es: string;
  choices_en: string[] | null;
  choices_es: string[] | null;
  correct_answer: string;
}

export interface QuestionsResponseData {
  generated: number;
  skipped: number;
  questions: GeneratedQuestion[];
}

export interface StudentProfileResponseData {
  student: {
    id: number;
    name: string;
    classId: number;
    className: string;
    gradeLevel: number;
    xp: number;
    level: number;
    nextLevelXp: number;
    streakDays: number;
    lastActive: string | null;
  };
  skills: Array<{
    skillTag: string;
    classification: UiClassification;
    diagnosticCount: number;
    explanation: string | null;
  }>;
  quests: Array<{
    id: number;
    skillTag: string;
    difficulty: "easy" | "medium" | "hard";
    status: "active" | "completed" | "locked";
    xpReward: number;
    totalItems: number;
    completedItems: number;
  }>;
  leaderboard: Array<{
    rank: number;
    studentId: number;
    studentName: string;
    weeklyXp: number;
    totalXp: number;
    level: number;
    streakDays: number;
    lastActive: string | null;
  }>;
}

export interface StudentDiagnosticResponseData {
  studentId: number;
  latestUploadId: number | null;
  totalQuestions: number;
  answeredQuestions: number;
  questions: Array<{
    id: string;
    subject: string;
    skillTag: string;
    questionType: "multiple_choice" | "short_answer";
    questionEn: string;
    questionEs: string;
    choicesEn: string[] | null;
    choicesEs: string[] | null;
    correctAnswer: string;
    studentAnswerEn: string | null;
    latestStudentAnswerEs: string | null;
    latestClassification: "LANGUAGE" | "CONTENT" | "MIXED" | null;
    latestExplanation: string | null;
    answeredAt: string | null;
    isCompleted: boolean;
  }>;
}

export interface AnswerResponseData {
  correct: boolean;
  xpEarned: number;
  newLevel: number | null;
}

export interface ClassificationResponseData {
  id: number;
  student_id: number;
  question_id: string;
  student_answer_es: string | null;
  classification: "LANGUAGE" | "CONTENT" | "MIXED" | null;
  explanation: string | null;
  created_at: string;
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new Error(body.error);
  }

  return body.data;
}

export async function getClassDashboard(classId: number): Promise<DashboardResponseData> {
  return requestJson<DashboardResponseData>(`/api/dashboard/${classId}`);
}

export async function uploadCsv(
  classId: number,
  file: File,
): Promise<UploadResponseData> {
  const formData = new FormData();
  formData.set("classId", String(classId));
  formData.set("file", file);

  return requestJson<UploadResponseData>("/api/upload", {
    method: "POST",
    body: formData,
  });
}

export async function generateSpanishQuestions(
  uploadId: number,
): Promise<QuestionsResponseData> {
  return requestJson<QuestionsResponseData>("/api/questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadId }),
  });
}

export async function getStudentDashboard(
  studentId: number,
): Promise<StudentProfileResponseData> {
  return requestJson<StudentProfileResponseData>(`/api/students/${studentId}`);
}

export async function getStudentDiagnostic(
  studentId: number,
): Promise<StudentDiagnosticResponseData> {
  return requestJson<StudentDiagnosticResponseData>(
    `/api/students/${studentId}/diagnostic`,
  );
}

export async function submitDiagnosticAnswer(input: {
  studentId: number;
  questionId: string;
  answerEs: string;
  inputMethod: "text" | "speech";
}): Promise<AnswerResponseData> {
  return requestJson<AnswerResponseData>("/api/answers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function classifyDiagnosticAnswer(input: {
  studentId: number;
  questionId: string;
  answerEs: string;
  isCorrect?: boolean;
}): Promise<ClassificationResponseData> {
  return requestJson<ClassificationResponseData>("/api/classify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  role: "teacher" | "student";
  classId: number | null;
  joinCode: string | null;
}

export async function getCurrentUser(): Promise<AuthUser> {
  return requestJson<AuthUser>("/api/auth/me");
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

// ---------------------------------------------------------------------------
// AI Explain
// ---------------------------------------------------------------------------

export interface QuestionExplanationData {
  keywords: Array<{ word: string; definition: string }>;
  conceptExplanation: string;
  stepByStep: string;
  languageTip: string | null;
}

export async function explainQuestion(input: {
  questionEn: string;
  questionEs: string;
  correctAnswer: string;
  studentAnswer: string;
  subject: string;
  responseLang: "en" | "es";
}): Promise<QuestionExplanationData> {
  return requestJson<QuestionExplanationData>("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function mapColorCodeToClassification(
  colorCode: DashboardStudent["color_code"],
): UiClassification {
  switch (colorCode) {
    case "yellow":
      return "language";
    case "red":
      return "content";
    case "orange":
      return "mixed";
    default:
      return "ontrack";
  }
}

export function mapQuestStatus(
  status: StudentProfileResponseData["quests"][number]["status"],
): "in_progress" | "not_started" | "completed" {
  switch (status) {
    case "active":
      return "in_progress";
    case "locked":
      return "not_started";
    default:
      return "completed";
  }
}

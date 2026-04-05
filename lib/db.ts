import BetterSqlite3 from "better-sqlite3";
import path from "node:path";

import { AppError } from "./errors";

export const QUESTION_SUBJECTS = {
  MATH: "Math",
  ELA: "ELA",
  SCIENCE: "Science",
  HISTORY: "History",
} as const;

export const QUESTION_GRADES = [3, 5, 8] as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  SHORT_ANSWER: "short_answer",
} as const;

export const DIAGNOSTIC_CLASSIFICATIONS = {
  LANGUAGE: "LANGUAGE",
  CONTENT: "CONTENT",
  MIXED: "MIXED",
} as const;

export const QUEST_DIFFICULTIES = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

export const QUEST_STATUSES = {
  ACTIVE: "active",
  COMPLETED: "completed",
  LOCKED: "locked",
} as const;

export const XP_ACTIONS = {
  COMPLETE_DIAGNOSTIC: "complete_diagnostic",
  COMPLETE_QUEST: "complete_quest",
  DAILY_STREAK: "daily_streak",
} as const;

export const XP_PER_LEVEL = 100;

export type QuestionSubject =
  (typeof QUESTION_SUBJECTS)[keyof typeof QUESTION_SUBJECTS];
export type QuestionGrade = (typeof QUESTION_GRADES)[number];
export type QuestionType =
  (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];
export type DiagnosticClassification =
  (typeof DIAGNOSTIC_CLASSIFICATIONS)[keyof typeof DIAGNOSTIC_CLASSIFICATIONS];
export type QuestDifficulty =
  (typeof QUEST_DIFFICULTIES)[keyof typeof QUEST_DIFFICULTIES];
export type QuestStatus = (typeof QUEST_STATUSES)[keyof typeof QUEST_STATUSES];
export type XPAction = (typeof XP_ACTIONS)[keyof typeof XP_ACTIONS];

export interface Student {
  id: number;
  class_id: number;
  name: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
}

export interface Question {
  id: string;
  subject: QuestionSubject;
  grade: QuestionGrade;
  skill_tag: string;
  question_type: QuestionType;
  question_en: string;
  question_es: string;
  choices_en: string[] | null;
  choices_es: string[] | null;
  correct_answer: string;
}

export interface Diagnostic {
  id: number;
  student_id: number;
  question_id: string;
  student_answer_es: string | null;
  classification: DiagnosticClassification | null;
  explanation: string | null;
  created_at: string;
}

export interface MissedItem {
  id: number;
  upload_id: number;
  student_id: number;
  question_id: string;
  student_answer_en: string | null;
}

export interface Quest {
  id: number;
  student_id: number;
  skill_tag: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  xp_reward: number;
}

export interface XPLog {
  id: number;
  student_id: number;
  action: string;
  xp_earned: number;
  timestamp: string;
}

export interface DiagnosticInsert {
  student_id: number;
  question_id: string;
  student_answer_es: string | null;
  classification: DiagnosticClassification | null;
  explanation: string | null;
  created_at?: string;
}

export interface DiagnosticRecord extends Diagnostic {}

export interface StudentUpsert {
  id?: number;
  class_id: number;
  name: string;
  xp?: number;
  streak_days?: number;
  last_active?: string | null;
}

export interface MissedItemInsert {
  upload_id: number;
  student_id: number;
  question_id: string;
  student_answer_en?: string | null;
}

export interface MissedItemWithQuestion {
  missed_item: MissedItem;
  question: Question;
}

export interface StudentDiagnosticSummary {
  student_id: number;
  class_id: number;
  student_name: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
  diagnostic_count: number;
  language_count: number;
  content_count: number;
  mixed_count: number;
  latest_classification: DiagnosticClassification | null;
  latest_explanation: string | null;
  latest_diagnostic_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  student_id: number;
  student_name: string;
  weekly_xp: number;
  total_xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
}

export interface XPResult {
  xp_log_id: number;
  student_id: number;
  action: XPAction;
  amount_awarded: number;
  total_xp: number;
  level: number;
  streak_days: number;
  last_active: string;
}

interface QuestionRow {
  id: string;
  subject: string;
  grade: number;
  skill_tag: string;
  question_type: string;
  question_en: string;
  question_es: string;
  choices_en: string | null;
  choices_es: string | null;
  correct_answer: string;
}

interface DiagnosticRow {
  id: number;
  student_id: number;
  question_id: string;
  student_answer_es: string | null;
  classification: string | null;
  explanation: string | null;
  created_at: string;
}

interface MissedItemQuestionJoinRow {
  missed_item_id: number;
  missed_item_upload_id: number;
  missed_item_student_id: number;
  missed_item_question_id: string;
  missed_item_student_answer_en: string | null;
  question_id: string;
  question_subject: string;
  question_grade: number;
  question_skill_tag: string;
  question_type: string;
  question_en: string;
  question_es: string;
  question_choices_en: string | null;
  question_choices_es: string | null;
  question_correct_answer: string;
}

interface StudentDiagnosticSummaryRow {
  student_id: number;
  class_id: number;
  student_name: string;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
  diagnostic_count: number;
  language_count: number;
  content_count: number;
  mixed_count: number;
  latest_classification: string | null;
  latest_explanation: string | null;
  latest_diagnostic_at: string | null;
}

interface LeaderboardRow {
  student_id: number;
  student_name: string;
  weekly_xp: number;
  total_xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
}

interface RunResultLike {
  lastInsertRowid: number | bigint;
}

type BetterSqliteDatabase = InstanceType<typeof BetterSqlite3>;

const DEFAULT_DATABASE_PATH = path.join(process.cwd(), "data", "saber.db");

export const db: BetterSqliteDatabase = createDatabase();

const getStudentByIdStatement = db.prepare(`
  SELECT id, class_id, name, xp, level, streak_days, last_active
  FROM students
  WHERE id = ?
`);

const getStudentsByClassStatement = db.prepare(`
  SELECT id, class_id, name, xp, level, streak_days, last_active
  FROM students
  WHERE class_id = ?
  ORDER BY name ASC, id ASC
`);

const getMissedItemsByUploadStatement = db.prepare(`
  SELECT
    mi.id AS missed_item_id,
    mi.upload_id AS missed_item_upload_id,
    mi.student_id AS missed_item_student_id,
    mi.question_id AS missed_item_question_id,
    mi.student_answer_en AS missed_item_student_answer_en,
    q.id AS question_id,
    q.subject AS question_subject,
    q.grade AS question_grade,
    q.skill_tag AS question_skill_tag,
    q.question_type AS question_type,
    q.question_en AS question_en,
    q.question_es AS question_es,
    q.choices_en AS question_choices_en,
    q.choices_es AS question_choices_es,
    q.correct_answer AS question_correct_answer
  FROM missed_items mi
  INNER JOIN questions q ON q.id = mi.question_id
  WHERE mi.upload_id = ?
  ORDER BY mi.student_id ASC, mi.id ASC
`);

const insertDiagnosticStatement = db.prepare(`
  INSERT INTO diagnostics (
    student_id,
    question_id,
    student_answer_es,
    classification,
    explanation,
    created_at
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

const getDiagnosticByIdStatement = db.prepare(`
  SELECT id, student_id, question_id, student_answer_es, classification, explanation, created_at
  FROM diagnostics
  WHERE id = ?
`);

const getClassDashboardStatement = db.prepare(`
  SELECT
    s.id AS student_id,
    s.class_id AS class_id,
    s.name AS student_name,
    s.xp AS xp,
    s.level AS level,
    s.streak_days AS streak_days,
    s.last_active AS last_active,
    COUNT(d.id) AS diagnostic_count,
    COALESCE(SUM(CASE WHEN d.classification = 'LANGUAGE' THEN 1 ELSE 0 END), 0) AS language_count,
    COALESCE(SUM(CASE WHEN d.classification = 'CONTENT' THEN 1 ELSE 0 END), 0) AS content_count,
    COALESCE(SUM(CASE WHEN d.classification = 'MIXED' THEN 1 ELSE 0 END), 0) AS mixed_count,
    (
      SELECT d2.classification
      FROM diagnostics d2
      WHERE d2.student_id = s.id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_classification,
    (
      SELECT d2.explanation
      FROM diagnostics d2
      WHERE d2.student_id = s.id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_explanation,
    (
      SELECT d2.created_at
      FROM diagnostics d2
      WHERE d2.student_id = s.id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_diagnostic_at
  FROM students s
  LEFT JOIN diagnostics d ON d.student_id = s.id
  WHERE s.class_id = ?
  GROUP BY s.id, s.class_id, s.name, s.xp, s.level, s.streak_days, s.last_active
  ORDER BY s.name ASC, s.id ASC
`);

const getLeaderboardStatement = db.prepare(`
  SELECT
    s.id AS student_id,
    s.name AS student_name,
    COALESCE(SUM(
      CASE
        WHEN datetime(x.timestamp) >= datetime(?) THEN x.xp_earned
        ELSE 0
      END
    ), 0) AS weekly_xp,
    s.xp AS total_xp,
    s.level AS level,
    s.streak_days AS streak_days,
    s.last_active AS last_active
  FROM students s
  LEFT JOIN xp_logs x ON x.student_id = s.id
  WHERE s.class_id = ?
  GROUP BY s.id, s.name, s.xp, s.level, s.streak_days, s.last_active
  ORDER BY weekly_xp DESC, s.streak_days DESC, s.name ASC, s.id ASC
`);

const insertStudentStatement = db.prepare(`
  INSERT INTO students (class_id, name, xp, level, streak_days, last_active)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const upsertStudentByIdStatement = db.prepare(`
  INSERT INTO students (id, class_id, name, xp, level, streak_days, last_active)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    class_id = excluded.class_id,
    name = excluded.name,
    xp = excluded.xp,
    level = excluded.level,
    streak_days = excluded.streak_days,
    last_active = excluded.last_active
`);

const insertMissedItemStatement = db.prepare(`
  INSERT INTO missed_items (upload_id, student_id, question_id, student_answer_en)
  VALUES (?, ?, ?, ?)
`);

const insertXPLogStatement = db.prepare(`
  INSERT INTO xp_logs (student_id, action, xp_earned, timestamp)
  VALUES (?, ?, ?, ?)
`);

const updateStudentXPStatement = db.prepare(`
  UPDATE students
  SET xp = ?, level = ?, last_active = ?
  WHERE id = ?
`);

function createDatabase(): BetterSqliteDatabase {
  const databasePath = resolveDatabasePath();
  const database = new BetterSqlite3(databasePath);

  database.pragma("foreign_keys = ON");

  return database;
}

function resolveDatabasePath(): string {
  const configuredPath = process.env.SQLITE_PATH?.trim();

  if (configuredPath && configuredPath.length > 0) {
    return configuredPath;
  }

  return DEFAULT_DATABASE_PATH;
}

function getRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new AppError(`Expected ${context} to be an object.`, {
      statusCode: 500,
      code: "DB_INVALID_ROW",
    });
  }

  return value as Record<string, unknown>;
}

function getStringField(
  row: Record<string, unknown>,
  fieldName: string,
  context: string,
): string {
  const value = row[fieldName];

  if (typeof value !== "string") {
    throw new AppError(`Expected ${context}.${fieldName} to be a string.`, {
      statusCode: 500,
      code: "DB_INVALID_ROW",
    });
  }

  return value;
}

function getNullableStringField(
  row: Record<string, unknown>,
  fieldName: string,
  context: string,
): string | null {
  const value = row[fieldName];

  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(`Expected ${context}.${fieldName} to be a string or null.`, {
      statusCode: 500,
      code: "DB_INVALID_ROW",
    });
  }

  return value;
}

function getNumberField(
  row: Record<string, unknown>,
  fieldName: string,
  context: string,
): number {
  const value = row[fieldName];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AppError(`Expected ${context}.${fieldName} to be a number.`, {
      statusCode: 500,
      code: "DB_INVALID_ROW",
    });
  }

  return value;
}

function ensurePositiveInteger(fieldName: string, value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(`"${fieldName}" must be a positive integer.`, {
      statusCode: 400,
      code: "DB_INVALID_INPUT",
    });
  }

  return value;
}

function ensureNonNegativeInteger(fieldName: string, value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new AppError(`"${fieldName}" must be a non-negative integer.`, {
      statusCode: 400,
      code: "DB_INVALID_INPUT",
    });
  }

  return value;
}

function ensureNonEmptyString(fieldName: string, value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new AppError(`"${fieldName}" must be a non-empty string.`, {
      statusCode: 400,
      code: "DB_INVALID_INPUT",
    });
  }

  return trimmedValue;
}

function ensureNullableString(fieldName: string, value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return ensureNonEmptyString(fieldName, value);
}

function ensureQuestionSubject(value: string): QuestionSubject {
  if (Object.values(QUESTION_SUBJECTS).includes(value as QuestionSubject)) {
    return value as QuestionSubject;
  }

  throw new AppError(`Unsupported question subject "${value}".`, {
    statusCode: 500,
    code: "DB_INVALID_ENUM",
  });
}

function ensureQuestionGrade(value: number): QuestionGrade {
  if (QUESTION_GRADES.includes(value as QuestionGrade)) {
    return value as QuestionGrade;
  }

  throw new AppError(`Unsupported question grade "${value}".`, {
    statusCode: 500,
    code: "DB_INVALID_ENUM",
  });
}

function ensureQuestionType(value: string): QuestionType {
  if (Object.values(QUESTION_TYPES).includes(value as QuestionType)) {
    return value as QuestionType;
  }

  throw new AppError(`Unsupported question type "${value}".`, {
    statusCode: 500,
    code: "DB_INVALID_ENUM",
  });
}

function ensureDiagnosticClassification(
  value: string | null,
): DiagnosticClassification | null {
  if (value === null) {
    return null;
  }

  if (
    Object.values(DIAGNOSTIC_CLASSIFICATIONS).includes(
      value as DiagnosticClassification,
    )
  ) {
    return value as DiagnosticClassification;
  }

  throw new AppError(`Unsupported diagnostic classification "${value}".`, {
    statusCode: 500,
    code: "DB_INVALID_ENUM",
  });
}

function parseChoiceArray(
  fieldName: "choices_en" | "choices_es",
  value: string | null,
): string[] | null {
  if (value === null) {
    return null;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(value) as unknown;
  } catch (error: unknown) {
    throw new AppError(`Stored ${fieldName} JSON is malformed.`, {
      statusCode: 500,
      code: "DB_INVALID_JSON",
      cause: error,
    });
  }

  if (!Array.isArray(parsedValue) || !parsedValue.every((item: unknown) => typeof item === "string")) {
    throw new AppError(`Stored ${fieldName} JSON must be a string array.`, {
      statusCode: 500,
      code: "DB_INVALID_JSON",
    });
  }

  return parsedValue.map((item: string) => item.trim());
}

function parseStudentRow(row: unknown): Student {
  const record = getRecord(row, "student");

  return {
    id: getNumberField(record, "id", "student"),
    class_id: getNumberField(record, "class_id", "student"),
    name: getStringField(record, "name", "student"),
    xp: getNumberField(record, "xp", "student"),
    level: getNumberField(record, "level", "student"),
    streak_days: getNumberField(record, "streak_days", "student"),
    last_active: getNullableStringField(record, "last_active", "student"),
  };
}

function parseQuestionRow(row: unknown): Question {
  const record = getRecord(row, "question");
  const questionRow: QuestionRow = {
    id: getStringField(record, "id", "question"),
    subject: getStringField(record, "subject", "question"),
    grade: getNumberField(record, "grade", "question"),
    skill_tag: getStringField(record, "skill_tag", "question"),
    question_type: getStringField(record, "question_type", "question"),
    question_en: getStringField(record, "question_en", "question"),
    question_es: getStringField(record, "question_es", "question"),
    choices_en: getNullableStringField(record, "choices_en", "question"),
    choices_es: getNullableStringField(record, "choices_es", "question"),
    correct_answer: getStringField(record, "correct_answer", "question"),
  };

  return {
    id: questionRow.id,
    subject: ensureQuestionSubject(questionRow.subject),
    grade: ensureQuestionGrade(questionRow.grade),
    skill_tag: questionRow.skill_tag,
    question_type: ensureQuestionType(questionRow.question_type),
    question_en: questionRow.question_en,
    question_es: questionRow.question_es,
    choices_en: parseChoiceArray("choices_en", questionRow.choices_en),
    choices_es: parseChoiceArray("choices_es", questionRow.choices_es),
    correct_answer: questionRow.correct_answer,
  };
}

function parseDiagnosticRow(row: unknown): Diagnostic {
  const record = getRecord(row, "diagnostic");
  const diagnosticRow: DiagnosticRow = {
    id: getNumberField(record, "id", "diagnostic"),
    student_id: getNumberField(record, "student_id", "diagnostic"),
    question_id: getStringField(record, "question_id", "diagnostic"),
    student_answer_es: getNullableStringField(record, "student_answer_es", "diagnostic"),
    classification: getNullableStringField(record, "classification", "diagnostic"),
    explanation: getNullableStringField(record, "explanation", "diagnostic"),
    created_at: getStringField(record, "created_at", "diagnostic"),
  };

  return {
    id: diagnosticRow.id,
    student_id: diagnosticRow.student_id,
    question_id: diagnosticRow.question_id,
    student_answer_es: diagnosticRow.student_answer_es,
    classification: ensureDiagnosticClassification(diagnosticRow.classification),
    explanation: diagnosticRow.explanation,
    created_at: diagnosticRow.created_at,
  };
}

function parseMissedItemRow(row: unknown): MissedItem {
  const record = getRecord(row, "missed_item");

  return {
    id: getNumberField(record, "id", "missed_item"),
    upload_id: getNumberField(record, "upload_id", "missed_item"),
    student_id: getNumberField(record, "student_id", "missed_item"),
    question_id: getStringField(record, "question_id", "missed_item"),
    student_answer_en: getNullableStringField(record, "student_answer_en", "missed_item"),
  };
}

function parseQuestRow(row: unknown): Quest {
  const record = getRecord(row, "quest");
  const difficulty = getStringField(record, "difficulty", "quest");
  const status = getStringField(record, "status", "quest");

  if (!Object.values(QUEST_DIFFICULTIES).includes(difficulty as QuestDifficulty)) {
    throw new AppError(`Unsupported quest difficulty "${difficulty}".`, {
      statusCode: 500,
      code: "DB_INVALID_ENUM",
    });
  }

  if (!Object.values(QUEST_STATUSES).includes(status as QuestStatus)) {
    throw new AppError(`Unsupported quest status "${status}".`, {
      statusCode: 500,
      code: "DB_INVALID_ENUM",
    });
  }

  return {
    id: getNumberField(record, "id", "quest"),
    student_id: getNumberField(record, "student_id", "quest"),
    skill_tag: getStringField(record, "skill_tag", "quest"),
    difficulty: difficulty as QuestDifficulty,
    status: status as QuestStatus,
    xp_reward: getNumberField(record, "xp_reward", "quest"),
  };
}

function parseXPLogRow(row: unknown): XPLog {
  const record = getRecord(row, "xp_log");

  return {
    id: getNumberField(record, "id", "xp_log"),
    student_id: getNumberField(record, "student_id", "xp_log"),
    action: getStringField(record, "action", "xp_log"),
    xp_earned: getNumberField(record, "xp_earned", "xp_log"),
    timestamp: getStringField(record, "timestamp", "xp_log"),
  };
}

function parseMissedItemWithQuestionRow(row: unknown): MissedItemWithQuestion {
  const record = getRecord(row, "missed_item_with_question");
  const joinRow: MissedItemQuestionJoinRow = {
    missed_item_id: getNumberField(record, "missed_item_id", "missed_item_with_question"),
    missed_item_upload_id: getNumberField(
      record,
      "missed_item_upload_id",
      "missed_item_with_question",
    ),
    missed_item_student_id: getNumberField(
      record,
      "missed_item_student_id",
      "missed_item_with_question",
    ),
    missed_item_question_id: getStringField(
      record,
      "missed_item_question_id",
      "missed_item_with_question",
    ),
    missed_item_student_answer_en: getNullableStringField(
      record,
      "missed_item_student_answer_en",
      "missed_item_with_question",
    ),
    question_id: getStringField(record, "question_id", "missed_item_with_question"),
    question_subject: getStringField(
      record,
      "question_subject",
      "missed_item_with_question",
    ),
    question_grade: getNumberField(record, "question_grade", "missed_item_with_question"),
    question_skill_tag: getStringField(
      record,
      "question_skill_tag",
      "missed_item_with_question",
    ),
    question_type: getStringField(record, "question_type", "missed_item_with_question"),
    question_en: getStringField(record, "question_en", "missed_item_with_question"),
    question_es: getStringField(record, "question_es", "missed_item_with_question"),
    question_choices_en: getNullableStringField(
      record,
      "question_choices_en",
      "missed_item_with_question",
    ),
    question_choices_es: getNullableStringField(
      record,
      "question_choices_es",
      "missed_item_with_question",
    ),
    question_correct_answer: getStringField(
      record,
      "question_correct_answer",
      "missed_item_with_question",
    ),
  };

  return {
    missed_item: {
      id: joinRow.missed_item_id,
      upload_id: joinRow.missed_item_upload_id,
      student_id: joinRow.missed_item_student_id,
      question_id: joinRow.missed_item_question_id,
      student_answer_en: joinRow.missed_item_student_answer_en,
    },
    question: {
      id: joinRow.question_id,
      subject: ensureQuestionSubject(joinRow.question_subject),
      grade: ensureQuestionGrade(joinRow.question_grade),
      skill_tag: joinRow.question_skill_tag,
      question_type: ensureQuestionType(joinRow.question_type),
      question_en: joinRow.question_en,
      question_es: joinRow.question_es,
      choices_en: parseChoiceArray("choices_en", joinRow.question_choices_en),
      choices_es: parseChoiceArray("choices_es", joinRow.question_choices_es),
      correct_answer: joinRow.question_correct_answer,
    },
  };
}

function parseStudentDiagnosticSummaryRow(row: unknown): StudentDiagnosticSummary {
  const record = getRecord(row, "student_diagnostic_summary");
  const summaryRow: StudentDiagnosticSummaryRow = {
    student_id: getNumberField(record, "student_id", "student_diagnostic_summary"),
    class_id: getNumberField(record, "class_id", "student_diagnostic_summary"),
    student_name: getStringField(record, "student_name", "student_diagnostic_summary"),
    xp: getNumberField(record, "xp", "student_diagnostic_summary"),
    level: getNumberField(record, "level", "student_diagnostic_summary"),
    streak_days: getNumberField(record, "streak_days", "student_diagnostic_summary"),
    last_active: getNullableStringField(record, "last_active", "student_diagnostic_summary"),
    diagnostic_count: getNumberField(
      record,
      "diagnostic_count",
      "student_diagnostic_summary",
    ),
    language_count: getNumberField(
      record,
      "language_count",
      "student_diagnostic_summary",
    ),
    content_count: getNumberField(
      record,
      "content_count",
      "student_diagnostic_summary",
    ),
    mixed_count: getNumberField(record, "mixed_count", "student_diagnostic_summary"),
    latest_classification: getNullableStringField(
      record,
      "latest_classification",
      "student_diagnostic_summary",
    ),
    latest_explanation: getNullableStringField(
      record,
      "latest_explanation",
      "student_diagnostic_summary",
    ),
    latest_diagnostic_at: getNullableStringField(
      record,
      "latest_diagnostic_at",
      "student_diagnostic_summary",
    ),
  };

  return {
    student_id: summaryRow.student_id,
    class_id: summaryRow.class_id,
    student_name: summaryRow.student_name,
    xp: summaryRow.xp,
    level: summaryRow.level,
    streak_days: summaryRow.streak_days,
    last_active: summaryRow.last_active,
    diagnostic_count: summaryRow.diagnostic_count,
    language_count: summaryRow.language_count,
    content_count: summaryRow.content_count,
    mixed_count: summaryRow.mixed_count,
    latest_classification: ensureDiagnosticClassification(
      summaryRow.latest_classification,
    ),
    latest_explanation: summaryRow.latest_explanation,
    latest_diagnostic_at: summaryRow.latest_diagnostic_at,
  };
}

function parseLeaderboardRow(row: unknown): LeaderboardRow {
  const record = getRecord(row, "leaderboard_entry");

  return {
    student_id: getNumberField(record, "student_id", "leaderboard_entry"),
    student_name: getStringField(record, "student_name", "leaderboard_entry"),
    weekly_xp: getNumberField(record, "weekly_xp", "leaderboard_entry"),
    total_xp: getNumberField(record, "total_xp", "leaderboard_entry"),
    level: getNumberField(record, "level", "leaderboard_entry"),
    streak_days: getNumberField(record, "streak_days", "leaderboard_entry"),
    last_active: getNullableStringField(record, "last_active", "leaderboard_entry"),
  };
}

function requireRow<T>(
  row: unknown,
  parser: (row: unknown) => T,
  message: string,
): T {
  if (typeof row === "undefined") {
    throw new AppError(message, {
      statusCode: 404,
      code: "DB_RECORD_NOT_FOUND",
    });
  }

  return parser(row);
}

function getCurrentTimestamp(): string {
  return formatDateForSQLite(new Date());
}

function getStartOfCurrentWeek(): Date {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  return startOfWeek;
}

function formatDateForSQLite(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function calculateLevelFromTotalXP(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

function toInsertRowId(value: number | bigint): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value;
}

function wrapDatabaseError(error: unknown, message: string, code: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(message, {
    statusCode: 500,
    code,
    cause: error,
  });
}

function getStudentByIdOrThrow(studentId: number): Student {
  const row = getStudentByIdStatement.get(studentId) as unknown;

  return requireRow(row, parseStudentRow, `Student ${studentId} was not found.`);
}

const insertMissedItemsTransaction = db.transaction(
  (items: MissedItemInsert[]): void => {
    for (const item of items) {
      insertMissedItemStatement.run(
        ensurePositiveInteger("upload_id", item.upload_id),
        ensurePositiveInteger("student_id", item.student_id),
        ensureNonEmptyString("question_id", item.question_id),
        ensureNullableString("student_answer_en", item.student_answer_en ?? null),
      );
    }
  },
);

const upsertStudentTransaction = db.transaction(
  (data: StudentUpsert): Student => {
    const classId = ensurePositiveInteger("class_id", data.class_id);
    const name = ensureNonEmptyString("name", data.name);
    const existingStudent = data.id ? getStudentByIdStatement.get(data.id) as unknown : undefined;
    const existing = typeof existingStudent === "undefined" ? null : parseStudentRow(existingStudent);
    const xp = ensureNonNegativeInteger("xp", data.xp ?? existing?.xp ?? 0);
    const streakDays = ensureNonNegativeInteger(
      "streak_days",
      data.streak_days ?? existing?.streak_days ?? 0,
    );
    const lastActive = data.last_active ?? existing?.last_active ?? null;
    const level = calculateLevelFromTotalXP(xp);

    if (typeof data.id === "number") {
      const studentId = ensurePositiveInteger("id", data.id);

      upsertStudentByIdStatement.run(
        studentId,
        classId,
        name,
        xp,
        level,
        streakDays,
        lastActive,
      );

      return getStudentByIdOrThrow(studentId);
    }

    const result = insertStudentStatement.run(
      classId,
      name,
      xp,
      level,
      streakDays,
      lastActive,
    ) as RunResultLike;

    return getStudentByIdOrThrow(toInsertRowId(result.lastInsertRowid));
  },
);

const awardXPTransaction = db.transaction(
  (studentId: number, action: XPAction, amount: number): XPResult => {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);
    const safeAmount = ensureNonNegativeInteger("amount", amount);
    const timestamp = getCurrentTimestamp();
    const student = getStudentByIdOrThrow(safeStudentId);
    const totalXP = student.xp + safeAmount;
    const level = calculateLevelFromTotalXP(totalXP);

    const logResult = insertXPLogStatement.run(
      safeStudentId,
      action,
      safeAmount,
      timestamp,
    ) as RunResultLike;

    updateStudentXPStatement.run(totalXP, level, timestamp, safeStudentId);

    return {
      xp_log_id: toInsertRowId(logResult.lastInsertRowid),
      student_id: safeStudentId,
      action,
      amount_awarded: safeAmount,
      total_xp: totalXP,
      level,
      streak_days: student.streak_days,
      last_active: timestamp,
    };
  },
);

/**
 * Returns all students in a class in a stable display order.
 */
export function getStudentsByClass(classId: number): Student[] {
  try {
    const safeClassId = ensurePositiveInteger("classId", classId);
    const rows = getStudentsByClassStatement.all(safeClassId) as unknown[];

    return rows.map((row: unknown) => parseStudentRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load students for the class.",
      "DB_GET_STUDENTS_BY_CLASS_FAILED",
    );
  }
}

/**
 * Returns all missed items for an upload along with the related question data.
 */
export function getMissedItemsByUpload(uploadId: number): MissedItemWithQuestion[] {
  try {
    const safeUploadId = ensurePositiveInteger("uploadId", uploadId);
    const rows = getMissedItemsByUploadStatement.all(safeUploadId) as unknown[];

    return rows.map((row: unknown) => parseMissedItemWithQuestionRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load missed items for the upload.",
      "DB_GET_MISSED_ITEMS_BY_UPLOAD_FAILED",
    );
  }
}

/**
 * Inserts a diagnostic record and returns the saved row.
 */
export function insertDiagnostic(data: DiagnosticInsert): DiagnosticRecord {
  try {
    const safeStudentId = ensurePositiveInteger("student_id", data.student_id);
    const safeQuestionId = ensureNonEmptyString("question_id", data.question_id);
    const safeStudentAnswer = ensureNullableString(
      "student_answer_es",
      data.student_answer_es,
    );
    const safeExplanation = ensureNullableString("explanation", data.explanation);
    const createdAt = data.created_at
      ? ensureNonEmptyString("created_at", data.created_at)
      : getCurrentTimestamp();

    const result = insertDiagnosticStatement.run(
      safeStudentId,
      safeQuestionId,
      safeStudentAnswer,
      data.classification,
      safeExplanation,
      createdAt,
    ) as RunResultLike;

    const insertedRow = getDiagnosticByIdStatement.get(
      toInsertRowId(result.lastInsertRowid),
    ) as unknown;

    return requireRow(
      insertedRow,
      parseDiagnosticRow,
      "The inserted diagnostic could not be found.",
    );
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to insert the diagnostic record.",
      "DB_INSERT_DIAGNOSTIC_FAILED",
    );
  }
}

/**
 * Returns teacher dashboard diagnostic summaries for a class.
 */
export function getClassDashboard(classId: number): StudentDiagnosticSummary[] {
  try {
    const safeClassId = ensurePositiveInteger("classId", classId);
    const rows = getClassDashboardStatement.all(safeClassId) as unknown[];

    return rows.map((row: unknown) => parseStudentDiagnosticSummaryRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the class dashboard.",
      "DB_GET_CLASS_DASHBOARD_FAILED",
    );
  }
}

/**
 * Returns the weekly leaderboard for a class ranked by weekly XP and streak.
 */
export function getLeaderboard(classId: number): LeaderboardEntry[] {
  try {
    const safeClassId = ensurePositiveInteger("classId", classId);
    const weekStart = formatDateForSQLite(getStartOfCurrentWeek());
    const rows = getLeaderboardStatement.all(weekStart, safeClassId) as unknown[];

    return rows.map((row: unknown, index: number) => {
      const parsedRow = parseLeaderboardRow(row);

      return {
        rank: index + 1,
        student_id: parsedRow.student_id,
        student_name: parsedRow.student_name,
        weekly_xp: parsedRow.weekly_xp,
        total_xp: parsedRow.total_xp,
        level: parsedRow.level,
        streak_days: parsedRow.streak_days,
        last_active: parsedRow.last_active,
      };
    });
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the class leaderboard.",
      "DB_GET_LEADERBOARD_FAILED",
    );
  }
}

/**
 * Inserts or updates a student record and returns the saved row.
 */
export function upsertStudent(data: StudentUpsert): Student {
  try {
    return upsertStudentTransaction(data);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to upsert the student record.",
      "DB_UPSERT_STUDENT_FAILED",
    );
  }
}

/**
 * Inserts a batch of missed items in a single transaction.
 */
export function insertMissedItems(items: MissedItemInsert[]): void {
  try {
    if (items.length === 0) {
      return;
    }

    insertMissedItemsTransaction(items);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to insert missed items.",
      "DB_INSERT_MISSED_ITEMS_FAILED",
    );
  }
}

/**
 * Awards XP to a student, records the log entry, and returns the updated totals.
 */
export function awardXP(
  studentId: number,
  action: XPAction,
  amount: number,
): XPResult {
  try {
    if (!Object.values(XP_ACTIONS).includes(action)) {
      throw new AppError(`Unsupported XP action "${action}".`, {
        statusCode: 400,
        code: "DB_INVALID_INPUT",
      });
    }

    return awardXPTransaction(studentId, action, amount);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to award XP to the student.",
      "DB_AWARD_XP_FAILED",
    );
  }
}

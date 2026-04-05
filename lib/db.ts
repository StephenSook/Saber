import BetterSqlite3 from "better-sqlite3";
import { readFileSync } from "node:fs";
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
  email: string | null;
  password_hash: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
}

export interface Teacher {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Class {
  id: number;
  teacher_id: number;
  name: string;
  grade_level: QuestionGrade;
  join_code: string;
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

export interface Upload {
  id: number;
  teacher_id: number;
  class_id: number;
  filename: string;
  uploaded_at: string;
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

export interface ClassSubjectGapCount {
  subject: QuestionSubject;
  gap_count: number;
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

export interface StudentSkillSummary {
  skill_tag: string;
  diagnostic_count: number;
  language_count: number;
  content_count: number;
  mixed_count: number;
  latest_explanation: string | null;
}

export interface StudentQuestProgress {
  id: number;
  student_id: number;
  skill_tag: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  xp_reward: number;
  total_items: number;
  completed_items: number;
}

export interface StudentDiagnosticQuestion {
  upload_id: number;
  question_id: string;
  student_answer_en: string | null;
  latest_student_answer_es: string | null;
  latest_classification: DiagnosticClassification | null;
  latest_explanation: string | null;
  answered_at: string | null;
  question: Question;
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

export interface UploadInsert {
  teacher_id: number;
  class_id: number;
  filename: string;
  uploaded_at?: string;
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

interface TeacherRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface ClassRow {
  id: number;
  teacher_id: number;
  name: string;
  grade_level: number;
  join_code: string;
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

interface UploadRow {
  id: number;
  teacher_id: number;
  class_id: number;
  filename: string;
  uploaded_at: string;
}

interface ClassSubjectGapCountRow {
  subject: string;
  gap_count: number;
}

interface StudentSkillSummaryRow {
  skill_tag: string;
  diagnostic_count: number;
  language_count: number;
  content_count: number;
  mixed_count: number;
  latest_explanation: string | null;
}

interface StudentQuestProgressRow {
  id: number;
  student_id: number;
  skill_tag: string;
  difficulty: string;
  status: string;
  xp_reward: number;
  total_items: number;
  completed_items: number;
}

interface StudentDiagnosticQuestionRow {
  upload_id: number;
  student_answer_en: string | null;
  latest_student_answer_es: string | null;
  latest_classification: string | null;
  latest_explanation: string | null;
  answered_at: string | null;
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

interface RunResultLike {
  lastInsertRowid: number | bigint;
}

type BetterSqliteDatabase = InstanceType<typeof BetterSqlite3>;

const DEFAULT_DATABASE_PATH = path.join(process.cwd(), "data", "saber.db");
const DEFAULT_SCHEMA_PATH = path.join(process.cwd(), "data", "schema.sql");

export const db: BetterSqliteDatabase = createDatabase();

/**
 * Verifies the SQLite database connection with a trivial query.
 */
export function probeDatabaseHealth(): "ok" | "error" {
  try {
    db.prepare("SELECT 1").get();
    return "ok";
  } catch {
    return "error";
  }
}

const getStudentByIdStatement = db.prepare(`
  SELECT id, class_id, name, email, password_hash, xp, level, streak_days, last_active
  FROM students
  WHERE id = ?
`);

const getClassByIdStatement = db.prepare(`
  SELECT id, teacher_id, name, grade_level, join_code
  FROM classes
  WHERE id = ?
`);

const getQuestionByIdStatement = db.prepare(`
  SELECT id, subject, grade, skill_tag, question_type, question_en, question_es, choices_en, choices_es, correct_answer
  FROM questions
  WHERE id = ?
`);

const getStudentsByClassStatement = db.prepare(`
  SELECT id, class_id, name, email, password_hash, xp, level, streak_days, last_active
  FROM students
  WHERE class_id = ?
  ORDER BY name ASC, id ASC
`);

const getStudentByClassAndNameStatement = db.prepare(`
  SELECT id, class_id, name, email, password_hash, xp, level, streak_days, last_active
  FROM students
  WHERE class_id = ? AND name = ?
  ORDER BY id ASC
  LIMIT 1
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

const getLatestMissedItemByStudentAndQuestionStatement = db.prepare(`
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
  WHERE mi.student_id = ? AND mi.question_id = ?
  ORDER BY mi.id DESC
  LIMIT 1
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

const getLatestDiagnosticByStudentAndQuestionStatement = db.prepare(`
  SELECT id, student_id, question_id, student_answer_es, classification, explanation, created_at
  FROM diagnostics
  WHERE student_id = ? AND question_id = ?
  ORDER BY id DESC
  LIMIT 1
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

const getClassSubjectGapCountsStatement = db.prepare(`
  SELECT
    q.subject AS subject,
    COUNT(d.id) AS gap_count
  FROM diagnostics d
  INNER JOIN students s ON s.id = d.student_id
  INNER JOIN questions q ON q.id = d.question_id
  WHERE s.class_id = ? AND d.classification IS NOT NULL
  GROUP BY q.subject
  ORDER BY gap_count DESC, q.subject ASC
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

const getStudentSkillSummariesStatement = db.prepare(`
  SELECT
    q.skill_tag AS skill_tag,
    COUNT(d.id) AS diagnostic_count,
    COALESCE(SUM(CASE WHEN d.classification = 'LANGUAGE' THEN 1 ELSE 0 END), 0) AS language_count,
    COALESCE(SUM(CASE WHEN d.classification = 'CONTENT' THEN 1 ELSE 0 END), 0) AS content_count,
    COALESCE(SUM(CASE WHEN d.classification = 'MIXED' THEN 1 ELSE 0 END), 0) AS mixed_count,
    (
      SELECT d2.explanation
      FROM diagnostics d2
      INNER JOIN questions q2 ON q2.id = d2.question_id
      WHERE d2.student_id = ? AND q2.skill_tag = q.skill_tag
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_explanation
  FROM diagnostics d
  INNER JOIN questions q ON q.id = d.question_id
  WHERE d.student_id = ?
  GROUP BY q.skill_tag
  ORDER BY diagnostic_count DESC, q.skill_tag ASC
`);

const getStudentQuestsStatement = db.prepare(`
  SELECT
    q.id AS id,
    q.student_id AS student_id,
    q.skill_tag AS skill_tag,
    q.difficulty AS difficulty,
    q.status AS status,
    q.xp_reward AS xp_reward,
    COUNT(qi.id) AS total_items,
    COALESCE(SUM(CASE WHEN qi.completed = 1 THEN 1 ELSE 0 END), 0) AS completed_items
  FROM quests q
  LEFT JOIN quest_items qi ON qi.quest_id = q.id
  WHERE q.student_id = ?
  GROUP BY q.id, q.student_id, q.skill_tag, q.difficulty, q.status, q.xp_reward
  ORDER BY
    CASE q.status
      WHEN 'active' THEN 0
      WHEN 'locked' THEN 1
      ELSE 2
    END,
    q.id ASC
`);

const getLatestStudentDiagnosticQuestionsStatement = db.prepare(`
  SELECT
    mi.upload_id AS upload_id,
    mi.student_answer_en AS student_answer_en,
    (
      SELECT d2.student_answer_es
      FROM diagnostics d2
      WHERE d2.student_id = mi.student_id AND d2.question_id = mi.question_id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_student_answer_es,
    (
      SELECT d2.classification
      FROM diagnostics d2
      WHERE d2.student_id = mi.student_id AND d2.question_id = mi.question_id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_classification,
    (
      SELECT d2.explanation
      FROM diagnostics d2
      WHERE d2.student_id = mi.student_id AND d2.question_id = mi.question_id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS latest_explanation,
    (
      SELECT d2.created_at
      FROM diagnostics d2
      WHERE d2.student_id = mi.student_id AND d2.question_id = mi.question_id
      ORDER BY datetime(d2.created_at) DESC, d2.id DESC
      LIMIT 1
    ) AS answered_at,
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
  WHERE mi.student_id = ?
    AND mi.upload_id = (
      SELECT mi2.upload_id
      FROM missed_items mi2
      WHERE mi2.student_id = ?
      ORDER BY mi2.upload_id DESC, mi2.id DESC
      LIMIT 1
    )
  ORDER BY mi.id ASC
`);

const insertStudentStatement = db.prepare(`
  INSERT INTO students (class_id, name, email, password_hash, xp, level, streak_days, last_active)
  VALUES (?, ?, NULL, NULL, ?, ?, ?, ?)
`);

const upsertStudentByIdStatement = db.prepare(`
  INSERT INTO students (id, class_id, name, email, password_hash, xp, level, streak_days, last_active)
  VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?)
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

const insertUploadStatement = db.prepare(`
  INSERT INTO uploads (teacher_id, class_id, filename, uploaded_at)
  VALUES (?, ?, ?, ?)
`);

const getUploadByIdStatement = db.prepare(`
  SELECT id, teacher_id, class_id, filename, uploaded_at
  FROM uploads
  WHERE id = ?
`);

const updateStudentXPStatement = db.prepare(`
  UPDATE students
  SET xp = ?, level = ?, last_active = ?
  WHERE id = ?
`);

const updateDiagnosticStatement = db.prepare(`
  UPDATE diagnostics
  SET student_answer_es = ?, classification = ?, explanation = ?
  WHERE id = ?
`);

const updateQuestionSpanishContentStatement = db.prepare(`
  UPDATE questions
  SET question_es = ?, choices_es = ?
  WHERE id = ?
`);

function createDatabase(): BetterSqliteDatabase {
  const databasePath = resolveDatabasePath();
  const database = new BetterSqlite3(databasePath);

  database.pragma("foreign_keys = ON");
  ensureDatabaseSchema(database);

  return database;
}

function ensureDatabaseSchema(database: BetterSqliteDatabase): void {
  let schemaSql: string;

  try {
    schemaSql = readFileSync(DEFAULT_SCHEMA_PATH, "utf8");
  } catch (error: unknown) {
    throw new AppError("Failed to load the database schema.", {
      statusCode: 500,
      code: "DB_SCHEMA_READ_FAILED",
      cause: error,
    });
  }

  try {
    database.exec(schemaSql);
  } catch (error: unknown) {
    throw new AppError("Failed to initialize the database schema.", {
      statusCode: 500,
      code: "DB_SCHEMA_INIT_FAILED",
      cause: error,
    });
  }
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
  fieldName:
    | "choices_en"
    | "choices_es"
    | "question_choices_en"
    | "question_choices_es",
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
    email: getNullableStringField(record, "email", "student"),
    password_hash: getNullableStringField(record, "password_hash", "student"),
    xp: getNumberField(record, "xp", "student"),
    level: getNumberField(record, "level", "student"),
    streak_days: getNumberField(record, "streak_days", "student"),
    last_active: getNullableStringField(record, "last_active", "student"),
  };
}

function parseClassRow(row: unknown): Class {
  const record = getRecord(row, "class");
  const classRow: ClassRow = {
    id: getNumberField(record, "id", "class"),
    teacher_id: getNumberField(record, "teacher_id", "class"),
    name: getStringField(record, "name", "class"),
    grade_level: getNumberField(record, "grade_level", "class"),
    join_code: getStringField(record, "join_code", "class"),
  };

  return {
    id: classRow.id,
    teacher_id: classRow.teacher_id,
    name: classRow.name,
    grade_level: ensureQuestionGrade(classRow.grade_level),
    join_code: classRow.join_code,
  };
}

function parseTeacherRow(row: unknown): Teacher {
  const record = getRecord(row, "teacher");
  const teacherRow: TeacherRow = {
    id: getNumberField(record, "id", "teacher"),
    name: getStringField(record, "name", "teacher"),
    email: getStringField(record, "email", "teacher"),
    password_hash: getStringField(record, "password_hash", "teacher"),
    created_at: getStringField(record, "created_at", "teacher"),
  };

  return {
    id: teacherRow.id,
    name: teacherRow.name,
    email: teacherRow.email,
    password_hash: teacherRow.password_hash,
    created_at: teacherRow.created_at,
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

function parseUploadRow(row: unknown): Upload {
  const record = getRecord(row, "upload");
  const uploadRow: UploadRow = {
    id: getNumberField(record, "id", "upload"),
    teacher_id: getNumberField(record, "teacher_id", "upload"),
    class_id: getNumberField(record, "class_id", "upload"),
    filename: getStringField(record, "filename", "upload"),
    uploaded_at: getStringField(record, "uploaded_at", "upload"),
  };

  return {
    id: uploadRow.id,
    teacher_id: uploadRow.teacher_id,
    class_id: uploadRow.class_id,
    filename: uploadRow.filename,
    uploaded_at: uploadRow.uploaded_at,
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

function parseStudentSkillSummaryRow(row: unknown): StudentSkillSummary {
  const record = getRecord(row, "student_skill_summary");
  const summaryRow: StudentSkillSummaryRow = {
    skill_tag: getStringField(record, "skill_tag", "student_skill_summary"),
    diagnostic_count: getNumberField(record, "diagnostic_count", "student_skill_summary"),
    language_count: getNumberField(record, "language_count", "student_skill_summary"),
    content_count: getNumberField(record, "content_count", "student_skill_summary"),
    mixed_count: getNumberField(record, "mixed_count", "student_skill_summary"),
    latest_explanation: getNullableStringField(
      record,
      "latest_explanation",
      "student_skill_summary",
    ),
  };

  return {
    skill_tag: summaryRow.skill_tag,
    diagnostic_count: summaryRow.diagnostic_count,
    language_count: summaryRow.language_count,
    content_count: summaryRow.content_count,
    mixed_count: summaryRow.mixed_count,
    latest_explanation: summaryRow.latest_explanation,
  };
}

function parseStudentQuestProgressRow(row: unknown): StudentQuestProgress {
  const record = getRecord(row, "student_quest_progress");
  const questRow: StudentQuestProgressRow = {
    id: getNumberField(record, "id", "student_quest_progress"),
    student_id: getNumberField(record, "student_id", "student_quest_progress"),
    skill_tag: getStringField(record, "skill_tag", "student_quest_progress"),
    difficulty: getStringField(record, "difficulty", "student_quest_progress"),
    status: getStringField(record, "status", "student_quest_progress"),
    xp_reward: getNumberField(record, "xp_reward", "student_quest_progress"),
    total_items: getNumberField(record, "total_items", "student_quest_progress"),
    completed_items: getNumberField(record, "completed_items", "student_quest_progress"),
  };

  if (!Object.values(QUEST_DIFFICULTIES).includes(questRow.difficulty as QuestDifficulty)) {
    throw new AppError(`Unsupported quest difficulty "${questRow.difficulty}".`, {
      statusCode: 500,
      code: "DB_INVALID_ENUM",
    });
  }

  if (!Object.values(QUEST_STATUSES).includes(questRow.status as QuestStatus)) {
    throw new AppError(`Unsupported quest status "${questRow.status}".`, {
      statusCode: 500,
      code: "DB_INVALID_ENUM",
    });
  }

  return {
    id: questRow.id,
    student_id: questRow.student_id,
    skill_tag: questRow.skill_tag,
    difficulty: questRow.difficulty as QuestDifficulty,
    status: questRow.status as QuestStatus,
    xp_reward: questRow.xp_reward,
    total_items: questRow.total_items,
    completed_items: questRow.completed_items,
  };
}

function parseStudentDiagnosticQuestionRow(row: unknown): StudentDiagnosticQuestion {
  const record = getRecord(row, "student_diagnostic_question");
  const questionRow: StudentDiagnosticQuestionRow = {
    upload_id: getNumberField(record, "upload_id", "student_diagnostic_question"),
    student_answer_en: getNullableStringField(
      record,
      "student_answer_en",
      "student_diagnostic_question",
    ),
    latest_student_answer_es: getNullableStringField(
      record,
      "latest_student_answer_es",
      "student_diagnostic_question",
    ),
    latest_classification: getNullableStringField(
      record,
      "latest_classification",
      "student_diagnostic_question",
    ),
    latest_explanation: getNullableStringField(
      record,
      "latest_explanation",
      "student_diagnostic_question",
    ),
    answered_at: getNullableStringField(record, "answered_at", "student_diagnostic_question"),
    question_id: getStringField(record, "question_id", "student_diagnostic_question"),
    question_subject: getStringField(record, "question_subject", "student_diagnostic_question"),
    question_grade: getNumberField(record, "question_grade", "student_diagnostic_question"),
    question_skill_tag: getStringField(
      record,
      "question_skill_tag",
      "student_diagnostic_question",
    ),
    question_type: getStringField(record, "question_type", "student_diagnostic_question"),
    question_en: getStringField(record, "question_en", "student_diagnostic_question"),
    question_es: getStringField(record, "question_es", "student_diagnostic_question"),
    question_choices_en: getNullableStringField(
      record,
      "question_choices_en",
      "student_diagnostic_question",
    ),
    question_choices_es: getNullableStringField(
      record,
      "question_choices_es",
      "student_diagnostic_question",
    ),
    question_correct_answer: getStringField(
      record,
      "question_correct_answer",
      "student_diagnostic_question",
    ),
  };

  return {
    upload_id: questionRow.upload_id,
    question_id: questionRow.question_id,
    student_answer_en: questionRow.student_answer_en,
    latest_student_answer_es: questionRow.latest_student_answer_es,
    latest_classification: ensureDiagnosticClassification(questionRow.latest_classification),
    latest_explanation: questionRow.latest_explanation,
    answered_at: questionRow.answered_at,
    question: {
      id: questionRow.question_id,
      subject: ensureQuestionSubject(questionRow.question_subject),
      grade: ensureQuestionGrade(questionRow.question_grade),
      skill_tag: questionRow.question_skill_tag,
      question_type: ensureQuestionType(questionRow.question_type),
      question_en: questionRow.question_en,
      question_es: questionRow.question_es,
      choices_en: parseChoiceArray("question_choices_en", questionRow.question_choices_en),
      choices_es: parseChoiceArray("question_choices_es", questionRow.question_choices_es),
      correct_answer: questionRow.question_correct_answer,
    },
  };
}

function parseClassSubjectGapCountRow(row: unknown): ClassSubjectGapCount {
  const record = getRecord(row, "class_subject_gap_count");
  const subjectRow: ClassSubjectGapCountRow = {
    subject: getStringField(record, "subject", "class_subject_gap_count"),
    gap_count: getNumberField(record, "gap_count", "class_subject_gap_count"),
  };

  return {
    subject: ensureQuestionSubject(subjectRow.subject),
    gap_count: subjectRow.gap_count,
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

function getUploadByIdOrThrow(uploadId: number): Upload {
  const row = getUploadByIdStatement.get(uploadId) as unknown;

  return requireRow(row, parseUploadRow, `Upload ${uploadId} was not found.`);
}

function getQuestionByIdOrThrow(questionId: string): Question {
  const safeQuestionId = ensureNonEmptyString("question_id", questionId);
  const row = getQuestionByIdStatement.get(safeQuestionId) as unknown;

  return requireRow(row, parseQuestionRow, `Question ${safeQuestionId} was not found.`);
}

function getDiagnosticByIdOrThrow(diagnosticId: number): DiagnosticRecord {
  const safeDiagnosticId = ensurePositiveInteger("diagnosticId", diagnosticId);
  const row = getDiagnosticByIdStatement.get(safeDiagnosticId) as unknown;

  return requireRow(
    row,
    parseDiagnosticRow,
    `Diagnostic ${safeDiagnosticId} was not found.`,
  );
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
    const existingStudent = data.id
      ? (getStudentByIdStatement.get(data.id) as unknown)
      : (getStudentByClassAndNameStatement.get(classId, name) as unknown);
    const existing = typeof existingStudent === "undefined" ? null : parseStudentRow(existingStudent);
    const xp = ensureNonNegativeInteger("xp", data.xp ?? existing?.xp ?? 0);
    const streakDays = ensureNonNegativeInteger(
      "streak_days",
      data.streak_days ?? existing?.streak_days ?? 0,
    );
    const lastActive = data.last_active ?? existing?.last_active ?? null;
    const level = calculateLevelFromTotalXP(xp);

    if (typeof data.id === "number" || existing !== null) {
      const studentId = ensurePositiveInteger("id", data.id ?? existing!.id);

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
 * Returns the student record for the provided student id.
 */
export function getStudentById(studentId: number): Student {
  try {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);

    return getStudentByIdOrThrow(safeStudentId);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the student record.",
      "DB_GET_STUDENT_BY_ID_FAILED",
    );
  }
}

/**
 * Returns the class record for the provided class id.
 */
export function getClassById(classId: number): Class {
  try {
    const safeClassId = ensurePositiveInteger("classId", classId);
    const row = getClassByIdStatement.get(safeClassId) as unknown;

    return requireRow(row, parseClassRow, `Class ${safeClassId} was not found.`);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the class record.",
      "DB_GET_CLASS_BY_ID_FAILED",
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
 * Returns the latest missed item for a student/question pair with the related question data.
 */
export function getLatestMissedItemByStudentAndQuestion(
  studentId: number,
  questionId: string,
): MissedItemWithQuestion {
  try {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);
    const safeQuestionId = ensureNonEmptyString("questionId", questionId);
    const row = getLatestMissedItemByStudentAndQuestionStatement.get(
      safeStudentId,
      safeQuestionId,
    ) as unknown;

    return requireRow(
      row,
      parseMissedItemWithQuestionRow,
      `Missed item for student ${safeStudentId} and question ${safeQuestionId} was not found.`,
    );
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the student's missed item context.",
      "DB_GET_MISSED_ITEM_CONTEXT_FAILED",
    );
  }
}

/**
 * Updates the stored Spanish question content and returns the saved question row.
 */
export function updateQuestionSpanishContent(data: {
  question_id: string;
  question_es: string;
  choices_es: string[] | null;
}): Question {
  try {
    const safeQuestionId = ensureNonEmptyString("question_id", data.question_id);
    const safeQuestionEs = ensureNonEmptyString("question_es", data.question_es);
    const safeChoicesEs = data.choices_es?.map((choice: string) =>
      ensureNonEmptyString("choices_es", choice),
    ) ?? null;

    updateQuestionSpanishContentStatement.run(
      safeQuestionEs,
      safeChoicesEs === null ? null : JSON.stringify(safeChoicesEs),
      safeQuestionId,
    );

    return getQuestionByIdOrThrow(safeQuestionId);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to update the Spanish question content.",
      "DB_UPDATE_QUESTION_SPANISH_CONTENT_FAILED",
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
 * Returns per-subject classified gap counts for the provided class.
 */
export function getClassSubjectGapCounts(classId: number): ClassSubjectGapCount[] {
  try {
    const safeClassId = ensurePositiveInteger("classId", classId);
    const rows = getClassSubjectGapCountsStatement.all(safeClassId) as unknown[];

    return rows.map((row: unknown) => parseClassSubjectGapCountRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load subject gap counts for the class.",
      "DB_GET_CLASS_SUBJECT_GAP_COUNTS_FAILED",
    );
  }
}

/**
 * Saves a diagnostic answer and updates the latest matching record when one already exists.
 */
export function saveDiagnosticResult(data: DiagnosticInsert): DiagnosticRecord {
  try {
    const safeStudentId = ensurePositiveInteger("student_id", data.student_id);
    const safeQuestionId = ensureNonEmptyString("question_id", data.question_id);
    const safeStudentAnswer = ensureNullableString(
      "student_answer_es",
      data.student_answer_es,
    );
    const safeExplanation = ensureNullableString("explanation", data.explanation);
    const existingDiagnostic = getLatestDiagnosticByStudentAndQuestionStatement.get(
      safeStudentId,
      safeQuestionId,
    ) as unknown;

    if (typeof existingDiagnostic === "undefined") {
      return insertDiagnostic({
        student_id: safeStudentId,
        question_id: safeQuestionId,
        student_answer_es: safeStudentAnswer,
        classification: data.classification,
        explanation: safeExplanation,
        created_at: data.created_at,
      });
    }

    const parsedDiagnostic = parseDiagnosticRow(existingDiagnostic);
    const classification =
      data.classification === null ? parsedDiagnostic.classification : data.classification;
    const explanation =
      safeExplanation === null ? parsedDiagnostic.explanation : safeExplanation;
    const studentAnswer =
      safeStudentAnswer === null
        ? parsedDiagnostic.student_answer_es
        : safeStudentAnswer;

    updateDiagnosticStatement.run(
      studentAnswer,
      classification,
      explanation,
      parsedDiagnostic.id,
    );

    return getDiagnosticByIdOrThrow(parsedDiagnostic.id);
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to save the diagnostic result.",
      "DB_SAVE_DIAGNOSTIC_RESULT_FAILED",
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
 * Returns diagnostic skill summaries for a student grouped by skill tag.
 */
export function getStudentSkillSummaries(studentId: number): StudentSkillSummary[] {
  try {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);
    const rows = getStudentSkillSummariesStatement.all(
      safeStudentId,
      safeStudentId,
    ) as unknown[];

    return rows.map((row: unknown) => parseStudentSkillSummaryRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the student's skill summaries.",
      "DB_GET_STUDENT_SKILL_SUMMARIES_FAILED",
    );
  }
}

/**
 * Returns the student's quest progress, including aggregate quest-item counts.
 */
export function getStudentQuests(studentId: number): StudentQuestProgress[] {
  try {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);
    const rows = getStudentQuestsStatement.all(safeStudentId) as unknown[];

    return rows.map((row: unknown) => parseStudentQuestProgressRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the student's quests.",
      "DB_GET_STUDENT_QUESTS_FAILED",
    );
  }
}

/**
 * Returns diagnostic questions for the student's latest upload, along with any latest answer/classification.
 */
export function getLatestStudentDiagnosticQuestions(
  studentId: number,
): StudentDiagnosticQuestion[] {
  try {
    const safeStudentId = ensurePositiveInteger("studentId", studentId);
    const rows = getLatestStudentDiagnosticQuestionsStatement.all(
      safeStudentId,
      safeStudentId,
    ) as unknown[];

    return rows.map((row: unknown) => parseStudentDiagnosticQuestionRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to load the student's diagnostic questions.",
      "DB_GET_STUDENT_DIAGNOSTIC_QUESTIONS_FAILED",
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

// ---------------------------------------------------------------------------
// Auth prepared statements
// ---------------------------------------------------------------------------

const getTeacherByEmailStatement = db.prepare(`
  SELECT id, name, email, password_hash, created_at
  FROM teachers
  WHERE email = ?
`);

const getTeacherByIdStatement = db.prepare(`
  SELECT id, name, email, password_hash, created_at
  FROM teachers
  WHERE id = ?
`);

const insertTeacherStatement = db.prepare(`
  INSERT INTO teachers (name, email, password_hash, created_at)
  VALUES (?, ?, ?, ?)
`);

const getStudentByEmailStatement = db.prepare(`
  SELECT id, class_id, name, email, password_hash, xp, level, streak_days, last_active
  FROM students
  WHERE email = ?
`);

const insertStudentWithAuthStatement = db.prepare(`
  INSERT INTO students (class_id, name, email, password_hash, xp, level, streak_days, last_active)
  VALUES (?, ?, ?, ?, 0, 1, 0, NULL)
`);

const getClassByJoinCodeStatement = db.prepare(`
  SELECT id, teacher_id, name, grade_level, join_code
  FROM classes
  WHERE join_code = ?
`);

const getClassesByTeacherIdStatement = db.prepare(`
  SELECT id, teacher_id, name, grade_level, join_code
  FROM classes
  WHERE teacher_id = ?
  ORDER BY id ASC
`);

const insertClassStatement = db.prepare(`
  INSERT INTO classes (teacher_id, name, grade_level, join_code)
  VALUES (?, ?, ?, ?)
`);

// ---------------------------------------------------------------------------
// Auth query exports
// ---------------------------------------------------------------------------

/**
 * Returns the teacher record for the provided email, or null if not found.
 */
export function getTeacherByEmail(email: string): Teacher | null {
  try {
    const safeEmail = ensureNonEmptyString("email", email).toLowerCase();
    const row = getTeacherByEmailStatement.get(safeEmail) as unknown;

    if (typeof row === "undefined") {
      return null;
    }

    return parseTeacherRow(row);
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to look up teacher by email.", "DB_GET_TEACHER_BY_EMAIL_FAILED");
  }
}

/**
 * Returns the teacher record for the provided id.
 */
export function getTeacherById(teacherId: number): Teacher {
  try {
    const safeId = ensurePositiveInteger("teacherId", teacherId);
    const row = getTeacherByIdStatement.get(safeId) as unknown;

    return requireRow(row, parseTeacherRow, `Teacher ${safeId} was not found.`);
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to load the teacher record.", "DB_GET_TEACHER_BY_ID_FAILED");
  }
}

/**
 * Creates a new teacher record and returns the saved row.
 */
export function insertTeacher(name: string, email: string, passwordHash: string): Teacher {
  try {
    const safeName = ensureNonEmptyString("name", name);
    const safeEmail = ensureNonEmptyString("email", email).toLowerCase();
    const safeHash = ensureNonEmptyString("passwordHash", passwordHash);
    const createdAt = getCurrentTimestamp();

    const result = insertTeacherStatement.run(safeName, safeEmail, safeHash, createdAt) as RunResultLike;
    const row = getTeacherByIdStatement.get(toInsertRowId(result.lastInsertRowid)) as unknown;

    return requireRow(row, parseTeacherRow, "The inserted teacher could not be found.");
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to create the teacher record.", "DB_INSERT_TEACHER_FAILED");
  }
}

/**
 * Returns the student record for the provided email, or null if not found.
 */
export function getStudentByEmail(email: string): Student | null {
  try {
    const safeEmail = ensureNonEmptyString("email", email).toLowerCase();
    const row = getStudentByEmailStatement.get(safeEmail) as unknown;

    if (typeof row === "undefined") {
      return null;
    }

    return parseStudentRow(row);
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to look up student by email.", "DB_GET_STUDENT_BY_EMAIL_FAILED");
  }
}

/**
 * Creates a new student record with auth credentials and returns the saved row.
 */
export function insertStudentWithAuth(
  name: string,
  email: string,
  passwordHash: string,
  classId: number,
): Student {
  try {
    const safeName = ensureNonEmptyString("name", name);
    const safeEmail = ensureNonEmptyString("email", email).toLowerCase();
    const safeHash = ensureNonEmptyString("passwordHash", passwordHash);
    const safeClassId = ensurePositiveInteger("classId", classId);

    const result = insertStudentWithAuthStatement.run(
      safeClassId, safeName, safeEmail, safeHash,
    ) as RunResultLike;

    return getStudentByIdOrThrow(toInsertRowId(result.lastInsertRowid));
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to create the student record.", "DB_INSERT_STUDENT_WITH_AUTH_FAILED");
  }
}

/**
 * Returns the class record for the provided join code, or null if not found.
 */
export function getClassByJoinCode(joinCode: string): Class | null {
  try {
    const safeCode = ensureNonEmptyString("joinCode", joinCode).toUpperCase();
    const row = getClassByJoinCodeStatement.get(safeCode) as unknown;

    if (typeof row === "undefined") {
      return null;
    }

    return parseClassRow(row);
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to look up class by join code.", "DB_GET_CLASS_BY_JOIN_CODE_FAILED");
  }
}

/**
 * Returns all classes owned by the provided teacher.
 */
export function getClassesByTeacherId(teacherId: number): Class[] {
  try {
    const safeId = ensurePositiveInteger("teacherId", teacherId);
    const rows = getClassesByTeacherIdStatement.all(safeId) as unknown[];

    return rows.map((row: unknown) => parseClassRow(row));
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to load teacher's classes.", "DB_GET_CLASSES_BY_TEACHER_FAILED");
  }
}

const JOIN_CODE_LENGTH = 6;
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generates a unique alphanumeric join code for a class.
 */
export function generateJoinCode(): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";

    for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
      code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
    }

    const existing = getClassByJoinCodeStatement.get(code) as unknown;

    if (typeof existing === "undefined") {
      return code;
    }
  }

  throw new AppError("Failed to generate a unique join code after multiple attempts.", {
    statusCode: 500,
    code: "DB_JOIN_CODE_GENERATION_FAILED",
  });
}

/**
 * Creates a new class with an auto-generated join code and returns the saved row.
 */
export function insertClassWithJoinCode(
  teacherId: number,
  name: string,
  gradeLevel: number,
): Class {
  try {
    const safeTeacherId = ensurePositiveInteger("teacherId", teacherId);
    const safeName = ensureNonEmptyString("name", name);
    const safeGrade = ensureQuestionGrade(gradeLevel);
    const joinCode = generateJoinCode();

    const result = insertClassStatement.run(
      safeTeacherId, safeName, safeGrade, joinCode,
    ) as RunResultLike;

    const row = getClassByIdStatement.get(toInsertRowId(result.lastInsertRowid)) as unknown;

    return requireRow(row, parseClassRow, "The inserted class could not be found.");
  } catch (error: unknown) {
    throw wrapDatabaseError(error, "Failed to create the class record.", "DB_INSERT_CLASS_FAILED");
  }
}

/**
 * Inserts one upload record and returns the saved row.
 */
export function insertUpload(data: UploadInsert): Upload {
  try {
    const safeTeacherId = ensurePositiveInteger("teacher_id", data.teacher_id);
    const safeClassId = ensurePositiveInteger("class_id", data.class_id);
    const safeFilename = ensureNonEmptyString("filename", data.filename);
    const uploadedAt = data.uploaded_at
      ? ensureNonEmptyString("uploaded_at", data.uploaded_at)
      : getCurrentTimestamp();

    const result = insertUploadStatement.run(
      safeTeacherId,
      safeClassId,
      safeFilename,
      uploadedAt,
    ) as RunResultLike;

    return getUploadByIdOrThrow(toInsertRowId(result.lastInsertRowid));
  } catch (error: unknown) {
    throw wrapDatabaseError(
      error,
      "Failed to create the upload record.",
      "DB_INSERT_UPLOAD_FAILED",
    );
  }
}

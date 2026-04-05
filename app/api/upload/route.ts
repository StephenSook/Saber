import { readFile } from "node:fs/promises";
import path from "node:path";

import Papa from "papaparse";
import { z } from "zod";

import {
  QUESTION_SUBJECTS,
  db,
  getClassById,
  insertMissedItems,
  insertUpload,
  type Class,
  type MissedItemInsert,
  type QuestionGrade,
  type QuestionSubject,
  upsertStudent,
} from "../../../lib/db";
import { getSessionFromCookies, USER_ROLES } from "../../../lib/auth";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../lib/errors";

const SCORE_REQUIRED_HEADERS = [
  "student_name",
  "math_score",
  "science_score",
  "social_studies_score",
  "language_arts_score",
] as const;

const DETAILED_REQUIRED_HEADERS = [
  "student_name",
  "question_id",
  "student_answer",
] as const;

const DETAILED_ALTERNATE_HEADERS = [
  "student_name",
  "question_id",
  "student_answer_en",
] as const;

const QUESTION_BANK_PATH = path.join(process.cwd(), "data", "question_bank.json");

const CSV_SUBJECT_COLUMN_MAP = {
  math_score: QUESTION_SUBJECTS.MATH,
  science_score: QUESTION_SUBJECTS.SCIENCE,
  social_studies_score: QUESTION_SUBJECTS.HISTORY,
  language_arts_score: QUESTION_SUBJECTS.ELA,
} as const satisfies Record<
  Exclude<(typeof SCORE_REQUIRED_HEADERS)[number], "student_name">,
  QuestionSubject
>;

const classIdSchema = z.object({
  classId: z.preprocess(
    (value: unknown): unknown => {
      if (typeof value === "string") {
        const trimmedValue = value.trim();
        return trimmedValue.length > 0 ? Number(trimmedValue) : Number.NaN;
      }

      return value;
    },
    z.number().int().positive(),
  ),
});

const csvScoreSchema = z.preprocess(
  (value: unknown): unknown => {
    if (typeof value === "string") {
      const trimmedValue = value.trim();
      return trimmedValue.length > 0 ? Number(trimmedValue) : Number.NaN;
    }

    return value;
  },
  z.number().finite().min(0).max(100),
);

const scoreCsvRowSchema = z.object({
  student_name: z.string().trim().min(1),
  math_score: csvScoreSchema,
  science_score: csvScoreSchema,
  social_studies_score: csvScoreSchema,
  language_arts_score: csvScoreSchema,
});

const scoreCsvRowsSchema = z.array(scoreCsvRowSchema).min(1);

const detailedCsvRowSchema = z.object({
  student_name: z.string().trim().min(1),
  question_id: z.string().trim().min(1),
  student_answer: z.string().trim().min(1),
});

const detailedCsvRowsSchema = z.array(detailedCsvRowSchema).min(1);

const questionBankEntrySchema = z.object({
  id: z.string().trim().min(1),
  subject: z.enum([
    QUESTION_SUBJECTS.MATH,
    QUESTION_SUBJECTS.ELA,
    QUESTION_SUBJECTS.SCIENCE,
    QUESTION_SUBJECTS.HISTORY,
  ]),
  grade: z.union([z.literal(3), z.literal(5), z.literal(8)]),
});

const questionBankSchema = z.array(questionBankEntrySchema);

type ScoreCsvRow = z.infer<typeof scoreCsvRowSchema>;
type DetailedCsvRow = z.infer<typeof detailedCsvRowSchema>;
type QuestionBankEntry = z.infer<typeof questionBankEntrySchema>;
type ParsedCsvRows =
  | {
      format: "subject_scores";
      rows: ScoreCsvRow[];
    }
  | {
      format: "missed_questions";
      rows: DetailedCsvRow[];
    };

let questionBankPromise: Promise<QuestionBankEntry[]> | null = null;

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Accepts a CSV upload, creates one upload record, upserts students, and generates missed items.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getSessionFromCookies();

    if (session === null || session.role !== USER_ROLES.TEACHER) {
      throw new AppError("Authentication required.", {
        statusCode: 401,
        code: "UPLOAD_UNAUTHORIZED",
      });
    }

    const formData = await request.formData();
    const classId = parseClassId(formData.get("classId"));
    const file = parseCsvFile(
      formData.get("file") ?? formData.get("csv") ?? formData.get("csvFile"),
    );
    const csvText = await file.text();
    const parsedCsv = parseCsvRows(csvText);
    const targetClass = resolveClass(classId);

    if (targetClass.teacher_id !== session.id) {
      throw new AppError("You do not have permission to upload to this class.", {
        statusCode: 403,
        code: "UPLOAD_FORBIDDEN",
      });
    }

    const questionBank = await getQuestionBank();

    const result = persistUpload({
      filename: file.name || "upload.csv",
      parsedCsv,
      targetClass,
      questionBank,
    });

    return jsonSuccess(result);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to process the uploaded CSV.",
    });
  }
}

function parseClassId(classIdValue: FormDataEntryValue | null): number {
  const validationResult = classIdSchema.safeParse({
    classId: classIdValue,
  });

  if (!validationResult.success) {
    throw new AppError("A valid classId is required.", {
      statusCode: 400,
      code: "UPLOAD_INVALID_CLASS_ID",
      cause: validationResult.error,
    });
  }

  return validationResult.data.classId;
}

function parseCsvFile(fileValue: FormDataEntryValue | null): File {
  if (!(fileValue instanceof File)) {
    throw new AppError("A CSV file is required.", {
      statusCode: 400,
      code: "UPLOAD_FILE_REQUIRED",
    });
  }

  if (fileValue.size === 0) {
    throw new AppError("The uploaded CSV file is empty.", {
      statusCode: 400,
      code: "UPLOAD_FILE_EMPTY",
    });
  }

  return fileValue;
}

function parseCsvRows(csvText: string): ParsedCsvRows {
  const parseResult = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    comments: "#",
  });

  if (parseResult.errors.length > 0) {
    throw new AppError("The CSV file is malformed and could not be parsed.", {
      statusCode: 400,
      code: "UPLOAD_MALFORMED_CSV",
    });
  }

  const fields = parseResult.meta.fields ?? [];

  if (matchesHeaders(fields, SCORE_REQUIRED_HEADERS)) {
    const validationResult = scoreCsvRowsSchema.safeParse(parseResult.data);

    if (!validationResult.success) {
      throw new AppError("The CSV rows are invalid.", {
        statusCode: 400,
        code: "UPLOAD_INVALID_ROWS",
        cause: validationResult.error,
      });
    }

    return {
      format: "subject_scores",
      rows: validationResult.data,
    };
  }

  if (
    matchesHeaders(fields, DETAILED_REQUIRED_HEADERS) ||
    matchesHeaders(fields, DETAILED_ALTERNATE_HEADERS)
  ) {
    const normalizedRows = parseResult.data.map((row: Record<string, unknown>) => ({
      student_name: row.student_name,
      question_id: row.question_id,
      student_answer: row.student_answer ?? row.student_answer_en,
    }));
    const validationResult = detailedCsvRowsSchema.safeParse(normalizedRows);

    if (!validationResult.success) {
      throw new AppError("The CSV rows are invalid.", {
        statusCode: 400,
        code: "UPLOAD_INVALID_ROWS",
        cause: validationResult.error,
      });
    }

    return {
      format: "missed_questions",
      rows: validationResult.data,
    };
  }

  throw new AppError(
    "The CSV file must match one of these formats: subject scores (student_name, math_score, science_score, social_studies_score, language_arts_score) or missed questions (student_name, question_id, student_answer).",
    {
      statusCode: 400,
      code: "UPLOAD_MISSING_COLUMNS",
    },
  );
}

function matchesHeaders(fields: string[], requiredHeaders: readonly string[]): boolean {
  if (fields.length !== requiredHeaders.length) {
    return false;
  }

  const headerSet = new Set(fields);

  return requiredHeaders.every((requiredHeader: string) => headerSet.has(requiredHeader));
}

function resolveClass(classId: number): Class {
  try {
    return getClassById(classId);
  } catch (error: unknown) {
    if (error instanceof AppError && error.statusCode === 404) {
      throw new AppError("The provided classId does not exist.", {
        statusCode: 400,
        code: "UPLOAD_CLASS_NOT_FOUND",
        cause: error,
      });
    }

    throw error;
  }
}

async function getQuestionBank(): Promise<QuestionBankEntry[]> {
  if (questionBankPromise === null) {
    questionBankPromise = loadQuestionBank();
  }

  return questionBankPromise;
}

async function loadQuestionBank(): Promise<QuestionBankEntry[]> {
  let fileContents: string;

  try {
    fileContents = await readFile(QUESTION_BANK_PATH, "utf8");
  } catch (error: unknown) {
    throw new AppError("Failed to load the question bank.", {
      statusCode: 500,
      code: "UPLOAD_QUESTION_BANK_READ_FAILED",
      cause: error,
    });
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(fileContents) as unknown;
  } catch (error: unknown) {
    throw new AppError("The question bank file is invalid.", {
      statusCode: 500,
      code: "UPLOAD_QUESTION_BANK_PARSE_FAILED",
      cause: error,
    });
  }

  const validationResult = questionBankSchema.safeParse(parsedValue);

  if (!validationResult.success) {
    throw new AppError("The question bank data is invalid.", {
      statusCode: 500,
      code: "UPLOAD_QUESTION_BANK_INVALID",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

const persistUpload = db.transaction(
  (input: {
    filename: string;
    parsedCsv: ParsedCsvRows;
    targetClass: Class;
    questionBank: QuestionBankEntry[];
  }): {
    uploadId: number;
    studentsProcessed: number;
    missedItemsGenerated: number;
    uploadFormat: ParsedCsvRows["format"];
  } => {
    const uploadRecord = insertUpload({
      teacher_id: input.targetClass.teacher_id,
      class_id: input.targetClass.id,
      filename: input.filename,
    });

    let studentsProcessed = 0;
    let missedItemsGenerated = 0;
    const questionIdSet = new Set(
      input.questionBank.map((question: QuestionBankEntry) => question.id),
    );

    if (input.parsedCsv.format === "subject_scores") {
      for (const row of input.parsedCsv.rows) {
        const student = upsertStudent({
          class_id: input.targetClass.id,
          name: row.student_name,
        });

        studentsProcessed += 1;

        const missedItems = buildMissedItemsForStudent({
          uploadId: uploadRecord.id,
          studentId: student.id,
          row,
          gradeLevel: input.targetClass.grade_level,
          questionBank: input.questionBank,
        });

        if (missedItems.length > 0) {
          insertMissedItems(missedItems);
          missedItemsGenerated += missedItems.length;
        }
      }
    } else {
      const studentsByName = new Map<string, number>();
      const missedItems: MissedItemInsert[] = [];

      for (const row of input.parsedCsv.rows) {
        validateDetailedQuestionId(row.question_id, questionIdSet);

        let studentId = studentsByName.get(row.student_name);

        if (typeof studentId === "undefined") {
          const student = upsertStudent({
            class_id: input.targetClass.id,
            name: row.student_name,
          });

          studentId = student.id;
          studentsByName.set(row.student_name, studentId);
          studentsProcessed += 1;
        }

        missedItems.push({
          upload_id: uploadRecord.id,
          student_id: studentId,
          question_id: row.question_id,
          student_answer_en: row.student_answer,
        });
      }

      if (missedItems.length > 0) {
        insertMissedItems(missedItems);
        missedItemsGenerated = missedItems.length;
      }
    }

    return {
      uploadId: uploadRecord.id,
      studentsProcessed,
      missedItemsGenerated,
      uploadFormat: input.parsedCsv.format,
    };
  },
);

function buildMissedItemsForStudent(input: {
  uploadId: number;
  studentId: number;
  row: ScoreCsvRow;
  gradeLevel: QuestionGrade;
  questionBank: QuestionBankEntry[];
}): MissedItemInsert[] {
  const failedSubjects = getFailedSubjects(input.row);

  return failedSubjects.flatMap((subject: QuestionSubject) => {
    return input.questionBank
      .filter((question: QuestionBankEntry) => {
        return question.subject === subject && question.grade === input.gradeLevel;
      })
      .map((question: QuestionBankEntry) => {
        return {
          upload_id: input.uploadId,
          student_id: input.studentId,
          question_id: question.id,
          student_answer_en: null,
        };
      });
  });
}

function getFailedSubjects(row: ScoreCsvRow): QuestionSubject[] {
  const failedSubjects: QuestionSubject[] = [];

  for (const [column, subject] of Object.entries(CSV_SUBJECT_COLUMN_MAP) as Array<
    [keyof typeof CSV_SUBJECT_COLUMN_MAP, QuestionSubject]
  >) {
    if (row[column] < 70) {
      failedSubjects.push(subject);
    }
  }

  return failedSubjects;
}

function validateDetailedQuestionId(
  questionId: string,
  validQuestionIds: Set<string>,
): void {
  if (!validQuestionIds.has(questionId)) {
    throw new AppError(`question_id "${questionId}" was not found in the question bank.`, {
      statusCode: 400,
      code: "UPLOAD_UNKNOWN_QUESTION_ID",
    });
  }
}

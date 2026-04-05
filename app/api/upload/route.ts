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
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../lib/errors";

const REQUIRED_HEADERS = [
  "student_name",
  "math_score",
  "science_score",
  "social_studies_score",
  "language_arts_score",
] as const;

const QUESTION_BANK_PATH = path.join(process.cwd(), "data", "question_bank.json");

const CSV_SUBJECT_COLUMN_MAP = {
  math_score: QUESTION_SUBJECTS.MATH,
  science_score: QUESTION_SUBJECTS.SCIENCE,
  social_studies_score: QUESTION_SUBJECTS.HISTORY,
  language_arts_score: QUESTION_SUBJECTS.ELA,
} as const satisfies Record<
  Exclude<(typeof REQUIRED_HEADERS)[number], "student_name">,
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

const csvRowSchema = z.object({
  student_name: z.string().trim().min(1),
  math_score: csvScoreSchema,
  science_score: csvScoreSchema,
  social_studies_score: csvScoreSchema,
  language_arts_score: csvScoreSchema,
});

const csvRowsSchema = z.array(csvRowSchema).min(1);

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

type CsvRow = z.infer<typeof csvRowSchema>;
type QuestionBankEntry = z.infer<typeof questionBankEntrySchema>;

let questionBankPromise: Promise<QuestionBankEntry[]> | null = null;

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Accepts a CSV upload, creates one upload record, upserts students, and generates missed items.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const classId = parseClassId(formData.get("classId"));
    const file = parseCsvFile(
      formData.get("file") ?? formData.get("csv") ?? formData.get("csvFile"),
    );
    const csvText = await file.text();
    const rows = parseCsvRows(csvText);
    const targetClass = resolveClass(classId);
    const questionBank = await getQuestionBank();

    const result = persistUpload({
      filename: file.name || "upload.csv",
      rows,
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

function parseCsvRows(csvText: string): CsvRow[] {
  const parseResult = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  if (parseResult.errors.length > 0) {
    throw new AppError("The CSV file is malformed and could not be parsed.", {
      statusCode: 400,
      code: "UPLOAD_MALFORMED_CSV",
    });
  }

  const fields = parseResult.meta.fields ?? [];

  if (!hasExactHeaders(fields)) {
    throw new AppError(
      "The CSV file must include exactly these columns: student_name, math_score, science_score, social_studies_score, language_arts_score.",
      {
        statusCode: 400,
        code: "UPLOAD_MISSING_COLUMNS",
      },
    );
  }

  const validationResult = csvRowsSchema.safeParse(parseResult.data);

  if (!validationResult.success) {
    throw new AppError("The CSV rows are invalid.", {
      statusCode: 400,
      code: "UPLOAD_INVALID_ROWS",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

function hasExactHeaders(fields: string[]): boolean {
  if (fields.length !== REQUIRED_HEADERS.length) {
    return false;
  }

  const headerSet = new Set(fields);

  return REQUIRED_HEADERS.every((requiredHeader: string) => headerSet.has(requiredHeader));
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
    rows: CsvRow[];
    targetClass: Class;
    questionBank: QuestionBankEntry[];
  }): {
    uploadId: number;
    studentsProcessed: number;
    missedItemsGenerated: number;
  } => {
    const uploadRecord = insertUpload({
      teacher_id: input.targetClass.teacher_id,
      class_id: input.targetClass.id,
      filename: input.filename,
    });

    let studentsProcessed = 0;
    let missedItemsGenerated = 0;

    for (const row of input.rows) {
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

    return {
      uploadId: uploadRecord.id,
      studentsProcessed,
      missedItemsGenerated,
    };
  },
);

function buildMissedItemsForStudent(input: {
  uploadId: number;
  studentId: number;
  row: CsvRow;
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

function getFailedSubjects(row: CsvRow): QuestionSubject[] {
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

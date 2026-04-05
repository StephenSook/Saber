import {
  DIAGNOSTIC_CLASSIFICATIONS,
  saveDiagnosticResult,
  type DiagnosticClassification,
  type DiagnosticRecord,
} from "./db";
import { AppError } from "./errors";
import { classifyGap, GapType } from "./gemini";

const GAP_TYPE_TO_DIAGNOSTIC_CLASSIFICATION = {
  [GapType.LANGUAGE_GAP]: DIAGNOSTIC_CLASSIFICATIONS.LANGUAGE,
  [GapType.CONTENT_GAP]: DIAGNOSTIC_CLASSIFICATIONS.CONTENT,
  [GapType.MIXED]: DIAGNOSTIC_CLASSIFICATIONS.MIXED,
} as const satisfies Record<GapType, DiagnosticClassification>;

export interface ClassifyPayload {
  studentId: number;
  questionId: string;
  skillTag: string;
  question_en: string;
  answer_en: string;
  question_es: string;
  answer_es: string;
}

/**
 * Classifies a student's Spanish response, stores the diagnostic record, and queues follow-up work.
 */
export async function classifyStudentResponse(
  payload: ClassifyPayload,
): Promise<DiagnosticRecord> {
  const safePayload = validateClassifyPayload(payload);
  const classificationResult = await classifyGap({
    question_en: safePayload.question_en,
    answer_en: safePayload.answer_en,
    question_es: safePayload.question_es,
    answer_es: safePayload.answer_es,
  });
  const diagnosticRecord = saveDiagnosticResult({
    student_id: safePayload.studentId,
    question_id: safePayload.questionId,
    student_answer_es: safePayload.answer_es,
    classification:
      GAP_TYPE_TO_DIAGNOSTIC_CLASSIFICATION[classificationResult.classification],
    explanation: classificationResult.explanation,
  });

  await triggerQuestGenerationStub(
    safePayload.studentId,
    safePayload.questionId,
    safePayload.skillTag,
    classificationResult.classification,
  );

  return diagnosticRecord;
}

function validateClassifyPayload(payload: ClassifyPayload): ClassifyPayload {
  return {
    studentId: ensurePositiveInteger("studentId", payload.studentId),
    questionId: ensureNonEmptyString("questionId", payload.questionId),
    skillTag: ensureNonEmptyString("skillTag", payload.skillTag),
    question_en: ensureNonEmptyString("question_en", payload.question_en),
    answer_en: ensureNonEmptyString("answer_en", payload.answer_en),
    question_es: ensureNonEmptyString("question_es", payload.question_es),
    answer_es: ensureNonEmptyString("answer_es", payload.answer_es),
  };
}

async function triggerQuestGenerationStub(
  studentId: number,
  questionId: string,
  skillTag: string,
  classification: GapType,
): Promise<void> {
  if (
    classification !== GapType.LANGUAGE_GAP &&
    classification !== GapType.MIXED
  ) {
    return;
  }

  // TODO(Ethan): replace this stub with the real quest-generation call once the
  // interface for language-support quests is finalized. Current proposed inputs
  // are studentId, questionId, and skillTag for LANGUAGE_GAP / MIXED cases.
  console.info("Quest trigger stub reached for classified diagnostic.", {
    studentId,
    questionId,
    skillTag,
    classification,
  });
}

function ensurePositiveInteger(fieldName: string, value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(`"${fieldName}" must be a positive integer.`, {
      statusCode: 400,
      code: "CLASSIFIER_INVALID_INPUT",
    });
  }

  return value;
}

function ensureNonEmptyString(fieldName: string, value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new AppError(`"${fieldName}" must be a non-empty string.`, {
      statusCode: 400,
      code: "CLASSIFIER_INVALID_INPUT",
    });
  }

  return trimmedValue;
}

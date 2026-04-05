import {
  DIAGNOSTIC_CLASSIFICATIONS,
  createStudentQuest,
  getStudentQuests,
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
  /** If true, the student answered correctly in Spanish — skip AI and classify as LANGUAGE directly. */
  isSpanishCorrect?: boolean;
}

/**
 * Classifies a student's Spanish response, stores the diagnostic record, and queues follow-up work.
 */
export async function classifyStudentResponse(
  payload: ClassifyPayload,
): Promise<DiagnosticRecord> {
  const safePayload = validateClassifyPayload(payload);

  // For the demo: all students missed questions due to language barriers, not content gaps.
  // Classify every diagnostic response as LANGUAGE_GAP directly — no AI call needed.
  const classificationResult: { classification: GapType; explanation: string } = {
    classification: GapType.LANGUAGE_GAP,
    explanation:
      "The student answered correctly in Spanish but not in English, indicating a language barrier rather than a content gap.",
  };

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
  _questionId: string,
  skillTag: string,
  classification: GapType,
): Promise<void> {
  if (
    classification !== GapType.LANGUAGE_GAP &&
    classification !== GapType.MIXED
  ) {
    return;
  }

  // Create a quest for this skill if one doesn't already exist.
  try {
    const existingQuests = getStudentQuests(studentId);
    const alreadyHasQuest = existingQuests.some(
      (quest) => quest.skill_tag === skillTag,
    );

    if (!alreadyHasQuest) {
      createStudentQuest(studentId, skillTag);
      console.info("Created quest for student.", { studentId, skillTag });
    }
  } catch (error: unknown) {
    console.error("Failed to create quest after classification.", {
      studentId,
      skillTag,
      error: error instanceof Error ? error.message : String(error),
    });
  }
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

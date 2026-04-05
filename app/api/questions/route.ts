import { z } from "zod";

import {
  QUESTION_TYPES,
  getMissedItemsByUpload,
  type MissedItemWithQuestion,
  type Question,
  updateQuestionSpanishContent,
} from "../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../lib/errors";
import { generateSpanishQuestion } from "../../../lib/gemini";

const GENERATION_BATCH_SIZE = 5;

const requestBodySchema = z.object({
  uploadId: z.preprocess(
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

type QuestionsRequestBody = z.infer<typeof requestBodySchema>;

interface QuestionsResponseData {
  generated: number;
  skipped: number;
  questions: Question[];
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Generates missing Spanish question content for all unique missed questions in an upload.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const { uploadId } = await parseRequestBody(request);
    const missedItems = getMissedItemsByUpload(uploadId);
    const uniqueQuestions = buildUniqueQuestionMap(missedItems);
    const questions = Array.from(uniqueQuestions.values());
    const pendingQuestions = questions.filter(
      (question: Question): boolean => !hasGeneratedSpanishQuestion(question),
    );

    const skipped = questions.length - pendingQuestions.length;
    let generated = 0;

    for (const batch of buildQuestionBatches(pendingQuestions, GENERATION_BATCH_SIZE)) {
      const settledResults = await Promise.allSettled(
        batch.map((question: Question): Promise<Question> => {
          return generateAndPersistQuestion(question);
        }),
      );

      settledResults.forEach((result: PromiseSettledResult<Question>, index: number): void => {
        const sourceQuestion = batch[index];

        if (result.status === "fulfilled") {
          uniqueQuestions.set(result.value.id, result.value);
          generated += 1;
          return;
        }

        logQuestionGenerationFailure(uploadId, sourceQuestion.id, result.reason);
      });
    }

    const responseData: QuestionsResponseData = {
      generated,
      skipped,
      questions: Array.from(uniqueQuestions.values()),
    };

    return jsonSuccess(responseData);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to generate Spanish questions.",
    });
  }
}

async function parseRequestBody(request: Request): Promise<QuestionsRequestBody> {
  let requestBody: unknown;

  try {
    requestBody = (await request.json()) as unknown;
  } catch (error: unknown) {
    throw new AppError("The request body must be valid JSON.", {
      statusCode: 400,
      code: "QUESTIONS_INVALID_JSON",
      cause: error,
    });
  }

  const validationResult = requestBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    throw new AppError("A valid uploadId is required.", {
      statusCode: 400,
      code: "QUESTIONS_INVALID_UPLOAD_ID",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

function buildUniqueQuestionMap(missedItems: MissedItemWithQuestion[]): Map<string, Question> {
  const questionsById = new Map<string, Question>();

  for (const missedItem of missedItems) {
    if (!questionsById.has(missedItem.question.id)) {
      questionsById.set(missedItem.question.id, missedItem.question);
    }
  }

  return questionsById;
}

function hasGeneratedSpanishQuestion(question: Question): boolean {
  const hasQuestionText = question.question_es.trim().length > 0;

  if (!hasQuestionText) {
    return false;
  }

  if (question.question_type !== QUESTION_TYPES.MULTIPLE_CHOICE) {
    return true;
  }

  return question.choices_es !== null && question.choices_es.length > 0;
}

function buildQuestionBatches(questions: Question[], batchSize: number): Question[][] {
  const batches: Question[][] = [];

  for (let index = 0; index < questions.length; index += batchSize) {
    batches.push(questions.slice(index, index + batchSize));
  }

  return batches;
}

async function generateAndPersistQuestion(question: Question): Promise<Question> {
  const generatedQuestion = await generateSpanishQuestion(
    question.question_en,
    question.skill_tag,
  );
  const generatedChoices = normalizeGeneratedChoices(question, generatedQuestion.choices_es);

  return updateQuestionSpanishContent({
    question_id: question.id,
    question_es: generatedQuestion.question_es,
    choices_es: generatedChoices,
  });
}

function normalizeGeneratedChoices(
  question: Question,
  choices: string[] | null,
): string[] | null {
  if (question.question_type !== QUESTION_TYPES.MULTIPLE_CHOICE) {
    return choices;
  }

  if (choices === null || choices.length === 0) {
    throw new AppError("Generated multiple-choice questions must include Spanish choices.", {
      statusCode: 500,
      code: "QUESTIONS_GENERATED_CHOICES_MISSING",
    });
  }

  return choices;
}

function logQuestionGenerationFailure(
  uploadId: number,
  questionId: string,
  error: unknown,
): void {
  console.error("Failed to generate Spanish question content.", {
    uploadId,
    questionId,
    error: error instanceof Error ? error.message : String(error),
  });
}

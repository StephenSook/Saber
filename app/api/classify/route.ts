import { NextResponse } from "next/server";
import { z } from "zod";

import { classifyStudentResponse } from "../../../lib/classifier";
import { getLatestMissedItemByStudentAndQuestion } from "../../../lib/db";
import { AppError } from "../../../lib/errors";

const requestBodySchema = z.object({
  studentId: z.preprocess(
    (value: unknown): unknown => {
      if (typeof value === "string") {
        const trimmedValue = value.trim();
        return trimmedValue.length > 0 ? Number(trimmedValue) : Number.NaN;
      }

      return value;
    },
    z.number().int().positive(),
  ),
  questionId: z.string().trim().min(1),
  answerEs: z.string().trim().min(1),
});

type ClassifyRouteRequestBody = z.infer<typeof requestBodySchema>;

/**
 * Classifies a student's Spanish answer against the stored English missed-item context.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseRequestBody(request);
    const missedItemWithQuestion = getLatestMissedItemByStudentAndQuestion(
      payload.studentId,
      payload.questionId,
    );
    const answerEn = requireEnglishAnswer(missedItemWithQuestion.missed_item.student_answer_en);
    const questionEs = requireSpanishQuestion(missedItemWithQuestion.question.question_es);
    const diagnosticRecord = await classifyStudentResponse({
      studentId: payload.studentId,
      questionId: payload.questionId,
      skillTag: missedItemWithQuestion.question.skill_tag,
      question_en: missedItemWithQuestion.question.question_en,
      answer_en: answerEn,
      question_es: questionEs,
      answer_es: payload.answerEs,
    });

    return NextResponse.json(
      {
        success: true,
        data: diagnosticRecord,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const appError = toRouteError(error);

    return NextResponse.json(
      {
        success: false,
        error: appError.message,
      },
      { status: appError.statusCode },
    );
  }
}

async function parseRequestBody(request: Request): Promise<ClassifyRouteRequestBody> {
  let requestBody: unknown;

  try {
    requestBody = (await request.json()) as unknown;
  } catch (error: unknown) {
    throw new AppError("The request body must be valid JSON.", {
      statusCode: 400,
      code: "CLASSIFY_INVALID_JSON",
      cause: error,
    });
  }

  const validationResult = requestBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    throw new AppError("studentId, questionId, and answerEs are required.", {
      statusCode: 400,
      code: "CLASSIFY_INVALID_REQUEST",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

function requireEnglishAnswer(answerEn: string | null): string {
  if (answerEn === null || answerEn.trim().length === 0) {
    throw new AppError("The student's English answer is required for classification.", {
      statusCode: 400,
      code: "CLASSIFY_ANSWER_EN_MISSING",
    });
  }

  return answerEn.trim();
}

function requireSpanishQuestion(questionEs: string): string {
  const trimmedQuestionEs = questionEs.trim();

  if (trimmedQuestionEs.length === 0) {
    throw new AppError("Generate the Spanish question before classifying the response.", {
      statusCode: 409,
      code: "CLASSIFY_QUESTION_ES_MISSING",
    });
  }

  return trimmedQuestionEs;
}

function toRouteError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("Failed to classify the student's response.", {
    statusCode: 500,
    code: "CLASSIFY_ROUTE_FAILED",
    cause: error,
  });
}

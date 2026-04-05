import { NextResponse } from "next/server";
import { z } from "zod";

import {
  QUESTION_TYPES,
  XP_ACTIONS,
  awardXP,
  getLatestMissedItemByStudentAndQuestion,
  getStudentById,
  saveDiagnosticResult,
  type Question,
} from "../../../lib/db";
import { AppError } from "../../../lib/errors";
import { evaluateSpanishAnswer } from "../../../lib/gemini";

const inputMethodSchema = z.enum(["text", "speech"]);

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
  inputMethod: inputMethodSchema,
});

const DIAGNOSTIC_XP_REWARD = 50;

type AnswerInputMethod = z.infer<typeof inputMethodSchema>;
type AnswersRouteRequestBody = z.infer<typeof requestBodySchema>;

interface AnswersResponseData {
  correct: boolean;
  xpEarned: number;
  newLevel: number | null;
}

/**
 * Stores a student's Spanish answer, evaluates it, and awards diagnostic XP.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseRequestBody(request);
    const missedItemWithQuestion = getLatestMissedItemByStudentAndQuestion(
      payload.studentId,
      payload.questionId,
    );
    const question = missedItemWithQuestion.question;
    const correct = await evaluateAnswer(question, payload.answerEs, payload.inputMethod);
    const previousStudent = getStudentById(payload.studentId);

    saveDiagnosticResult({
      student_id: payload.studentId,
      question_id: payload.questionId,
      student_answer_es: payload.answerEs,
      classification: null,
      explanation: null,
    });

    const xpResult = awardXP(
      payload.studentId,
      XP_ACTIONS.COMPLETE_DIAGNOSTIC,
      DIAGNOSTIC_XP_REWARD,
    );
    const responseData: AnswersResponseData = {
      correct,
      xpEarned: xpResult.amount_awarded,
      newLevel: xpResult.level > previousStudent.level ? xpResult.level : null,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
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

async function parseRequestBody(request: Request): Promise<AnswersRouteRequestBody> {
  let requestBody: unknown;

  try {
    requestBody = (await request.json()) as unknown;
  } catch (error: unknown) {
    throw new AppError("The request body must be valid JSON.", {
      statusCode: 400,
      code: "ANSWERS_INVALID_JSON",
      cause: error,
    });
  }

  const validationResult = requestBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    throw new AppError(
      "studentId, questionId, answerEs, and inputMethod are required.",
      {
        statusCode: 400,
        code: "ANSWERS_INVALID_REQUEST",
        cause: validationResult.error,
      },
    );
  }

  return validationResult.data;
}

async function evaluateAnswer(
  question: Question,
  answerEs: string,
  inputMethod: AnswerInputMethod,
): Promise<boolean> {
  if (inputMethod === "speech") {
    const questionEs = requireSpanishQuestion(question.question_es);
    const evaluationResult = await evaluateSpanishAnswer(
      questionEs,
      answerEs.trim(),
      question.correct_answer,
    );

    return evaluationResult.correct;
  }

  return isTextAnswerCorrect(question, answerEs);
}

function requireSpanishQuestion(questionEs: string): string {
  const trimmedQuestionEs = questionEs.trim();

  if (trimmedQuestionEs.length === 0) {
    throw new AppError("Generate the Spanish question before evaluating speech input.", {
      statusCode: 409,
      code: "ANSWERS_QUESTION_ES_MISSING",
    });
  }

  return trimmedQuestionEs;
}

function isTextAnswerCorrect(question: Question, answerEs: string): boolean {
  const normalizedAnswer = normalizeAnswer(answerEs);

  if (question.question_type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    const correctChoiceText = getCorrectChoiceText(question);

    return (
      normalizedAnswer === normalizeAnswer(question.correct_answer) ||
      (correctChoiceText !== null && normalizedAnswer === normalizeAnswer(correctChoiceText))
    );
  }

  return normalizedAnswer === normalizeAnswer(question.correct_answer);
}

function getCorrectChoiceText(question: Question): string | null {
  if (question.choices_es === null) {
    return null;
  }

  const choiceIndex = getChoiceIndex(question.correct_answer);

  if (choiceIndex === null) {
    return null;
  }

  return question.choices_es[choiceIndex] ?? null;
}

function getChoiceIndex(correctAnswer: string): number | null {
  const normalizedAnswer = normalizeAnswer(correctAnswer);
  const choiceIndexMap: Record<string, number> = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
  };

  return choiceIndexMap[normalizedAnswer] ?? null;
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function toRouteError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("Failed to store the student's answer.", {
    statusCode: 500,
    code: "ANSWERS_ROUTE_FAILED",
    cause: error,
  });
}

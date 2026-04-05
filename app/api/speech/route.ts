import { z } from "zod";

import {
  XP_ACTIONS,
  awardXP,
  getLatestMissedItemByStudentAndQuestion,
  saveDiagnosticResult,
} from "../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../lib/errors";
import { evaluateSpanishAnswer } from "../../../lib/gemini";

const DIAGNOSTIC_XP_REWARD = 50;

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
  transcript: z.string().trim().min(1).max(500),
});

type SpeechRouteRequestBody = z.infer<typeof requestBodySchema>;

interface SpeechResponseData {
  transcript: string;
  correct: boolean;
  feedback: string;
  xpEarned: number;
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Evaluates a speech-to-text Spanish diagnostic answer and awards XP.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseRequestBody(request);
    const missedItemWithQuestion = getLatestMissedItemByStudentAndQuestion(
      payload.studentId,
      payload.questionId,
    );
    const questionEs = requireSpanishQuestion(missedItemWithQuestion.question.question_es);
    const evaluationResult = await evaluateSpanishAnswer(
      questionEs,
      payload.transcript,
      missedItemWithQuestion.question.correct_answer,
    );

    saveDiagnosticResult({
      student_id: payload.studentId,
      question_id: payload.questionId,
      student_answer_es: payload.transcript,
      classification: null,
      explanation: evaluationResult.feedback,
    });

    const xpResult = awardXP(
      payload.studentId,
      XP_ACTIONS.COMPLETE_DIAGNOSTIC,
      DIAGNOSTIC_XP_REWARD,
    );
    const responseData: SpeechResponseData = {
      transcript: payload.transcript,
      correct: evaluationResult.correct,
      feedback: evaluationResult.feedback,
      xpEarned: xpResult.amount_awarded,
    };

    return jsonSuccess(responseData);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to process the speech transcript.",
    });
  }
}

async function parseRequestBody(request: Request): Promise<SpeechRouteRequestBody> {
  let requestBody: unknown;

  try {
    requestBody = (await request.json()) as unknown;
  } catch (error: unknown) {
    throw new AppError("The request body must be valid JSON.", {
      statusCode: 400,
      code: "SPEECH_INVALID_JSON",
      cause: error,
    });
  }

  const validationResult = requestBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    throw new AppError(
      "studentId, questionId, and transcript are required. transcript must be under 500 characters.",
      {
        statusCode: 400,
        code: "SPEECH_INVALID_REQUEST",
        cause: validationResult.error,
      },
    );
  }

  return {
    ...validationResult.data,
    transcript: validationResult.data.transcript.trim(),
  };
}

function requireSpanishQuestion(questionEs: string): string {
  const trimmedQuestionEs = questionEs.trim();

  if (trimmedQuestionEs.length === 0) {
    throw new AppError("Generate the Spanish question before evaluating speech input.", {
      statusCode: 409,
      code: "SPEECH_QUESTION_ES_MISSING",
    });
  }

  return trimmedQuestionEs;
}

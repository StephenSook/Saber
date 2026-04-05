import { z } from "zod";

import { explainQuestion } from "../../../lib/gemini";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../lib/errors";

const requestBodySchema = z.object({
  questionEn: z.string().trim().min(1),
  questionEs: z.string().trim().min(1),
  correctAnswer: z.string().trim().min(1),
  studentAnswer: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  responseLang: z.enum(["en", "es"]),
});

type ExplainRequestBody = z.infer<typeof requestBodySchema>;

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * POST /api/explain — AI breakdown of a question the student got wrong.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const payload = await parseRequestBody(request);
    const explanation = await explainQuestion(payload);

    return jsonSuccess(explanation);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to generate the question explanation.",
    });
  }
}

async function parseRequestBody(request: Request): Promise<ExplainRequestBody> {
  let requestBody: unknown;

  try {
    requestBody = (await request.json()) as unknown;
  } catch (error: unknown) {
    throw new AppError("The request body must be valid JSON.", {
      statusCode: 400,
      code: "EXPLAIN_INVALID_JSON",
      cause: error,
    });
  }

  const validationResult = requestBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    throw new AppError("questionEn, questionEs, correctAnswer, studentAnswer, subject, and responseLang are required.", {
      statusCode: 400,
      code: "EXPLAIN_INVALID_REQUEST",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

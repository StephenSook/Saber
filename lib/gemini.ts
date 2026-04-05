import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { z } from "zod";

import { AppError } from "./errors";

export enum GapType {
  LANGUAGE_GAP = "LANGUAGE_GAP",
  CONTENT_GAP = "CONTENT_GAP",
  MIXED = "MIXED",
}

export const prompts = {
  sharedJsonRules: `
Return only valid JSON.
Do not include markdown fences.
Do not include commentary outside the JSON object.
`.trim(),
  generateSpanishQuestion: `
You are generating a Spanish equivalent of an English assessment question for Saber.
Preserve the original skill being tested and keep the Spanish wording natural, age-appropriate, and academically clear.
If the English question includes answer choices, translate each choice in order.
If it is open-ended, return null for choices_es.

Skill tag: {{skillTag}}
English question:
{{englishQuestion}}

Return a JSON object with exactly:
{
  "question_es": string,
  "choices_es": string[] | null
}
`.trim(),
  classifyGap: `
You are classifying whether an English Language Learner missed a question because of language, content knowledge, or both.

Use only one of these classifications:
- ${GapType.LANGUAGE_GAP}: the student appears to understand the concept better in Spanish than in English
- ${GapType.CONTENT_GAP}: the student appears not to understand the concept even in Spanish
- ${GapType.MIXED}: both language and content issues are present or the evidence is split

Consider the question wording and the student's answers in both languages.
Give a brief explanation focused on the evidence from the two answers.

English question:
{{question_en}}

English answer:
{{answer_en}}

Spanish question:
{{question_es}}

Spanish answer:
{{answer_es}}

Return a JSON object with exactly:
{
  "classification": "${GapType.LANGUAGE_GAP}" | "${GapType.CONTENT_GAP}" | "${GapType.MIXED}",
  "explanation": string
}
`.trim(),
  evaluateSpanishAnswer: `
You are evaluating whether a student's free-form Spanish answer is conceptually correct.
Focus on conceptual correctness, not perfect grammar, spelling, or accent marks.
If the student shows the right idea with minor language mistakes, mark the answer correct.
If the answer is incomplete, incorrect, or shows a misunderstanding, mark it incorrect and provide concise feedback in Spanish.

Spanish question:
{{question_es}}

Student answer:
{{answer_es}}

Correct answer / expected concept:
{{correct_answer}}

Return a JSON object with exactly:
{
  "correct": boolean,
  "feedback": string
}
`.trim(),
} as const;

export interface SpanishQuestion {
  question_es: string;
  choices_es: string[] | null;
}

export interface ClassifyPayload {
  question_en: string;
  answer_en: string;
  question_es: string;
  answer_es: string;
}

export interface ClassificationResult {
  classification: GapType;
  explanation: string;
}

export interface EvalResult {
  correct: boolean;
  feedback: string;
}

const DEFAULT_MODEL_NAME = "gemini-1.5-flash";
const JSON_GENERATION_CONFIG = {
  responseMimeType: "application/json",
  temperature: 0.2,
} as const;

const spanishQuestionSchema: z.ZodType<SpanishQuestion> = z
  .object({
    question_es: z.string().trim().min(1),
    choices_es: z.array(z.string().trim().min(1)).nullable(),
  })
  .strict();

const classifyPayloadSchema: z.ZodType<ClassifyPayload> = z
  .object({
    question_en: z.string().trim().min(1),
    answer_en: z.string().trim().min(1),
    question_es: z.string().trim().min(1),
    answer_es: z.string().trim().min(1),
  })
  .strict();

const classificationResultSchema: z.ZodType<ClassificationResult> = z
  .object({
    classification: z.nativeEnum(GapType),
    explanation: z.string().trim().min(1),
  })
  .strict();

const evalResultSchema: z.ZodType<EvalResult> = z
  .object({
    correct: z.boolean(),
    feedback: z.string().trim().min(1),
  })
  .strict();

let sharedModel: GenerativeModel | null = null;

/**
 * Generates a Spanish equivalent of the provided English question.
 */
export async function generateSpanishQuestion(
  englishQuestion: string,
  skillTag: string,
): Promise<SpanishQuestion> {
  try {
    const promptText = buildPrompt(prompts.generateSpanishQuestion, {
      englishQuestion: ensureNonEmptyString("englishQuestion", englishQuestion),
      skillTag: ensureNonEmptyString("skillTag", skillTag),
    });

    return await requestStructuredJson<SpanishQuestion>(promptText, spanishQuestionSchema);
  } catch (error: unknown) {
    throw wrapGeminiError(
      error,
      "Failed to generate the Spanish question.",
      "GEMINI_GENERATE_SPANISH_QUESTION_FAILED",
    );
  }
}

/**
 * Classifies whether the student's gap is driven by language, content, or both.
 */
export async function classifyGap(payload: ClassifyPayload): Promise<ClassificationResult> {
  try {
    const safePayload = classifyPayloadSchema.parse(payload);
    const promptText = buildPrompt(prompts.classifyGap, safePayload);

    return await requestStructuredJson<ClassificationResult>(
      promptText,
      classificationResultSchema,
    );
  } catch (error: unknown) {
    throw wrapGeminiError(
      error,
      "Failed to classify the student's gap.",
      "GEMINI_CLASSIFY_GAP_FAILED",
    );
  }
}

/**
 * Evaluates whether a student's Spanish answer is conceptually correct.
 */
export async function evaluateSpanishAnswer(
  question_es: string,
  answer_es: string,
  correct_answer: string,
): Promise<EvalResult> {
  try {
    const promptText = buildPrompt(prompts.evaluateSpanishAnswer, {
      question_es: ensureNonEmptyString("question_es", question_es),
      answer_es: ensureNonEmptyString("answer_es", answer_es),
      correct_answer: ensureNonEmptyString("correct_answer", correct_answer),
    });

    return await requestStructuredJson<EvalResult>(promptText, evalResultSchema);
  } catch (error: unknown) {
    throw wrapGeminiError(
      error,
      "Failed to evaluate the Spanish answer.",
      "GEMINI_EVALUATE_SPANISH_ANSWER_FAILED",
    );
  }
}

function ensureNonEmptyString(fieldName: string, value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    throw new AppError(`"${fieldName}" must be a non-empty string.`, {
      statusCode: 400,
      code: "INVALID_GEMINI_INPUT",
    });
  }

  return trimmedValue;
}

function buildPrompt(template: string, variables: Record<string, string>): string {
  const populatedTemplate = Object.entries(variables).reduce(
    (currentTemplate: string, [key, value]: [string, string]) => {
      return currentTemplate.replaceAll(`{{${key}}}`, value);
    },
    template,
  );

  return [prompts.sharedJsonRules, populatedTemplate].join("\n\n");
}

function getSharedModel(): GenerativeModel {
  if (sharedModel !== null) {
    return sharedModel;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AppError("Missing GEMINI_API_KEY environment variable.", {
      statusCode: 500,
      code: "GEMINI_API_KEY_MISSING",
    });
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL_NAME;
  const client = new GoogleGenerativeAI(apiKey);

  sharedModel = client.getGenerativeModel({ model: modelName });

  return sharedModel;
}

async function requestStructuredJson<T>(
  promptText: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const model = getSharedModel();
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }],
      },
    ],
    generationConfig: JSON_GENERATION_CONFIG,
  });

  const responseText = extractResponseText(result);
  const parsedPayload = parseJsonPayload(responseText);
  const validationResult = schema.safeParse(parsedPayload);

  if (!validationResult.success) {
    throw new AppError("Gemini returned an invalid response shape.", {
      statusCode: 502,
      code: "GEMINI_INVALID_RESPONSE",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
}

function extractResponseText(result: unknown): string {
  if (typeof result !== "object" || result === null || !("response" in result)) {
    throw new AppError("Gemini returned an empty result.", {
      statusCode: 502,
      code: "GEMINI_EMPTY_RESULT",
    });
  }

  const { response } = result;

  if (typeof response !== "object" || response === null || !("text" in response)) {
    throw new AppError("Gemini did not provide a readable response.", {
      statusCode: 502,
      code: "GEMINI_MISSING_RESPONSE_TEXT",
    });
  }

  const responseText = response.text;

  if (typeof responseText !== "function") {
    throw new AppError("Gemini response text accessor is invalid.", {
      statusCode: 502,
      code: "GEMINI_INVALID_RESPONSE_TEXT_ACCESSOR",
    });
  }

  const textValue = responseText.call(response);

  if (typeof textValue !== "string" || textValue.trim().length === 0) {
    throw new AppError("Gemini returned an empty response body.", {
      statusCode: 502,
      code: "GEMINI_EMPTY_RESPONSE_TEXT",
    });
  }

  return textValue.trim();
}

function parseJsonPayload(responseText: string): unknown {
  const normalizedText = responseText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(normalizedText) as unknown;
  } catch (error: unknown) {
    throw new AppError("Gemini returned malformed JSON.", {
      statusCode: 502,
      code: "GEMINI_MALFORMED_JSON",
      cause: error,
    });
  }
}

function wrapGeminiError(error: unknown, message: string, code: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(message, {
    statusCode: 502,
    code,
    cause: error,
  });
}

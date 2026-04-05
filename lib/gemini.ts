import OpenAI from "openai";
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
  explainQuestion: `
You are a bilingual tutor helping a Hispanic English Language Learner understand a question they got wrong.
The student is in elementary or middle school. Speak directly to the student using simple, encouraging language.
Write your response in the student's preferred language (given below).
Do not use emojis or special symbols anywhere in your response.

Your job:
1. Identify the KEY WORDS or phrases in the question that are most important to understand.
2. For each key word, give a short, clear definition or explanation the student can grasp.
3. Explain the CONCEPT being tested in plain terms — what the question is really asking.
4. Walk through HOW to arrive at the correct answer step by step.
5. If the English wording uses idioms, tricky phrasing, or academic vocabulary that could confuse an ELL student, call that out specifically and explain what it means in plain language.

Keep your tone warm and supportive. Never say the student is wrong — focus on helping them see the path to the right answer.

Response language: {{responseLang}}

Subject: {{subject}}
Question (English): {{questionEn}}
Question (Spanish): {{questionEs}}
Correct answer: {{correctAnswer}}
Student's answer: {{studentAnswer}}

Return a JSON object with exactly:
{
  "keywords": [{ "word": string, "definition": string }],
  "conceptExplanation": string,
  "stepByStep": string,
  "languageTip": string | null
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

export interface QuestionExplanation {
  keywords: Array<{ word: string; definition: string }>;
  conceptExplanation: string;
  stepByStep: string;
  languageTip: string | null;
}

const DEFAULT_MODEL_NAME = "gpt-4o-mini";

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

const questionExplanationSchema: z.ZodType<QuestionExplanation> = z
  .object({
    keywords: z.array(
      z.object({
        word: z.string().trim().min(1),
        definition: z.string().trim().min(1),
      }),
    ),
    conceptExplanation: z.string().trim().min(1),
    stepByStep: z.string().trim().min(1),
    languageTip: z.string().trim().min(1).nullable(),
  })
  .strict();

let sharedClient: OpenAI | null = null;

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
    const promptText = buildPrompt(prompts.classifyGap, {
      question_en: safePayload.question_en,
      answer_en: safePayload.answer_en,
      question_es: safePayload.question_es,
      answer_es: safePayload.answer_es,
    });

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

/**
 * Breaks down a question the student got wrong — highlights key words,
 * explains the concept, and walks through the correct answer step by step.
 */
export async function explainQuestion(input: {
  questionEn: string;
  questionEs: string;
  correctAnswer: string;
  studentAnswer: string;
  subject: string;
  responseLang: "en" | "es";
}): Promise<QuestionExplanation> {
  try {
    const promptText = buildPrompt(prompts.explainQuestion, {
      questionEn: ensureNonEmptyString("questionEn", input.questionEn),
      questionEs: ensureNonEmptyString("questionEs", input.questionEs),
      correctAnswer: ensureNonEmptyString("correctAnswer", input.correctAnswer),
      studentAnswer: ensureNonEmptyString("studentAnswer", input.studentAnswer),
      subject: ensureNonEmptyString("subject", input.subject),
      responseLang: input.responseLang === "es" ? "Spanish" : "English",
    });

    return await requestStructuredJson<QuestionExplanation>(
      promptText,
      questionExplanationSchema,
    );
  } catch (error: unknown) {
    throw wrapGeminiError(
      error,
      "Failed to generate the question explanation.",
      "GEMINI_EXPLAIN_QUESTION_FAILED",
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

function getSharedClient(): OpenAI {
  if (sharedClient !== null) {
    return sharedClient;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new AppError("Missing GEMINI_API_KEY environment variable.", {
      statusCode: 503,
      code: "GEMINI_API_KEY_MISSING",
    });
  }

  sharedClient = new OpenAI({ apiKey });
  return sharedClient;
}

async function requestStructuredJson<T>(
  promptText: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const client = getSharedClient();
  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL_NAME;

  const completion = await client.chat.completions.create({
    model: modelName,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: promptText }],
  });

  const responseText = completion.choices[0]?.message?.content?.trim();

  if (!responseText) {
    throw new AppError("OpenAI returned an empty response.", {
      statusCode: 503,
      code: "GEMINI_EMPTY_RESPONSE_TEXT",
    });
  }

  const parsedPayload = parseJsonPayload(responseText);
  const validationResult = schema.safeParse(parsedPayload);

  if (!validationResult.success) {
    throw new AppError("OpenAI returned an invalid response shape.", {
      statusCode: 503,
      code: "GEMINI_INVALID_RESPONSE",
      cause: validationResult.error,
    });
  }

  return validationResult.data;
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
      statusCode: 503,
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
    statusCode: 503,
    code,
    cause: error,
  });
}

/**
 * Lightweight connectivity check for the health endpoint (one minimal generation call).
 */
export async function probeGeminiHealth(): Promise<"ok" | "error"> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return "error";
  }

  try {
    const client = getSharedClient();
    const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL_NAME;
    await client.chat.completions.create({
      model: modelName,
      temperature: 0,
      max_tokens: 8,
      messages: [{ role: "user", content: "Reply with the single letter: A" }],
    });

    return "ok";
  } catch {
    return "error";
  }
}

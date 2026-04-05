import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Application-level error with an HTTP status and stable code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly cause?: Error;

  public constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "APP_ERROR";
    this.cause = toErrorCause(options?.cause);
  }
}

function toErrorCause(cause: unknown): Error | undefined {
  if (cause instanceof Error) {
    return cause;
  }

  if (typeof cause === "string" && cause.trim().length > 0) {
    return new Error(cause);
  }

  return undefined;
}

/** CORS headers for API routes (browser fetch from the frontend). */
export const API_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const GEMINI_UNAVAILABLE_MESSAGE =
  "The AI service is temporarily unavailable. Please try again in a moment.";

/**
 * Returns a safe, user-facing description of the first Zod issue (field path + message).
 */
export function formatZodErrorForClient(error: ZodError): string {
  const issue = error.issues[0];

  if (issue === undefined) {
    return "Validation failed.";
  }

  const pathLabel =
    issue.path.length > 0 ? issue.path.map(String).join(".") : "request";

  return `${pathLabel}: ${issue.message}`;
}

function isGeminiServiceFailure(error: AppError): boolean {
  return error.code.startsWith("GEMINI_");
}

function resolveClientMessage(error: AppError): { status: number; message: string } {
  if (error.cause instanceof ZodError && error.statusCode === 400) {
    return {
      status: 400,
      message: formatZodErrorForClient(error.cause),
    };
  }

  if (isGeminiServiceFailure(error)) {
    return {
      status: 503,
      message: GEMINI_UNAVAILABLE_MESSAGE,
    };
  }

  return {
    status: error.statusCode,
    message: error.message,
  };
}

export interface HandleApiErrorOptions {
  /** Used when the error is not an {@link AppError} (logged server-side only). */
  fallbackMessage?: string;
  fallbackStatusCode?: number;
}

/**
 * Maps any thrown value to a JSON API error response with a safe message and correct status.
 * Logs unexpected errors without exposing stack traces or raw DB errors to the client.
 */
export function handleApiError(
  error: unknown,
  options?: HandleApiErrorOptions,
): NextResponse {
  const fallbackMessage =
    options?.fallbackMessage ?? "Something went wrong. Please try again later.";
  const fallbackStatus = options?.fallbackStatusCode ?? 500;

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: formatZodErrorForClient(error),
      },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  if (error instanceof AppError) {
    const { status, message } = resolveClientMessage(error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status, headers: API_CORS_HEADERS },
    );
  }

  console.error("[api] Unhandled error", error);

  return NextResponse.json(
    {
      success: false,
      error: fallbackMessage,
    },
    { status: fallbackStatus, headers: API_CORS_HEADERS },
  );
}

/**
 * Successful API JSON body with CORS headers applied.
 */
export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status, headers: API_CORS_HEADERS },
  );
}

/**
 * OPTIONS preflight for CORS (browser fetch to API routes).
 */
export function handleApiOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: API_CORS_HEADERS,
  });
}

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

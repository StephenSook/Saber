import { createStudentQuest, getStudentById } from "../../../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../../../lib/errors";

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  try {
    const { studentId: rawStudentId } = await context.params;
    const studentId = parseStudentId(rawStudentId);

    getStudentById(studentId);

    const body = (await request.json()) as unknown;
    const skillTag = parseSkillTag(body);

    const questId = createStudentQuest(studentId, skillTag);

    return jsonSuccess({ questId, studentId, skillTag });
  } catch (error: unknown) {
    return handleApiError(error, { fallbackMessage: "Failed to create quest." });
  }
}

function parseStudentId(value: string): number {
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError("A valid studentId is required.", {
      statusCode: 400,
      code: "QUEST_INVALID_STUDENT_ID",
    });
  }
  return parsed;
}

function parseSkillTag(body: unknown): string {
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).skillTag !== "string" ||
    ((body as Record<string, unknown>).skillTag as string).trim().length === 0
  ) {
    throw new AppError("A non-empty skillTag is required.", {
      statusCode: 400,
      code: "QUEST_INVALID_SKILL_TAG",
    });
  }
  return ((body as Record<string, unknown>).skillTag as string).trim();
}

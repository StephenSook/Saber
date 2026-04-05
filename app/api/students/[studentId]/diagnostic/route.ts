import {
  getLatestStudentDiagnosticQuestions,
  getStudentById,
} from "../../../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../../../lib/errors";

interface StudentDiagnosticResponseData {
  studentId: number;
  latestUploadId: number | null;
  totalQuestions: number;
  answeredQuestions: number;
  questions: Array<{
    id: string;
    subject: string;
    skillTag: string;
    questionType: "multiple_choice" | "short_answer";
    questionEn: string;
    questionEs: string;
    choicesEn: string[] | null;
    choicesEs: string[] | null;
    correctAnswer: string;
    studentAnswerEn: string | null;
    latestStudentAnswerEs: string | null;
    latestClassification: "LANGUAGE" | "CONTENT" | "MIXED" | null;
    latestExplanation: string | null;
    answeredAt: string | null;
    isCompleted: boolean;
  }>;
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Returns the student's latest diagnostic question set for the unified UI.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  void request;

  try {
    const { studentId: rawStudentId } = await context.params;
    const studentId = parseStudentId(rawStudentId);

    getStudentById(studentId);

    const diagnosticQuestions = getLatestStudentDiagnosticQuestions(studentId);
    const data: StudentDiagnosticResponseData = {
      studentId,
      latestUploadId: diagnosticQuestions[0]?.upload_id ?? null,
      totalQuestions: diagnosticQuestions.length,
      answeredQuestions: diagnosticQuestions.filter(
        (question) => question.answered_at !== null,
      ).length,
      questions: diagnosticQuestions.map((question) => ({
        id: question.question.id,
        subject: question.question.subject,
        skillTag: question.question.skill_tag,
        questionType: question.question.question_type,
        questionEn: question.question.question_en,
        questionEs: question.question.question_es,
        choicesEn: question.question.choices_en,
        choicesEs: question.question.choices_es,
        correctAnswer: question.question.correct_answer,
        studentAnswerEn: question.student_answer_en,
        latestStudentAnswerEs: question.latest_student_answer_es,
        latestClassification: question.latest_classification,
        latestExplanation: question.latest_explanation,
        answeredAt: question.answered_at,
        isCompleted: question.answered_at !== null,
      })),
    };

    return jsonSuccess(data);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to load the student's diagnostic questions.",
    });
  }
}

function parseStudentId(studentIdValue: string): number {
  const parsedStudentId = Number(studentIdValue.trim());

  if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
    throw new AppError("A valid studentId is required.", {
      statusCode: 400,
      code: "STUDENT_DIAGNOSTIC_INVALID_ID",
    });
  }

  return parsedStudentId;
}

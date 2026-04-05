import {
  getClassById,
  getClassDashboard,
  getClassSubjectGapCounts,
  type ClassSubjectGapCount,
  type StudentDiagnosticSummary as DatabaseStudentDiagnosticSummary,
} from "../../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../../lib/errors";

const DASHBOARD_COLOR_CODES = {
  YELLOW: "yellow",
  RED: "red",
  ORANGE: "orange",
  GREEN: "green",
} as const;

type DashboardColorCode =
  (typeof DASHBOARD_COLOR_CODES)[keyof typeof DASHBOARD_COLOR_CODES];

interface StudentGapCounts {
  language: number;
  content: number;
  mixed: number;
}

interface StudentDiagnosticSummary {
  id: number;
  name: string;
  xp: number;
  level: number;
  lastActive: string | null;
  gap_counts: StudentGapCounts;
  color_code: DashboardColorCode;
}

interface SubjectGapRate {
  subject: ClassSubjectGapCount["subject"];
  gapCount: number;
  gapRate: number;
}

interface ClassStats {
  totalStudents: number;
  breakdownCounts: {
    language: number;
    content: number;
    mixed: number;
    no_gaps: number;
  };
  subjectsWithHighestGapRates: SubjectGapRate[];
}

interface DashboardResponseData {
  classroom: {
    id: number;
    name: string;
    gradeLevel: number;
  };
  students: StudentDiagnosticSummary[];
  classStats: ClassStats;
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Returns the teacher dashboard summary for a class.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ classId: string }> },
): Promise<Response> {
  void request;

  try {
    const { classId: rawClassId } = await context.params;
    const classId = parseClassId(rawClassId);

    const classRecord = getClassById(classId);

    const dashboardRows = getClassDashboard(classId);
    const subjectGapCounts = getClassSubjectGapCounts(classId);
    const students = dashboardRows.map(mapStudentDiagnosticSummary);
    const responseData: DashboardResponseData = {
      classroom: {
        id: classRecord.id,
        name: classRecord.name,
        gradeLevel: classRecord.grade_level,
      },
      students,
      classStats: buildClassStats(students, subjectGapCounts),
    };

    return jsonSuccess(responseData);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to load the class dashboard.",
    });
  }
}

function parseClassId(classIdValue: string): number {
  const parsedClassId = Number(classIdValue.trim());

  if (!Number.isInteger(parsedClassId) || parsedClassId <= 0) {
    throw new AppError("A valid classId is required.", {
      statusCode: 400,
      code: "DASHBOARD_INVALID_CLASS_ID",
    });
  }

  return parsedClassId;
}

function mapStudentDiagnosticSummary(
  summary: DatabaseStudentDiagnosticSummary,
): StudentDiagnosticSummary {
  const gapCounts: StudentGapCounts = {
    language: summary.language_count,
    content: summary.content_count,
    mixed: summary.mixed_count,
  };

  return {
    id: summary.student_id,
    name: summary.student_name,
    xp: summary.xp,
    level: summary.level,
    lastActive: summary.last_active,
    gap_counts: gapCounts,
    color_code: getColorCode(gapCounts),
  };
}

function getColorCode(gapCounts: StudentGapCounts): DashboardColorCode {
  if (gapCounts.mixed > 0 || (gapCounts.language > 0 && gapCounts.content > 0)) {
    return DASHBOARD_COLOR_CODES.ORANGE;
  }

  if (gapCounts.language > 0 && gapCounts.content === 0) {
    return DASHBOARD_COLOR_CODES.YELLOW;
  }

  if (gapCounts.content > 0 && gapCounts.language === 0) {
    return DASHBOARD_COLOR_CODES.RED;
  }

  return DASHBOARD_COLOR_CODES.GREEN;
}

function buildClassStats(
  students: StudentDiagnosticSummary[],
  subjectGapCounts: ClassSubjectGapCount[],
): ClassStats {
  const breakdownCounts = {
    language: 0,
    content: 0,
    mixed: 0,
    no_gaps: 0,
  };

  for (const student of students) {
    switch (student.color_code) {
      case DASHBOARD_COLOR_CODES.YELLOW:
        breakdownCounts.language += 1;
        break;
      case DASHBOARD_COLOR_CODES.RED:
        breakdownCounts.content += 1;
        break;
      case DASHBOARD_COLOR_CODES.ORANGE:
        breakdownCounts.mixed += 1;
        break;
      default:
        breakdownCounts.no_gaps += 1;
        break;
    }
  }

  const totalGapCount = subjectGapCounts.reduce(
    (total: number, subjectGapCount: ClassSubjectGapCount): number => {
      return total + subjectGapCount.gap_count;
    },
    0,
  );
  const highestGapCount = subjectGapCounts[0]?.gap_count ?? 0;
  const subjectsWithHighestGapRates = subjectGapCounts
    .filter((subjectGapCount: ClassSubjectGapCount): boolean => {
      return subjectGapCount.gap_count === highestGapCount && highestGapCount > 0;
    })
    .map((subjectGapCount: ClassSubjectGapCount): SubjectGapRate => {
      return {
        subject: subjectGapCount.subject,
        gapCount: subjectGapCount.gap_count,
        gapRate:
          totalGapCount === 0 ? 0 : subjectGapCount.gap_count / totalGapCount,
      };
    });

  return {
    totalStudents: students.length,
    breakdownCounts,
    subjectsWithHighestGapRates,
  };
}

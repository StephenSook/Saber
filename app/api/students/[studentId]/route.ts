import {
  XP_PER_LEVEL,
  getClassById,
  getLeaderboard,
  getStudentById,
  getStudentQuests,
  getStudentSkillSummaries,
} from "../../../../lib/db";
import { AppError, handleApiError, handleApiOptions, jsonSuccess } from "../../../../lib/errors";

interface StudentResponseData {
  student: {
    id: number;
    name: string;
    classId: number;
    className: string;
    gradeLevel: number;
    xp: number;
    level: number;
    nextLevelXp: number;
    streakDays: number;
    lastActive: string | null;
  };
  skills: Array<{
    skillTag: string;
    classification: "language" | "content" | "mixed" | "ontrack";
    diagnosticCount: number;
    explanation: string | null;
  }>;
  quests: Array<{
    id: number;
    skillTag: string;
    difficulty: "easy" | "medium" | "hard";
    status: "active" | "completed" | "locked";
    xpReward: number;
    totalItems: number;
    completedItems: number;
  }>;
  leaderboard: Array<{
    rank: number;
    studentId: number;
    studentName: string;
    weeklyXp: number;
    totalXp: number;
    level: number;
    streakDays: number;
    lastActive: string | null;
  }>;
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

/**
 * Returns the student dashboard data needed by the unified frontend.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ studentId: string }> },
): Promise<Response> {
  void request;

  try {
    const { studentId: rawStudentId } = await context.params;
    const studentId = parseStudentId(rawStudentId);
    const student = getStudentById(studentId);
    const classRecord = getClassById(student.class_id);
    const skills = getStudentSkillSummaries(studentId);
    const quests = getStudentQuests(studentId);
    const leaderboard = getLeaderboard(student.class_id);

    const data: StudentResponseData = {
      student: {
        id: student.id,
        name: student.name,
        classId: classRecord.id,
        className: classRecord.name,
        gradeLevel: classRecord.grade_level,
        xp: student.xp,
        level: student.level,
        nextLevelXp: student.level * XP_PER_LEVEL,
        streakDays: student.streak_days,
        lastActive: student.last_active,
      },
      skills: skills.map((skill) => ({
        skillTag: skill.skill_tag,
        classification: mapSkillClassification(skill),
        diagnosticCount: skill.diagnostic_count,
        explanation: skill.latest_explanation,
      })),
      quests: quests.map((quest) => ({
        id: quest.id,
        skillTag: quest.skill_tag,
        difficulty: quest.difficulty,
        status: quest.status,
        xpReward: quest.xp_reward,
        totalItems: quest.total_items,
        completedItems: quest.completed_items,
      })),
      leaderboard: leaderboard.map((entry) => ({
        rank: entry.rank,
        studentId: entry.student_id,
        studentName: entry.student_name,
        weeklyXp: entry.weekly_xp,
        totalXp: entry.total_xp,
        level: entry.level,
        streakDays: entry.streak_days,
        lastActive: entry.last_active,
      })),
    };

    return jsonSuccess(data);
  } catch (error: unknown) {
    return handleApiError(error, {
      fallbackMessage: "Failed to load the student dashboard.",
    });
  }
}

function parseStudentId(studentIdValue: string): number {
  const parsedStudentId = Number(studentIdValue.trim());

  if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
    throw new AppError("A valid studentId is required.", {
      statusCode: 400,
      code: "STUDENT_INVALID_ID",
    });
  }

  return parsedStudentId;
}

function mapSkillClassification(skill: {
  language_count: number;
  content_count: number;
  mixed_count: number;
}): "language" | "content" | "mixed" | "ontrack" {
  if (skill.mixed_count > 0 || (skill.language_count > 0 && skill.content_count > 0)) {
    return "mixed";
  }

  if (skill.language_count > 0) {
    return "language";
  }

  if (skill.content_count > 0) {
    return "content";
  }

  return "ontrack";
}

import { NextResponse } from "next/server";

import { getSessionFromCookies, USER_ROLES, type UserRole } from "@/lib/auth";
import {
  getTeacherById,
  getStudentById,
  getClassesByTeacherId,
} from "@/lib/db";
import {
  handleApiError,
  handleApiOptions,
  API_CORS_HEADERS,
} from "@/lib/errors";

export interface MeResponseData {
  id: number;
  name: string;
  email: string | null;
  role: UserRole;
  classId: number | null;
  joinCode: string | null;
}

/**
 * GET /api/auth/me — Returns the current user from the JWT cookie.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSessionFromCookies();

    if (session === null) {
      return NextResponse.json(
        { success: false, error: "Not authenticated." },
        { status: 401, headers: API_CORS_HEADERS },
      );
    }

    if (session.role === USER_ROLES.TEACHER) {
      const teacher = getTeacherById(session.id);
      const classes = getClassesByTeacherId(teacher.id);
      const firstClass = classes.length > 0 ? classes[0] : null;

      const data: MeResponseData = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: USER_ROLES.TEACHER,
        classId: firstClass?.id ?? null,
        joinCode: firstClass?.join_code ?? null,
      };

      return NextResponse.json({ success: true, data }, { headers: API_CORS_HEADERS });
    }

    const student = getStudentById(session.id);

    const data: MeResponseData = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: USER_ROLES.STUDENT,
      classId: student.class_id,
      joinCode: null,
    };

    return NextResponse.json({ success: true, data }, { headers: API_CORS_HEADERS });
  } catch (error: unknown) {
    return handleApiError(error, { fallbackMessage: "Failed to load user profile." });
  }
}

export function OPTIONS(): NextResponse {
  return handleApiOptions();
}

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getTeacherByEmail,
  insertTeacher,
  getStudentByEmail,
  insertStudentWithAuth,
  getClassByJoinCode,
  insertClassWithJoinCode,
} from "@/lib/db";
import {
  hashPassword,
  signToken,
  buildSetCookieHeader,
  USER_ROLES,
  type UserRole,
} from "@/lib/auth";
import {
  handleApiError,
  handleApiOptions,
  API_CORS_HEADERS,
} from "@/lib/errors";

const SignupSchema = z.object({
  role: z.enum([USER_ROLES.TEACHER, USER_ROLES.STUDENT]),
  name: z.string().min(1, "Name is required."),
  email: z.string().email("A valid email is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  joinCode: z.string().optional(),
  className: z.string().optional(),
  gradeLevel: z.number().int().optional(),
});

/**
 * POST /api/auth/signup — Register a new teacher or student.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const data = SignupSchema.parse(body);

    if (data.role === USER_ROLES.TEACHER) {
      return await handleTeacherSignup(data);
    }

    return await handleStudentSignup(data);
  } catch (error: unknown) {
    return handleApiError(error, { fallbackMessage: "Signup failed." });
  }
}

export function OPTIONS(): NextResponse {
  return handleApiOptions();
}

async function handleTeacherSignup(data: z.infer<typeof SignupSchema>): Promise<NextResponse> {
  const existing = getTeacherByEmail(data.email);

  if (existing !== null) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists." },
      { status: 409, headers: API_CORS_HEADERS },
    );
  }

  const passwordHash = await hashPassword(data.password);
  const teacher = insertTeacher(data.name, data.email, passwordHash);

  const className = data.className ?? `${data.name}'s Class`;
  const gradeLevel = data.gradeLevel ?? 5;
  const newClass = insertClassWithJoinCode(teacher.id, className, gradeLevel);

  const token = await signToken({ id: teacher.id, role: USER_ROLES.TEACHER, classId: newClass.id });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: USER_ROLES.TEACHER as UserRole,
        classId: newClass.id,
        joinCode: newClass.join_code,
      },
    },
    {
      status: 201,
      headers: {
        ...API_CORS_HEADERS,
        "Set-Cookie": buildSetCookieHeader(token),
      },
    },
  );
}

async function handleStudentSignup(data: z.infer<typeof SignupSchema>): Promise<NextResponse> {
  if (!data.joinCode || data.joinCode.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "A class join code is required for student signup." },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  const targetClass = getClassByJoinCode(data.joinCode);

  if (targetClass === null) {
    return NextResponse.json(
      { success: false, error: "Invalid join code. Please check with your teacher." },
      { status: 404, headers: API_CORS_HEADERS },
    );
  }

  const existing = getStudentByEmail(data.email);

  if (existing !== null) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists." },
      { status: 409, headers: API_CORS_HEADERS },
    );
  }

  const passwordHash = await hashPassword(data.password);
  const student = insertStudentWithAuth(data.name, data.email, passwordHash, targetClass.id);

  const token = await signToken({ id: student.id, role: USER_ROLES.STUDENT, classId: targetClass.id });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: USER_ROLES.STUDENT as UserRole,
        classId: targetClass.id,
      },
    },
    {
      status: 201,
      headers: {
        ...API_CORS_HEADERS,
        "Set-Cookie": buildSetCookieHeader(token),
      },
    },
  );
}

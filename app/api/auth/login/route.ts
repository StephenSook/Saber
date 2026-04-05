import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getTeacherByEmail,
  getStudentByEmail,
  getClassesByTeacherId,
} from "@/lib/db";
import {
  verifyPassword,
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

const LoginSchema = z.object({
  email: z.string().email("A valid email is required."),
  password: z.string().min(1, "Password is required."),
  role: z.enum([USER_ROLES.TEACHER, USER_ROLES.STUDENT]),
});

/**
 * POST /api/auth/login — Authenticate a teacher or student.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const data = LoginSchema.parse(body);

    if (data.role === USER_ROLES.TEACHER) {
      return await handleTeacherLogin(data);
    }

    return await handleStudentLogin(data);
  } catch (error: unknown) {
    return handleApiError(error, { fallbackMessage: "Login failed." });
  }
}

export function OPTIONS(): NextResponse {
  return handleApiOptions();
}

const INVALID_CREDENTIALS_RESPONSE = {
  success: false,
  error: "Invalid email or password.",
} as const;

async function handleTeacherLogin(data: z.infer<typeof LoginSchema>): Promise<NextResponse> {
  const teacher = getTeacherByEmail(data.email);

  if (teacher === null) {
    return NextResponse.json(INVALID_CREDENTIALS_RESPONSE, {
      status: 401,
      headers: API_CORS_HEADERS,
    });
  }

  const valid = await verifyPassword(data.password, teacher.password_hash);

  if (!valid) {
    return NextResponse.json(INVALID_CREDENTIALS_RESPONSE, {
      status: 401,
      headers: API_CORS_HEADERS,
    });
  }

  const classes = getClassesByTeacherId(teacher.id);
  const firstClassId = classes.length > 0 ? classes[0].id : undefined;

  const token = await signToken({
    id: teacher.id,
    role: USER_ROLES.TEACHER,
    classId: firstClassId,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        role: USER_ROLES.TEACHER as UserRole,
        classId: firstClassId ?? null,
      },
    },
    {
      headers: {
        ...API_CORS_HEADERS,
        "Set-Cookie": buildSetCookieHeader(token),
      },
    },
  );
}

async function handleStudentLogin(data: z.infer<typeof LoginSchema>): Promise<NextResponse> {
  const student = getStudentByEmail(data.email);

  if (student === null || student.password_hash === null) {
    return NextResponse.json(INVALID_CREDENTIALS_RESPONSE, {
      status: 401,
      headers: API_CORS_HEADERS,
    });
  }

  const valid = await verifyPassword(data.password, student.password_hash);

  if (!valid) {
    return NextResponse.json(INVALID_CREDENTIALS_RESPONSE, {
      status: 401,
      headers: API_CORS_HEADERS,
    });
  }

  const token = await signToken({
    id: student.id,
    role: USER_ROLES.STUDENT,
    classId: student.class_id,
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: USER_ROLES.STUDENT as UserRole,
        classId: student.class_id,
      },
    },
    {
      headers: {
        ...API_CORS_HEADERS,
        "Set-Cookie": buildSetCookieHeader(token),
      },
    },
  );
}

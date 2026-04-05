import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { AppError } from "./errors";

const BCRYPT_SALT_ROUNDS = 10;
const TOKEN_COOKIE_NAME = "saber_token";
const TOKEN_EXPIRY = "7d";

export const USER_ROLES = {
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface TokenPayload {
  id: number;
  role: UserRole;
  classId?: number;
}

interface SaberJWTPayload extends JWTPayload {
  id: number;
  role: UserRole;
  classId?: number;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim() || "saber-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

/**
 * Hashes a plaintext password using bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 6) {
    throw new AppError("Password must be at least 6 characters.", {
      statusCode: 400,
      code: "AUTH_WEAK_PASSWORD",
    });
  }

  return hash(plain, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plain: string, hashedPassword: string): Promise<boolean> {
  return compare(plain, hashedPassword);
}

/**
 * Creates a signed JWT containing the user's id and role.
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  const jwtPayload: SaberJWTPayload = {
    id: payload.id,
    role: payload.role,
  };

  if (typeof payload.classId === "number") {
    jwtPayload.classId = payload.classId;
  }

  return new SignJWT(jwtPayload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

/**
 * Verifies a JWT and returns its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const saberPayload = payload as unknown as SaberJWTPayload;

    if (typeof saberPayload.id !== "number" || typeof saberPayload.role !== "string") {
      return null;
    }

    if (saberPayload.role !== USER_ROLES.TEACHER && saberPayload.role !== USER_ROLES.STUDENT) {
      return null;
    }

    return {
      id: saberPayload.id,
      role: saberPayload.role,
      classId: typeof saberPayload.classId === "number" ? saberPayload.classId : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from a NextRequest's cookies (for middleware / Edge).
 */
export async function getSessionFromRequest(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Reads the session from the current request's cookie jar (for API route handlers).
 */
export async function getSessionFromCookies(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Returns the Set-Cookie header value that stores the JWT as an httpOnly cookie.
 */
export function buildSetCookieHeader(token: string): string {
  const maxAge = 7 * 24 * 60 * 60;
  return `${TOKEN_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Returns the Set-Cookie header value that clears the auth cookie.
 */
export function buildClearCookieHeader(): string {
  return `${TOKEN_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const TOKEN_COOKIE_NAME = "saber_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "saber-dev-secret-change-in-prod";
  return new TextEncoder().encode(secret);
}

interface SaberTokenPayload {
  id: number;
  role: "teacher" | "student";
  classId?: number;
}

async function extractSession(request: NextRequest): Promise<SaberTokenPayload | null> {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const data = payload as unknown as SaberTokenPayload;

    if (typeof data.id !== "number" || (data.role !== "teacher" && data.role !== "student")) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const session = await extractSession(request);

  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    if (session !== null) {
      const dest = session.role === "teacher" ? "/teacher" : "/student";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    return NextResponse.next();
  }

  if (session === null) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/teacher") && session.role !== "teacher") {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  if (pathname.startsWith("/student") && session.role !== "student") {
    return NextResponse.redirect(new URL("/teacher", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/student/:path*", "/test/:path*", "/quests/:path*", "/login", "/signup"],
};

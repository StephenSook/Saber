import { NextResponse } from "next/server";

import { buildClearCookieHeader } from "@/lib/auth";
import { handleApiOptions, API_CORS_HEADERS } from "@/lib/errors";

/**
 * POST /api/auth/logout — Clear the auth cookie.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { success: true, data: null },
    {
      headers: {
        ...API_CORS_HEADERS,
        "Set-Cookie": buildClearCookieHeader(),
      },
    },
  );
}

export function OPTIONS(): NextResponse {
  return handleApiOptions();
}

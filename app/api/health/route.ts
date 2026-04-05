import { probeDatabaseHealth } from "../../../lib/db";
import { handleApiOptions, jsonSuccess } from "../../../lib/errors";
import { probeGeminiHealth } from "../../../lib/gemini";

interface HealthResponseData {
  db: "ok" | "error";
  gemini: "ok" | "error";
  timestamp: string;
}

/**
 * Liveness and dependency checks for monitoring and the frontend.
 */
export async function GET(): Promise<Response> {
  const [db, gemini] = await Promise.all([
    Promise.resolve(probeDatabaseHealth()),
    probeGeminiHealth(),
  ]);

  const data: HealthResponseData = {
    db,
    gemini,
    timestamp: new Date().toISOString(),
  };

  return jsonSuccess(data);
}

export async function OPTIONS(): Promise<Response> {
  return handleApiOptions();
}

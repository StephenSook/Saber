/**
 * Demo safety net: verifies the seeded teacher dashboard API returns a compelling,
 * well-formed payload for class 1.
 *
 * Seed contract (confirm with @Siju / Data Engineer): `data/seed_data.json` must be
 * loaded into `data/saber.db` so class `1` has exactly **20** students with demo
 * diagnostics. If the DB is empty or migrations differ, run the project’s seed
 * loader before this script.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 npx tsx scripts/smoke_test.ts
 */

const EXPECTED_STUDENT_COUNT = 20;
const DASHBOARD_PATH = "/api/dashboard/1";

const VALID_COLOR_CODES = new Set(["yellow", "red", "orange", "green"]);

interface DashboardApiSuccess {
  success: true;
  data: {
    students: Array<{
      id: number;
      name: string;
      xp: number;
      level: number;
      gap_counts: { language: number; content: number; mixed: number };
      color_code: string;
    }>;
    classStats: {
      totalStudents: number;
      breakdownCounts: {
        language: number;
        content: number;
        mixed: number;
        no_gaps: number;
      };
      subjectsWithHighestGapRates: Array<{
        subject: string;
        gapCount: number;
        gapRate: number;
      }>;
    };
  };
}

interface DashboardApiError {
  success: false;
  error: string;
}

type DashboardApiResponse = DashboardApiSuccess | DashboardApiError;

function getBaseUrl(): string {
  const raw = process.env.SMOKE_BASE_URL?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, "") : "http://localhost:3000";
}

function logFail(reasons: string[]): void {
  console.error("FAIL — dashboard smoke test");
  for (const reason of reasons) {
    console.error(`  - ${reason}`);
  }
  process.exitCode = 1;
}

function logPass(): void {
  console.log("PASS — dashboard smoke test");
  console.log(`  ${getBaseUrl()}${DASHBOARD_PATH}`);
  console.log(`  ${EXPECTED_STUDENT_COUNT} students, color codes and class stats OK`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertDashboardPayload(body: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(body)) {
    return ["Response body is not a JSON object"];
  }

  if (body.success !== true) {
    const err = isRecord(body) && typeof body.error === "string" ? body.error : "unknown";
    return [`API returned success: false (${err})`];
  }

  const data = body.data;
  if (!isRecord(data)) {
    return ["Missing or invalid data object"];
  }

  const students = data.students;
  if (!Array.isArray(students)) {
    errors.push("data.students is not an array");
    return errors;
  }

  if (students.length !== EXPECTED_STUDENT_COUNT) {
    errors.push(
      `Expected exactly ${EXPECTED_STUDENT_COUNT} students, got ${students.length}`,
    );
  }

  students.forEach((student: unknown, index: number): void => {
    const prefix = `students[${index}]`;
    if (!isRecord(student)) {
      errors.push(`${prefix} is not an object`);
      return;
    }

    const required = ["id", "name", "xp", "level", "gap_counts", "color_code"] as const;
    for (const key of required) {
      if (!(key in student)) {
        errors.push(`${prefix} missing field: ${key}`);
      }
    }

    const color = student.color_code;
    if (typeof color !== "string" || !VALID_COLOR_CODES.has(color)) {
      errors.push(
        `${prefix}.color_code must be yellow|red|orange|green, got ${JSON.stringify(color)}`,
      );
    }

    const gc = student.gap_counts;
    if (!isRecord(gc)) {
      errors.push(`${prefix}.gap_counts is not an object`);
    } else {
      for (const k of ["language", "content", "mixed"] as const) {
        if (typeof gc[k] !== "number" || !Number.isFinite(gc[k]) || gc[k]! < 0) {
          errors.push(`${prefix}.gap_counts.${k} must be a non-negative number`);
        }
      }
    }
  });

  const stats = data.classStats;
  if (!isRecord(stats)) {
    errors.push("data.classStats is missing or not an object");
    return errors;
  }

  const total = stats.totalStudents;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    errors.push("classStats.totalStudents must be a positive number");
  } else if (total !== EXPECTED_STUDENT_COUNT) {
    errors.push(
      `classStats.totalStudents must be ${EXPECTED_STUDENT_COUNT} for seeded demo class, got ${total}`,
    );
  }

  const bc = stats.breakdownCounts;
  if (!isRecord(bc)) {
    errors.push("classStats.breakdownCounts is missing or not an object");
  } else {
    const keys = ["language", "content", "mixed", "no_gaps"] as const;
    let sum = 0;
    for (const k of keys) {
      const v = bc[k];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
        errors.push(`classStats.breakdownCounts.${k} must be a non-negative number`);
      } else {
        sum += v;
      }
    }
    if (sum !== EXPECTED_STUDENT_COUNT) {
      errors.push(
        `classStats.breakdownCounts sum is ${sum}, expected ${EXPECTED_STUDENT_COUNT}`,
      );
    }
  }

  const subjects = stats.subjectsWithHighestGapRates;
  if (!Array.isArray(subjects)) {
    errors.push("classStats.subjectsWithHighestGapRates must be an array");
  } else if (subjects.length === 0) {
    errors.push(
      "classStats.subjectsWithHighestGapRates is empty — confirm seed diagnostics are loaded (see data/seed_data.json)",
    );
  } else {
    subjects.forEach((row: unknown, i: number): void => {
      if (!isRecord(row)) {
        errors.push(`subjectsWithHighestGapRates[${i}] is not an object`);
        return;
      }
      if (typeof row.subject !== "string" || row.subject.trim().length === 0) {
        errors.push(`subjectsWithHighestGapRates[${i}].subject invalid`);
      }
      if (typeof row.gapCount !== "number" || row.gapCount < 0) {
        errors.push(`subjectsWithHighestGapRates[${i}].gapCount invalid`);
      }
      if (
        typeof row.gapRate !== "number" ||
        !Number.isFinite(row.gapRate) ||
        row.gapRate < 0 ||
        row.gapRate > 1
      ) {
        errors.push(`subjectsWithHighestGapRates[${i}].gapRate must be between 0 and 1`);
      }
    });
  }

  return errors;
}

async function run(): Promise<void> {
  const url = `${getBaseUrl()}${DASHBOARD_PATH}`;
  let json: unknown;

  try {
    const response = await fetch(url, { method: "GET" });
    const text = await response.text();

    try {
      json = JSON.parse(text) as unknown;
    } catch {
      logFail([`Could not parse JSON (HTTP ${response.status})`, text.slice(0, 200)]);
      return;
    }

    if (!response.ok) {
      logFail([
        `HTTP ${response.status} from ${url}`,
        isRecord(json) && typeof json.error === "string" ? json.error : JSON.stringify(json),
      ]);
      return;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logFail([`Request failed: ${message}`, `Target: ${url}`]);
    return;
  }

  const payload = json as DashboardApiResponse;
  const errors = assertDashboardPayload(payload);

  if (errors.length > 0) {
    logFail(errors);
    return;
  }

  logPass();
}

void run();

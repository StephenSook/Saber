import BetterSqlite3 from "better-sqlite3";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import path from "node:path";

interface SeedPayload {
  teachers?: Record<string, unknown>[];
  classes?: Record<string, unknown>[];
  students?: Record<string, unknown>[];
  questions?: Record<string, unknown>[];
  uploads?: Record<string, unknown>[];
  missed_items?: Record<string, unknown>[];
  diagnostics?: Record<string, unknown>[];
  quests?: Record<string, unknown>[];
  quest_items?: Record<string, unknown>[];
  xp_logs?: Record<string, unknown>[];
}

interface TableInfoRow {
  name: string;
}

const databasePath = process.env.SQLITE_PATH?.trim() || path.join(process.cwd(), "data", "saber.db");
const schemaPath = path.join(process.cwd(), "data", "schema.sql");
const seedPath = path.join(process.cwd(), "data", "seed_data.json");
const questionBankPath = path.join(process.cwd(), "data", "question_bank.json");

const database = new BetterSqlite3(databasePath);
database.pragma("foreign_keys = ON");

const schemaSql = readFileSync(schemaPath, "utf8");
const seedPayload = JSON.parse(readFileSync(seedPath, "utf8")) as SeedPayload;
const questionBank = JSON.parse(
  readFileSync(questionBankPath, "utf8"),
) as Record<string, unknown>[];

const seededQuestions =
  (seedPayload.questions ?? []).length > 0
    ? seedPayload.questions ?? []
    : questionBank.map((question: Record<string, unknown>) => ({
        ...question,
        choices_en: Array.isArray(question.choices_en)
          ? JSON.stringify(question.choices_en)
          : question.choices_en ?? null,
        choices_es: Array.isArray(question.choices_es)
          ? JSON.stringify(question.choices_es)
          : question.choices_es ?? null,
        correct_answer:
          typeof question.correct_answer === "string" && question.correct_answer.trim().length > 0
            ? question.correct_answer
            : String(question.question_en ?? ""),
      }));

database.exec(schemaSql);

const resetTables = database.transaction((): void => {
  database.pragma("foreign_keys = OFF");
  const tables = [
    "xp_logs",
    "quest_items",
    "quests",
    "diagnostics",
    "missed_items",
    "uploads",
    "questions",
    "students",
    "classes",
    "teachers",
  ];

  for (const tableName of tables) {
    database.prepare(`DELETE FROM ${tableName}`).run();
  }

  database.pragma("foreign_keys = ON");
});

const insertRows = database.transaction(
  (tableName: string, rows: Record<string, unknown>[]): number => {
    if (rows.length === 0) {
      return 0;
    }

    const tableColumns = (
      database.prepare(`PRAGMA table_info(${tableName})`).all() as TableInfoRow[]
    ).map((row: TableInfoRow) => row.name);
    const columns = Object.keys(rows[0] ?? {}).filter((columnName: string) =>
      tableColumns.includes(columnName),
    );

    if (columns.length === 0) {
      return 0;
    }

    const placeholders = columns.map(() => "?").join(", ");
    const statement = database.prepare(
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
    );

    for (const row of rows) {
      const values = columns.map((columnName) => row[columnName] ?? null);
      statement.run(...values);
    }

    return rows.length;
  },
);

async function hashDemoPasswords(
  rows: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const result: Record<string, unknown>[] = [];

  for (const row of rows) {
    if (typeof row.demo_password === "string" && row.demo_password.length > 0) {
      const password_hash = await bcrypt.hash(row.demo_password, 10);
      const { demo_password: _, ...rest } = row;
      result.push({ ...rest, password_hash });
    } else {
      const { demo_password: _, ...rest } = row;
      result.push(rest);
    }
  }

  return result;
}

async function seed(): Promise<void> {
  resetTables();

  database.pragma("foreign_keys = OFF");

  const classesWithJoinCode = (seedPayload.classes ?? []).map(
    (cls: Record<string, unknown>, index: number) => ({
      ...cls,
      join_code: cls.join_code ?? `DEMO${String(index + 1).padStart(2, "0")}`,
    }),
  );

  const teachers = await hashDemoPasswords(seedPayload.teachers ?? []);
  const students = await hashDemoPasswords(seedPayload.students ?? []);

  const insertedCounts = {
    teachers: insertRows("teachers", teachers),
    classes: insertRows("classes", classesWithJoinCode),
    students: insertRows("students", students),
    questions: insertRows("questions", seededQuestions),
    uploads: insertRows("uploads", seedPayload.uploads ?? []),
    missed_items: insertRows("missed_items", seedPayload.missed_items ?? []),
    diagnostics: insertRows("diagnostics", seedPayload.diagnostics ?? []),
    quests: insertRows("quests", seedPayload.quests ?? []),
    quest_items: insertRows("quest_items", seedPayload.quest_items ?? []),
    xp_logs: insertRows("xp_logs", seedPayload.xp_logs ?? []),
  };

  database.pragma("foreign_keys = ON");

  console.log("Seeded database at", databasePath);
  console.log(JSON.stringify(insertedCounts, null, 2));
}

void seed();

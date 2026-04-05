# Saber

AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners.

## Current Architecture

Saber now runs as a single Next.js App Router application from the repository root.

- UI pages live under `app/` through the unified root app.
- API routes live under `app/api/`.
- Shared browser-side UI modules still live under `frontend/` and are imported by the root app.
- SQLite data lives at `data/saber.db` by default.
- Gemini integration lives in `lib/gemini.ts`.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4, Web Speech API
- Backend: Next.js App Router route handlers, TypeScript, Zod
- Database: SQLite via `better-sqlite3`
- AI/LLM: Google Gemini (`@google/generative-ai`)

## Important Files

- `app/`: unified Next app pages
- `app/api/`: backend route handlers
- `frontend/components/`: UI components used by the root app
- `frontend/app/`: original UI modules now imported by the root routes
- `lib/db.ts`: SQLite query layer
- `lib/gemini.ts`: Gemini client and prompts
- `lib/errors.ts`: centralized API error handling
- `data/schema.sql`: schema source of truth
- `data/seed_data.json`: demo dataset
- `data/question_bank.json`: question content
- `data/sample_upload.csv`: demo teacher upload file

## Environment Variables

Copy `.env.example` to `.env` and set:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
# Optional
SQLITE_PATH=/absolute/path/to/custom.db
```

Notes:

- `GEMINI_API_KEY` is required for Gemini-backed generation/classification.
- If `SQLITE_PATH` is not set, Saber uses `data/saber.db`.

## Local Setup

```bash
npm install
npm run db:seed
npm run dev
```

The app will be available at `http://localhost:3000`.

## Build And Verification

```bash
npm run typecheck
npm run build
```

Optional dashboard smoke check:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke:test
```

## Manual Test Flow

### 1. Health check

Open:

- `/api/health`

Expected shape:

```json
{
  "success": true,
  "data": {
    "db": "ok",
    "gemini": "ok | error",
    "timestamp": "..."
  }
}
```

`gemini: "error"` is expected if `GEMINI_API_KEY` is not configured.

### 2. Teacher flow

Open:

- `/teacher?classId=1`

Then upload either:

- `data/sample_upload.csv`

Supported CSV formats:

- Detailed missed-question format:
  - `student_name,question_id,student_answer`
- Subject-score format:
  - `student_name,math_score,science_score,social_studies_score,language_arts_score`

After upload, the UI calls:

1. `POST /api/upload`
2. `POST /api/questions`
3. `GET /api/dashboard/1`

### 3. Student flow

Open:

- `/student?studentId=1`
- `/test?studentId=1`
- `/quests?studentId=1&questId=2`

The student pages now load real data from:

- `GET /api/students/[studentId]`
- `GET /api/students/[studentId]/diagnostic`

And submit through:

- `POST /api/answers`
- `POST /api/classify`

## Notes

- `data/saber.db` is generated locally and ignored by git.
- The schema is auto-initialized from `data/schema.sql` when the app starts.
- The seed script also hydrates demo data from `data/seed_data.json` and falls back to `data/question_bank.json` for question rows.

## Team

Built at Vibra ATL 2026 — SHPE Hackathon at Georgia State University, April 4–5, 2026.

| Name | Role | Focus |
|------|------|-------|
| Stephen Sookra | Frontend Lead | UI/UX, teacher and student dashboards |
| Tylin | Backend Lead | API routes, Gemini integration, classification engine |
| Siju | Data Engineer | Schema, question bank, seed data |
| Ethan | Gamification + Speech | XP, quests, speech experience |

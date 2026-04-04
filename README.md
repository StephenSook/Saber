# Saber

**AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners.**

---

## The Problem

In Georgia, only 15.7% of English Learner students score proficient on 3rd-grade ELA. Hispanic students score 14–17 points below state averages across every subject on the Georgia Milestones Assessment. The standard response is to place these students in remedial programs — but research shows that a significant portion of these students actually understand the content. They just can't demonstrate it through English-language assessments.

Standardized tests cannot distinguish between "this student doesn't know math" and "this student doesn't understand the English question." Teachers receive scores that tell them **what** happened, but never **why**. The result: students with language barriers get the same intervention as students with genuine content gaps, billions are spent on misdirected remediation, and thousands of capable students are incorrectly referred to special education every year.

Georgia is one of only 19 states that does not offer state assessments in any language other than English — and its ELL population has grown 61% in the last decade. There are 108,752 English Language Learners in Georgia public schools. **Zero existing tools use AI to separate language proficiency from subject knowledge.**

## The Solution

Saber is a diagnostic platform that sits alongside existing standardized tests — not in place of them. Teachers upload their students' test results, Saber re-tests missed questions in Spanish, and AI classifies each gap as a **language barrier** or a **content gap**. Teachers get an actionable diagnostic dashboard. Students get a gamified, personalized learning path targeting their specific needs.

### How It Works

**1. Teacher uploads test scores** — CSV upload of GA Milestones results (or manual entry). Saber identifies which questions each student missed and maps them to skill categories.

**2. Students retake in Spanish** — For each missed question, Saber generates an equivalent Spanish-language question testing the same skill. Students complete the diagnostic through a clean, kid-friendly interface with optional speech-to-text input.

**3. AI classifies the gap** — The LLM compares English and Spanish performance per question. If a student got it wrong in English but right in Spanish, that's a language barrier. Wrong in both? That's a content gap. The classification includes an explanation of what specific English vocabulary or phrasing patterns are causing the barrier.

**4. Teacher dashboard populates** — Each student is color-coded: language barrier (teal), content gap (coral), or mixed (amber). Teachers can drill into per-student, per-skill breakdowns and assign targeted practice.

**5. Students level up** — Students classified with language barriers receive personalized quests that teach them the specific English academic vocabulary and phrasing they need. XP, levels, streaks, and a class leaderboard (ranked by weekly growth, not raw score) keep students motivated. The experience is designed to feel like a game, not busywork.

## Tech Stack

**Frontend:** React (Vite) + Tailwind CSS + Web Speech API

**Backend:** FastAPI (Python)

**Database:** SQLite

**AI/LLM:** Google Gemini API

**Font:** DM Sans

## Project Structure

```
saber/
├── frontend/                # React application
│   └── src/
│       ├── components/
│       │   ├── Landing.jsx
│       │   ├── TeacherDashboard.jsx
│       │   ├── StudentDashboard.jsx
│       │   ├── DiagnosticTest.jsx
│       │   ├── QuestView.jsx
│       │   ├── Leaderboard.jsx
│       │   ├── SpeechInput.jsx
│       │   └── FileUpload.jsx
│       ├── App.jsx
│       └── main.jsx
├── backend/                 # FastAPI server
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── classifier.py
│   └── question_gen.py
├── data/                    # Schema, seed data, question bank
│   ├── schema.sql
│   ├── seed_data.json
│   ├── question_bank.json
│   └── sample_upload.csv
├── gamification/            # XP, quests, leaderboard logic
│   ├── xp_engine.py
│   ├── quest_generator.py
│   └── leaderboard.py
└── README.md
```

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install fastapi uvicorn google-generativeai
uvicorn main:app --reload
```

### Environment Variables

Create a `.env` file in the backend directory:

```
GEMINI_API_KEY=your_api_key_here
```

## Key Research

Saber approach is grounded in peer-reviewed research spanning four decades. Abedi & Lord (2001) demonstrated that ELL students' math scores improved 3.7% when test items were linguistically simplified, while non-ELL scores improved only 2.4% — proving the original wording measured language, not math. Abedi's multi-site analysis for the U.S. Department of Education found that the ELL performance gap was only 9% for low-language-demand math computation but jumped to 26.4% for high-language-demand problem solving and 37% for science. The gap tracks with linguistic complexity, not content difficulty.

Wilkinson et al. (2006) reviewed ELL students identified as having learning disabilities and found that nearly half were experiencing difficulties caused by language barriers, not disabilities. California reclassification data shows that former ELL students who gained English proficiency scored higher than native English speakers on state exit exams (94% vs. 87% passing rate) — proving the knowledge was always there.

## The Team

**sudo apt-get install sazon**

Built at Vibra ATL 2026 — SHPE Hackathon at Georgia State University, April 4–5, 2026.

| Name | Role | Focus |
|------|------|-------|
| Stephen Sookra | Frontend Lead | React/Tailwind, UI/UX, teacher and student dashboards, pitch |
| Tylin | Backend Lead | FastAPI, LLM integration, classification engine, API architecture |
| Siju | Data Engineer | Database schema, question bank, seed data, CSV parsing pipeline |
| Ethan | Gamification + Speech | XP/leveling system, quest generation, Web Speech API, leaderboard |

## License

MIT

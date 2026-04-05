# SaberReal — Frontend

## What This Project Is

SaberReal is an AI-powered diagnostic platform built for the Vibra ATL 2026 hackathon (SHPE, April 4-5). It helps Hispanic English Language Learner (ELL) students by separating language barriers from actual knowledge gaps on standardized tests. Teachers upload test scores, students retake missed questions in Spanish, and AI classifies each gap. Teachers get a diagnostic dashboard. Students get a gamified learning path.

I am building the entire frontend: the landing page, teacher dashboard, student dashboard, diagnostic test view, and quest system. The Stitch-generated UI images attached to this project are my design reference. Match them as closely as possible in code.

---

## Tech Stack

- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS (utility-first, no separate CSS files unless absolutely necessary)
- **Routing:** React Router DOM v6
- **HTTP Client:** Axios (for API calls to the FastAPI backend)
- **Speech-to-Text:** Web Speech API (browser-native, no external library)
- **Font:** DM Sans from Google Fonts (weights: 400, 500, 700)
- **Icons:** Lucide React (thin-line icons only, no emojis anywhere)
- **Animations:** CSS transitions and keyframes (keep it lightweight, no heavy animation libraries)

---

## Design System

### Color Palette (use these as Tailwind custom colors)

| Token          | Hex       | Usage                                                    |
|----------------|-----------|----------------------------------------------------------|
| `teal`         | `#2A9D8F` | Primary — headers, primary buttons, active states, correct answers |
| `coral`        | `#E07A5F` | Secondary — accents, highlights, XP indicators, content-gap tag |
| `gold`         | `#F2CC8F` | Accent — achievements, level badges, stars, milestones   |
| `offwhite`     | `#F5F0EB` | Background — main page background                        |
| `navy`         | `#264653` | Dark text — headings and body text                       |
| `card`         | `#FFFFFF` | Cards — all card surfaces with subtle shadow             |
| `success`      | `#81B29A` | Soft green — correct answers, language-gap classification |
| `warning`      | `#F4A261` | Warm amber — content-gap classification, mixed-gap tag   |
| `error`        | `#E07A5F` | Soft coral — error states                                |

### Typography

- **Font Family:** `'DM Sans', sans-serif`
- **Headings:** DM Sans Bold (700), slightly larger with good letter spacing
- **Body:** DM Sans Regular (400), comfortable reading size
- **Small/Labels:** DM Sans Medium (500)
- **No emojis anywhere.** Use Lucide React icons (thin-line style) for all iconography.

### Component Style Rules

- Rounded corners on all cards and buttons (`rounded-xl` for cards, `rounded-lg` for buttons)
- Soft drop shadows on cards (`shadow-md` or custom `shadow-[0_2px_12px_rgba(0,0,0,0.06)]`)
- Generous whitespace — never let components feel cramped
- Background is always the warm off-white (`#F5F0EB`), cards are white
- Buttons have subtle hover states: slight scale (`hover:scale-[1.02]`) or color shift with smooth transition (`transition-all duration-200`)
- The overall feeling: "This is a space where I feel smart and supported, not tested and judged"

---

## Tailwind Configuration

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: "#2A9D8F",
        coral: "#E07A5F",
        gold: "#F2CC8F",
        offwhite: "#F5F0EB",
        navy: "#264653",
        success: "#81B29A",
        warning: "#F4A261",
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Index HTML Font Import

```html
<!-- Add to <head> in index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
```

---

## Routing Structure

```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import DiagnosticTest from "./components/DiagnosticTest";
import QuestView from "./components/QuestView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/test" element={<DiagnosticTest />} />
        <Route path="/quests" element={<QuestView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## Pages and Components — Detailed Specifications

### 1. Landing Page (`Landing.jsx`)

**Purpose:** First thing judges see. Explains what SaberReal does in 10 seconds.

**Layout:**
- Hero section: Large heading "Know What They Know" in DM Sans Bold. Subheading: "AI-powered diagnostics that separate language barriers from knowledge gaps for English Language Learners." Both centered.
- Two CTA buttons side by side: "I'm a Teacher" (links to `/teacher`, primary teal button) and "I'm a Student" (links to `/student`, outlined teal button).
- "How It Works" section: Three-step horizontal flow with icons (use Lucide). Step 1: "Upload Test Scores" (Upload icon). Step 2: "Students Retake in Spanish" (Languages icon). Step 3: "Get Actionable Diagnostics" (BarChart3 icon). Each step is a card with an icon, title, and one-line description.
- Stats banner: Three stats side by side in a colored bar — "5.3M ELL Students" / "108K in Georgia" / "0 Existing Tools". Teal background, white text.

**Build priority:** LOW (last thing to build, keep it simple).

---

### 2. Teacher Dashboard (`TeacherDashboard.jsx`)

**Purpose:** Command center. Where teachers upload scores and see student diagnostics.

**Layout:**
- Top bar: "SaberReal" logo text on the left, teacher name on the right, logout button.
- Summary stats row: Four cards showing Total Students, Language Barrier (teal), Content Gap (coral), Mixed (amber). Each card has the count and a percentage.
- Upload button: Prominent "Upload Test Scores" button (teal, with Upload icon from Lucide). Clicking it opens a modal with a drag-and-drop file zone that accepts CSV files.
- Class roster: Below the upload button. Displayed as a clean table or grid of student cards. Each student row/card shows: student name, grade level, and a colored status dot — teal dot for language barrier, coral dot for content gap, amber dot for mixed, green dot for on-track. Clicking a student opens a detail panel/modal.
- Student detail modal: When a student is clicked, show their name, overall classification, and a per-skill breakdown. The breakdown should be a list of skills (e.g., "Inference", "Fractions", "Author's Purpose") with each skill tagged as either "Language Barrier" (teal badge) or "Content Gap" (coral badge). Include the AI's explanation text for each skill. An "Assign Practice" button at the bottom that would send quests to the student.

**Key interactions:**
- CSV upload: Parse the file client-side with FileReader, display a preview table, then POST to backend via axios.
- Clicking a student: Opens modal/slide-over with their diagnostic detail.
- Assign Practice button: POST to `/api/assign-quest` endpoint.

**Build priority:** HIGHEST (first thing judges see in demo after the pitch).

---

### 3. Student Dashboard (`StudentDashboard.jsx`)

**Purpose:** Where students see their progress, quests, and leaderboard.

**Layout:**
- Welcome header: "Welcome back, [Name]" with their level badge (circular badge with level number, gold background). Below that, the XP progress bar — a horizontal bar with teal fill, showing current XP / XP needed for next level. Gold diamond markers at milestone points along the bar.
- Daily streak counter: Small card showing streak in days with a subtle star icon (Lucide `Star`). "5 Day Streak" style display.
- Quest board: The main content area. Grid of quest cards (2 columns on desktop, 1 on mobile). Each quest card shows: quest title (e.g., "Master Math Word Problems"), skill tag, number of exercises (e.g., "8 exercises"), XP reward (e.g., "+120 XP"), and a mini progress bar showing completion (e.g., 3/8 done). Cards should feel inviting and tappable. Clicking a quest navigates to `/quests?id=[questId]`.
- Leaderboard sidebar: Right sidebar (or below on mobile). "This Week's Leaders" heading. Ordered list of top 10 students by weekly XP. Each entry shows: rank number, student name, their level, and weekly XP earned. The current student's row is highlighted with a subtle teal background. Leaderboard ranks by effort (XP earned this week), NOT total XP, so students who work hard this week can climb regardless of where they started.
- Floating mic button: Fixed position bottom-right corner. Circular teal button with a Mic icon (Lucide). This is for quick speech-to-text input when doing exercises.

**Build priority:** HIGH (second page judges see during demo).

---

### 4. Diagnostic Test View (`DiagnosticTest.jsx`)

**Purpose:** Where students take the Spanish re-test of questions they missed.

**Layout:**
- Minimal, distraction-free interface. Off-white background, single card centered.
- Progress indicator at top: "Question 3 of 8" with a thin progress bar beneath.
- Question display: Large, readable text. The question is displayed in Spanish. If it's a math question, any numbers or equations render clearly.
- Answer area — adapts by question type:
  - **Multiple choice:** Four answer cards stacked vertically. Each card is a white rounded card with a subtle border. On hover, the border turns teal and the card slightly lifts. When selected, the card fills with a light teal background and shows a checkmark. Each card should be large and easy to tap for mobile/touchscreen use.
  - **Short answer:** A text input field with a microphone button beside it. The mic button triggers Web Speech API (language set to `'es-ES'` for Spanish). While recording, the mic button pulses with a red glow. Transcribed text appears in the input field in real-time.
- Submit button: Below the answer area. Teal, full-width.
- After submission — feedback:
  - Correct: The card flashes success green. A floating "+50 XP" badge animates upward and fades out. A brief "Correct!" message in teal appears.
  - Incorrect: The card shows a soft coral border. No harsh "wrong" messaging. Just "Let's keep going" style encouragement.
- Results summary (end of diagnostic): After all questions, show a summary card. "You completed 8 questions" with a breakdown: how many right, how many classified as language barrier vs content gap. Encouraging closing message. "Your teacher will receive your results" line at the bottom. An XP summary showing total earned.

**Build priority:** HIGH (this is where the live demo magic happens — the mic moment).

---

### 5. Quest View (`QuestView.jsx`)

**Purpose:** Where students work through assigned practice exercises.

**Layout:**
- Similar to DiagnosticTest but with gamification layered on. The quest title is displayed at the top ("Master Math Word Problems"). Below it, a progress bar showing how many items are completed in this quest.
- Questions are presented one at a time, same format as DiagnosticTest.
- After each question, XP is awarded and the progress bar advances.
- When the quest is completed, show a completion screen: large gold badge, XP earned summary, "Quest Complete!" heading, and a button to return to the student dashboard.

**Build priority:** MEDIUM (nice to have for demo, not critical if time runs short).

---

## Mock Data Structure

Use this file for development until Tylin's API is ready. Build all UI against this data. When the API is done, swap the imports for axios calls.

```js
// src/mockData.js

export const mockTeacher = {
  id: "t1",
  name: "Ms. Rodriguez",
  email: "rodriguez@school.edu",
};

export const mockStudents = [
  {
    id: "s1",
    name: "Maria Gonzalez",
    grade: 5,
    classification: "language",  // "language" | "content" | "mixed" | "ontrack"
    xp: 340,
    level: 4,
    xpToNextLevel: 500,
    streakDays: 5,
    skills: [
      { name: "Fractions", classification: "language", explanation: "Maria answered 5/6 fraction questions correctly in Spanish but only 2/6 in English. Her math knowledge is at grade level. The barrier is English academic vocabulary in word problems." },
      { name: "Inference", classification: "language", explanation: "Scored 4/5 on inference questions in Spanish vs 1/5 in English. She can identify implied meaning when she understands the text." },
      { name: "Geometry", classification: "content", explanation: "Scored 1/4 in both English and Spanish. Maria needs instruction on area and perimeter concepts." },
    ],
    quests: [
      { id: "q1", title: "Master Math Word Problems", skillTag: "Fractions", totalItems: 8, completedItems: 3, xpReward: 120, status: "in_progress" },
      { id: "q2", title: "Reading Between the Lines", skillTag: "Inference", totalItems: 6, completedItems: 0, xpReward: 90, status: "not_started" },
    ],
  },
  {
    id: "s2",
    name: "Carlos Rivera",
    grade: 5,
    classification: "content",
    xp: 180,
    level: 2,
    xpToNextLevel: 300,
    streakDays: 2,
    skills: [
      { name: "Fractions", classification: "content", explanation: "Scored 2/6 in both English and Spanish. Carlos needs foundational work on fraction operations." },
      { name: "Author's Purpose", classification: "language", explanation: "Scored 3/4 in Spanish but 0/4 in English. He understands rhetorical intent but can't parse the English phrasing." },
    ],
    quests: [
      { id: "q3", title: "Fraction Foundations", skillTag: "Fractions", totalItems: 10, completedItems: 1, xpReward: 150, status: "in_progress" },
    ],
  },
  {
    id: "s3",
    name: "Sofia Herrera",
    grade: 5,
    classification: "language",
    xp: 520,
    level: 6,
    xpToNextLevel: 600,
    streakDays: 8,
    skills: [
      { name: "Multiplication", classification: "language", explanation: "Perfect score in Spanish (6/6), but only 3/6 in English. Sofia fully understands multiplication. The barrier is English word problem phrasing." },
      { name: "Main Idea", classification: "language", explanation: "4/5 in Spanish, 1/5 in English. She identifies central themes easily in her native language." },
      { name: "Vocabulary in Context", classification: "language", explanation: "5/5 in Spanish, 2/5 in English. She understands contextual vocabulary use but needs English-specific academic word knowledge." },
    ],
    quests: [
      { id: "q4", title: "English Math Vocabulary", skillTag: "Multiplication", totalItems: 6, completedItems: 6, xpReward: 90, status: "completed" },
      { id: "q5", title: "Finding the Main Idea", skillTag: "Main Idea", totalItems: 8, completedItems: 5, xpReward: 120, status: "in_progress" },
    ],
  },
  {
    id: "s4",
    name: "Diego Martinez",
    grade: 5,
    classification: "mixed",
    xp: 90,
    level: 1,
    xpToNextLevel: 100,
    streakDays: 1,
    skills: [
      { name: "Division", classification: "content", explanation: "Scored 1/5 in both languages. Diego needs instruction on long division concepts." },
      { name: "Cause and Effect", classification: "language", explanation: "3/4 in Spanish, 0/4 in English. Understands causal reasoning but struggles with English conditional phrasing." },
    ],
    quests: [],
  },
  {
    id: "s5",
    name: "Isabella Lopez",
    grade: 5,
    classification: "ontrack",
    xp: 410,
    level: 5,
    xpToNextLevel: 500,
    streakDays: 6,
    skills: [
      { name: "Fractions", classification: "ontrack", explanation: "Scored 5/6 in English. No re-test needed." },
      { name: "Inference", classification: "ontrack", explanation: "Scored 4/5 in English. No re-test needed." },
    ],
    quests: [],
  },
  // Add more students to fill out the roster to ~15-20 for a realistic demo
  { id: "s6", name: "Mateo Ruiz", grade: 5, classification: "language", xp: 270, level: 3, xpToNextLevel: 400, streakDays: 4, skills: [], quests: [] },
  { id: "s7", name: "Valentina Cruz", grade: 5, classification: "language", xp: 310, level: 4, xpToNextLevel: 500, streakDays: 3, skills: [], quests: [] },
  { id: "s8", name: "Lucas Morales", grade: 5, classification: "content", xp: 60, level: 1, xpToNextLevel: 100, streakDays: 0, skills: [], quests: [] },
  { id: "s9", name: "Camila Reyes", grade: 5, classification: "language", xp: 440, level: 5, xpToNextLevel: 500, streakDays: 7, skills: [], quests: [] },
  { id: "s10", name: "Sebastian Torres", grade: 5, classification: "mixed", xp: 150, level: 2, xpToNextLevel: 300, streakDays: 2, skills: [], quests: [] },
  { id: "s11", name: "Emilia Vargas", grade: 5, classification: "language", xp: 380, level: 4, xpToNextLevel: 500, streakDays: 5, skills: [], quests: [] },
  { id: "s12", name: "Daniel Flores", grade: 5, classification: "content", xp: 120, level: 2, xpToNextLevel: 300, streakDays: 1, skills: [], quests: [] },
  { id: "s13", name: "Victoria Sandoval", grade: 5, classification: "language", xp: 490, level: 5, xpToNextLevel: 500, streakDays: 9, skills: [], quests: [] },
  { id: "s14", name: "Alejandro Nunez", grade: 5, classification: "mixed", xp: 200, level: 3, xpToNextLevel: 400, streakDays: 3, skills: [], quests: [] },
  { id: "s15", name: "Ana Castillo", grade: 5, classification: "language", xp: 360, level: 4, xpToNextLevel: 500, streakDays: 4, skills: [], quests: [] },
];

export const mockLeaderboard = [
  { name: "Victoria Sandoval", level: 5, weeklyXP: 210 },
  { name: "Sofia Herrera", level: 6, weeklyXP: 185 },
  { name: "Camila Reyes", level: 5, weeklyXP: 170 },
  { name: "Maria Gonzalez", level: 4, weeklyXP: 145 },
  { name: "Isabella Lopez", level: 5, weeklyXP: 130 },
  { name: "Emilia Vargas", level: 4, weeklyXP: 120 },
  { name: "Ana Castillo", level: 4, weeklyXP: 115 },
  { name: "Valentina Cruz", level: 4, weeklyXP: 100 },
  { name: "Mateo Ruiz", level: 3, weeklyXP: 90 },
  { name: "Alejandro Nunez", level: 3, weeklyXP: 75 },
];

export const mockDiagnosticQuestions = [
  {
    id: "dq1",
    subject: "Math",
    skill: "Fractions",
    grade: 5,
    questionEs: "Maria tiene 3/4 de una pizza. Ella come 1/4. Que fraccion de la pizza le queda?",
    choicesEs: ["1/2", "2/4", "1/4", "3/4"],
    correctAnswer: 0, // index of correct choice (1/2 = 2/4 simplified)
    questionEn: "Maria has 3/4 of a pizza. She eats 1/4. What fraction of the pizza is left?",
    choicesEn: ["1/2", "2/4", "1/4", "3/4"],
  },
  {
    id: "dq2",
    subject: "ELA",
    skill: "Inference",
    grade: 5,
    questionEs: "Juan miro por la ventana y suspiro. Las hojas caian de los arboles y el cielo estaba gris. Que estacion del ano es probablemente?",
    choicesEs: ["Primavera", "Verano", "Otono", "Invierno"],
    correctAnswer: 2,
    questionEn: "Juan looked out the window and sighed. The leaves were falling from the trees and the sky was gray. What season is it probably?",
    choicesEn: ["Spring", "Summer", "Fall", "Winter"],
  },
  {
    id: "dq3",
    subject: "Math",
    skill: "Multiplication",
    grade: 5,
    questionEs: "Una tienda vende cajas de lapices. Cada caja tiene 12 lapices. Si la maestra compra 8 cajas, cuantos lapices tiene en total?",
    choicesEs: ["84", "92", "96", "108"],
    correctAnswer: 2,
    questionEn: "A store sells boxes of pencils. Each box has 12 pencils. If the teacher buys 8 boxes, how many pencils does she have in total?",
    choicesEn: ["84", "92", "96", "108"],
  },
  {
    id: "dq4",
    subject: "ELA",
    skill: "Main Idea",
    grade: 5,
    questionEs: "Los delfines son mamiferos que viven en el oceano. Respiran aire, cuidan a sus crias, y son muy inteligentes. Pueden comunicarse usando sonidos y trabajan en grupo para encontrar comida. Cual es la idea principal?",
    choicesEs: [
      "Los delfines comen pescado",
      "Los delfines son mamiferos inteligentes que viven en el oceano",
      "Los delfines viven solos",
      "Los delfines no pueden respirar bajo el agua"
    ],
    correctAnswer: 1,
    questionEn: "Dolphins are mammals that live in the ocean. They breathe air, care for their young, and are very intelligent. They can communicate using sounds and work in groups to find food. What is the main idea?",
    choicesEn: [
      "Dolphins eat fish",
      "Dolphins are intelligent mammals that live in the ocean",
      "Dolphins live alone",
      "Dolphins cannot breathe underwater"
    ],
  },
  {
    id: "dq5",
    subject: "ELA",
    skill: "Author's Purpose",
    grade: 5,
    questionEs: "Lee el siguiente parrafo: 'Deberias reciclar porque ayuda al planeta. Cada botella que reciclas ahorra energia y reduce la basura.' Cual es el proposito del autor?",
    choicesEs: ["Entretener", "Informar", "Persuadir", "Describir"],
    correctAnswer: 2,
    questionEn: "Read the following paragraph: 'You should recycle because it helps the planet. Every bottle you recycle saves energy and reduces waste.' What is the author's purpose?",
    choicesEn: ["To entertain", "To inform", "To persuade", "To describe"],
  },
];

// XP Thresholds for leveling (Ethan's system, used for frontend progress bar calculation)
export const levelThresholds = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 250 },
  { level: 4, xpRequired: 450 },
  { level: 5, xpRequired: 700 },
  { level: 6, xpRequired: 1000 },
  { level: 7, xpRequired: 1400 },
  { level: 8, xpRequired: 1900 },
  { level: 9, xpRequired: 2500 },
  { level: 10, xpRequired: 3200 },
];
```

---

## API Contract (What to Expect from Tylin's Backend)

Build against mock data first. When the API is ready, swap imports for these axios calls. Base URL will be `http://localhost:8000` in dev.

```
GET    /api/teacher/:teacherId/class          → returns { students: [...] }
POST   /api/teacher/upload                    → accepts CSV file, returns parsed student list
GET    /api/student/:studentId                → returns student profile (xp, level, quests, skills)
GET    /api/student/:studentId/diagnostic     → returns array of Spanish diagnostic questions
POST   /api/student/:studentId/answer         → accepts { questionId, answer, answerType: "text"|"speech" }
                                                returns { correct, classification, explanation, xpEarned }
GET    /api/leaderboard/:classId              → returns ordered leaderboard array
POST   /api/teacher/assign-quest              → accepts { studentId, skillTag }
GET    /api/student/:studentId/quests         → returns array of quest objects
```

---

## Speech-to-Text Integration (Ethan's Component)

Ethan is building this as a standalone hook. Here is the interface to expect:

```jsx
// Ethan will provide this hook or you can implement it yourself
function useSpeechToText() {
  // Returns: { transcript, isListening, startListening, stopListening, resetTranscript }
  // Language is set to 'es-ES' for Spanish
  // Call startListening() on mic button click
  // transcript updates in real-time as the student speaks
  // Call stopListening() when done, use transcript as the answer
}
```

Wire this to the mic button in DiagnosticTest.jsx and QuestView.jsx. The mic button should show a pulsing red glow animation while `isListening` is true. The transcript text should appear in the text input field in real-time.

---

## Animations to Implement

Keep these lightweight — CSS transitions and keyframes only.

**XP Gain:** When a student answers correctly, a "+50 XP" text element animates from the answer area upward and fades out over 1 second. Use CSS `@keyframes` with `translateY(-40px)` and `opacity: 0`.

**Level Up:** When currentXP crosses the nextLevelThreshold, show a brief celebration: the level badge scales up to 1.2x, glows gold for 1 second, then settles back. Calculate this client-side: `if (newXP >= xpToNextLevel) { triggerLevelUp() }`.

**Progress Bar Fill:** The XP bar and quest progress bars should animate their width on load and on update. Use `transition: width 0.6s ease-out` on the fill element.

**Card Hover:** All interactive cards (quest cards, answer cards, student roster cards) should have `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`.

**Correct Answer Flash:** When a correct answer is submitted, the selected card briefly flashes with a success green background (`#81B29A`) for 0.5 seconds.

---

## Build Priority Order

1. **TeacherDashboard.jsx** — First page in the demo. Build the roster, status dots, upload button, and student detail modal.
2. **DiagnosticTest.jsx** — Where the live demo magic happens. Build the question display, answer cards, mic button, and XP animation.
3. **StudentDashboard.jsx** — Quest board, XP bar, leaderboard sidebar, level badge.
4. **QuestView.jsx** — Similar to DiagnosticTest but with quest completion flow.
5. **Landing.jsx** — Keep it simple. Hero, how-it-works, stats, two buttons. 30-45 minutes max.

---

## Classification Color Coding Reference

Use these consistently across ALL views (teacher roster, student detail, skill tags, etc.):

- **Language Barrier:** Teal dot/badge (`bg-teal text-white`) — the student knows the content, needs English support
- **Content Gap:** Coral dot/badge (`bg-coral text-white`) — the student genuinely needs concept instruction
- **Mixed:** Amber dot/badge (`bg-warning text-white`) — some of both
- **On Track:** Green dot/badge (`bg-success text-white`) — no intervention needed

---

## Important Notes

- **No emojis.** Use Lucide React icons everywhere. Thin-line style only.
- **Responsive design.** Teacher dashboard is desktop-first (teachers use laptops). Student dashboard should be mobile-friendly (students might use phones).
- **Bilingual-ready.** Some UI labels can show Spanish translations in lighter text beneath the English label as a subtle design touch, but the primary interface language is English.
- **The Stitch images attached to this project are the design target.** Match the layout, spacing, and visual hierarchy from those images as closely as possible. The color palette and typography defined in this README override any conflicting values from Stitch.

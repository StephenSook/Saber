-- SaberReal Database Schema
-- Vibra ATL 2026 | Team: sudo apt-get install sazon

CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- question_type distinguishes multiple_choice from short_answer
-- choices_en / choices_es are JSON arrays, NULL for short_answer questions
-- correct_answer is a letter (A/B/C/D) for MC, expected text for short_answer
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL CHECK(subject IN ('Math', 'ELA', 'Science', 'History')),
    grade INTEGER NOT NULL CHECK(grade IN (3, 5, 8)),
    skill_tag TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'multiple_choice'
        CHECK(question_type IN ('multiple_choice', 'short_answer')),
    question_en TEXT NOT NULL,
    question_es TEXT NOT NULL,
    choices_en TEXT,
    choices_es TEXT,
    correct_answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- One row per missed question per student per upload
CREATE TABLE IF NOT EXISTS missed_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    student_answer_en TEXT,
    FOREIGN KEY (upload_id) REFERENCES uploads(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Created when a student submits their Spanish re-test answer
-- classification is set by the Gemini classification endpoint
CREATE TABLE IF NOT EXISTS diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    student_answer_es TEXT,
    classification TEXT CHECK(classification IN ('LANGUAGE', 'CONTENT', 'MIXED')),
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    skill_tag TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'locked')),
    xp_reward INTEGER DEFAULT 30,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS quest_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quest_id INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    student_answer TEXT,
    FOREIGN KEY (quest_id) REFERENCES quests(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Used by leaderboard: rank by SUM(xp_earned) WHERE timestamp >= start of current week
CREATE TABLE IF NOT EXISTS xp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    xp_earned INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX IF NOT EXISTS idx_students_class       ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_missed_items_student ON missed_items(student_id);
CREATE INDEX IF NOT EXISTS idx_missed_items_upload  ON missed_items(upload_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_student  ON diagnostics(student_id);
CREATE INDEX IF NOT EXISTS idx_quests_student       ON quests(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_student      ON xp_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_timestamp    ON xp_logs(timestamp);

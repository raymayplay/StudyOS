import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "studyos.db");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#8b5cf6',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    notes TEXT DEFAULT '',
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    analysis_source TEXT NOT NULL DEFAULT 'legacy',
    summary TEXT,
    extracted_text TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Intermediate',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    confidence INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_questions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS document_notes (
    document_id TEXT PRIMARY KEY,
    notes TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_plan_cache (
    input_hash TEXT PRIMARY KEY,
    plan_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const documentColumns = db.prepare("PRAGMA table_info(documents)").all() as Array<{ name: string }>;
if (!documentColumns.some((column) => column.name === "analysis_source")) {
  db.exec("ALTER TABLE documents ADD COLUMN analysis_source TEXT NOT NULL DEFAULT 'legacy'");
}
const assignmentColumns = db.prepare("PRAGMA table_info(assignments)").all() as Array<{ name: string }>;
if (!assignmentColumns.some((column) => column.name === "is_completed")) {
  db.exec("ALTER TABLE assignments ADD COLUMN is_completed INTEGER NOT NULL DEFAULT 0");
}
db.prepare("UPDATE documents SET analysis_source = 'ai' WHERE analysis_source IN ('openai', 'ollama')").run();

const defaultSettings = [
  ["study_days", "Mon,Tue,Wed,Thu,Fri"],
  ["start_hour", "9"],
  ["end_hour", "18"],
  ["revision_minutes", "45"],
  ["timezone", "Asia/Tokyo"],
];

const insertSetting = db.prepare(
  "INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
);
for (const [key, value] of defaultSettings) {
  insertSetting.run(key, value);
}

export function getSettings() {
  return Object.fromEntries(
    db.prepare("SELECT key, value FROM app_settings").all().map((row: any) => [row.key, row.value]),
  ) as Record<string, string>;
}

export function getCourses() {
  return db.prepare("SELECT * FROM courses ORDER BY created_at DESC").all() as any[];
}

export function getExams() {
  return db.prepare("SELECT * FROM exams ORDER BY date ASC").all() as any[];
}

export function getAssignments() {
  return db.prepare("SELECT * FROM assignments ORDER BY due_date ASC").all() as any[];
}

export function getDocuments() {
  return db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all() as any[];
}

export function getStudySessions() {
  return db.prepare("SELECT * FROM study_sessions ORDER BY scheduled_at ASC").all() as any[];
}

export function getDocumentQuestions(documentId: string) {
  return db
    .prepare("SELECT * FROM document_questions WHERE document_id = ? ORDER BY created_at DESC")
    .all(documentId) as any[];
}

export function getDocumentNotes(documentId: string) {
  return db
    .prepare("SELECT notes FROM document_notes WHERE document_id = ?")
    .get(documentId) as { notes: string } | undefined;
}

export type DocumentTopic = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
};

export function getDocumentTopics(documentId: string): DocumentTopic[] {
  const document = db.prepare("SELECT analysis_source FROM documents WHERE id = ?").get(documentId) as
    | { analysis_source: string }
    | undefined;
  if (document?.analysis_source !== "ai") return [];

  return db
    .prepare("SELECT id, title, description, difficulty FROM topics WHERE document_id = ? ORDER BY created_at")
    .all(documentId) as DocumentTopic[];
}

export function getDashboardData() {
  const courses = getCourses();
  const exams = getExams();
  const assignments = getAssignments();
  const sessions = getStudySessions();
  const documents = getDocuments();

  return {
    courses,
    exams,
    assignments,
    sessions,
    documents,
  };
}

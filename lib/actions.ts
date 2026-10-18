"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { db, getSettings } from "@/lib/db";
import { buildStudyPlan } from "@/lib/scheduler";
import { buildStudyNotes, extractPdfText, fallbackBasicTopics } from "@/lib/pdf";

export async function createCourse(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "#8b5cf6");

  if (!name || !code) {
    return;
  }

  db.prepare(
    `INSERT INTO courses (id, name, code, description, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  ).run(randomUUID(), name, code, description, color);

  revalidatePath("/");
  revalidatePath("/courses");
}

export async function updateCourse(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const color = String(formData.get("color") || "#8b5cf6");

  if (!id || !name || !code) {
    return;
  }

  db.prepare(
    `UPDATE courses
     SET name = ?, code = ?, description = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(name, code, description, color, id);

  revalidatePath("/");
  revalidatePath("/courses");
}

export async function deleteCourse(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  db.prepare("DELETE FROM courses WHERE id = ?").run(id);
  revalidatePath("/");
  revalidatePath("/courses");
}

export async function createExam(formData: FormData) {
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!courseId || !title || !date) {
    return;
  }

  db.prepare(
    `INSERT INTO exams (id, course_id, title, date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  ).run(randomUUID(), courseId, title, date, notes);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

export async function updateExam(formData: FormData) {
  const id = String(formData.get("id") || "");
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  const notes = String(formData.get("notes") || "").trim();

  if (!id || !courseId || !title || !date) return;

  db.prepare(
    `UPDATE exams SET course_id = ?, title = ?, date = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(courseId, title, date, notes, id);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

export async function deleteExam(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  db.prepare("DELETE FROM exams WHERE id = ?").run(id);
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

export async function createAssignment(formData: FormData) {
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("due_date") || "");
  const priority = String(formData.get("priority") || "Medium");
  const notes = String(formData.get("notes") || "").trim();

  if (!courseId || !title || !dueDate) {
    return;
  }

  db.prepare(
    `INSERT INTO assignments (id, course_id, title, due_date, priority, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  ).run(randomUUID(), courseId, title, dueDate, priority, notes);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

export async function updateAssignment(formData: FormData) {
  const id = String(formData.get("id") || "");
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("due_date") || "");
  const priority = String(formData.get("priority") || "Medium");
  const notes = String(formData.get("notes") || "").trim();

  if (!id || !courseId || !title || !dueDate) return;

  db.prepare(
    `UPDATE assignments SET course_id = ?, title = ?, due_date = ?, priority = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(courseId, title, dueDate, priority, notes, id);

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

export async function deleteAssignment(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  db.prepare("DELETE FROM assignments WHERE id = ?").run(id);
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/calendar");
}

function sanitizeStudySettings(formData: FormData) {
  const startHour = Number(formData.get("start_hour") ?? 9);
  const endHour = Number(formData.get("end_hour") ?? 18);
  const revisionMinutes = Number(formData.get("revision_minutes") ?? 45);
  const studyDays = String(formData.get("study_days") || "Mon,Tue,Wed,Thu,Fri");

  return {
    study_days: studyDays
      .split(",")
      .map((day) => day.trim())
      .filter(Boolean)
      .join(",") || "Mon,Tue,Wed,Thu,Fri",
    start_hour: String(Math.min(Math.max(startHour || 9, 6), 18)),
    end_hour: String(Math.min(Math.max(endHour || 18, Math.max(startHour || 9, 6) + 1), 24)),
    revision_minutes: String(Math.min(Math.max(revisionMinutes || 45, 15), 120)),
  };
}

export async function saveSettings(formData: FormData) {
  const settings = sanitizeStudySettings(formData);

  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  );

  Object.entries(settings).forEach(([key, value]) => upsert.run(key, value));
  revalidatePath("/settings");
  revalidatePath("/planner");
}

export async function createStudySession(formData: FormData) {
  const courseId = String(formData.get("course_id") || "");
  const title = String(formData.get("title") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const scheduledAt = String(formData.get("scheduled_at") || "");
  const duration = Number(formData.get("duration_minutes") || 60);

  if (!courseId || !title || !topic || !scheduledAt) {
    return;
  }

  const safeDuration = Number.isFinite(duration) ? Math.min(Math.max(duration, 15), 240) : 60;

  db.prepare(
    `INSERT INTO study_sessions (id, course_id, title, topic, scheduled_at, duration_minutes, status, confidence, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'scheduled', NULL, '', datetime('now'), datetime('now'))`,
  ).run(randomUUID(), courseId, title, topic, scheduledAt, safeDuration);

  revalidatePath("/");
  revalidatePath("/progress");
}

export async function completeStudySession(formData: FormData) {
  const id = String(formData.get("id") || "");
  const confidenceInput = Number(formData.get("confidence") || 3);
  const confidence = Number.isFinite(confidenceInput) ? Math.min(Math.max(Math.round(confidenceInput), 1), 5) : 3;
  const note = String(formData.get("note") || "").trim().slice(0, 1000);

  if (!id) return;

  const result = db.prepare(
    `UPDATE study_sessions SET status = 'completed', confidence = ?, note = ?, updated_at = datetime('now')
     WHERE id = ? AND status != 'completed'`,
  ).run(confidence, note, id);

  if (result.changes > 0) {
    revalidatePath("/");
    revalidatePath("/progress");
  }
}

export async function uploadDocument(formData: FormData) {
  const courseId = String(formData.get("course_id") || "");
  const file = formData.get("file");

  if (!courseId || !(file instanceof File) || !file.name) {
    return;
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(uploadDir, `${randomUUID()}-${safeName}`);

  const bytes = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(bytes));

  const documentId = randomUUID();
  const status = file.type === "application/pdf" ? "processing" : "invalid";

  db.prepare(
    `INSERT INTO documents (id, course_id, file_name, file_path, status, summary, extracted_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', '', datetime('now'), datetime('now'))`,
  ).run(documentId, courseId, safeName, filePath, status);

  try {
    if (file.type === "application/pdf") {
      const extracted = await extractPdfText(filePath);
      const summary = extracted.length > 240 ? `${extracted.slice(0, 240)}...` : extracted;
      const topics = fallbackBasicTopics(extracted).slice(0, 5);

      db.prepare(
        `UPDATE documents SET status = 'ready', summary = ?, extracted_text = ?, updated_at = datetime('now') WHERE id = ?`,
      ).run(summary, extracted, documentId);

      const insertTopic = db.prepare(
        `INSERT INTO topics (id, document_id, title, description, difficulty, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      );

      topics.forEach((topic) => {
        insertTopic.run(randomUUID(), documentId, topic.title, topic.description, topic.difficulty);
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF processing error";
    db.prepare(
      `UPDATE documents SET status = 'error', summary = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(message, documentId);
  }

  revalidatePath("/resources");
}

export async function answerQuestion(formData: FormData) {
  const documentId = String(formData.get("document_id") || "");
  const question = String(formData.get("question") || "").trim();
  const sourceExcerpt = String(formData.get("source_excerpt") || "").trim().slice(0, 3000);

  if (!documentId || !question) {
    return;
  }

  const document = db.prepare("SELECT extracted_text FROM documents WHERE id = ?").get(documentId) as { extracted_text: string | null } | undefined;
  const text = document?.extracted_text || "";
  const normalizedQuestion = question.toLowerCase();
  const keywords = normalizedQuestion
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token && token.length > 2);

  const candidates = (sourceExcerpt || text)
    .split(/\n|(?<=[.!?])\s+|\s*\/\s*/)
    .map((sentence: string) => sentence.trim())
    .filter((sentence: string) => sentence.length > 20);

  let scoredSentences = candidates
    .map((sentence: string) => {
      const lowercaseSentence = sentence.toLowerCase();
      const score = keywords.reduce((total, keyword) => total + (lowercaseSentence.includes(keyword) ? 1 : 0), 0);
      return { sentence, score };
    })
    .filter((entry: { sentence: string; score: number }) => entry.score > 0)
    .sort((left: { score: number }, right: { score: number }) => right.score - left.score)
    .slice(0, 2);

  if (!scoredSentences.length && sourceExcerpt) {
    scoredSentences = text
      .split(/\n|(?<=[.!?])\s+|\s*\/\s*/)
      .map((sentence: string) => sentence.trim())
      .filter((sentence: string) => sentence.length > 20)
      .map((sentence: string) => {
        const lowercaseSentence = sentence.toLowerCase();
        const score = keywords.reduce((total, keyword) => total + (lowercaseSentence.includes(keyword) ? 1 : 0), 0);
        return { sentence, score };
      })
      .filter((entry: { sentence: string; score: number }) => entry.score > 0)
      .sort((left: { score: number }, right: { score: number }) => right.score - left.score)
      .slice(0, 2);
  }

  const answer = scoredSentences.length
    ? `${sourceExcerpt ? "From the selected passage and document: " : ""}${scoredSentences.map((entry: { sentence: string }) => entry.sentence).join(" ")}`
    : "I could not find a direct match in the uploaded document. Try using a key term from the source or select a passage to ask about.";

  db.prepare(
    `INSERT INTO document_questions (id, document_id, question, answer, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  ).run(randomUUID(), documentId, question, answer);

  revalidatePath("/resources");
}

export async function saveDocumentNotes(formData: FormData) {
  const documentId = String(formData.get("document_id") || "");
  const notes = String(formData.get("notes") || "").trim().slice(0, 50000);
  if (!documentId || !db.prepare("SELECT 1 FROM documents WHERE id = ?").get(documentId)) {
    return;
  }

  db.prepare(
    `INSERT INTO document_notes (document_id, notes, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(document_id) DO UPDATE SET notes = excluded.notes, updated_at = datetime('now')`,
  ).run(documentId, notes);

  revalidatePath("/resources");
}

export async function generateDocumentNotes(formData: FormData) {
  const documentId = String(formData.get("document_id") || "");
  if (!documentId) return;

  const document = db
    .prepare("SELECT file_name, extracted_text FROM documents WHERE id = ?")
    .get(documentId) as { file_name: string; extracted_text: string | null } | undefined;
  if (!document) return;

  const notes = buildStudyNotes(document.extracted_text || "", document.file_name.replace(/\.[^.]+$/, ""));
  db.prepare(
    `INSERT INTO document_notes (document_id, notes, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(document_id) DO UPDATE SET notes = excluded.notes, updated_at = datetime('now')`,
  ).run(documentId, notes);

  revalidatePath("/resources");
}

export async function buildPlannerData() {
  const settings = getSettings();
  const courses = db.prepare("SELECT * FROM courses ORDER BY created_at DESC").all() as any[];
  const exams = db.prepare("SELECT * FROM exams ORDER BY date ASC").all() as any[];
  const assignments = db.prepare("SELECT * FROM assignments ORDER BY due_date ASC").all() as any[];
  const sessions = db.prepare("SELECT * FROM study_sessions ORDER BY scheduled_at ASC").all() as any[];

  return buildStudyPlan({
    courses,
    exams,
    assignments,
    sessions,
    settings: {
      study_days: settings.study_days || "Mon,Tue,Wed,Thu,Fri",
      start_hour: Number(settings.start_hour || 9),
      end_hour: Number(settings.end_hour || 18),
      revision_minutes: Number(settings.revision_minutes || 45),
    },
  }, false);
}

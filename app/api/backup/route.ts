import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hasValidSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-crypto";

export const runtime = "nodejs";
const tables = ["courses", "exams", "assignments", "documents", "topics", "resources", "study_sessions", "document_questions", "document_notes", "app_settings"] as const;

async function authorized() {
  return hasValidSession((await cookies()).get(SESSION_COOKIE_NAME)?.value);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const backup: Record<string, unknown> = { format: "studyos-backup", version: 1, exportedAt: new Date().toISOString(), tables: {}, uploads: [] };
  const rows: Record<string, unknown> = {};
  for (const table of tables) rows[table] = db.prepare(`SELECT * FROM ${table}`).all();
  backup.tables = rows;
  backup.uploads = (rows.documents as Array<{ id: string; file_name: string; file_path: string }>).flatMap((doc) => {
    try { return [{ documentId: doc.id, fileName: doc.file_name, data: fs.readFileSync(doc.file_path).toString("base64") }]; }
    catch { return []; }
  });
  return new NextResponse(JSON.stringify(backup), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="studyos-backup-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}

const backupSchema = z.object({ format: z.literal("studyos-backup"), version: z.literal(1), tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))), uploads: z.array(z.object({ documentId: z.string(), fileName: z.string(), data: z.string() })).default([]) });

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 100 * 1024 * 1024) return NextResponse.json({ error: "Backup exceeds the 100 MB import limit." }, { status: 413 });
  let raw: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 100 * 1024 * 1024) return NextResponse.json({ error: "Backup exceeds the 100 MB import limit." }, { status: 413 });
    raw = JSON.parse(body);
  } catch { return NextResponse.json({ error: "Choose a valid StudyOS JSON backup." }, { status: 400 }); }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "This is not a supported StudyOS backup." }, { status: 400 });
  const backup = parsed.data;
  const uploadById = new Map(backup.uploads.map((file) => [file.documentId, file]));
  const documentRows = backup.tables.documents ?? [];
  const uploadDir = path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  const filePaths = new Map<string, string>();
  try {
    for (const row of documentRows) {
      const name = String(row.file_name ?? "");
      if (db.prepare("SELECT 1 FROM documents WHERE id = ?").get(String(row.id ?? ""))) continue;
      const file = uploadById.get(String(row.id ?? ""));
      if (!file) continue;
      const bytes = Buffer.from(file.data, "base64");
      if (bytes.length > 25 * 1024 * 1024 || bytes.subarray(0, 1024).indexOf(Buffer.from("%PDF-")) < 0) throw new Error(`Invalid PDF data for ${name}.`);
      const storedPath = path.join(uploadDir, `${randomUUID()}.pdf`);
      fs.writeFileSync(storedPath, bytes, { flag: "wx" });
      filePaths.set(String(row.id), storedPath);
    }
    const order = ["courses", "exams", "assignments", "documents", "topics", "resources", "study_sessions", "document_questions", "document_notes", "app_settings"] as const;
    const insertBackup = db.transaction(() => {
      for (const table of order) {
        for (const original of backup.tables[table] ?? []) {
          const row = { ...original };
          if (table === "documents") {
            const importedPath = filePaths.get(String(row.id ?? ""));
            if (importedPath) row.file_path = importedPath;
            else delete row.file_path;
          }
          const columns = Object.keys(row).filter((key) => /^[a-z_]+$/.test(key));
          if (!columns.length) continue;
          const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
          db.prepare(sql).run(...columns.map((column) => row[column] ?? null));
        }
      }
    });
    insertBackup();
  } catch (error) {
    for (const filePath of filePaths.values()) { try { fs.unlinkSync(filePath); } catch { /* best effort cleanup */ } }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import the backup." }, { status: 400 });
  }
  return NextResponse.json({ imported: true, message: "Backup merged. Existing records with matching IDs were kept." });
}

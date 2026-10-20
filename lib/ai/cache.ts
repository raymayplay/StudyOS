import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { db } from "@/lib/db";

db.exec(`
  CREATE TABLE IF NOT EXISTS document_analysis_cache (
    file_hash TEXT PRIMARY KEY,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const cachedAnalysisSchema = z.object({
  summary: z.string().trim().min(1).max(1500),
  topics: z.array(z.object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).max(600),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  })).min(3).max(12),
});

export type CachedDocumentAnalysis = z.infer<typeof cachedAnalysisSchema>;

export function hashDocument(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function getCachedDocumentAnalysis(fileHash: string): CachedDocumentAnalysis | null {
  const row = db.prepare("SELECT analysis_json FROM document_analysis_cache WHERE file_hash = ?").get(fileHash) as
    | { analysis_json: string }
    | undefined;
  if (!row) return null;
  try {
    const parsed = cachedAnalysisSchema.safeParse(JSON.parse(row.analysis_json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveCachedDocumentAnalysis(fileHash: string, analysis: CachedDocumentAnalysis) {
  db.prepare(
    `INSERT OR IGNORE INTO document_analysis_cache (file_hash, analysis_json, created_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(file_hash) DO UPDATE SET analysis_json = excluded.analysis_json, created_at = datetime('now')`,
  ).run(fileHash, JSON.stringify(analysis));
}

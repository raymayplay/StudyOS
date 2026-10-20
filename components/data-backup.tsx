"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";

export function DataBackup() {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function importBackup() {
    const file = input.current?.files?.[0];
    if (!file) return;
    setBusy(true); setStatus("Importing backup…");
    try {
      const response = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: await file.text() });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Import failed.");
      setStatus(result.message || "Backup imported.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import this backup.");
    } finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  return <section className="card rounded-3xl p-5">
    <h3 className="text-lg font-semibold text-white">Backup and restore</h3>
    <p className="mt-2 text-sm leading-6 text-slate-400">Export your StudyOS records and PDF uploads as one JSON file. Import merges records and keeps existing items with matching IDs.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <a href="/api/backup" className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"><Download className="h-4 w-4" /> Export backup</a>
      <input ref={input} type="file" accept="application/json,.json" aria-label="Choose a StudyOS JSON backup" className="sr-only" onChange={importBackup} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"><Upload className="h-4 w-4" /> {busy ? "Importing…" : "Import backup"}</button>
    </div>
    {status && <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-300">{status}</p>}
  </section>;
}

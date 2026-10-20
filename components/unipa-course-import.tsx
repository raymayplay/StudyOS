"use client";

import { useActionState, useMemo, useState } from "react";
import { ClipboardPaste, FileUp, Plus } from "lucide-react";

import { importCourses } from "@/lib/actions";

type ImportedCourse = {
  key: string;
  name: string;
  code: string;
  description: string;
  color: string;
  meetings: Array<{ dayOfWeek: number; startTime: string; endTime: string; location: string; instructor: string }>;
};

const colors = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#14b8a6"];
const dayMatchers: Array<[RegExp, number]> = [
  [/(sun|sunday|日)/i, 0], [/(mon|monday|月)/i, 1], [/(tue|tuesday|火)/i, 2], [/(wed|wednesday|水)/i, 3], [/(thu|thursday|木)/i, 4], [/(fri|friday|金)/i, 5], [/(sat|saturday|土)/i, 6],
];

function parseMeeting(details: string) {
  const dayOfWeek = dayMatchers.find(([pattern]) => pattern.test(details))?.[1];
  const time = /(\d{1,2}):(\d{2})\s*(?:-|–|—|to|〜|~)\s*(\d{1,2}):(\d{2})/i.exec(details);
  if (dayOfWeek === undefined || !time) return [];
  return [{
    dayOfWeek,
    startTime: `${time[1].padStart(2, "0")}:${time[2]}`,
    endTime: `${time[3].padStart(2, "0")}:${time[4]}`,
    location: "",
    instructor: "",
  }];
}

function parseUnipaCourses(value: string): ImportedCourse[] {
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(line.includes("\t") ? "\t" : line.includes(",") ? "," : /\s{2,}/).map((cell) => cell.trim()).filter(Boolean));
  if (!rows.length) return [];
  const first = rows[0].join(" ").toLowerCase();
  const dataRows = /(course|class|subject|科目|授業|曜日|時間割)/.test(first) ? rows.slice(1) : rows;
  return dataRows.slice(0, 40).flatMap((cells, index) => {
    if (!cells.length) return [];
    const leadingNumber = /^\d+$/.test(cells[0]);
    const codeCandidate = cells[leadingNumber ? 1 : 0] ?? "";
    const hasCode = /[a-zA-Z]/.test(codeCandidate) || /^\d{4,}$/.test(codeCandidate);
    const nameIndex = hasCode ? (leadingNumber ? 2 : 1) : 0;
    const name = (cells[nameIndex] ?? "").trim();
    if (!name) return [];
    const code = hasCode ? codeCandidate : `UNIPA-${index + 1}`;
    const detailCells = cells.filter((_, cellIndex) => cellIndex !== nameIndex && cellIndex !== (hasCode ? (leadingNumber ? 1 : 0) : -1));
    const description = detailCells.join(" · ").slice(0, 800);
    return [{
      key: `${code}-${name}-${index}`,
      name: name.slice(0, 160),
      code: code.slice(0, 80),
      description,
      color: colors[index % colors.length],
      meetings: parseMeeting(description),
    }];
  });
}

function extractRowsFromUnipaHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(document.querySelectorAll("table tr"))
    .map((row) => Array.from(row.querySelectorAll("th, td")).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() || "").filter(Boolean))
    .filter((row) => row.length > 0);
  const extracted: string[] = [];
  let timetableColumns: Array<{ index: number; day: number; label: string }> = [];
  for (const row of rows) {
    const days = row.map((cell, index) => ({ index, label: cell, day: dayMatchers.find(([pattern]) => pattern.test(cell))?.[1] }))
      .filter((entry): entry is { index: number; label: string; day: number } => entry.day !== undefined);
    if (days.length >= 2) {
      timetableColumns = days;
      continue;
    }
    if (timetableColumns.length) {
      const period = row[0] || "class";
      for (const column of timetableColumns) {
        const className = row[column.index];
        if (className && !dayMatchers.some(([pattern]) => pattern.test(className))) {
          extracted.push(`UNIPA-${column.day}-${period}\t${className}\t${column.label}\tPeriod ${period}`);
        }
      }
      continue;
    }
    extracted.push(row.join("\t"));
  }
  return extracted.join("\n");
}

export function UnipaCourseImport() {
  const [pasted, setPasted] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileMessage, setFileMessage] = useState("");
  const [state, action, pending] = useActionState(importCourses, "");
  const courses = useMemo(() => parseUnipaCourses(pasted), [pasted]);

  function updatePasted(value: string) {
    setPasted(value);
    setSelected(new Set(parseUnipaCourses(value).map((course) => course.key)));
  }

  async function importSavedPage(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileMessage("Choose an HTML page smaller than 5 MB.");
      return;
    }
    try {
      updatePasted(extractRowsFromUnipaHtml(await file.text()));
      setFileMessage("Saved page read locally. Review the detected classes below before importing.");
    } catch {
      setFileMessage("StudyOS could not read that saved page. Copy and paste the UNIPA course rows instead.");
    }
  }

  const chosenCourses = courses.filter((course) => selected.has(course.key));
  return (
    <section className="card rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200"><ClipboardPaste className="h-5 w-5" /></div>
        <div>
          <h3 className="text-lg font-semibold text-white">Import classes from YGU UNIPA</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">Copy UNIPA rows, or choose a saved UNIPA page. Review and select classes before importing. Nothing is sent to UNIPA.</p>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium text-slate-200">
        Pasted course list
        <textarea value={pasted} onChange={(event) => updatePasted(event.target.value)} placeholder={"Course code\tCourse name\tInstructor\tDay / period\tRoom\nDATA100\tIntroduction to Computer Science\tParida\tTue 3\tLecture Theater"} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
      </label>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"><FileUp className="h-4 w-4" /> Import a saved UNIPA page<input type="file" accept="text/html,.html,.htm" className="sr-only" onChange={(event) => void importSavedPage(event.target.files?.[0])} /></label>
      <p className="mt-2 text-xs leading-5 text-slate-500">Open your UNIPA timetable or registered-course page, use Save Page As in your browser, then choose the HTML file here. StudyOS reads the file in your browser and sends only the parsed class rows to your local database.</p>
      {fileMessage && <p role="status" aria-live="polite" className="mt-2 text-sm text-sky-200">{fileMessage}</p>}
      {courses.length > 0 && <form action={action} className="mt-4">
        <input type="hidden" name="courses" value={JSON.stringify(chosenCourses.map((course) => ({ name: course.name, code: course.code, description: course.description, color: course.color, meetings: course.meetings })))} />
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          {courses.map((course) => <label key={course.key} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
            <input type="checkbox" checked={selected.has(course.key)} onChange={() => setSelected((current) => {
              const next = new Set(current);
              if (next.has(course.key)) next.delete(course.key);
              else next.add(course.key);
              return next;
            })} className="mt-1 h-4 w-4 accent-violet-500" />
            <span className="min-w-0"><span className="block font-medium text-white">{course.name}</span><span className="block text-xs text-slate-400">{course.code}{course.description ? ` · ${course.description}` : ""}{course.meetings.length ? ` · time detected: ${course.meetings[0].startTime}–${course.meetings[0].endTime}` : ""}</span></span>
          </label>)}
        </div>
        <button type="submit" disabled={pending || chosenCourses.length === 0} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400"><Plus className="h-4 w-4" />{pending ? "Importing…" : `Add ${chosenCourses.length} selected class${chosenCourses.length === 1 ? "" : "es"}`}</button>
      </form>}
      {pasted.trim() && courses.length === 0 && <p role="alert" className="mt-3 text-sm text-amber-200">No course rows were recognized. Paste one class per line, with tabs, commas, or wide spaces between columns.</p>}
      {state && <p role="status" aria-live="polite" className="mt-3 text-sm text-sky-200">{state}</p>}
    </section>
  );
}

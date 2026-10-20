"use client";

import { useActionState, useMemo, useState } from "react";
import { ClipboardPaste, FileUp, Plus } from "lucide-react";

import { importCourses } from "@/lib/actions";

type ScheduleProfile = "ygu" | "icla";
type Meeting = { dayOfWeek: number; startTime: string; endTime: string; location: string; instructor: string };
type ImportedCourse = { key: string; name: string; code: string; description: string; color: string; meetings: Meeting[] };

const colors = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e", "#14b8a6"];
const weekdays: Array<[RegExp, number]> = [
  [/^(sun(day)?|\u65e5)$/i, 0], [/^(mon(day)?|\u6708)$/i, 1], [/^(tue(sday)?|\u706b)$/i, 2],
  [/^(wed(nesday)?|\u6c34)$/i, 3], [/^(thu(rsday)?|\u6728)$/i, 4], [/^(fri(day)?|\u91d1)$/i, 5], [/^(sat(urday)?|\u571f)$/i, 6],
];
const periodTimes: Record<ScheduleProfile, Array<[string, string]>> = {
  ygu: [["08:30", "10:15"], ["10:25", "12:10"], ["13:00", "14:45"], ["14:55", "16:40"], ["16:50", "18:35"]],
  icla: [["09:00", "10:15"], ["10:25", "11:40"], ["12:40", "13:55"], ["14:05", "15:20"], ["15:30", "16:45"]],
};

function matchDay(value: string) {
  const normalized = value.trim().toLowerCase();
  return weekdays.find(([pattern]) => pattern.test(normalized))?.[1];
}

function makeMeeting(details: string, profile: ScheduleProfile): Meeting[] {
  const dayOfWeek = details.split(/[\s,/]+/).map(matchDay).find((day) => day !== undefined);
  if (dayOfWeek === undefined) return [];
  const time = /(\d{1,2}):(\d{2})\s*(?:-|\u2013|\u2014|to|\u301c|~)\s*(\d{1,2}):(\d{2})/i.exec(details);
  if (time) return [{ dayOfWeek, startTime: `${time[1].padStart(2, "0")}:${time[2]}`, endTime: `${time[3].padStart(2, "0")}:${time[4]}`, location: "", instructor: "" }];
  const periodMatch = /(?:period\s*([1-5])|([1-5])\s*\u9650|[\uff08(]([1-5])[\uff09)]|\b([1-5])\s*(?:st|nd|rd|th)?\s*period\b|(?:^|\s)([1-5])(?:\s|$))/i.exec(details);
  const period = periodMatch?.slice(1).find(Boolean);
  if (!period) return [];
  const [startTime, endTime] = periodTimes[profile][Number(period) - 1];
  return [{ dayOfWeek, startTime, endTime, location: "", instructor: "" }];
}

function mergeCourse(target: ImportedCourse[], course: ImportedCourse) {
  const existing = target.find((item) => item.code.toLowerCase() === course.code.toLowerCase() && item.name.toLowerCase() === course.name.toLowerCase());
  if (!existing) {
    target.push(course);
    return;
  }
  existing.description = [...new Set([existing.description, course.description].filter(Boolean))].join(" · ").slice(0, 800);
  for (const meeting of course.meetings) {
    if (!existing.meetings.some((item) => item.dayOfWeek === meeting.dayOfWeek && item.startTime === meeting.startTime && item.endTime === meeting.endTime)) existing.meetings.push(meeting);
  }
}

function parseCourseRows(value: string, profile: ScheduleProfile): ImportedCourse[] {
  const rows = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    .map((line) => line.split(line.includes("\t") ? "\t" : line.includes(",") ? "," : /\s{2,}/).map((cell) => cell.trim()).filter(Boolean));
  if (!rows.length) return [];
  const first = rows[0].join(" ").toLowerCase();
  const dataRows = /(course|class|subject|\u79d1\u76ee|\u6388\u696d|\u66dc\u65e5|\u6642\u9593\u5272)/.test(first) ? rows.slice(1) : rows;
  const imported: ImportedCourse[] = [];
  for (const [index, cells] of dataRows.slice(0, 160).entries()) {
    if (!cells.length) continue;
    const leadingNumber = /^\d+$/.test(cells[0]);
    const codeCandidate = cells[leadingNumber ? 1 : 0] ?? "";
    const hasCode = /[a-zA-Z]/.test(codeCandidate) || /^\d{4,}$/.test(codeCandidate);
    const nameIndex = hasCode ? (leadingNumber ? 2 : 1) : 0;
    const name = (cells[nameIndex] ?? "").trim();
    if (!name || /^(period|class|course|subject|\u6642\u9650|\u6642\u9650)$/i.test(name)) continue;
    const details = cells.filter((_, cellIndex) => cellIndex !== nameIndex && cellIndex !== (hasCode ? (leadingNumber ? 1 : 0) : -1));
    const description = details.join(" · ").slice(0, 800);
    const code = (hasCode ? codeCandidate : `UNIPA-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 55) || index + 1}`).slice(0, 80);
    mergeCourse(imported, {
      key: `${code}-${name}-${index}`,
      name: name.slice(0, 160), code, description, color: colors[index % colors.length],
      meetings: makeMeeting(cells.join(" "), profile),
    });
  }
  return imported;
}

function extractUnipaHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(document.querySelectorAll("table"));
  const output: string[] = [];
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("th,td")).map((cell) => (cell as HTMLElement).innerText || cell.textContent || "").map((value) => value.split(/[\r\n]+/).map((part) => part.trim()).filter(Boolean).join(" | ")));
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const dayColumns = row.map((value, index) => ({ value, index, day: matchDay(value) })).filter((item): item is { value: string; index: number; day: number } => item.day !== undefined);
      if (dayColumns.length < 3) continue;
      for (const classRow of rows.slice(rowIndex + 1)) {
        const period = /([1-5])\s*(?:st|nd|rd|th)?\s*(?:period|\u9650)/i.exec(classRow[0] || "")?.[1] || /^([1-5])$/.exec(classRow[0] || "")?.[1];
        if (!period) continue;
        for (const column of dayColumns) {
          const cellText = classRow[column.index]?.trim();
          if (!cellText || /^(?:-|\u2014|\u2013|\s)+$/.test(cellText)) continue;
          const parts = cellText.split(/\s*\|\s*/).filter(Boolean);
          const code = parts.find((part) => /\b[A-Z]{2,}[A-Z0-9/-]*\d[A-Z0-9/-]*\b/.test(part));
          const name = parts.find((part) => part !== code && !/\b(?:room|classroom)\b/i.test(part)) || parts[0];
          if (!name) continue;
          const room = parts.find((part) => /\b(?:room|classroom|[A-Z]\d{2,4})\b/i.test(part)) || "";
          output.push([code || `UNIPA-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 55)}`, name, parts.filter((part) => part !== name && part !== code && part !== room).join(" "), `${column.value} Period ${period}`, room].join("\t"));
        }
      }
      break;
    }
  }
  return output.join("\n") || Array.from(document.querySelectorAll("table tr")).map((row) => Array.from(row.querySelectorAll("th,td")).map((cell) => cell.textContent?.replace(/\s+/g, " ").trim() || "").join("\t")).join("\n");
}

export function UnipaCourseImport() {
  const [pasted, setPasted] = useState("");
  const [profile, setProfile] = useState<ScheduleProfile>("ygu");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileMessage, setFileMessage] = useState("");
  const [state, action, pending] = useActionState(importCourses, "");
  const courses = useMemo(() => parseCourseRows(pasted, profile), [pasted, profile]);

  function updatePasted(value: string) {
    setPasted(value);
    setSelected(new Set(parseCourseRows(value, profile).map((course) => course.key)));
  }

  async function importSavedPage(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFileMessage("Choose an HTML page smaller than 5 MB.");
      return;
    }
    try {
      updatePasted(extractUnipaHtml(await file.text()));
      setFileMessage("Saved page read in your browser. Review detected classes and times before importing.");
    } catch {
      setFileMessage("Could not read that page. Copy the course rows from UNIPA and paste them instead.");
    }
  }

  const chosenCourses = courses.filter((course) => selected.has(course.key));
  return <section className="card rounded-3xl p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-200"><ClipboardPaste className="h-5 w-5" /></div>
      <div><h3 className="text-lg font-semibold text-white">Import classes from YGU UNIPA</h3><p className="mt-1 text-sm leading-6 text-slate-400">Paste copied rows or choose a saved timetable page. Review and select classes before importing; nothing is sent to UNIPA.</p></div>
    </div>
    <label className="mt-4 block text-sm font-medium text-slate-200">Pasted course list<textarea value={pasted} onChange={(event) => updatePasted(event.target.value)} placeholder={"Course code\tCourse name\tInstructor\tDay / period\tRoom\nDATA100\tIntroduction to Computer Science\tParida\tTue 3\tC201"} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500" /></label>
    <label className="mt-3 block max-w-sm text-sm font-medium text-slate-200">Timetable profile<select value={profile} onChange={(event) => setProfile(event.target.value as ScheduleProfile)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white"><option value="ygu">YGU standard · 105 minute classes</option><option value="icla">iCLA · 75 minute classes</option></select></label>
    <p className="mt-1 text-xs text-slate-500">Period times use YGU&apos;s published schedules. You can review or adjust every imported time on the Timetable page.</p>
    <a href="https://www.ygu.ac.jp/news/4107/" target="_blank" rel="noreferrer" className="text-xs text-violet-300 underline">YGU period time information</a>
    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"><FileUp className="h-4 w-4" /> Import a saved UNIPA page<input type="file" accept="text/html,.html,.htm" className="sr-only" onChange={(event) => void importSavedPage(event.target.files?.[0])} /></label>
    <p className="mt-2 text-xs leading-5 text-slate-500">Open your UNIPA timetable or registered-course page, save the page from your browser, then choose its HTML file. StudyOS parses it locally before showing the preview.</p>
    {fileMessage && <p role="status" aria-live="polite" className="mt-2 text-sm text-sky-200">{fileMessage}</p>}
    {courses.length > 0 && <form action={action} className="mt-4">
      <input type="hidden" name="courses" value={JSON.stringify(chosenCourses.map((course) => ({ name: course.name, code: course.code, description: course.description, color: course.color, meetings: course.meetings })))} />
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/25 p-3">{courses.map((course) => <label key={course.key} className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/5"><input type="checkbox" checked={selected.has(course.key)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(course.key)) next.delete(course.key); else next.add(course.key); return next; })} className="mt-1 h-4 w-4 accent-violet-500" /><span className="min-w-0"><span className="block font-medium text-white">{course.name}</span><span className="block text-xs text-slate-400">{course.code}{course.description ? ` · ${course.description}` : ""}{course.meetings.map((meeting) => ` · ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][meeting.dayOfWeek]} ${meeting.startTime}–${meeting.endTime}`).join("")}</span></span></label>)}</div>
      <button type="submit" disabled={pending || chosenCourses.length === 0} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-400"><Plus className="h-4 w-4" />{pending ? "Importing…" : `Add ${chosenCourses.length} selected class${chosenCourses.length === 1 ? "" : "es"}`}</button>
    </form>}
    {pasted.trim() && courses.length === 0 && <p role="alert" className="mt-3 text-sm text-amber-200">No course rows were recognized. Paste one class per line, with tabs, commas, or wide spaces between columns.</p>}
    {state && <p role="status" aria-live="polite" className="mt-3 text-sm text-sky-200">{state}</p>}
  </section>;
}

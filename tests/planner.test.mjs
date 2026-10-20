import assert from "node:assert/strict";
import fs from "node:fs";
import { Module } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadTypeScript(relativePath) {
  const filename = path.join(testDirectory, "..", relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = new Module(filename);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const { buildStudyPlan, normalizeStudySettings } = loadTypeScript("lib/scheduler.ts");
const { daysFromToday, isDueWithinDays, parseLocalDate } = loadTypeScript("lib/deadlines.ts");

test("planner orders deadlines by date and then priority", () => {
  const today = new Date();
  const date = (offset) => {
    const result = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return `${result.getFullYear()}-${String(result.getMonth() + 1).padStart(2, "0")}-${String(result.getDate()).padStart(2, "0")}`;
  };
  const plan = buildStudyPlan({
    courses: [{ id: "c1", name: "Math", code: "MTH", color: "violet" }],
    exams: [{ id: "e1", title: "Exam", date: date(4), course_id: "c1", notes: "" }],
    assignments: [
      { id: "a1", title: "Later task", due_date: date(5), course_id: "c1", priority: "High" },
      { id: "a2", title: "Completed", due_date: date(1), course_id: "c1", priority: "High", is_completed: 1 },
      { id: "a3", title: "Same day task", due_date: date(4), course_id: "c1", priority: "Low" },
    ],
    sessions: [],
    settings: { start_hour: 9, end_hour: 18, revision_minutes: 45, study_days: "Mon,Tue,Wed,Thu,Fri" },
  });
  assert.deepEqual(plan.suggestions.slice(0, 3).map((item) => item.id), ["exam-e1", "assignment-a3", "assignment-a1"]);
  assert.ok(!plan.suggestions.some((item) => item.title.includes("Completed")));
});

test("date-only deadlines stay local and include today in the due window", () => {
  const today = new Date(2026, 9, 20, 23, 30);
  assert.equal(parseLocalDate("2026-10-20").getDate(), 20);
  assert.equal(daysFromToday("2026-10-20", today), 0);
  assert.equal(isDueWithinDays("2026-10-27", 7, today), true);
  assert.equal(isDueWithinDays("2026-10-28", 7, today), false);
  assert.equal(isDueWithinDays("2026-10-19", 7, today), false);
});

test("study settings are clamped to usable ranges", () => {
  assert.deepEqual(normalizeStudySettings({ start_hour: 25, end_hour: 2, revision_minutes: 1, study_days: "" }), {
    study_days: "Mon,Tue,Wed,Thu,Fri", start_hour: 18, end_hour: 19, revision_minutes: 15,
  });
});

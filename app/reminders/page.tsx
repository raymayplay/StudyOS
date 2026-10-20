import Link from "next/link";
import { BellRing, CalendarClock, CheckCircle2, Clock3 } from "lucide-react";

import { AssignmentCompletion } from "@/components/assignment-completion";
import { ReminderNotificationStatus } from "@/components/deadline-reminders";
import { getAssignments, getCourses, getExams } from "@/lib/db";

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

function formatDate(value: string) {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RemindersPage() {
  const courses = getCourses();
  const courseNames = new Map(courses.map((course) => [course.id, course.name]));
  const exams = getExams().map((exam) => ({
    id: exam.id,
    title: exam.title,
    date: exam.date,
    type: "Exam" as const,
    courseName: courseNames.get(exam.course_id) ?? "Course",
  }));
  const assignments = getAssignments();
  const activeAssignments = assignments
    .filter((assignment) => !assignment.is_completed)
    .map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      date: assignment.due_date,
      type: "Assignment" as const,
      courseName: courseNames.get(assignment.course_id) ?? "Course",
      priority: assignment.priority,
      completed: false,
    }));
  const activeReminders = [...exams, ...activeAssignments].sort((left, right) => left.date.localeCompare(right.date));
  const completedAssignments = assignments.filter((assignment) => assignment.is_completed);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
            <BellRing className="h-4 w-4" /> Reminder center
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Stay ahead of deadlines</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            See upcoming exams and assignments together. Mark assignments complete here or in your course list.
          </p>
        </div>
        <Link href="/courses" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5">
          Manage deadlines <CalendarClock className="h-4 w-4" />
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Active reminders</p>
          <p className="mt-2 text-2xl font-semibold text-white">{activeReminders.length}</p>
        </div>
        <div className="card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Assignments left</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{activeAssignments.length}</p>
        </div>
        <div className="card rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tasks completed</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-200">{completedAssignments.length}</p>
        </div>
      </section>

      <ReminderNotificationStatus />

      <section className="card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Upcoming and overdue</h3>
            <p className="mt-1 text-sm text-slate-400">Unfinished assignments and all exam dates are listed by date.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200">
            <Clock3 className="h-3.5 w-3.5" /> Browser alerts: day before and due date
          </div>
        </div>

        {activeReminders.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" />
            <p className="mt-3 font-medium text-white">You’re all caught up.</p>
            <p className="mt-1 text-sm text-slate-400">Add a course deadline to see it here.</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {activeReminders.map((reminder) => {
              const isAssignment = reminder.type === "Assignment";
              const isPastDue = parseLocalDate(reminder.date) < new Date(new Date().setHours(0, 0, 0, 0));
              const assignment = isAssignment ? assignments.find((item) => item.id === reminder.id) : undefined;

              return (
                <li key={`${reminder.type}-${reminder.id}`} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                        isAssignment ? "bg-amber-500/10 text-amber-200" : "bg-violet-500/10 text-violet-200"
                      }`}>{reminder.type}</span>
                      {"priority" in reminder && <span className="text-xs text-slate-500">{reminder.priority} priority</span>}
                      {isPastDue && <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-rose-200">Overdue</span>}
                    </div>
                    <p className="mt-2 truncate font-semibold text-white">{reminder.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{reminder.courseName} · {formatDate(reminder.date)}</p>
                  </div>
                  {assignment && (
                    <AssignmentCompletion
                      id={assignment.id}
                      title={assignment.title}
                      completed={Boolean(assignment.is_completed)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {completedAssignments.length > 0 && (
        <section className="card rounded-3xl p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Completed assignments</h3>
          <ul className="mt-4 space-y-3">
            {completedAssignments.map((assignment) => (
              <li key={assignment.id} className="flex flex-col gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-300 line-through decoration-emerald-400/50">{assignment.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{courseNames.get(assignment.course_id) ?? "Course"} · Due {formatDate(assignment.due_date)}</p>
                </div>
                <AssignmentCompletion id={assignment.id} title={assignment.title} completed />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

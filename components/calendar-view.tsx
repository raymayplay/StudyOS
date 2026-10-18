"use client";

import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  course_id: string;
  date: Date;
  type: "exam" | "assignment";
  priority?: string;
};

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDay(left: Date, right: Date) {
  return dayKey(left) === dayKey(right);
}

export default function CalendarView({
  courses,
  exams,
  assignments,
}: {
  courses: Array<{ id: string; name: string; code: string; color: string }>;
  exams: Array<{ id: string; title: string; date: string; course_id: string; notes: string }>;
  assignments: Array<{ id: string; title: string; due_date: string; course_id: string; priority: string }>;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const today = new Date();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return day;
  });
  const events: CalendarEvent[] = [
    ...exams.map((exam) => ({ ...exam, type: "exam" as const, date: parseLocalDate(exam.date) })),
    ...assignments.map((assignment) => ({
      ...assignment,
      type: "assignment" as const,
      date: parseLocalDate(assignment.due_date),
    })),
  ];
  const selectedEvents = events.filter((event) => isSameDay(event.date, selectedDay));
  const monthTitle = visibleMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

  const upcoming = useMemo(
    () =>
      events
        .filter((event) => event.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((left, right) => left.date.getTime() - right.date.getTime())
        .slice(0, 5),
    // Events are supplied from the server and remain stable during this calendar view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exams, assignments],
  );

  function shiftMonth(amount: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function goToToday() {
    const current = new Date();
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
    setSelectedDay(current);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Calendar / Timeline</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your academic schedule</h2>
          <p className="mt-2 text-sm text-slate-400">Exams and assignments, in one clear view.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold text-white">{monthTitle}</span>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={goToToday} className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-500/20">
            Today
          </button>
        </div>
      </header>

      <div className="card rounded-3xl p-4 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" /> Exams</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" /> Assignments</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 sm:gap-2 sm:text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(event.date, day));
            const isCurrentMonth = day.getMonth() === month;
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDay);
            return (
              <button
                key={dayKey(day)}
                type="button"
                onClick={() => setSelectedDay(day)}
                aria-label={`${day.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
                aria-pressed={isSelected}
                className={`min-h-20 rounded-xl border p-1.5 text-left transition sm:min-h-28 sm:rounded-2xl sm:p-2 ${
                  isSelected
                    ? "border-violet-400/60 bg-violet-500/10 ring-1 ring-violet-400/20"
                    : isCurrentMonth
                      ? "border-white/[0.08] bg-slate-900/50 hover:border-violet-400/30 hover:bg-slate-900/90"
                      : "border-white/[0.04] bg-slate-950/30 text-slate-600 hover:bg-white/[0.03]"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:mb-2 ${isToday ? "bg-gradient-to-br from-violet-400 to-indigo-500 font-bold text-white shadow-md shadow-violet-950/60" : isCurrentMonth ? "text-slate-200" : "text-slate-600"}`}>
                  {day.getDate()}
                </span>
                <span className="hidden space-y-1 sm:block">
                  {dayEvents.slice(0, 2).map((event) => (
                    <span key={`${event.id}-${event.type}`} title={event.title} className={`block truncate rounded-md px-1.5 py-1 text-[10px] font-medium ${event.type === "exam" ? "bg-violet-500/20 text-violet-200" : "bg-amber-500/15 text-amber-100"}`}>
                      {event.title}
                    </span>
                  ))}
                </span>
                {dayEvents.length > 0 && (
                  <span className="mt-1 flex gap-1 sm:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span key={`${event.id}-${event.type}`} className={`h-1.5 w-1.5 rounded-full ${event.type === "exam" ? "bg-violet-400" : "bg-amber-300"}`} />
                    ))}
                  </span>
                )}
                {dayEvents.length > 2 && <span className="hidden text-[9px] text-slate-500 sm:block">+{dayEvents.length - 2} more</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-slate-950/45 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-white">
              {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <span className="text-xs text-slate-500">{selectedEvents.length} {selectedEvents.length === 1 ? "event" : "events"}</span>
          </div>
          {selectedEvents.length ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selectedEvents.map((event) => (
                <div key={`${event.id}-${event.type}`} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.type === "exam" ? "bg-violet-400" : "bg-amber-300"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{event.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{courses.find((course) => course.id === event.course_id)?.name ?? "General"} · {event.type}{event.priority ? ` · ${event.priority} priority` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Nothing scheduled. Take this day to focus or recharge.</p>
          )}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card rounded-3xl p-5">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white"><Clock3 className="h-4 w-4 text-violet-300" /> Coming up</h3>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-slate-400">No upcoming deadlines. You&apos;re all caught up.</p> : upcoming.map((event) => (
              <div key={`${event.id}-${event.type}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{courses.find((course) => course.id === event.course_id)?.name ?? "General"}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${event.type === "exam" ? "bg-violet-500/15 text-violet-200" : "bg-amber-500/15 text-amber-100"}`}>
                  {event.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Deadline overview</h3>
          <div className="mt-4 space-y-3">
            {exams.length === 0 && assignments.length === 0 ? (
              <p className="text-sm text-slate-400">No deadlines saved yet. Add an exam or assignment in your course library.</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] px-3 py-3 text-sm">
                  <span className="text-slate-300">Exams</span><span className="font-semibold text-violet-200">{exams.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] px-3 py-3 text-sm">
                  <span className="text-slate-300">Assignments</span><span className="font-semibold text-amber-100">{assignments.length}</span>
                </div>
                <p className="text-xs leading-5 text-slate-500">Select a day above to see its full agenda. Use the month arrows to look ahead.</p>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

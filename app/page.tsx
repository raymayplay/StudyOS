import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileStack, GraduationCap, Sparkles } from "lucide-react";

import StudyChart from "@/components/study-chart";
import { getDashboardData, getSettings } from "@/lib/db";
import { getAIStudyPlan } from "@/lib/planning-ai";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = getDashboardData();
  const settings = getSettings();
  const { plan, source, error: aiError } = await getAIStudyPlan();

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlines = [
    ...data.exams.map((exam) => ({ id: exam.id, title: exam.title, dueDate: exam.date, type: "Exam" })),
    ...data.assignments
      .filter((assignment) => !assignment.is_completed)
      .map((assignment) => ({ id: assignment.id, title: assignment.title, dueDate: assignment.due_date, type: "Assignment" })),
  ].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  const dueSoon = deadlines.filter((item) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(item.dueDate);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(item.dueDate);
    const daysAway = Math.ceil((date.getTime() - todayStart.getTime()) / 86_400_000);
    return daysAway >= 0 && daysAway <= 7;
  });
  const nextDeadline = deadlines.find((item) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(item.dueDate);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(item.dueDate);
    return date >= todayStart;
  }) ?? deadlines.find((item) => item.type === "Assignment");
  const upcomingExams = deadlines.filter((item) => item.type === "Exam").slice(0, 3);
  const upcomingAssignments = deadlines.filter((item) => item.type === "Assignment").slice(0, 3);
  const completedSessions = data.sessions.filter((session) => session.status === "completed").length;
  const nextSession = data.sessions.find((session) => session.status !== "completed") ?? null;
  const focusSuggestion = plan.suggestions[0];

  const chartData = data.courses.map((course) => ({
    name: course.code,
    sessions: data.sessions.filter((session) => session.course_id === course.id).length,
  }));

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-violet-300/15 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-cyan-500/[0.08] p-6 shadow-2xl shadow-violet-950/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-48 rounded-full bg-cyan-400/[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> StudyOS / Dashboard</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your study command center</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">A clear view of your workload, with a practical next step based on what is coming up.</p>
            <p className="mt-2 text-xs text-slate-400">
              {source === "ai" ? "Local AI plan tailored to your deadlines and uploaded course material." : "Using the local deadline planner."}
            </p>
            {aiError && (
              <p role="status" className="mt-2 max-w-xl text-xs leading-5 text-amber-200">
                AI planning is unavailable: {aiError}
              </p>
            )}
          </div>
          <Link href="/planner" className="relative inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 lg:self-auto">
            Generate study plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">Suggested next step</p>
            <p className="mt-2 font-semibold text-white">{focusSuggestion?.title || (nextSession ? nextSession.title : "Add a course or deadline to get started")}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{focusSuggestion?.reason || (nextSession ? `Your next session is ${nextSession.topic}.` : "Your planner will surface a focused recommendation here.")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">Nearest deadline</p>
            {nextDeadline ? (
              <>
                <p className="mt-2 font-semibold text-white">{nextDeadline.title}</p>
                <p className="mt-1 text-xs text-slate-300">{nextDeadline.type} · {new Date(`${nextDeadline.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString()}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-300">No deadlines yet. Enjoy the breathing room.</p>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<GraduationCap className="h-5 w-5" />} label="Courses" value={String(data.courses.length)} tone="violet" />
        <MetricCard icon={<Clock3 className="h-5 w-5" />} label="Due in 7 days" value={String(dueSoon.length)} tone="sky" />
        <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed sessions" value={String(completedSessions)} tone="emerald" />
        <MetricCard icon={<FileStack className="h-5 w-5" />} label="Documents" value={String(data.documents.length)} tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Course progress</h3>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Overview</span>
          </div>
          <div className="h-72 w-full">
            <StudyChart data={chartData} fill="#8b5cf6" />
          </div>
        </div>

        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Next scheduled session</h3>
          {nextSession ? (
            <div className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
              <p className="text-sm text-violet-200">{nextSession.title}</p>
              <p className="mt-2 text-xl font-semibold text-white">{new Date(nextSession.scheduled_at).toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-400">Topic: {nextSession.topic}</p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
              No sessions scheduled yet. Create a study block in the planner or add a course.
            </div>
          )}
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
              <span>Deadlines this week</span>
              <span className="font-semibold text-white">{dueSoon.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
              <span>Available study time</span>
              <span className="font-semibold text-white">{settings.study_days || "Mon-Fri"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Upcoming exams</h3>
          <div className="mt-4 space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-slate-400">No exam dates saved yet.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-white">{exam.title}</strong>
                    <span className="text-xs uppercase tracking-[0.2em] text-violet-300">Exam</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{new Date(`${exam.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Upcoming assignments</h3>
            <Link href="/reminders" className="text-xs font-medium text-violet-300 hover:text-violet-200">Reminder center →</Link>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-slate-400">No assignment deadlines saved yet.</p>
            ) : (
              upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-white">{assignment.title}</strong>
                    <span className="text-xs uppercase tracking-[0.2em] text-amber-300">Assignment</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">Due {new Date(`${assignment.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Suggested study rhythm</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {plan.suggestions.slice(0, 3).map((task) => (
            <div key={task.id} className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
              <p className="text-sm text-violet-200">{task.courseName}</p>
              <h4 className="mt-2 text-base font-semibold text-white">{task.title}</h4>
              <p className="mt-2 text-sm text-slate-300">{task.reason}</p>
            </div>
          ))}
          {plan.suggestions.length === 0 && <p className="text-sm text-slate-400">Add a course and upcoming deadline to get a study rhythm suggestion.</p>}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "violet" | "sky" | "emerald" | "amber";
}) {
  const tones = {
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    sky: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };

  return (
    <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-950/40 p-2">{icon}</div>
        <span className="text-xl font-semibold text-white">{value}</span>
      </div>
      <p className="mt-4 text-sm text-slate-200">{label}</p>
    </div>
  );
}

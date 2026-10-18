import StudyChart from "@/components/study-chart";
import { completeStudySession, createStudySession } from "@/lib/actions";
import { getCourses, getStudySessions } from "@/lib/db";

export default async function ProgressPage() {
  const courses = getCourses();
  const sessions = getStudySessions();
  const completed = sessions.filter((session) => session.status === "completed").length;
  const chartData = courses.map((course) => ({
    name: course.code,
    value: sessions.filter((session) => session.course_id === course.id && session.status === "completed").length,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Progress</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Study momentum and session completion</h2>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Completed sessions" value={String(completed)} tone="emerald" />
        <MetricCard label="Scheduled" value={String(sessions.filter((session) => session.status === "scheduled").length)} tone="violet" />
        <MetricCard label="Total sessions" value={String(sessions.length)} tone="sky" />
      </section>

      <section className="card rounded-3xl p-5">
        <h3 className="text-lg font-semibold text-white">Session completion trend</h3>
        <div className="mt-4 h-72 w-full">
          <StudyChart data={chartData} fill="#22c55e" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">New study session</h3>
          <form action={createStudySession} className="mt-4 space-y-3">
            <select name="course_id" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required>
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <input name="title" placeholder="Session title" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
            <input name="topic" placeholder="Topic" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
            <input type="datetime-local" name="scheduled_at" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" required />
            <input type="number" name="duration_minutes" defaultValue={60} min={15} max={240} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            <button type="submit" className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400">Create session</button>
          </form>
        </div>

        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Recent sessions</h3>
          <div className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400">No study sessions created yet.</p>
            ) : (
              [...sessions].sort((left, right) => right.created_at.localeCompare(left.created_at)).slice(0, 6).map((session) => (
                <div key={session.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-white">{session.title}</strong>
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${session.status === "completed" ? "bg-emerald-500/10 text-emerald-300" : "bg-violet-500/10 text-violet-200"}`}>{session.status}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{session.topic} • {new Date(session.scheduled_at).toLocaleString()}</p>
                  {session.status === "completed" ? (
                    <p className="mt-3 text-xs text-emerald-300">Session completed{session.confidence ? ` · confidence ${session.confidence}/5` : ""}{session.note ? ` · ${session.note}` : ""}</p>
                  ) : (
                    <form action={completeStudySession} className="mt-3 flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={session.id} />
                      <label className="sr-only" htmlFor={`confidence-${session.id}`}>Confidence from 1 to 5</label>
                      <input id={`confidence-${session.id}`} type="number" name="confidence" min={1} max={5} defaultValue={3} className="w-20 rounded-xl border border-white/10 bg-slate-950/60 px-2 py-1 text-white" />
                      <label className="sr-only" htmlFor={`note-${session.id}`}>Session note</label>
                      <input id={`note-${session.id}`} name="note" placeholder="Quick note" className="min-w-32 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-2 py-1 text-white placeholder:text-slate-500" />
                      <button type="submit" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white hover:from-emerald-400 hover:to-teal-400">Mark done</button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "violet" | "sky" }) {
  const colors = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  };

  return (
    <div className={`rounded-3xl border p-4 ${colors[tone]}`}>
      <p className="text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

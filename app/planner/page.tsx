import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";

import { saveSettings } from "@/lib/actions";
import { getSettings } from "@/lib/db";
import { getAIStudyPlan } from "@/lib/planning-ai";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams?: Promise<{ recovery?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const recoveryMode = params.recovery === "true";
  const settings = getSettings();
  const { plan, source, error: aiError } = await getAIStudyPlan(recoveryMode);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-violet-300">AI Study Room</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Deadline-aware study planner</h2>
          <p className="mt-2 text-sm text-slate-400">
            {source === "ai" ? "AI plan based on your deadlines and uploaded PDF content." : "Local deadline-based plan."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/planner" className="rounded-full border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5">Standard</Link>
          <Link href="/planner?recovery=true" className="rounded-full bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400">Recovery mode</Link>
        </div>
      </header>

      {aiError && (
        <div role="status" className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          AI planning is unavailable, so this is the local fallback plan: {aiError}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-2 text-violet-200">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-white">Availability preferences</h3>
          </div>
          <form action={saveSettings} className="space-y-3">
            <input name="study_days" defaultValue={settings.study_days || "Mon,Tue,Wed,Thu,Fri"} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" name="start_hour" defaultValue={settings.start_hour || 9} min={6} max={14} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
              <input type="number" name="end_hour" defaultValue={settings.end_hour || 18} min={10} max={24} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            </div>
            <input type="number" name="revision_minutes" defaultValue={settings.revision_minutes || 45} min={15} max={120} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            <button type="submit" className="rounded-full bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400">Save availability</button>
          </form>
        </div>

        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Study planner summary</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <SummaryMetric label="Available minutes" value={`${plan.totalAvailableMinutes}`} />
            <SummaryMetric label="Suggested minutes" value={`${plan.totalNeededMinutes}`} />
            <SummaryMetric label="Mode" value={recoveryMode ? "Recovery" : "Balanced"} />
          </div>
          {plan.warning && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100">
              <AlertTriangle className="mt-0.5 h-5 w-5" />
              <p className="text-sm">The current workload exceeds the available study time. Prioritize urgent deadlines and reduce scope where possible.</p>
            </div>
          )}
        </div>
      </section>

      <section className="card rounded-3xl p-5">
        <h3 className="text-lg font-semibold text-white">Recommended sessions</h3>
        <div className="mt-5 space-y-4">
          {plan.suggestions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300">{item.courseName}</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">{item.title}</h4>
                </div>
                <div className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">{item.duration} min</div>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-2 py-1">Due {item.dueDate}</span>
                <span className="rounded-full border border-white/10 px-2 py-1">Start {new Date(item.start).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

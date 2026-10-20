import { saveSettings } from "@/lib/actions";
import { getSettings } from "@/lib/db";
import { AIStatus } from "@/components/ai-status";
import { DataBackup } from "@/components/data-backup";

export default async function SettingsPage() {
  const settings = getSettings();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-violet-300">Settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Study availability and working preferences</h2>
      </header>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="xl:col-span-2"><DataBackup /></div>
        <div className="xl:col-span-2">
          <AIStatus />
        </div>
        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Study windows</h3>
          <form action={saveSettings} className="mt-4 space-y-3">
            <label className="block text-sm text-slate-300">
              Study days
              <input name="study_days" defaultValue={settings.study_days || "Mon,Tue,Wed,Thu,Fri"} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Start hour
                <input type="number" name="start_hour" min={6} max={18} defaultValue={settings.start_hour || 9} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
              </label>
              <label className="block text-sm text-slate-300">
                End hour
                <input type="number" name="end_hour" min={10} max={24} defaultValue={settings.end_hour || 18} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Revision minutes
              <input type="number" name="revision_minutes" min={15} max={120} defaultValue={settings.revision_minutes || 45} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white" />
            </label>
            <button type="submit" className="rounded-full bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400">Save settings</button>
          </form>
        </div>

        <div className="card rounded-3xl p-5">
          <h3 className="text-lg font-semibold text-white">Operational notes</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• AI features use the provider selected in environment settings. Ollama runs locally; OpenAI, Anthropic, and Gemini send prompts to their configured services.</li>
            <li>• PDF text stays on this computer. Text extraction is local; scanned PDFs still require OCR.</li>
            <li>• Enable browser notifications to receive automatic deadline reminders while StudyOS remains open.</li>
            <li>• This local-only app stores data in SQLite and persists across refreshes and restarts.</li>
            <li>• Academic sources are labeled as search links when public APIs are not configured.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

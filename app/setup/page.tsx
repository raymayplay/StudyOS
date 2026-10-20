export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-12">
      <section className="card w-full rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">One-time setup</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Secure StudyOS before use</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">StudyOS requires a password and a signing secret before it can open. Add these values to <code className="text-violet-200">.env.local</code> in the project folder, then restart the app.</p>
        <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs leading-6 text-slate-200">{`STUDYOS_PASSWORD=choose-a-long-unique-password\nSTUDYOS_SESSION_SECRET=at-least-32-random-characters`}</pre>
        <p className="mt-4 text-xs leading-5 text-slate-400">Generate a signing secret with <code>openssl rand -base64 32</code>. Keep both values private. Restart StudyOS after saving them.</p>
      </section>
    </main>
  );
}

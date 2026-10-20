import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5 py-12">
      <section className="card w-full rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">StudyOS / Private workspace</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Enter your StudyOS password to open your academic workspace.</p>
        <LoginForm />
      </section>
    </main>
  );
}

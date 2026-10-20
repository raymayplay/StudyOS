"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/session-actions";

export function LoginForm() {
  const [message, action, pending] = useActionState(loginAction, "");

  return (
    <form action={action} className="mt-6 space-y-4">
      <label htmlFor="studyos-password" className="block text-sm font-medium text-slate-200">Password</label>
      <input
        id="studyos-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={1024}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-white placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-violet-400"
        aria-describedby={message ? "login-message" : undefined}
      />
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {message && <p id="login-message" role="alert" className="text-sm text-rose-200">{message}</p>}
    </form>
  );
}

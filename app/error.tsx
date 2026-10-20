"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("StudyOS page error:", error); }, [error]);
  return <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center">
    <TriangleAlert className="h-8 w-8 text-amber-300" aria-hidden="true" />
    <h1 className="mt-4 text-2xl font-semibold text-white">This page hit a problem</h1>
    <p role="alert" className="mt-2 text-sm leading-6 text-slate-400">StudyOS could not finish loading this page. Retry, or return to the dashboard and try again.</p>
    <button type="button" onClick={reset} className="mt-5 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400">Try again</button>
  </main>;
}

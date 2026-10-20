"use client";

import { useActionState } from "react";

import { reanalyzeDocument, uploadDocument } from "@/lib/actions";

export function ResourceUploadForm({
  courses,
}: {
  courses: Array<{ id: string; name: string; code: string }>;
}) {
  const [state, action, pending] = useActionState(uploadDocument, "");

  return (
    <form action={action} className="mt-5 grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end">
      <label className="block text-sm font-medium text-slate-200">
        Course
        <select
          name="course_id"
          className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          required
          disabled={courses.length === 0 || pending}
          defaultValue=""
        >
          <option value="" disabled>Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.code} · {course.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-200">
        PDF file
        <input
          type="file"
          name="file"
          accept=".pdf,application/pdf"
          className="mt-2 block w-full rounded-xl border border-dashed border-white/20 bg-slate-950/50 p-2 text-sm text-slate-300 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-violet-100 hover:border-violet-400/50"
          required
          disabled={courses.length === 0 || pending}
        />
      </label>
      <button
        type="submit"
        disabled={courses.length === 0 || pending}
        className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:brightness-110"
      >
        {pending ? "Reading PDF…" : "Upload and analyze"}
      </button>
      {state && (
        <p role="status" aria-live="polite" className="text-sm leading-6 text-violet-200 md:col-span-3">
          {state}
        </p>
      )}
    </form>
  );
}

export function ReanalyzeDocumentForm({ documentId }: { documentId: string }) {
  const [state, action, pending] = useActionState(reanalyzeDocument, "");

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="document_id" value={documentId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/20"
      >
        {pending ? "Reading and analyzing…" : "Retry PDF and AI analysis"}
      </button>
      {state && <p role="status" aria-live="polite" className="mt-2 max-w-xl text-xs leading-5 text-violet-200">{state}</p>}
    </form>
  );
}

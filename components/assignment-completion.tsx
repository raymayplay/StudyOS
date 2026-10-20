"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";

import { setAssignmentCompletion } from "@/lib/actions";

export function AssignmentCompletion({
  id,
  title,
  completed,
}: {
  id: string;
  title: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 text-sm ${completed ? "text-emerald-300" : "text-slate-300"}`}>
      <input
        type="checkbox"
        checked={completed}
        disabled={pending}
        aria-label={`${completed ? "Mark incomplete" : "Mark complete"}: ${title}`}
        onChange={(event) => {
          const nextCompleted = event.currentTarget.checked;
          startTransition(async () => {
            await setAssignmentCompletion(id, nextCompleted);
          });
        }}
        className="peer sr-only"
      />
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
        completed
          ? "border-emerald-400 bg-emerald-500 text-slate-950"
          : "border-slate-500 bg-slate-950/70 text-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400"
      }`}>
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span>{pending ? "Saving…" : completed ? "Completed" : "Mark complete"}</span>
    </label>
  );
}

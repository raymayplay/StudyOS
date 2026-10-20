"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Bot, Mic, MicOff, Send } from "lucide-react";

import { applyTimetableChanges, proposeTimetableChanges } from "@/lib/actions";

type CourseOption = { id: string; code: string; name: string };
type Proposal = { summary: string; changes: Array<{ operation: "add" | "update" | "delete"; meetingId?: string; courseId?: string; dayOfWeek?: number; startTime?: string; endTime?: string; location?: string; instructor?: string }> };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

function parseProposal(value: string): { proposal: Proposal | null; error: string | null } {
  if (!value) return { proposal: null, error: null };
  try {
    const parsed = JSON.parse(value) as { proposal?: Proposal; error?: string };
    return { proposal: parsed.proposal ?? null, error: parsed.error ?? null };
  } catch {
    return { proposal: null, error: "The assistant returned an unreadable proposal. Please try again." };
  }
}

export function TimetableAssistant({ courses }: { courses: CourseOption[] }) {
  const [command, setCommand] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const [proposalState, proposeAction, proposing] = useActionState(proposeTimetableChanges, "");
  const [applyState, applyAction, applying] = useActionState(applyTimetableChanges, "");
  const result = useMemo(() => parseProposal(proposalState), [proposalState]);
  const courseNames = new Map(courses.map((course) => [course.id, `${course.code} · ${course.name}`]));

  function toggleVoice() {
    if (listening) {
      recognition.current?.abort();
      return;
    }
    const speechWindow = window as typeof window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage("Voice input is not supported in this browser. Use Chrome or type your command.");
      return;
    }
    const next = new SpeechRecognition();
    next.lang = "en-US";
    next.continuous = false;
    next.interimResults = false;
    next.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setCommand(transcript);
    };
    next.onerror = (event) => setVoiceMessage(`Voice input could not start: ${event.error}.`);
    next.onend = () => setListening(false);
    recognition.current = next;
    setVoiceMessage("Listening… Speak a timetable command.");
    setListening(true);
    next.start();
  }

  return <section className="card rounded-3xl p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-200"><Bot className="h-5 w-5" /></div>
      <div>
        <h2 className="text-lg font-semibold text-white">AI timetable assistant</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">Ask for a correction such as “Move DATA100 to Tuesday 10:40–12:10 in C203” or “Remove the Friday seminar.” Review the proposal before applying it.</p>
      </div>
    </div>
    <form action={proposeAction} className="mt-4">
      <label className="block text-sm font-medium text-slate-200">Timetable command
        <textarea name="command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Move my Tuesday class to 10:40–12:10" className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white placeholder:text-slate-500" required />
      </label>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="submit" disabled={proposing || !command.trim()} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"><Send className="h-4 w-4" />{proposing ? "Checking…" : "Review change"}</button>
        <button type="button" onClick={toggleVoice} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5">{listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{listening ? "Stop listening" : "Voice command"}</button>
      </div>
    </form>
    {voiceMessage && <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-300">{voiceMessage}</p>}
    {result.error && <p role="alert" className="mt-3 text-sm text-amber-200">{result.error}</p>}
    {result.proposal && <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/5 p-4">
      <p className="font-medium text-white">Proposed: {result.proposal.summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {result.proposal.changes.map((change, index) => <li key={`${change.operation}-${change.meetingId || change.courseId}-${index}`} className="rounded-xl border border-white/10 px-3 py-2">
          <span className="font-semibold capitalize text-violet-200">{change.operation}</span>{" "}
          {change.courseId ? courseNames.get(change.courseId) || "Selected course" : "class meeting"}
          {change.dayOfWeek !== undefined && ` · day ${change.dayOfWeek}`}{change.startTime && ` · ${change.startTime}–${change.endTime}`}{change.location && ` · ${change.location}`}
        </li>)}
      </ul>
      <form action={applyAction} className="mt-4">
        <input type="hidden" name="proposal" value={JSON.stringify(result.proposal)} />
        <button type="submit" disabled={applying} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">{applying ? "Applying…" : "Apply proposal"}</button>
      </form>
    </div>}
    {applyState && <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-200">{applyState}</p>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Voice transcription is provided by your browser. Some browsers use an online speech service; the assistant only receives the resulting text command.</p>
  </section>;
}

"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { generateDocumentNotes, saveDocumentNotes } from "@/lib/actions";

type DocumentQuestion = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
};

type DocumentReaderProps = {
  documentId: string;
  fileName: string;
  extractedText: string;
  notes: string;
  questions: DocumentQuestion[];
  aiAvailable: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400 focus:outline-none";

export function DocumentReader({
  documentId,
  fileName,
  extractedText,
  notes,
  questions,
  aiAvailable,
}: DocumentReaderProps) {
  const [selectedPassage, setSelectedPassage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const router = useRouter();
  const [notesState, notesAction, isDrafting] = useActionState(generateDocumentNotes, "");
  const [saveState, saveAction, isSaving] = useActionState(saveDocumentNotes, "");

  function captureSelection() {
    const selection = window.getSelection()?.toString().trim() || "";
    if (selection) setSelectedPassage(selection.slice(0, 3000));
  }

  function askAboutSelection() {
    if (!selectedPassage) return;
    setQuestion("Explain this selected passage in simple terms.");
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const questionText = question.trim();
    if (!questionText || isAnswering) return;

    setIsAnswering(true);
    setAnswer("");
    setAnswerError("");
    try {
      const response = await fetch("/api/ai/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, question: questionText, sourceExcerpt: selectedPassage }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || `AI request failed (HTTP ${response.status}).`);
      }
      if (!response.body) throw new Error("The AI response stream did not start.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;
      function processEvent(block: string) {
        const lines = block.split("\n");
        const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (!data) return;
        const payload = JSON.parse(data) as { text?: string; error?: string };
        if (eventName === "token" && payload.text) setAnswer((current) => current + payload.text);
        if (eventName === "error") throw new Error(payload.error || "The AI response was interrupted.");
        if (eventName === "done") completed = true;
      }

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
        let boundary = buffer.indexOf("\n\n");
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          processEvent(block);
          boundary = buffer.indexOf("\n\n");
        }
        if (done) break;
      }
      if (!completed) throw new Error("The AI response ended before it was saved. Please retry.");
      router.refresh();
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : "Could not get an AI answer. Please retry.");
    } finally {
      setIsAnswering(false);
    }
  }

  const readableText = extractedText.trim();

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Smart reader</p>
          <p className="mt-1 text-xs text-slate-400">Select a passage or ask about the whole PDF.</p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
          {readableText ? `${readableText.split(/\s+/).length.toLocaleString()} words` : "No extracted text"}
        </span>
      </div>

      <div className="grid min-h-[32rem] lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <article
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
          className="max-h-[42rem] overflow-y-auto border-b border-white/10 p-5 text-[15px] leading-7 text-slate-200 selection:bg-violet-400/40 lg:border-b-0 lg:border-r lg:border-white/10"
        >
          {readableText ? (
            <div className="whitespace-pre-wrap">{readableText}</div>
          ) : (
            <p className="text-sm leading-6 text-amber-200">
              This PDF has no readable extracted text. If it contains scanned pages, OCR is needed before the reader can analyze them.
            </p>
          )}
        </article>

        <aside className="flex max-h-[42rem] flex-col gap-5 overflow-y-auto p-4">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-white">Ask about this document</h4>
              {selectedPassage && (
                <button
                  type="button"
                  onClick={askAboutSelection}
                  className="text-xs font-medium text-violet-300 hover:text-violet-200"
                >
                  Explain selection
                </button>
              )}
            </div>
            {selectedPassage && (
              <blockquote className="mt-3 line-clamp-4 rounded-xl border-l-2 border-violet-400 bg-violet-500/5 px-3 py-2 text-xs leading-5 text-slate-300">
                “{selectedPassage}”
              </blockquote>
            )}
            <form onSubmit={submitQuestion} aria-busy={isAnswering} className="mt-3 space-y-2">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                aria-label="Question about the selected document"
                placeholder={aiAvailable ? "Ask for an explanation, definition, or key point…" : "Configure your AI provider to ask questions"}
                className={`${inputClassName} min-h-20 resize-y`}
                required
                disabled={!aiAvailable || !readableText || isAnswering}
              />
              <div className="flex flex-wrap gap-2">
                {["Explain simply", "Key points", "Define a term"].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!aiAvailable || !readableText}
                    onClick={() =>
                      setQuestion(
                        prompt === "Explain simply"
                          ? "Explain the main idea in simple terms."
                          : prompt === "Key points"
                            ? "What are the most important key points?"
                            : "Define the main terms used in the document.",
                      )
                    }
                    className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300 hover:border-violet-400/50 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!aiAvailable || !readableText || isAnswering}
                className="w-full rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                {isAnswering ? "Asking…" : "Ask using document"}
              </button>
              {answer && (
                <article aria-live="polite" className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <p className="text-xs font-semibold text-violet-200">{isAnswering ? "Answering…" : "Answer"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-200">{answer}</p>
                </article>
              )}
              {answerError && <p role="alert" className="text-xs leading-5 text-rose-200">{answerError}</p>}
            </form>

            {questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {questions.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-xs font-semibold text-white">{entry.question}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-300">{entry.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Study notes</h4>
                <p className="mt-1 text-xs text-slate-400">Draft from the PDF, edit, then save.</p>
              </div>
              <form action={notesAction}>
                <input type="hidden" name="document_id" value={documentId} />
                <button
                  type="submit"
                  disabled={!aiAvailable || !readableText || isDrafting}
                  className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
                >
                  {isDrafting ? "Drafting…" : "Draft notes"}
                </button>
              </form>
            </div>
            {notesState && <p aria-live="polite" className="mt-2 text-xs text-violet-200">{notesState}</p>}
            <form action={saveAction} className="mt-3 space-y-2">
              <input type="hidden" name="document_id" value={documentId} />
              <textarea
                name="notes"
                defaultValue={notes}
                key={`${documentId}-${notes}`}
                placeholder={`## ${fileName}\n\nWrite or draft study notes here…`}
                className={`${inputClassName} min-h-56 resize-y font-mono text-xs leading-5`}
              />
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isSaving ? "Saving…" : "Save notes"}
              </button>
              {saveState && <p aria-live="polite" className="text-xs text-violet-200">{saveState}</p>}
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}

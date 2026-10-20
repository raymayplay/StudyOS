"use client";

import { useActionState } from "react";
import { ArrowUpRight, PlayCircle, Sparkles } from "lucide-react";

import {
  generateLibraryVideoRecommendations,
  type LibraryVideoRecommendationsState,
} from "@/lib/actions";

const initialState: LibraryVideoRecommendationsState = {
  recommendations: [],
  documentsRead: 0,
  error: "",
};

export function LibraryVideoRecommendations({ pdfCount }: { pdfCount: number }) {
  const [state, action, pending] = useActionState(generateLibraryVideoRecommendations, initialState);

  return (
    <section className="card rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            <Sparkles className="h-4 w-4" /> Local AI learning guide
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">Learn across your whole PDF library</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Your selected AI provider reads the extracted text from every PDF, finds connected topics, then builds focused YouTube lesson searches from those topics.
          </p>
        </div>
        <form action={action}>
          <button
            type="submit"
            disabled={pending || pdfCount === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:brightness-110"
          >
            <Sparkles className="h-4 w-4" />
            {pending ? "Reading all PDFs…" : "Recommend YouTube lessons"}
          </button>
        </form>
      </div>

      {pdfCount === 0 && (
        <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-400">
          Upload a PDF to generate recommendations for the topics in your library.
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3 text-sm leading-6 text-amber-100">
          {state.error}
        </p>
      )}

      {state.recommendations.length > 0 && (
        <div className="mt-5">
          <p role="status" className="mb-3 text-xs text-slate-400">
            Generated from {state.documentsRead} {state.documentsRead === 1 ? "PDF" : "PDFs"}. Links open YouTube search results for each AI-selected topic.
          </p>
          <ul className="grid gap-3 lg:grid-cols-2">
            {state.recommendations.map((recommendation) => {
              const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recommendation.searchQuery)}`;
              return (
                <li key={`${recommendation.topic}-${recommendation.searchQuery}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-white">{recommendation.topic}</h4>
                      <p className="mt-1 text-sm leading-5 text-slate-400">{recommendation.reason}</p>
                    </div>
                    <PlayCircle className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    From: {recommendation.sourceDocuments.join(", ")}
                  </p>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
                  >
                    Find lessons: {recommendation.searchQuery}
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

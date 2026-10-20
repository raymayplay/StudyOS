"use client";

import { useSyncExternalStore } from "react";
import { RefreshCw, Server } from "lucide-react";

type AIStatusData = {
  provider: string;
  connected: boolean;
  model: string;
  modelAvailable: boolean;
  models: string[];
  error: string | null;
};

let currentStatus: AIStatusData | null = null;
let isChecking = true;
let pendingCheck: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  if (!currentStatus && !pendingCheck) void refreshAIStatus();
  return () => {
    subscribers.delete(subscriber);
  };
}

function getStatusSnapshot() {
  return currentStatus;
}

function getCheckingSnapshot() {
  return isChecking;
}

function getServerStatusSnapshot() {
  return null;
}

function getServerCheckingSnapshot() {
  return true;
}

async function refreshAIStatus() {
  if (pendingCheck) return pendingCheck;
  isChecking = true;
  notifySubscribers();

  pendingCheck = (async () => {
    try {
      const response = await fetch("/api/ai/status", { cache: "no-store" });
      if (!response.ok) throw new Error(`Status check failed (HTTP ${response.status}).`);
      currentStatus = await response.json() as AIStatusData;
    } catch (error) {
      currentStatus = {
        connected: false,
        provider: "ollama",
        model: "qwen2.5:3b",
        modelAvailable: false,
        models: [],
        error: error instanceof Error ? error.message : "Could not check the AI provider configuration.",
      };
    } finally {
      isChecking = false;
      pendingCheck = null;
      notifySubscribers();
    }
  })();

  return pendingCheck;
}

export function AIStatus() {
  const status = useSyncExternalStore(subscribe, getStatusSnapshot, getServerStatusSnapshot);
  const checking = useSyncExternalStore(subscribe, getCheckingSnapshot, getServerCheckingSnapshot);

  const ready = Boolean(status?.connected && status.modelAvailable);

  return (
    <section className="card rounded-3xl p-5" aria-live="polite">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            ready ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"
          }`}>
            <Server className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">Selected AI provider</p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {checking
                ? `Checking ${status?.provider ?? "provider"}…`
                : ready
                  ? status?.provider === "ollama" ? `${status.model} is ready` : `${status?.provider} is configured`
                  : `${status?.provider ?? "AI provider"} needs attention`}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              {checking
                ? "Checking the selected provider configuration."
                : ready && status?.provider === "ollama"
                  ? `Requests run on this computer with ${status.model}. No API key is needed.`
                  : ready
                    ? `The ${status?.provider} API key is configured. StudyOS sends prompts to that provider when you request AI help; the key stays on the server.`
                    : status?.error}
            </p>
            {!checking && status?.connected && !status.modelAvailable && status.models.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">Installed models: {status.models.join(", ")}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refreshAIStatus()}
          disabled={checking}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-violet-400/40 hover:bg-white/[0.04]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          Check connection
        </button>
      </div>
      {!checking && !ready && status?.provider === "ollama" && (
        <p className="mt-4 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-3 text-xs leading-5 text-slate-300">
          Start the Ollama desktop app. If the model is missing, run <code className="rounded bg-slate-800 px-1.5 py-0.5 text-violet-200">ollama pull {status?.model || "qwen2.5:3b"}</code> in a terminal, then check again.
        </p>
      )}
    </section>
  );
}

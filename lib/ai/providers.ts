import "server-only";

export type AIProviderName = "ollama" | "openai" | "anthropic" | "gemini";
export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export type AIStatusData = {
  provider: string;
  model: string;
  connected: boolean;
  modelAvailable: boolean;
  models: string[];
  error: string | null;
};

export type AIProviderAdapter = {
  name: AIProviderName;
  model: string;
  generate(messages: AIMessage[], json: boolean): Promise<string>;
};

const providerNames: AIProviderName[] = ["ollama", "openai", "anthropic", "gemini"];

export function getAIConfig() {
  const provider = (process.env.AI_PROVIDER?.trim().toLowerCase() || "ollama") as AIProviderName;
  const model = provider === "openai"
      ? process.env.OPENAI_MODEL?.trim() || "gpt-5.4-mini"
    : provider === "anthropic"
      ? process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-5-5"
      : provider === "gemini"
        ? process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash"
        : process.env.OLLAMA_MODEL?.trim() || "qwen2.5:3b";
  const endpoint = provider === "ollama"
    ? (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/+$/, "")
    : "";
  return { provider, model, endpoint };
}

function getApiKey(provider: AIProviderName) {
  return provider === "openai"
    ? process.env.OPENAI_API_KEY?.trim()
    : provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY?.trim()
      : provider === "gemini"
        ? process.env.GEMINI_API_KEY?.trim()
        : undefined;
}

function requiredKeyName(provider: AIProviderName) {
  return provider === "openai" ? "OPENAI_API_KEY" : provider === "anthropic" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY";
}

function configValue(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), minimum), maximum) : fallback;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  provider: string,
  overrides: { timeoutMs?: number; maxRetries?: number } = {},
) {
  const timeoutMs = overrides.timeoutMs ?? configValue(process.env.AI_REQUEST_TIMEOUT_MS, 120_000, 5_000, 600_000);
  const maxRetries = overrides.maxRetries ?? configValue(process.env.AI_MAX_RETRIES, 2, 0, 5);
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (response.ok) return response;
      if (response.status < 500 && response.status !== 429) {
        const hint = response.status === 401 || response.status === 403 ? " Check the provider API key." : "";
        throw new Error(`${provider} returned HTTP ${response.status}.${hint}`);
      }
      lastError = new Error(`${provider} returned HTTP ${response.status}.`);
    } catch (error) {
      if (error instanceof Error && /^\w+ returned HTTP \d+/.test(error.message)) throw error;
      lastError = error;
    }

    if (attempt < maxRetries) await new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** attempt, 2_000)));
  }

  if (lastError instanceof Error && lastError.name === "TimeoutError") {
    throw new Error(`${provider} did not respond within ${timeoutMs / 1000} seconds. Try again or choose a faster model.`);
  }
  throw new Error(`Could not reach ${provider} after ${maxRetries + 1} attempts. Check its service and network connection.`);
}

async function parseJsonResponse(response: Response, provider: string) {
  try {
    return await response.json() as unknown;
  } catch {
    throw new Error(`${provider} returned an unreadable response.`);
  }
}

function readOpenAIText(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("choices" in payload) || !Array.isArray(payload.choices)) return "";
  const first = payload.choices[0];
  return typeof first === "object" && first !== null && "message" in first && typeof first.message === "object" && first.message !== null && "content" in first.message && typeof first.message.content === "string"
    ? first.message.content.trim()
    : "";
}

function readAnthropicText(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("content" in payload) || !Array.isArray(payload.content)) return "";
  return payload.content.flatMap((item: unknown) => typeof item === "object" && item !== null && "type" in item && item.type === "text" && "text" in item && typeof item.text === "string" ? [item.text] : []).join("").trim();
}

function readGeminiText(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("candidates" in payload) || !Array.isArray(payload.candidates)) return "";
  const first = payload.candidates[0];
  if (typeof first !== "object" || first === null || !("content" in first) || typeof first.content !== "object" || first.content === null || !("parts" in first.content) || !Array.isArray(first.content.parts)) return "";
  return first.content.parts.flatMap((part: unknown) => typeof part === "object" && part !== null && "text" in part && typeof part.text === "string" ? [part.text] : []).join("").trim();
}

async function ollamaCompletion(messages: AIMessage[], json: boolean, model: string, endpoint: string) {
  let response: Response;
  try {
    response = await fetchWithRetry(`${endpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...(json ? { format: "json" } : {}),
        options: { temperature: 0.2, num_ctx: 8192, num_predict: 3000 },
        keep_alive: "10m",
      }),
    }, "ollama");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not reach ollama")) {
      throw new Error(`Ollama is unavailable at ${endpoint}. Start the Ollama app and try again.`);
    }
    throw error;
  }
  const payload = await parseJsonResponse(response, "Ollama");
  if (typeof payload !== "object" || payload === null || !("message" in payload) || typeof payload.message !== "object" || payload.message === null || !("content" in payload.message) || typeof payload.message.content !== "string") return "";
  return payload.message.content.trim();
}

async function openAICompletion(messages: AIMessage[], json: boolean, model: string) {
  const apiKey = getApiKey("openai");
  if (!apiKey) throw new Error("OpenAI is selected, but OPENAI_API_KEY is missing from .env.local.");
  const response = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, ...(json ? { response_format: { type: "json_object" } } : {}) }),
  }, "OpenAI");
  return readOpenAIText(await parseJsonResponse(response, "OpenAI"));
}

async function anthropicCompletion(messages: AIMessage[], json: boolean, model: string) {
  const apiKey = getApiKey("anthropic");
  if (!apiKey) throw new Error("Anthropic is selected, but ANTHROPIC_API_KEY is missing from .env.local.");
  const system = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: `${system}${json ? "\nReturn only valid JSON without Markdown fences." : ""}`,
      messages: messages.filter((message) => message.role !== "system"),
    }),
  }, "Anthropic");
  return readAnthropicText(await parseJsonResponse(response, "Anthropic"));
}

async function geminiCompletion(messages: AIMessage[], json: boolean, model: string) {
  const apiKey = getApiKey("gemini");
  if (!apiKey) throw new Error("Gemini is selected, but GEMINI_API_KEY is missing from .env.local.");
  const systemInstruction = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
      generationConfig: { temperature: 0.2, ...(json ? { responseMimeType: "application/json" } : {}) },
    }),
  }, "Gemini");
  return readGeminiText(await parseJsonResponse(response, "Gemini"));
}

export function getAIProviderAdapter(): AIProviderAdapter {
  const config = getAIConfig();
  if (!providerNames.includes(config.provider)) {
    throw new Error(`Unsupported AI_PROVIDER "${config.provider}". Choose ollama, openai, anthropic, or gemini.`);
  }
  const name = config.provider;
  return {
    name,
    model: config.model,
    generate: (messages, json) => name === "ollama"
      ? ollamaCompletion(messages, json, config.model, config.endpoint)
      : name === "openai"
        ? openAICompletion(messages, json, config.model)
        : name === "anthropic"
          ? anthropicCompletion(messages, json, config.model)
          : geminiCompletion(messages, json, config.model),
  };
}

export async function generateCompletion(messages: AIMessage[], json = false) {
  const result = await getAIProviderAdapter().generate(messages, json);
  if (!result) throw new Error(`${getAIConfig().provider} returned an empty response. Try again or select a different model.`);
  return result;
}

export async function getAIStatus(): Promise<AIStatusData> {
  const config = getAIConfig();
  if (!providerNames.includes(config.provider)) {
    return { provider: config.provider, model: config.model, connected: false, modelAvailable: false, models: [], error: `Unsupported AI_PROVIDER "${config.provider}". Choose ollama, openai, anthropic, or gemini.` };
  }
  if (config.provider !== "ollama") {
    const apiKey = getApiKey(config.provider);
    if (!apiKey) {
      const variable = requiredKeyName(config.provider);
      return { provider: config.provider, model: config.model, connected: false, modelAvailable: false, models: [], error: `${variable} is missing from .env.local.` };
    }
    return { provider: config.provider, model: config.model, connected: true, modelAvailable: true, models: [], error: "API key is configured. Provider availability is checked when you make a request." };
  }

  try {
    const response = await fetchWithRetry(`${config.endpoint}/api/tags`, {}, "ollama", { timeoutMs: 3_000, maxRetries: 0 });
    const payload: unknown = await parseJsonResponse(response, "Ollama");
    const models = typeof payload === "object" && payload !== null && "models" in payload && Array.isArray(payload.models)
      ? payload.models.flatMap((item) => typeof item === "object" && item !== null && "name" in item && typeof item.name === "string" ? [item.name] : [])
      : [];
    const modelAvailable = models.some((installed) => installed === config.model || installed.startsWith(`${config.model}:`));
    return { provider: config.provider, model: config.model, connected: true, modelAvailable, models, error: modelAvailable ? null : `Model "${config.model}" is not installed.` };
  } catch (error) {
    return {
      provider: config.provider,
      model: config.model,
      connected: false,
      modelAvailable: false,
      models: [],
      error: error instanceof Error && error.message.startsWith("Could not reach ollama")
        ? `Ollama is not responding at ${config.endpoint}. Start the Ollama app and try again.`
        : error instanceof Error ? error.message : "Could not check the Ollama connection.",
    };
  }
}

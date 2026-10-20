type RateLimitEntry = { count: number; resetAt: number };
type RateLimitStore = typeof globalThis & { __studyOSRateLimits?: Map<string, RateLimitEntry> };

const store = globalThis as RateLimitStore;
const entries = (store.__studyOSRateLimits ??= new Map());

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  let entry = entries.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    entries.set(key, entry);
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  if (entries.size > 1000) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export function enforceRateLimit(key: string) {
  const limit = Number(process.env.AI_RATE_LIMIT_MAX || 20);
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60_000);
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error(`StudyOS is receiving too many AI requests. Please try again in ${result.retryAfterSeconds} seconds.`);
  }
}

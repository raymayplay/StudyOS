import { getAIStatus } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const rateLimit = checkRateLimit("ai-status", 60, 60_000);
  if (!rateLimit.allowed) {
    return Response.json({ error: "Status checks are temporarily rate limited." }, {
      status: 429,
      headers: { "Cache-Control": "no-store", "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }
  return Response.json(await getAIStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}

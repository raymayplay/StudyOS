import { getAIStatus } from "@/lib/ai";
import { hasValidSession } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth-crypto";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await hasValidSession(request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`))?.slice(SESSION_COOKIE_NAME.length + 1)))) {
    return Response.json({ error: "Sign in to use StudyOS." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
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

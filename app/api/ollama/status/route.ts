import { getOllamaStatus } from "@/lib/ollama";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getOllamaStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}

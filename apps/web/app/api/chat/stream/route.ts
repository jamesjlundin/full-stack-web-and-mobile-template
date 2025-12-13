import { streamChat } from "@acme/ai";
import { createRateLimiter } from "@acme/security";
import { NextRequest } from "next/server";

import { withRateLimit } from "../../_lib/withRateLimit";

// Rate limiter: 10 requests per 60 seconds per IP
const chatStreamLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

async function handleRequest(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const promptFromQuery = searchParams.get("prompt");

  let prompt = promptFromQuery ?? "";

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (body && typeof body.prompt === "string") {
      prompt = body.prompt;
    }
  }

  return streamChat({ prompt });
}

export const GET = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);
export const POST = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);

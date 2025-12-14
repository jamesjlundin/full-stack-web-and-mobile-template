import {
  streamChat,
  selectPrompt,
  configureAjv,
  buildVersionMeta,
  attachVersionHeaders,
  schemas,
} from "@acme/ai";
import { createRateLimiter } from "@acme/security";
import { NextRequest } from "next/server";

import { withRateLimit } from "../../_lib/withRateLimit";

// Rate limiter: 10 requests per 60 seconds per IP
const chatStreamLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

// Initialize Ajv with compiled validators (ok if not used yet, ready for future validation)
const ajvConfig = configureAjv();
const _chatResponseValidator = ajvConfig.getValidator("chatResponse");

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

  // Resolve active prompt for the chat feature
  const activePrompt = selectPrompt("chat");

  // Build version metadata for logging and headers
  const versionMeta = buildVersionMeta({
    prompt_id: activePrompt.id,
    prompt_version: activePrompt.version,
    schema_id: schemas.chatResponse.id,
    schema_version: schemas.chatResponse.version,
    rag_config_version: null, // Will be set when RAG is implemented (Step 26)
    embed_model: process.env.AI_MODEL || undefined,
  });

  // Log version metadata alongside the request
  console.log("[chat/stream] Request received", {
    ...versionMeta,
    model: process.env.AI_MODEL || "gpt-4o-mini",
    prompt_length: prompt.length,
  });

  // Stream the chat response with the active system prompt
  const response = await streamChat({
    prompt,
    systemPrompt: activePrompt.content,
  });

  // Attach version headers to the response (additive, does not alter streaming)
  return attachVersionHeaders(response, versionMeta);
}

export const GET = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);
export const POST = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);

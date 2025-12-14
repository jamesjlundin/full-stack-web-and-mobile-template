import {
  streamChat,
  selectPrompt,
  configureAjv,
  buildVersionMeta,
  attachVersionHeaders,
  schemas,
} from "@acme/ai";
import { withTrace, logLlmCall } from "@acme/obs";
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

// Default model and provider configuration
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_PROVIDER = "openai";

async function handleRequest(request: NextRequest) {
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const provider = DEFAULT_PROVIDER;

  // Wrap the entire request handling in a trace
  const { result: response, error, ctx } = await withTrace(
    "chat.stream",
    async (traceCtx) => {
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
        embed_model: model,
      });

      // Record LLM call start time
      const llmStartedAt = Date.now();

      // Stream the chat response with the active system prompt
      const streamResponse = await streamChat({
        prompt,
        systemPrompt: activePrompt.content,
      });

      // Record LLM call end time
      const llmFinishedAt = Date.now();

      // Log the LLM call with version metadata
      // Note: Token counts are not available from streaming responses without parsing
      // They will be undefined here but can be populated if the response includes usage
      await logLlmCall({
        provider,
        model,
        startedAt: llmStartedAt,
        finishedAt: llmFinishedAt,
        promptVersion: versionMeta.prompt_version,
        schemaVersion: versionMeta.schema_version,
        ragConfigVersion: versionMeta.rag_config_version,
        embedModel: versionMeta.embed_model,
        // embedDims: undefined - will be set when RAG is implemented
        // retrievedChunksCount: undefined - will be set when RAG is implemented
        // toolCallsCount: undefined - will be set when tools are invoked
        traceId: traceCtx.traceId,
      });

      // Attach version headers to the response (additive, does not alter streaming)
      return attachVersionHeaders(streamResponse, versionMeta);
    }
  );

  // If an error occurred during tracing, log it and re-throw
  if (error) {
    await logLlmCall({
      provider,
      model,
      startedAt: ctx.startMs,
      finishedAt: Date.now(),
      error: error.message,
      traceId: ctx.traceId,
    });
    throw error;
  }

  return response!;
}

export const GET = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);
export const POST = withRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);

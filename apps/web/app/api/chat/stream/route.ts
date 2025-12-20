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

import { withUserRateLimit } from "../../_lib/withUserRateLimit";

import type { CurrentUserResult } from "@acme/auth";

// Rate limiter: 10 requests per 60 seconds per user
const chatStreamLimiter = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});

// Initialize Ajv with compiled validators (ok if not used yet, ready for future validation)
const ajvConfig = configureAjv();
const _chatResponseValidator = ajvConfig.getValidator("chatResponse");

async function handleRequest(
  request: NextRequest,
  _user: NonNullable<CurrentUserResult>
) {
  // Parse request body for provider/model selection
  let requestProvider: string | undefined;
  let requestModel: string | undefined;
  let prompt = "";

  const { searchParams } = request.nextUrl;
  const promptFromQuery = searchParams.get("prompt");
  prompt = promptFromQuery ?? "";

  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (body) {
      if (typeof body.prompt === "string") {
        prompt = body.prompt;
      }
      if (typeof body.provider === "string") {
        requestProvider = body.provider;
      }
      if (typeof body.model === "string") {
        requestModel = body.model;
      }
    }
  }

  // Track provider/model used for logging (will be set after streamChat)
  let usedProvider = "mock";
  let usedModel = "mock";

  // Wrap the entire request handling in a trace
  const { result: response, error, ctx } = await withTrace(
    "chat.stream",
    async (traceCtx) => {
      // Resolve active prompt for the chat feature
      const activePrompt = selectPrompt("chat");

      // Record LLM call start time
      const llmStartedAt = Date.now();

      // Stream the chat response with the active system prompt
      const streamResult = await streamChat({
        prompt,
        systemPrompt: activePrompt.content,
        provider: requestProvider,
        model: requestModel,
      });

      // Capture the actual provider/model used
      usedProvider = streamResult.provider;
      usedModel = streamResult.model;

      // Build version metadata for logging and headers
      const versionMeta = buildVersionMeta({
        prompt_id: activePrompt.id,
        prompt_version: activePrompt.version,
        schema_id: schemas.chatResponse.id,
        schema_version: schemas.chatResponse.version,
        rag_config_version: null, // Will be set when RAG is implemented (Step 26)
        embed_model: usedModel,
      });

      // Record LLM call end time
      const llmFinishedAt = Date.now();

      // Log the LLM call with version metadata
      // Note: Token counts are not available from streaming responses without parsing
      // They will be undefined here but can be populated if the response includes usage
      await logLlmCall({
        provider: usedProvider,
        model: usedModel,
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
      return attachVersionHeaders(streamResult.response, versionMeta);
    }
  );

  // If an error occurred during tracing, log it and re-throw
  if (error) {
    await logLlmCall({
      provider: usedProvider,
      model: usedModel,
      startedAt: ctx.startMs,
      finishedAt: Date.now(),
      error: error.message,
      traceId: ctx.traceId,
    });
    throw error;
  }

  return response!;
}

export const GET = withUserRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);
export const POST = withUserRateLimit("/api/chat/stream", chatStreamLimiter, handleRequest);

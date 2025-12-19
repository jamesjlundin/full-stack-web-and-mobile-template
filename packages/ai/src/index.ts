import { streamText } from "ai";

// Re-export version and routing utilities
export { selectPrompt, listFeatures, listChannels } from "./router";
export {
  buildVersionMeta,
  attachVersionHeaders,
  extractVersionHeaders,
  VERSION_HEADERS,
  type VersionMeta,
  type BuildVersionMetaArgs,
} from "./versions";
export { configureAjv, type AjvConfig, type SchemaValidator, type ValidatorResult } from "./ajv";
export { schemas, type SchemaInfo, type SchemaKey } from "./schemas/index";
export type { PromptDef } from "./prompts/types";

// Re-export provider utilities
export {
  getModel,
  getAvailableProviders,
  getDefaultProvider,
  getProviderConfig,
  isProviderAvailable,
  validateProviderModel,
  type ProviderId,
  type ProviderConfig,
  type ModelInfo,
} from "./providers";

import {
  getModel,
  getDefaultProvider,
  validateProviderModel,
  type ProviderId,
} from "./providers";

type StreamChatParams = {
  prompt: string;
  systemPrompt?: string;
  provider?: ProviderId;
  model?: string;
};

type StreamChatResult = Promise<Response>;

const MOCK_TOKENS = [
  "Hello",
  ", ",
  "this ",
  "is ",
  "a ",
  "mock ",
  "stream.",
];

function buildHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
}

async function createMockStreamResponse(): StreamChatResult {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of MOCK_TOKENS) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "text", text: token })}\n\n`),
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, { headers: buildHeaders() });
}

async function createProviderStreamResponse(
  prompt: string,
  systemPrompt?: string,
  providerId?: ProviderId,
  modelId?: string,
): StreamChatResult {
  // Determine provider - use specified, or fall back to default
  const defaultProvider = getDefaultProvider();

  if (!providerId && !defaultProvider) {
    return createMockStreamResponse();
  }

  const targetProvider = providerId ?? defaultProvider!.id;

  // Validate provider/model combination
  const validation = validateProviderModel(targetProvider, modelId);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const messages: Array<{ role: "system" | "user"; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const model = getModel(validation.providerId, validation.modelId);

  const result = await streamText({
    model,
    messages,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", text: part.text })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, { headers: buildHeaders() });
}

export async function streamChat({
  prompt,
  systemPrompt,
  provider,
  model,
}: StreamChatParams): StreamChatResult {
  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  return createProviderStreamResponse(prompt, systemPrompt, provider, model);
}

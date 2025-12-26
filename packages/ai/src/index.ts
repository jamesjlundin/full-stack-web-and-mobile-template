import { streamText } from "ai";

import { getModel, validateProviderModel, type ProviderId } from "./providers";

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
export {
  getAvailableProviders,
  getDefaultProvider,
  getModel,
  isProviderAvailable,
  validateProviderModel,
  type ModelInfo,
  type ProviderConfig,
  type ProviderId,
} from "./providers";
export {
  generateImageToolDef,
  generateImageToolSchema,
  executeGenerateImage,
  type GenerateImageInput,
  type GenerateImageResult,
} from "./tools";

type StreamChatParams = {
  prompt: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
};

type StreamChatResult = {
  response: Response;
  provider: string;
  model: string;
};

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

function createMockStreamResponse(): Response {
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
  providerId: ProviderId,
  modelId: string,
  prompt: string,
  systemPrompt?: string,
): Promise<Response> {
  const languageModel = getModel(providerId, modelId);

  if (!languageModel) {
    return createMockStreamResponse();
  }

  const encoder = new TextEncoder();

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const result = await streamText({
    model: languageModel,
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
}: StreamChatParams): Promise<StreamChatResult> {
  if (!prompt) {
    return {
      response: new Response("Missing prompt", { status: 400 }),
      provider: "mock",
      model: "mock",
    };
  }

  // Validate and normalize provider/model
  const validated = validateProviderModel(provider, model);

  if (!validated) {
    // No valid provider available, use mock
    return {
      response: createMockStreamResponse(),
      provider: "mock",
      model: "mock",
    };
  }

  const response = await createProviderStreamResponse(
    validated.provider,
    validated.model,
    prompt,
    systemPrompt,
  );

  return {
    response,
    provider: validated.provider,
    model: validated.model,
  };
}

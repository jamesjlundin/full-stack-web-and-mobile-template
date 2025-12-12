import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

type StreamChatParams = {
  prompt: string;
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

const DEFAULT_MODEL = "gpt-4o-mini";

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

async function createOpenAIStreamResponse(prompt: string): StreamChatResult {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return createMockStreamResponse();
  }

  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const client = createOpenAI({ apiKey });
  const encoder = new TextEncoder();

  const result = await streamText({
    model: client(model),
    messages: [{ role: "user", content: prompt }],
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

export async function streamChat({ prompt }: StreamChatParams): StreamChatResult {
  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  return createOpenAIStreamResponse(prompt);
}

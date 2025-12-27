import {
  executeGenerateImage,
  getModel,
  selectPrompt,
  validateProviderModel,
} from "@acme/ai";
import { createRateLimiter } from "@acme/security";
import { put } from "@vercel/blob";
import { stepCountIs, streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

import { withUserRateLimit } from "../../_lib/withUserRateLimit";

import type { CurrentUserResult } from "@acme/auth";
import type { ModelMessage, ImagePart, TextPart } from "ai";

// Rate limiter: 5 requests per 24 hours per user
const agentLimiter = createRateLimiter({
  limit: 5,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
});

// Mock weather data based on city
function getMockWeather(city: string) {
  const cityLower = city.toLowerCase();
  const weatherData: Record<
    string,
    { temperature: number; conditions: string }
  > = {
    "san francisco": { temperature: 62, conditions: "Foggy" },
    "new york": { temperature: 45, conditions: "Partly cloudy" },
    "los angeles": { temperature: 75, conditions: "Sunny" },
    chicago: { temperature: 38, conditions: "Windy" },
    miami: { temperature: 82, conditions: "Humid and sunny" },
    seattle: { temperature: 52, conditions: "Rainy" },
    austin: { temperature: 78, conditions: "Clear skies" },
    denver: { temperature: 55, conditions: "Sunny with thin clouds" },
  };

  const data = weatherData[cityLower] || {
    temperature: 68,
    conditions: "Pleasant",
  };

  return {
    city,
    temperature: data.temperature,
    unit: "fahrenheit" as const,
    conditions: data.conditions,
  };
}

// Get current time for a timezone
function getMockTime(timezone?: string) {
  const tz = timezone || "UTC";
  const now = new Date();

  try {
    const time = now.toLocaleTimeString("en-US", { timeZone: tz });
    return {
      time,
      timezone: tz,
      iso: now.toISOString(),
    };
  } catch {
    // Invalid timezone, fall back to UTC
    return {
      time: now.toLocaleTimeString("en-US", { timeZone: "UTC" }),
      timezone: "UTC",
      iso: now.toISOString(),
    };
  }
}

// Message part schema for multimodal messages
const messagePartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("image"),
    url: z.string(),
    alt: z.string().optional(),
  }),
]);

// Request body schema - supports both legacy string content and new parts array
const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      // Support both legacy string content and new parts array
      content: z.string().optional(),
      parts: z.array(messagePartSchema).optional(),
    }),
  ),
  provider: z.string().optional(),
  model: z.string().optional(),
});

// Convert our message format to AI SDK CoreMessage format
function convertToAIMessages(
  messages: Array<{
    role: "user" | "assistant";
    content?: string;
    parts?: Array<{ type: "text"; text: string } | { type: "image"; url: string; alt?: string }>;
  }>
): ModelMessage[] {
  return messages.map((msg): ModelMessage => {
    // If parts array exists, use it
    if (msg.parts && msg.parts.length > 0) {
      const content: Array<TextPart | ImagePart> = msg.parts.map((part) => {
        if (part.type === "text") {
          return { type: "text" as const, text: part.text };
        } else {
          return { type: "image" as const, image: part.url };
        }
      });

      if (msg.role === "user") {
        return { role: "user" as const, content };
      } else {
        // For assistant messages with parts, convert to text-only
        // since assistant messages don't support image parts in the same way
        const textContent = msg.parts
          .filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("");
        return { role: "assistant" as const, content: textContent };
      }
    }

    // Legacy: single string content
    if (msg.role === "user") {
      return { role: "user" as const, content: msg.content || "" };
    } else {
      return { role: "assistant" as const, content: msg.content || "" };
    }
  });
}

// Generate a unique ID for blob storage
function generateBlobId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function handleRequest(
  request: NextRequest,
  _userResult: CurrentUserResult,
) {
  // Parse request body
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request body",
        details: parsed.error.issues,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages, provider: requestProvider, model: requestModel } = parsed.data;

  // Get the agent system prompt
  const activePrompt = selectPrompt("agent");

  // Validate and normalize provider/model
  const validated = validateProviderModel(requestProvider, requestModel);

  // If no valid provider available, return mock streaming response
  if (!validated) {
    return createMockStream(messages);
  }

  // Get the language model instance
  const languageModel = getModel(validated.provider, validated.model);

  // If model creation failed (shouldn't happen after validation), return mock
  if (!languageModel) {
    return createMockStream(messages);
  }

  // Convert messages to AI SDK format
  const aiMessages = convertToAIMessages(messages);

  // Stream with tools
  const result = streamText({
    model: languageModel,
    system: activePrompt.content,
    messages: aiMessages,
    tools: {
      get_weather: {
        description:
          "Get current weather for a city. Use this when users ask about weather.",
        inputSchema: z.object({
          city: z.string().describe("The city name to get weather for"),
        }),
        execute: async ({ city }: { city: string }) => getMockWeather(city),
      },
      get_time: {
        description:
          "Get current time in a timezone. Use this when users ask about time.",
        inputSchema: z.object({
          timezone: z
            .string()
            .optional()
            .describe(
              "The timezone (e.g., 'America/New_York', 'UTC'). Defaults to UTC.",
            ),
        }),
        execute: async ({ timezone }: { timezone?: string }) =>
          getMockTime(timezone),
      },
      generate_image: {
        description:
          "Generate an image from a text description. Use when the user explicitly asks for an image to be generated or when a message starts with 'Generate an image:'.",
        inputSchema: z.object({
          prompt: z.string().describe("Detailed description of the image to generate"),
          size: z
            .enum(["1024x1024", "1792x1024", "1024x1792"])
            .default("1024x1024")
            .describe("Image dimensions (square, landscape, or portrait)"),
        }),
        execute: async (input: { prompt: string; size?: "1024x1024" | "1792x1024" | "1024x1792" }) => {
          const result = await executeGenerateImage({
            prompt: input.prompt,
            size: input.size || "1024x1024",
          });

          if (!result.success) {
            return { success: false, error: result.error };
          }

          // Upload the generated image to Vercel Blob
          try {
            const imageBuffer = Buffer.from(result.imageBase64, "base64");
            const blob = await put(
              `generated/${generateBlobId()}.png`,
              imageBuffer,
              {
                access: "public",
                contentType: "image/png",
              }
            );

            return {
              success: true,
              imageUrl: blob.url,
              prompt: result.prompt,
              size: result.size,
            };
          } catch (uploadError) {
            const message = uploadError instanceof Error ? uploadError.message : "Failed to upload image";
            return { success: false, error: message };
          }
        },
      },
    },
    stopWhen: stepCountIs(5), // Allow up to 5 steps for more complex interactions
  });

  // Create SSE stream with tool events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          let event: Record<string, unknown> | null = null;

          switch (part.type) {
            case "text-delta":
              event = { type: "text", text: part.text };
              break;
            case "tool-call":
              event = {
                type: "tool_call",
                id: part.toolCallId,
                name: part.toolName,
                args: part.input,
              };
              break;
            case "tool-result":
              event = {
                type: "tool_result",
                id: part.toolCallId,
                result: part.output,
              };

              // If this was a successful image generation, also emit an image event
              if (
                part.toolName === "generate_image" &&
                part.output &&
                typeof part.output === "object" &&
                "success" in part.output &&
                part.output.success === true &&
                "imageUrl" in part.output
              ) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
                // Emit the image event
                const imageEvent = {
                  type: "image",
                  url: part.output.imageUrl,
                  alt: `Generated: ${(part.output as { prompt?: string }).prompt || "image"}`,
                };
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(imageEvent)}\n\n`),
                );
                event = null; // Already emitted
              }
              break;
          }

          if (event) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
        );
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Get text content from message (supports both legacy and new format)
function getMessageText(msg: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join(" ");
  }
  return msg.content || "";
}

// Mock streaming response when no API key is set
function createMockStream(messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>) {
  const lastMessage = getMessageText(messages[messages.length - 1] || {}).toLowerCase();
  const encoder = new TextEncoder();

  let mockResponse =
    "I'm a demo agent. In production with an OpenAI API key, I can help with weather, time queries, and image generation using tools.";

  // Check if the user asked about weather
  if (lastMessage.includes("weather")) {
    const cityMatch = lastMessage.match(
      /weather\s+(?:in|for|at)?\s*(\w+(?:\s+\w+)?)/i,
    );
    const city = cityMatch?.[1] || "San Francisco";
    const weather = getMockWeather(city);

    mockResponse = `Let me check the weather for ${city}...`;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial text
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: mockResponse })}\n\n`,
          ),
        );

        // Simulate tool call
        await new Promise((r) => setTimeout(r, 300));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call",
              id: "mock_1",
              name: "get_weather",
              args: { city },
            })}\n\n`,
          ),
        );

        // Simulate tool result
        await new Promise((r) => setTimeout(r, 500));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_result",
              id: "mock_1",
              result: weather,
            })}\n\n`,
          ),
        );

        // Send follow-up text
        await new Promise((r) => setTimeout(r, 200));
        const followUp = ` The current weather in ${weather.city} is ${weather.temperature}°F and ${weather.conditions.toLowerCase()}.`;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: followUp })}\n\n`,
          ),
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Check if the user asked about time
  if (lastMessage.includes("time")) {
    const tzMatch = lastMessage.match(
      /time\s+(?:in|for|at)?\s*(\w+(?:\/\w+)?)/i,
    );
    const timezone = tzMatch?.[1] || "UTC";
    const time = getMockTime(timezone);

    mockResponse = `Let me check the time...`;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: mockResponse })}\n\n`,
          ),
        );

        await new Promise((r) => setTimeout(r, 300));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call",
              id: "mock_2",
              name: "get_time",
              args: { timezone },
            })}\n\n`,
          ),
        );

        await new Promise((r) => setTimeout(r, 500));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_result",
              id: "mock_2",
              result: time,
            })}\n\n`,
          ),
        );

        await new Promise((r) => setTimeout(r, 200));
        const followUp = ` The current time in ${time.timezone} is ${time.time}.`;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: followUp })}\n\n`,
          ),
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Check if the user asked for image generation
  if (
    lastMessage.includes("generate an image") ||
    lastMessage.includes("create an image") ||
    lastMessage.includes("create a picture") ||
    lastMessage.includes("generate a picture") ||
    lastMessage.startsWith("/image")
  ) {
    mockResponse = `I would generate an image for you, but this requires an OpenAI API key to be configured. In production, I can create images using GPT Image 1.5.`;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_call",
              id: "mock_3",
              name: "generate_image",
              args: { prompt: lastMessage, size: "1024x1024" },
            })}\n\n`,
          ),
        );

        await new Promise((r) => setTimeout(r, 500));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "tool_result",
              id: "mock_3",
              result: { success: false, error: "Mock mode - no API key configured" },
            })}\n\n`,
          ),
        );

        await new Promise((r) => setTimeout(r, 200));
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: mockResponse })}\n\n`,
          ),
        );

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Default mock response
  const stream = new ReadableStream({
    async start(controller) {
      for (const char of mockResponse) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: char })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const POST = withUserRateLimit(
  "/api/agent/stream",
  agentLimiter,
  handleRequest,
);

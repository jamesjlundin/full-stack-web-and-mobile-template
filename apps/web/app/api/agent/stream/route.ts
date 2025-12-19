import { getModel, selectPrompt, validateProviderModel } from "@acme/ai";
import { createRateLimiter } from "@acme/security";
import { stepCountIs, streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";

import { withUserRateLimit } from "../../_lib/withUserRateLimit";

import type { CurrentUserResult } from "@acme/auth";

// Rate limiter: 20 requests per 60 seconds per user
const agentLimiter = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
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

// Request body schema
const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  provider: z.string().optional(),
  model: z.string().optional(),
});

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

  // Stream with tools
  const result = streamText({
    model: languageModel,
    system: activePrompt.content,
    messages,
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
    },
    stopWhen: stepCountIs(3), // Allow up to 3 steps (tool calls)
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

// Mock streaming response when no API key is set
function createMockStream(messages: { role: string; content: string }[]) {
  const lastMessage =
    messages[messages.length - 1]?.content.toLowerCase() || "";
  const encoder = new TextEncoder();

  let mockResponse =
    "I'm a demo agent. In production with an OpenAI API key, I can help with weather and time queries using tools.";

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

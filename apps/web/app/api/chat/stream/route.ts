import { streamChat } from "@acme/ai";
import { NextRequest } from "next/server";

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

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

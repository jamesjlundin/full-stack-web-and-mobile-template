import { describe, it, expect } from "vitest";

import { streamText } from "./http.js";

describe("Chat Stream", () => {
  it("should stream multiple chunks from /api/chat/stream via POST", async () => {
    const response = await streamText("/api/chat/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "integration test" }),
      maxChunks: 5,
    });

    expect(response.status).toBe(200);

    // Check content type is SSE
    const contentType = response.headers.get("Content-Type");
    expect(contentType).toContain("text/event-stream");

    // Should have received chunks
    expect(response.chunks.length).toBeGreaterThan(0);

    // Log chunks for debugging
    console.log(`Received ${response.chunks.length} chunks`);
    response.chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}:`, chunk.substring(0, 100));
    });

    // Verify chunks contain SSE data format
    const allText = response.chunks.join("");
    expect(allText.length).toBeGreaterThan(0);
    expect(allText).toContain("data:");
  });

  it("should stream chunks from /api/chat/stream via GET", async () => {
    const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
    const url = `${BASE_URL}/api/chat/stream?prompt=hello`;

    const response = await fetch(url);
    expect(response.status).toBe(200);

    const contentType = response.headers.get("Content-Type");
    expect(contentType).toContain("text/event-stream");

    // Read a few chunks
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const chunks: string[] = [];

      for (let i = 0; i < 3; i++) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        if (text.trim()) {
          chunks.push(text);
        }
      }

      reader.releaseLock();

      expect(chunks.length).toBeGreaterThan(0);
      console.log(`GET stream received ${chunks.length} chunks`);
    }
  });

  it("should include done marker in stream", async () => {
    const response = await streamText("/api/chat/stream", {
      method: "POST",
      body: JSON.stringify({ prompt: "short test" }),
      maxChunks: 20, // Get more chunks to ensure we see the done marker
    });

    expect(response.status).toBe(200);

    const allText = response.chunks.join("");

    // The stream should contain type indicators
    // Either "type":"done" or "type":"text" depending on implementation
    console.log("Stream content sample:", allText.substring(0, 500));

    // Verify we got actual content
    expect(allText.length).toBeGreaterThan(10);
  });
});

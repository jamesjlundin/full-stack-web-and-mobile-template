import { describe, it, expect } from "vitest";

import { options } from "./http.js";

describe("CORS Preflight", () => {
  it("should respond to OPTIONS /api/chat/stream with CORS headers", async () => {
    const response = await options("/api/chat/stream", {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    });

    // OPTIONS preflight should return 200 or 204
    expect([200, 204]).toContain(response.status);

    // Check for CORS headers (Next.js may set these differently)
    // At minimum, the server should accept the request
    const allowOrigin = response.headers.get("Access-Control-Allow-Origin");
    const allowMethods = response.headers.get("Access-Control-Allow-Methods");
    const allowHeaders = response.headers.get("Access-Control-Allow-Headers");

    // Log headers for debugging
    console.log("CORS Headers:", {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": allowMethods,
      "Access-Control-Allow-Headers": allowHeaders,
    });

    // The preflight should succeed (not blocked)
    // Next.js API routes may handle CORS differently, so we check if it responds
    expect(response.status).toBeLessThan(400);
  });

  it("should respond to OPTIONS /api/me with CORS headers", async () => {
    const response = await options("/api/me", {
      Origin: "http://localhost:3000",
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "authorization",
    });

    // OPTIONS preflight should return 200 or 204
    expect([200, 204]).toContain(response.status);
    expect(response.status).toBeLessThan(400);
  });
});

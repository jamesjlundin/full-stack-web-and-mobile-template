import { authHandler } from "@acme/auth";
import { createRateLimiter } from "@acme/security";

import { withRateLimit } from "../../../_lib/withRateLimit";

// Rate limiter: 5 requests per 60 seconds per IP
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

const routeId = "/api/auth/email-password/sign-up";

async function handleSignUp(request: Request) {
  // Rewrite the request URL to the Better Auth endpoint path
  const url = new URL(request.url);
  url.pathname = "/api/auth/sign-up/email";

  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: "half",
  } as RequestInit);

  return authHandler.POST(newRequest);
}

export const POST = withRateLimit(routeId, authLimiter, handleSignUp);

import { authHandler, getCurrentUser } from "@acme/auth";
import { createRateLimiter } from "@acme/security";
import { NextResponse } from "next/server";

import { withRateLimit } from "../../../_lib/withRateLimit";

// Rate limiter: 5 requests per 60 seconds per IP
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

const routeId = "/api/auth/email-password/sign-in";

async function handleSignIn(request: Request) {
  const isEmailVerificationRequired = !!process.env.RESEND_API_KEY;

  // Clone the request to read the body (we need the email for verification redirect)
  const clonedRequest = request.clone();
  let email: string | undefined;

  try {
    const body = await clonedRequest.json();
    email = body.email;
  } catch {
    // If we can't parse the body, let Better Auth handle the error
  }

  // Rewrite the request URL to the Better Auth endpoint path
  const url = new URL(request.url);
  url.pathname = "/api/auth/sign-in/email";

  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: "half",
  } as RequestInit);

  const response = await authHandler.POST(newRequest);

  // If sign-in failed, return the original response
  if (!response.ok) {
    return response;
  }

  // If email verification is not required, return success
  if (!isEmailVerificationRequired) {
    return NextResponse.json({ success: true, requiresVerification: false });
  }

  // Check if user is verified by getting the session from the response
  // We need to make a new request with the cookies from the response to check
  const setCookieHeader = response.headers.get("set-cookie");
  if (setCookieHeader) {
    // Create a request to check the user's verification status
    const checkRequest = new Request(request.url, {
      headers: {
        cookie: setCookieHeader,
      },
    });

    const userResult = await getCurrentUser(checkRequest);
    if (userResult?.user && !userResult.user.emailVerified) {
      // User is not verified - return requiresVerification flag
      // Include set-cookie header so session is still established
      const jsonResponse = NextResponse.json({
        success: true,
        requiresVerification: true,
        email: email ?? userResult.user.email,
      });
      jsonResponse.headers.set("set-cookie", setCookieHeader);
      return jsonResponse;
    }
  }

  // User is verified or we couldn't check - return success
  const jsonResponse = NextResponse.json({
    success: true,
    requiresVerification: false,
  });
  if (setCookieHeader) {
    jsonResponse.headers.set("set-cookie", setCookieHeader);
  }
  return jsonResponse;
}

export const POST = withRateLimit(routeId, authLimiter, handleSignIn);

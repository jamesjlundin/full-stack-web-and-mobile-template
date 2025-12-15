import { auth } from "@acme/auth";
import { createRateLimiter } from "@acme/security";
import { NextRequest, NextResponse } from "next/server";

import { withRateLimit } from "../../../_lib/withRateLimit";

// Rate limit: 5 requests per 60 seconds per IP
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/reset/confirm
 * Confirm password reset. Body: { token: string, newPassword: string }
 *
 * Returns { ok: true } on success.
 * Returns HTTP 400 with { error: "invalid_or_expired_token" } on failure.
 */
async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "invalid_or_expired_token" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    // Validate password length (minimum 8 characters)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Call Better Auth's reset password API
    // This validates and consumes the token, and updates the user's password
    await auth.api.resetPassword({
      body: { token, newPassword },
    });

    // Optionally: Better Auth may terminate existing sessions on password reset
    // depending on configuration. The default behavior handles this automatically.

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset/confirm] Error:", error);
    // Token validation errors from Better Auth typically mean invalid/expired token
    return NextResponse.json(
      { error: "invalid_or_expired_token" },
      { status: 400 }
    );
  }
}

export const POST = withRateLimit("/api/auth/reset/confirm", limiter, handler);

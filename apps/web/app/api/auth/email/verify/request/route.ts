import { auth, getDevToken, consumeTokenForEmail } from "@acme/auth";
import { createRateLimiter } from "@acme/security";
import { NextRequest, NextResponse } from "next/server";

import { sendVerificationEmail } from "@/app/api/_lib/mailer";
import { withRateLimit } from "@/app/api/_lib/withRateLimit";

// Rate limit: 3 requests per 60 seconds per IP (stricter to prevent email spam)
const verifyRequestLimiter = createRateLimiter({ limit: 3, windowMs: 60_000 });

/**
 * POST /api/auth/email/verify/request
 * Request email verification. Body: { email: string }
 *
 * Behavior:
 * - DEV MODE: Returns { ok: true, devToken: "..." } for testing without email delivery.
 * - PRODUCTION with RESEND_API_KEY: Sends verification email via Resend, returns { ok: true }.
 * - PRODUCTION with RESEND_DRY_RUN=1: Logs email payload, returns { ok: true, devNote: "dry_run: email payload logged" }.
 * - PRODUCTION without RESEND_API_KEY: Returns error (email not configured).
 */
async function handler(request: NextRequest) {
  // Check if dev token echoing is allowed (dev mode OR ALLOW_DEV_TOKENS=true for testing)
  const isDevTokenAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_TOKENS === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const isDryRun = process.env.RESEND_DRY_RUN === "1";

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Call Better Auth's send verification email API
    // This triggers the callback which stores the token
    await auth.api.sendVerificationEmail({
      body: { email },
      headers: request.headers,
    });

    // Small delay to ensure token is stored by the callback
    await new Promise((resolve) => setTimeout(resolve, 100));

    // DEV MODE: Return devToken for testing
    if (isDevTokenAllowed) {
      const devToken = getDevToken("verify", email);
      return NextResponse.json({ ok: true, devToken: devToken ?? undefined });
    }

    // PRODUCTION: Send email via Resend
    if (isProduction && hasResendKey) {
      // Retrieve token for email sending
      const token = consumeTokenForEmail("verify", email);
      if (!token) {
        console.error("[email/verify/request] Failed to retrieve token for email");
        return NextResponse.json(
          { ok: false, error: "Failed to generate verification token" },
          { status: 500 }
        );
      }

      const result = await sendVerificationEmail({ to: email, token });

      if (!result.ok) {
        return NextResponse.json(
          { ok: false, error: result.error || "Failed to send verification email" },
          { status: 500 }
        );
      }

      // Dry run mode: include note in response
      if (isDryRun) {
        return NextResponse.json({ ok: true, devNote: "dry_run: email payload logged" });
      }

      return NextResponse.json({ ok: true });
    }

    // PRODUCTION without RESEND_API_KEY: Error
    if (isProduction && !hasResendKey) {
      console.error("[email/verify/request] RESEND_API_KEY not configured");
      return NextResponse.json(
        { ok: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Fallback (should not reach here)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[email/verify/request] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit("/api/auth/email/verify/request", verifyRequestLimiter, handler);

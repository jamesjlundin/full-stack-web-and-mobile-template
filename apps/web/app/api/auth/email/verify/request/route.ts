import { auth, getDevToken } from "@acme/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/email/verify/request
 * Request email verification. Body: { email: string }
 *
 * DEV MODE ONLY: Returns { ok: true, devToken: "..." } for testing without SMTP.
 * PRODUCTION: Returns { ok: true } only. Tokens are NEVER exposed in production.
 */
export async function POST(request: Request) {
  // Check if dev token echoing is allowed (dev mode OR ALLOW_DEV_TOKENS=true for testing)
  const isDevTokenAllowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_TOKENS === "true";

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
    await auth.api.sendVerificationEmail({
      body: { email },
      headers: request.headers,
    });

    // In dev mode, retrieve the token that was stored by the email callback
    // IMPORTANT: This token echoing is FORBIDDEN in actual production
    if (isDevTokenAllowed) {
      // Small delay to ensure token is stored
      await new Promise((resolve) => setTimeout(resolve, 100));
      const devToken = getDevToken("verify", email);
      return NextResponse.json({ ok: true, devToken: devToken ?? undefined });
    }

    // Production: never expose tokens
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

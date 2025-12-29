import { auth } from "@acme/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/email/verify/confirm
 * Confirm email verification. Body: { token: string }
 *
 * Returns { ok: true } on success, or { ok: false, error: "..." } on failure.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "Token is required" },
        { status: 400 },
      );
    }

    // Call Better Auth's verify email API
    await auth.api.verifyEmail({
      query: { token },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[email/verify/confirm] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { isGoogleAuthEnabled } from "@acme/auth";

/**
 * Public configuration endpoint.
 * Exposes non-sensitive app configuration to frontend clients.
 */
export async function GET() {
  return NextResponse.json({
    isEmailVerificationRequired: !!process.env.RESEND_API_KEY,
    isGoogleAuthEnabled: isGoogleAuthEnabled(),
  });
}

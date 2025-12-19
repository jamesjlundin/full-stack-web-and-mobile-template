import { isGoogleAuthEnabled } from "@acme/auth";
import { NextResponse } from "next/server";

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

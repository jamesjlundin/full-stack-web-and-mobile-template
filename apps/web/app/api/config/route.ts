import { getAvailableProviders, getDefaultProvider } from "@acme/ai";
import { isGoogleAuthEnabled } from "@acme/auth";
import { NextResponse } from "next/server";

/**
 * Public configuration endpoint.
 * Exposes non-sensitive app configuration to frontend clients.
 */
export async function GET() {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return NextResponse.json({
    isEmailVerificationRequired: !!process.env.RESEND_API_KEY,
    isGoogleAuthEnabled: isGoogleAuthEnabled(),
    ai: {
      providers,
      defaultProvider: defaultProvider?.id ?? null,
    },
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_TRACKING_ID || null,
    },
  });
}

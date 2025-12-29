import { auth, authHandler, consumeTokenForEmail, getDevToken } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';

import { sendVerificationEmail } from '../../../_lib/mailer';
import { withRateLimit } from '../../../_lib/withRateLimit';

// Rate limiter: 5 requests per 60 seconds per IP
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

const routeId = '/api/auth/email-password/sign-up';

async function handleSignUp(request: Request) {
  const isEmailVerificationRequired = !!process.env.RESEND_API_KEY;
  const isDevTokenAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOKENS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  // Clone the request to read the body (we need the email for verification)
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
  url.pathname = '/api/auth/sign-up/email';

  const newRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    duplex: 'half',
  } as RequestInit);

  const response = await authHandler.POST(newRequest);

  // If sign-up failed, return the original response
  if (!response.ok) {
    return response;
  }

  // If email verification is not required, return success with flag
  if (!isEmailVerificationRequired) {
    const setCookieHeader = response.headers.get('set-cookie');
    const jsonResponse = NextResponse.json({
      success: true,
      requiresVerification: false,
    });
    if (setCookieHeader) {
      jsonResponse.headers.set('set-cookie', setCookieHeader);
    }
    return jsonResponse;
  }

  // Email verification is required - trigger verification email
  if (email) {
    try {
      // Trigger Better Auth to generate and store the verification token
      await auth.api.sendVerificationEmail({
        body: { email },
        headers: request.headers,
      });

      // Small delay to ensure token is stored by the callback
      await new Promise((resolve) => setTimeout(resolve, 100));

      // In dev mode, get the token for testing convenience
      let devToken: string | undefined;
      if (isDevTokenAllowed) {
        devToken = getDevToken('verify', email) ?? undefined;
      }

      // In production, send the actual email
      if (isProduction && !isDevTokenAllowed) {
        const token = consumeTokenForEmail('verify', email);
        if (token) {
          await sendVerificationEmail({ to: email, token });
        }
      }

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email,
        devToken,
      });
    } catch (error) {
      console.error('[sign-up] Failed to send verification email:', error);
      // Still return success - account was created, just email failed
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email,
        verificationEmailError: true,
      });
    }
  }

  return NextResponse.json({
    success: true,
    requiresVerification: true,
  });
}

export const POST = withRateLimit(routeId, authLimiter, handleSignUp);

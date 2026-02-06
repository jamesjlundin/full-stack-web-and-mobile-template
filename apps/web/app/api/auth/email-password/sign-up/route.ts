import { auth, consumeTokenForEmail, getDevToken } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';

import { sendVerificationEmail } from '../../../_lib/mailer';
import { withRateLimit } from '../../../_lib/withRateLimit';
import { proxyBetterAuthPost, tryReadJsonField } from '../../_lib/betterAuthProxy';

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

  // Read email from body for verification (preserves original body)
  const email = await tryReadJsonField<string>(request, 'email');

  // Forward to Better Auth sign-up endpoint
  const response = await proxyBetterAuthPost(request, '/api/auth/sign-up/email');

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

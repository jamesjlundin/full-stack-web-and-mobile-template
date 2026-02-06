import { getCurrentUser } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextResponse } from 'next/server';

import { withRateLimit } from '../../../_lib/withRateLimit';
import { proxyBetterAuthPost, tryReadJsonField } from '../../_lib/betterAuthProxy';

// Rate limiter: 5 requests per 60 seconds per IP
const authLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60_000,
});

const routeId = '/api/auth/email-password/sign-in';

async function handleSignIn(request: Request) {
  const isEmailVerificationRequired = !!process.env.RESEND_API_KEY;

  // Read email from body for verification redirect (preserves original body)
  const email = await tryReadJsonField<string>(request, 'email');

  // Forward to Better Auth sign-in endpoint
  const response = await proxyBetterAuthPost(request, '/api/auth/sign-in/email');

  // If sign-in failed, return the original response
  if (!response.ok) {
    return response;
  }

  // If email verification is not required, return success with session cookie
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

  // Check if user is verified by getting the session from the response
  // We need to make a new request with the cookies from the response to check
  const setCookieHeader = response.headers.get('set-cookie');
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
      // Do NOT include set-cookie header - no session for unverified users
      return NextResponse.json({
        success: false,
        requiresVerification: true,
        email: email ?? userResult.user.email,
      });
    }
  }

  // User is verified - return success with session cookie
  const jsonResponse = NextResponse.json({
    success: true,
    requiresVerification: false,
  });
  if (setCookieHeader) {
    jsonResponse.headers.set('set-cookie', setCookieHeader);
  }
  return jsonResponse;
}

export const POST = withRateLimit(routeId, authLimiter, handleSignIn);

import { auth, getDevToken, consumeTokenForEmail } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordResetEmail, buildPasswordResetUrls } from '../../../_lib/passwordResetEmail';
import { withRateLimit } from '../../../_lib/withRateLimit';

// Rate limit: 5 requests per 60 seconds per IP
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/reset/request
 * Request password reset. Body: { email: string }
 *
 * Security: Always returns 200 to prevent email enumeration.
 * DEV MODE ONLY: Returns { ok: true, devToken: "..." } for testing without SMTP.
 * PRODUCTION: Returns { ok: true } only. Tokens are NEVER exposed in production.
 */
async function handler(request: NextRequest) {
  // Check if dev token echoing is allowed (dev mode OR ALLOW_DEV_TOKENS=true for testing)
  const isDevTokenAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOKENS === 'true';

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      // Still return 200 to prevent enumeration of valid/invalid emails
      return NextResponse.json({ ok: true });
    }

    // Call Better Auth's request password reset API
    // This will trigger the sendResetPassword callback which stores the token
    try {
      await auth.api.requestPasswordReset({
        body: { email, redirectTo: '/reset-password/confirm' },
        headers: request.headers,
      });
    } catch {
      // Even on error (e.g., user not found), return success to prevent enumeration
      // Log for debugging but don't expose to client
      console.log('[reset/request] Password reset requested for:', email);
    }

    // Small delay to ensure token is stored by callback
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Try to get token for email sending (works in all environments)
    const tokenForEmail = consumeTokenForEmail('reset', email);

    // In dev mode, also get devToken for response echoing
    if (isDevTokenAllowed) {
      // Get token again if we consumed it for email (need to re-check)
      const devToken = getDevToken('reset', email) ?? tokenForEmail;

      // Send email (in dev, just logs to console)
      if (tokenForEmail) {
        await sendPasswordResetEmail({ to: email, token: tokenForEmail });
      }

      return NextResponse.json({ ok: true, devToken: devToken ?? undefined });
    }

    // Production: send actual email if token exists
    if (tokenForEmail) {
      const emailResult = await sendPasswordResetEmail({
        to: email,
        token: tokenForEmail,
      });
      if (!emailResult.ok) {
        // Log error but still return success to prevent enumeration
        console.error('[reset/request] Failed to send email:', emailResult.error);

        // If no email service, log URLs for manual testing
        const { webResetUrl, mobileDeepLink } = buildPasswordResetUrls(tokenForEmail);
        console.log('[reset/request] Reset URL (no email sent):', webResetUrl);
        if (mobileDeepLink) {
          console.log('[reset/request] Mobile deep link:', mobileDeepLink);
        }
      }
    }

    // Production: never expose tokens
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[reset/request] Error:', error);
    // Return success even on error to prevent enumeration
    return NextResponse.json({ ok: true });
  }
}

export const POST = withRateLimit('/api/auth/reset/request', limiter, handler);

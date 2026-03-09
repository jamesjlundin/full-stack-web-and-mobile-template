import { auth, getDevToken } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../../../../_lib/withRateLimit';

const resetRequestSchema = z.object({ email: z.string().email() });

const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/password/reset/request
 * Request password reset. Body: { email: string }
 *
 * DEV MODE ONLY: Returns { ok: true, devToken: "..." } for testing without SMTP.
 * PRODUCTION: Returns { ok: true } only. Tokens are NEVER exposed in production.
 */
async function handlePost(request: NextRequest) {
  // Check if dev token echoing is allowed (dev mode OR ALLOW_DEV_TOKENS=true for testing)
  const isDevTokenAllowed =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_TOKENS === 'true';

  try {
    const body = await request.json();

    const parsed = resetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 });
    }
    const { email } = parsed.data;

    // Call Better Auth's request password reset API
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: '/auth/reset/confirm' },
      headers: request.headers,
    });

    // In dev mode, retrieve the token that was stored by the email callback
    // IMPORTANT: This token echoing is FORBIDDEN in actual production
    if (isDevTokenAllowed) {
      // Small delay to ensure token is stored
      await new Promise((resolve) => setTimeout(resolve, 100));
      const devToken = getDevToken('reset', email);
      return NextResponse.json({ ok: true, devToken: devToken ?? undefined });
    }

    // Production: never expose tokens
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[password/reset/request] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export const POST = withRateLimit('/api/auth/password/reset/request', limiter, handlePost);

import { auth } from '@acme/auth';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withRateLimit } from '../../../_lib/withRateLimit';

const resetConfirmSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Rate limit: 5 requests per 60 seconds per IP
const limiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

/**
 * POST /api/auth/reset/confirm
 * Confirm password reset. Body: { token: string, newPassword: string }
 *
 * Returns { ok: true } on success.
 * Returns HTTP 400 with { error: "invalid_or_expired_token" } on failure.
 */
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = resetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      // Check if it's specifically a password length issue
      const passwordError = parsed.error.issues.find((i) => i.path[0] === 'newPassword');
      if (passwordError) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 400 });
    }
    const { token, newPassword } = parsed.data;

    // Call Better Auth's reset password API
    // This validates and consumes the token, and updates the user's password
    await auth.api.resetPassword({
      body: { token, newPassword },
    });

    // Optionally: Better Auth may terminate existing sessions on password reset
    // depending on configuration. The default behavior handles this automatically.

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[reset/confirm] Error:', error);
    // Token validation errors from Better Auth typically mean invalid/expired token
    return NextResponse.json({ error: 'invalid_or_expired_token' }, { status: 400 });
  }
}

export const POST = withRateLimit('/api/auth/reset/confirm', limiter, handlePost);

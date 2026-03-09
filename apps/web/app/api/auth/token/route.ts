import { auth } from '@acme/auth';
import { db, eq, schema } from '@acme/db';
import { createRateLimiter } from '@acme/security';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { signAuthToken } from '../../../../lib/jwt';
import { withRateLimit } from '../../_lib/withRateLimit';

const tokenRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const isEmailVerificationRequired = !!process.env.RESEND_API_KEY;

// Rate limit: 5 requests per 60 seconds per IP (same as other auth endpoints)
const tokenLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

async function authenticateUser(email: string, password: string) {
  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!result?.user?.id || !result.user.email) {
      return null;
    }

    return {
      id: result.user.id,
      email: result.user.email,
      emailVerified: result.user.emailVerified ?? false,
    };
  } catch {
    return null;
  }
}

async function handlePost(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = tokenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await authenticateUser(email, password);

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check if verification is required and user is not verified
  if (isEmailVerificationRequired && !user.emailVerified) {
    // Double-check against database in case Better Auth result is stale
    const [dbUser] = await db
      .select({ emailVerified: schema.users.emailVerified })
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1);

    if (!dbUser?.emailVerified) {
      // User is not verified - do NOT return a token
      return NextResponse.json(
        {
          error: 'email_not_verified',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }
  }

  const token = await signAuthToken({ email: user.email, sub: user.id });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
}

export const POST = withRateLimit('/api/auth/token', tokenLimiter, handlePost);

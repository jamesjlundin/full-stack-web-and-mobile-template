import { auth } from '@acme/auth';
import { headers } from 'next/headers';

import { getAppConfig } from './appConfig';

import type { AppConfig } from '@acme/types';

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
};

export type SessionResult = {
  user: SessionUser | null;
  config: AppConfig;
};

/**
 * Server-side session check for protected routes.
 * Call this from server components to get the current user and app config.
 *
 * Uses Better Auth's direct session API with nextCookies() plugin,
 * which properly handles cookie access in server components.
 */
export async function getServerSession(): Promise<SessionResult> {
  const headersList = await headers();

  const defaultConfig = getAppConfig();

  try {
    // Use Better Auth's direct session API
    // The nextCookies() plugin handles cookie access properly in server components
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return { user: null, config: defaultConfig };
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? undefined,
        emailVerified: session.user.emailVerified ?? false,
      },
      config: defaultConfig,
    };
  } catch (error) {
    // Only log presence indicators, not actual values, for security
    const hasCookie = !!headersList.get('cookie');
    console.error('Failed to get session:', error, { hasCookie });
    return { user: null, config: defaultConfig };
  }
}

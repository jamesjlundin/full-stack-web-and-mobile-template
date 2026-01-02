import { getAvailableProviders, getDefaultProvider } from '@acme/ai';
import { auth } from '@acme/auth';
import { headers } from 'next/headers';

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  emailVerified?: boolean;
};

export type AppConfig = {
  isEmailVerificationRequired: boolean;
  isGoogleAuthEnabled?: boolean;
  blobStorageEnabled?: boolean;
  ai?: {
    providers: Array<{
      id: string;
      name: string;
      models: Array<{ id: string; name: string }>;
      defaultModel: string;
    }>;
    defaultProvider: string | null;
  };
};

export type SessionResult = {
  user: SessionUser | null;
  config: AppConfig;
};

/**
 * Build app configuration from environment variables.
 * Same logic as /api/me route for consistency.
 */
function getConfig(): AppConfig {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return {
    isEmailVerificationRequired: !!process.env.RESEND_API_KEY,
    isGoogleAuthEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    blobStorageEnabled: !!process.env.BLOB_READ_WRITE_TOKEN,
    ai: {
      providers,
      defaultProvider: defaultProvider?.id ?? null,
    },
  };
}

/**
 * Server-side session check for protected routes.
 * Call this from server components to get the current user and app config.
 *
 * Uses Better Auth's direct session API with nextCookies() plugin,
 * which properly handles cookie access in server components.
 */
export async function getServerSession(): Promise<SessionResult> {
  const headersList = await headers();

  const defaultConfig = getConfig();

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

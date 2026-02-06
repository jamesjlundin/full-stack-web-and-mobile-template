import { getAvailableProviders, getDefaultProvider } from '@acme/ai';
import { isGoogleAuthEnabled } from '@acme/auth';

import type { AppConfig } from '@acme/types';

/**
 * Build app configuration from environment variables.
 * Centralized function used by API routes and server-side session checks.
 */
export function getAppConfig(): AppConfig {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return {
    isEmailVerificationRequired: !!process.env.RESEND_API_KEY,
    isGoogleAuthEnabled: isGoogleAuthEnabled(),
    blobStorageEnabled: !!process.env.BLOB_READ_WRITE_TOKEN,
    ai: {
      providers,
      defaultProvider: defaultProvider?.id ?? null,
    },
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GA_TRACKING_ID || null,
    },
  };
}

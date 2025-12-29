import { createAuthClient } from 'better-auth/client';

/**
 * Better Auth client for frontend authentication.
 * Used for social authentication (Google) which requires the client-side OAuth flow.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
});

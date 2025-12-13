import { db, schema } from "@acme/db";
import { betterAuth, type Session, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

/**
 * Check if dev token echoing is allowed.
 * Returns true if:
 * - NODE_ENV is not "production" (true development mode), OR
 * - ALLOW_DEV_TOKENS is set to "true" (for testing with production builds)
 *
 * IMPORTANT: ALLOW_DEV_TOKENS should NEVER be set in actual production environments.
 * It exists only to allow testing production builds locally.
 */
function isDevTokenAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_TOKENS === "true";
}

// DEV ONLY: In-memory store for tokens to enable testing without SMTP.
// NEVER expose tokens in production - this store is only populated in dev mode.
type DevTokenEntry = { token: string; url: string; timestamp: number };
const devTokenStore: Map<string, DevTokenEntry> = new Map();

/**
 * DEV ONLY: Store a token for later retrieval. In production, this is a no-op.
 */
export function storeDevToken(type: "verify" | "reset", email: string, token: string, url: string): void {
  if (!isDevTokenAllowed()) return;
  const key = `${type}:${email.toLowerCase()}`;
  devTokenStore.set(key, { token, url, timestamp: Date.now() });
  console.log(`[DEV] ${type} token for ${email}: ${token}`);
}

/**
 * DEV ONLY: Retrieve and consume a stored token. Returns null in production or if no token exists.
 */
export function getDevToken(type: "verify" | "reset", email: string): string | null {
  if (!isDevTokenAllowed()) return null;
  const key = `${type}:${email.toLowerCase()}`;
  const entry = devTokenStore.get(key);
  if (!entry) return null;
  // Token is valid for 10 minutes
  if (Date.now() - entry.timestamp > 10 * 60 * 1000) {
    devTokenStore.delete(key);
    return null;
  }
  devTokenStore.delete(key);
  return entry.token;
}

type SessionResponse =
  | {
      headers: Headers | null | undefined;
      response: { session: Session; user: User } | null;
      status?: number;
    }
  | null;

export const auth = betterAuth({
  baseURL,
  secret,
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Store token in dev mode for testing. In production, integrate with SMTP.
      storeDevToken("reset", user.email, token, url);
      if (!isDevTokenAllowed()) {
        // TODO: Implement production SMTP email sending here
        console.log(`[PROD] Password reset email would be sent to ${user.email}`);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      // Store token in dev mode for testing. In production, integrate with SMTP.
      storeDevToken("verify", user.email, token, url);
      if (!isDevTokenAllowed()) {
        // TODO: Implement production SMTP email sending here
        console.log(`[PROD] Verification email would be sent to ${user.email}`);
      }
    },
    sendOnSignUp: false, // Don't auto-send on signup - use explicit request endpoint
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  plugins: [nextCookies()],
});

export const authHandler = toNextJsHandler(auth);

export type CurrentUserResult = {
  headers: Headers | null;
  session: Session | null;
  status: number;
  user: User | null;
};

export async function getCurrentUser(request: Request): Promise<CurrentUserResult | null> {
  try {
    const result = (await auth.api.getSession({
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    })) as SessionResponse;

    if (!result) {
      return null;
    }

    const { headers, response, status } = result;

    if (response && "user" in response && "session" in response) {
      return {
        headers: headers ?? null,
        session: response.session,
        status: status ?? 200,
        user: response.user,
      };
    }

    return {
      headers: headers ?? null,
      session: null,
      status: status ?? 401,
      user: null,
    };
  } catch (error) {
    console.error("Failed to read current user", error);
    return null;
  }
}

export default auth;

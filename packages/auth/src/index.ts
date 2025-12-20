import { db, schema } from "@acme/db";
import { betterAuth, type Session, type User } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

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

// In-memory store for tokens. Used for:
// - DEV mode: Token echoing for testing without email delivery
// - PROD mode: Temporary storage to pass token from callback to route handler for email sending
type DevTokenEntry = { token: string; url: string; timestamp: number };
const devTokenStore: Map<string, DevTokenEntry> = new Map();

/**
 * Store a token for later retrieval.
 * Always stores the token (for both dev and prod use cases).
 * In dev mode, logs the token for convenience.
 */
export function storeDevToken(type: "verify" | "reset", email: string, token: string, url: string): void {
  const key = `${type}:${email.toLowerCase()}`;
  devTokenStore.set(key, { token, url, timestamp: Date.now() });
  if (isDevTokenAllowed()) {
    console.log(`[DEV] ${type} token for ${email}: ${token}`);
  }
}

/**
 * DEV ONLY: Retrieve and consume a stored token for API response echoing.
 * Returns null in production (unless ALLOW_DEV_TOKENS=true) or if no token exists.
 * Use this for returning devToken in API responses.
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

/**
 * Retrieve and consume a stored token for email sending purposes.
 * Works in all environments. Used by mailer to get token for sending emails.
 * Returns null if no token exists or token has expired.
 */
export function consumeTokenForEmail(type: "verify" | "reset", email: string): string | null {
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

// Lazy initialization for auth - env vars are checked at runtime, not build time
let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (_auth) return _auth;

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.APP_BASE_URL;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }

  if (!baseURL) {
    throw new Error("APP_BASE_URL is not set");
  }

  // Trust the base URL for CORS
  const trustedOrigins = [baseURL];

  // Configure Google OAuth if credentials are present
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const isGoogleAuthEnabled = !!(googleClientId && googleClientSecret);

  _auth = betterAuth({
    baseURL,
    secret,
    trustedOrigins,
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
    // Google OAuth - only enabled if credentials are configured
    ...(isGoogleAuthEnabled && {
      socialProviders: {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      },
    }),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    plugins: [nextCookies()],
  });

  return _auth;
}

// Export auth as a getter to support lazy initialization
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    return (getAuth() as Record<string | symbol, unknown>)[prop];
  },
});

// Lazy handler that creates the Next.js handler on first use
let _authHandler: ReturnType<typeof toNextJsHandler> | null = null;

export const authHandler = {
  GET: (req: Request) => {
    if (!_authHandler) _authHandler = toNextJsHandler(getAuth());
    return _authHandler.GET(req);
  },
  POST: (req: Request) => {
    if (!_authHandler) _authHandler = toNextJsHandler(getAuth());
    return _authHandler.POST(req);
  },
  PUT: (req: Request) => {
    if (!_authHandler) _authHandler = toNextJsHandler(getAuth());
    return _authHandler.PUT(req);
  },
  PATCH: (req: Request) => {
    if (!_authHandler) _authHandler = toNextJsHandler(getAuth());
    return _authHandler.PATCH(req);
  },
  DELETE: (req: Request) => {
    if (!_authHandler) _authHandler = toNextJsHandler(getAuth());
    return _authHandler.DELETE(req);
  },
};

export type CurrentUserResult = {
  headers: Headers | null;
  session: Session | null;
  status: number;
  user: User | null;
};

/**
 * Get the JWT secret key for token verification.
 * Uses the same secret as Better Auth for consistency.
 */
let _jwtSecretKey: Uint8Array | null = null;

function getJwtSecretKey(): Uint8Array {
  if (_jwtSecretKey) return _jwtSecretKey;

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set and at least 32 characters long");
  }
  _jwtSecretKey = new TextEncoder().encode(secret);
  return _jwtSecretKey;
}

/**
 * Extract Bearer token from Authorization header.
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token || null;
}

/**
 * Verify a JWT Bearer token and return the user from the database.
 */
async function verifyBearerToken(token: string): Promise<CurrentUserResult | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), { algorithms: ["HS256"] });

    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }

    // Fetch user from database
    const [dbUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);

    if (!dbUser) {
      return null;
    }

    // Convert to User type expected by Better Auth
    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified ?? false,
      name: dbUser.name ?? "",
      image: dbUser.image ?? null,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };

    return {
      headers: null,
      session: null, // No session for Bearer token auth
      status: 200,
      user,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: Request): Promise<CurrentUserResult | null> {
  try {
    // First, check for Bearer token authentication
    const bearerToken = extractBearerToken(request);
    if (bearerToken) {
      const bearerResult = await verifyBearerToken(bearerToken);
      if (bearerResult) {
        return bearerResult;
      }
      // If Bearer token is invalid, return unauthorized (don't fall through to cookies)
      return {
        headers: null,
        session: null,
        status: 401,
        user: null,
      };
    }

    // Fall back to session cookie authentication
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

/**
 * Check if Google OAuth is enabled based on environment variables.
 * Returns true only if both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 */
export function isGoogleAuthEnabled(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export default auth;

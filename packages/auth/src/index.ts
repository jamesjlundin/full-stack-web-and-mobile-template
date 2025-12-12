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
  advanced: {
    disableOriginCheck: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  providers: {
    emailPassword: {},
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

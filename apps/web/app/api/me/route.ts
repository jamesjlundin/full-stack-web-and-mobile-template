import { getAvailableProviders, getDefaultProvider } from "@acme/ai";
import { getCurrentUser, isGoogleAuthEnabled } from "@acme/auth";
import { db, schema } from "@acme/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { verifyAuthToken } from "../../../lib/jwt";

function getConfig() {
  const providers = getAvailableProviders();
  const defaultProvider = getDefaultProvider();

  return {
    isEmailVerificationRequired: !!process.env.RESEND_API_KEY,
    isGoogleAuthEnabled: isGoogleAuthEnabled(),
    ai: {
      providers,
      defaultProvider: defaultProvider?.id ?? null,
    },
  };
}

export async function GET(request: Request) {
  const result = await getCurrentUser(request);

  if (result?.user) {
    const response = NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          emailVerified: result.user.emailVerified,
        },
        config: getConfig(),
      },
      { status: 200 },
    );

    if (result.headers) {
      result.headers.forEach((value, key) => {
        response.headers.append(key, value);
      });
    }

    return response;
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice("bearer ".length).trim();

    try {
      const payload = await verifyAuthToken(token);

      // Look up user from database to get emailVerified status
      const [dbUser] = await db
        .select({ emailVerified: schema.users.emailVerified })
        .from(schema.users)
        .where(eq(schema.users.id, payload.sub))
        .limit(1);

      return NextResponse.json(
        {
          user: {
            id: payload.sub,
            email: payload.email,
            emailVerified: dbUser?.emailVerified ?? false,
          },
          config: getConfig(),
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const status = result?.status ?? 401;
  const response = NextResponse.json({ error: "unauthorized" }, { status });

  if (result?.headers) {
    result.headers.forEach((value, key) => {
      response.headers.append(key, value);
    });
  }

  return response;
}

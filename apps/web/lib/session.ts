import { cookies, headers } from "next/headers";

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
 * Server-side session check for protected routes.
 * Call this from server components to get the current user and app config.
 */
export async function getServerSession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Get the host for constructing the URL
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  const defaultConfig: AppConfig = {
    isEmailVerificationRequired: false,
    isGoogleAuthEnabled: false,
    blobStorageEnabled: false,
    ai: { providers: [], defaultProvider: null },
  };

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { user: null, config: defaultConfig };
    }

    const data = await response.json();
    return {
      user: data?.user ?? null,
      config: data?.config ?? defaultConfig,
    };
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return { user: null, config: defaultConfig };
  }
}

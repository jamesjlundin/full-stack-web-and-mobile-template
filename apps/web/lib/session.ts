import { cookies, headers } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
};

/**
 * Server-side session check for protected routes.
 * Call this from server components to get the current user.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const headersList = await headers();

  // Get the host for constructing the URL
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return null;
    }

    const data = await response.json();
    return data?.user ?? null;
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return null;
  }
}

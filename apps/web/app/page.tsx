import { cookies, headers } from "next/headers";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface AuthStatus {
  isAuthenticated: boolean;
  email?: string;
  name?: string;
}

async function getAuthStatus(): Promise<AuthStatus> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { isAuthenticated: false };
    }

    const data = await response.json();
    return {
      isAuthenticated: !!data?.user,
      email: data?.user?.email,
      name: data?.user?.name,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

export default async function HomePage() {
  const { isAuthenticated, email, name } = await getAuthStatus();

  return (
    <AppShell user={isAuthenticated ? { email, name } : null}>
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] py-12 text-center">
        <Badge variant="secondary" className="mb-4">
          Full-Stack Template
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Build your next
          <br />
          <span className="text-primary">great project</span>
        </h1>
        <p className="mt-6 max-w-[600px] text-lg text-muted-foreground sm:text-xl">
          A complete full-stack foundation with authentication, database, and
          modern tooling ready to go.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <p className="w-full text-center text-green-600 dark:text-green-400 mb-2">
                Welcome back{email ? `, ${email}` : ""}!
              </p>
              <Button size="lg" asChild>
                <Link href="/app/(protected)/home">Enter App</Link>
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" asChild>
                <Link href="/register">Create account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <details className="mt-16 w-full max-w-md">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
            Developer info
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-muted text-left">
            <p className="text-sm">
              API endpoint:{" "}
              <code className="ml-2 px-2 py-1 rounded bg-background font-mono text-xs">
                {apiUrl || "Not configured"}
              </code>
            </p>
          </div>
        </details>
      </div>
    </AppShell>
  );
}

import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
                <Link href="/app/home">Enter App</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/agent">AI Agent Demo</Link>
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

        {/* Creator Branding - Remove this section when using this template */}
        <div className="mt-16 w-full max-w-md">
          <Separator className="mb-6" />
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>
              Created by{" "}
              <span className="font-medium text-foreground">James Lundin</span>
            </p>
            <p className="text-xs max-w-sm">
              Full-stack engineer passionate about building modern web and mobile applications
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a
                href="https://github.com/jamesjlundin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/jamesjlundin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Linkedin className="h-5 w-5" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
        {/* End Creator Branding */}

      </div>
    </AppShell>
  );
}

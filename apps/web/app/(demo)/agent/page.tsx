import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";

import { AgentChat } from "./_components/AgentChat";

async function getUser() {
  const cookieStore = await cookies();
  const host = process.env.VERCEL_URL || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (response.status === 401) {
      return null;
    }

    const data = await response.json();
    return data?.user || null;
  } catch {
    return null;
  }
}

export default async function AgentDemoPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/agent");
  }

  return (
    <AppShell user={user}>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">AI Agent</h1>
              <Badge variant="secondary">Demo</Badge>
            </div>
            <p className="text-muted-foreground">
              Chat with an AI agent that can use tools to get weather and time information.
              This demonstrates streaming responses with tool calling.
            </p>
          </div>

          <AgentChat />

          <p className="text-xs text-muted-foreground text-center">
            Rate limited to 20 requests per minute. Weather data is mocked for demo purposes.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

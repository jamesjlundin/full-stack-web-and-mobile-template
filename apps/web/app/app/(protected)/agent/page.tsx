import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { getServerSession } from "@/lib/session";

import { AgentChat } from "./_components/AgentChat";

import type { AiProviderInfo } from "@acme/api-client";

// Skip static generation - this page requires auth check at runtime
export const dynamic = "force-dynamic";

export default async function AgentDemoPage() {
  const { user, config } = await getServerSession();

  if (!user) {
    redirect("/login?next=/agent");
  }

  const aiProviders = config.ai?.providers ?? [];
  const defaultProvider = config.ai?.defaultProvider ?? null;
  const blobStorageEnabled = config.blobStorageEnabled ?? false;

  return (
    <AppShell user={{ email: user.email, name: user.name }}>
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

          <AgentChat
            providers={aiProviders as AiProviderInfo[]}
            defaultProvider={defaultProvider}
            blobStorageEnabled={blobStorageEnabled}
          />

          <p className="text-xs text-muted-foreground text-center">
            Rate limited to 20 requests per minute. Weather data is mocked for demo purposes.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

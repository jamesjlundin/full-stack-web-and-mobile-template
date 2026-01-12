import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

/**
 * Loading skeleton for the AI Agent page.
 * Shows a placeholder chat interface while the page loads.
 */
export default function AgentLoading() {
  return (
    <div className="container py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">AI Agent</h1>
            <Badge variant="secondary">Demo</Badge>
          </div>
          <p className="text-muted-foreground">
            Chat with an AI agent that can use tools to get weather and time information. This
            demonstrates streaming responses with tool calling.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat messages area placeholder */}
            <div className="min-h-[300px] rounded-lg border bg-muted/30 p-4">
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <Spinner size="lg" className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading chat interface...</p>
              </div>
            </div>

            {/* Input area placeholder */}
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Rate limited to 5 requests per 24 hours. Weather data is mocked for demo purposes.
        </p>
      </div>
    </div>
  );
}

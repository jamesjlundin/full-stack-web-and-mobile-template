'use client';

import { Cloud, Clock, Loader2, CheckCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import type { ToolCall } from '../_lib/types';

const toolIcons: Record<string, typeof Cloud> = {
  get_weather: Cloud,
  get_time: Clock,
};

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const Icon = toolIcons[toolCall.name] || Cloud;
  const isComplete = toolCall.status === 'complete';

  return (
    <Card className="my-2 bg-muted/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{formatToolName(toolCall.name)}</span>
              {isComplete ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Tool arguments */}
            {Object.keys(toolCall.args).length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {Object.entries(toolCall.args).map(([key, value]) => (
                  <span key={key} className="mr-2">
                    {key}: <span className="font-mono">{formatArgValue(value)}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {/* Tool result */}
            {isComplete && toolCall.result ? (
              <div className="mt-2 p-2 rounded bg-background text-xs font-mono overflow-x-auto">
                {formatToolResult(toolCall.name, toolCall.result)}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatArgValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatToolResult(toolName: string, result: unknown): string {
  if (typeof result !== 'object' || result === null) {
    return String(result);
  }

  const data = result as Record<string, unknown>;

  switch (toolName) {
    case 'get_weather':
      return `${data.temperature}°${(data.unit as string)?.[0]?.toUpperCase() || 'F'} - ${data.conditions}`;
    case 'get_time':
      return `${data.time} (${data.timezone})`;
    default:
      return JSON.stringify(result, null, 2);
  }
}

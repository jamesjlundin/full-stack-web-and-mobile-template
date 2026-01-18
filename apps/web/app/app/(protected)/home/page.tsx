import { Home, Bot } from 'lucide-react';
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { getServerSession } from '../../../../lib/session';

import { SignOutButton } from './_components/SignOutButton';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function ProtectedHomePage() {
  const { user } = await getServerSession();

  const displayName = user?.name || user?.email || 'User';

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="dashboard-heading">
              Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome to your protected area</p>
          </div>
          <Badge variant="secondary" data-testid="dashboard-protected-badge">
            Protected
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2"
              data-testid="dashboard-account-info-title"
            >
              <Home className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>Your current session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert data-testid="dashboard-signed-in-alert">
              <AlertTitle>Signed in as</AlertTitle>
              <AlertDescription className="font-medium">{displayName}</AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/app/agent" data-testid="dashboard-ai-agent-link">
                  <Bot className="mr-2 h-4 w-4" />
                  AI Agent Demo
                </Link>
              </Button>
              <SignOutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

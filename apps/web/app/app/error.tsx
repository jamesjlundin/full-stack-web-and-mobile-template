'use client';

import { useEffect } from 'react';

import { AppShell } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('App section error:', error);
  }, [error]);

  return (
    <AppShell>
      <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              An error occurred while loading this page. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error.digest && (
              <p className="text-sm text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/app/home')}>
              Go to dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}

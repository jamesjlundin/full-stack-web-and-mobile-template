import Link from 'next/link';

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

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export default function AppNotFound() {
  return (
    <AppShell>
      <div className="container flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-6xl font-bold text-muted-foreground">404</CardTitle>
            <CardDescription className="text-lg">Page not found</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/app/home">Go to dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}

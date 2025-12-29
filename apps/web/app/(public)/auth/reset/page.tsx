'use client';

import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/password/reset/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('Password reset email sent! Check your inbox.');
        toast.success('Reset email sent');
        if (data.devToken) {
          setDevToken(data.devToken);
        }
      } else {
        setError(data.error ?? 'Failed to send reset email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleRequestReset}>
            <CardContent className="space-y-4">
              {message && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {devToken && (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                  <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                    DEV MODE: Reset Token
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <code className="block break-all text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded mt-2">
                      {devToken}
                    </code>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Copy this token and use it on the{' '}
                      <Link
                        href={`/auth/reset/confirm?token=${encodeURIComponent(devToken)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        confirmation page
                      </Link>
                      .
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner size="sm" className="mr-2" />}
                {loading ? 'Sending...' : 'Request password reset'}
              </Button>
              <div className="text-sm text-center space-y-2">
                <p className="text-muted-foreground">
                  <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                    Back to Sign in
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  <Link
                    href="/auth/verify"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Verify your email
                  </Link>
                  {' | '}
                  <Link
                    href="/auth/reset/confirm"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Have a reset token?
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

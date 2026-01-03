'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';

import { useUser } from '@/app/_components/useUser';
import { DividerWithText } from '@/components/auth/divider-with-text';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { AppShell } from '@/components/layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { getSafeRedirectUrl } from '@/lib/utils';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleAuthEnabled, setIsGoogleAuthEnabled] = useState(false);

  const nextUrl = getSafeRedirectUrl(searchParams.get('next'));
  const googleError = searchParams.get('error') === 'google';

  // Redirect authenticated users to app home
  useEffect(() => {
    if (!userLoading && user) {
      router.replace('/app/home');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setIsGoogleAuthEnabled(data.isGoogleAuthEnabled ?? false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (googleError) {
      setError('Failed to sign up with Google. Please try again.');
    }
  }, [googleError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const signupResponse = await fetch('/api/auth/email-password/sign-up', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      if (!signupResponse.ok) {
        const data = await signupResponse.json().catch(() => ({}));
        setError(data?.message ?? 'Unable to sign up. Please try again.');
        return;
      }

      const data = await signupResponse.json().catch(() => ({}));

      // If verification is required, redirect to verify page
      if (data.requiresVerification) {
        toast.success('Account created! Please verify your email.');
        const verifyUrl =
          nextUrl !== '/app/home'
            ? `/auth/verify?email=${encodeURIComponent(email)}&sent=true&next=${encodeURIComponent(nextUrl)}`
            : `/auth/verify?email=${encodeURIComponent(email)}&sent=true`;
        router.push(verifyUrl);
        return;
      }

      // No verification required - sign in and redirect
      const signinResponse = await fetch('/api/auth/email-password/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (signinResponse.ok) {
        toast.success('Account created successfully');
        router.push(nextUrl);
        return;
      }

      const signinData = await signinResponse.json().catch(() => ({}));
      setError(signinData?.message ?? 'Signed up but failed to sign in. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (userLoading || user) {
    return (
      <AppShell>
        <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
          <Card className="w-full max-w-md min-h-[440px]">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>Loading...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Spinner size="lg" />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md min-h-[440px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Enter your details to create an account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isGoogleAuthEnabled && (
              <>
                <GoogleSignInButton callbackURL={nextUrl} mode="signup" />
                <DividerWithText text="or continue with email" />
              </>
            )}
          </CardContent>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner size="sm" className="mr-2" />}
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href={
                    nextUrl !== '/app/home'
                      ? `/login?next=${encodeURIComponent(nextUrl)}`
                      : '/login'
                  }
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

function RegisterLoading() {
  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md min-h-[440px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  );
}

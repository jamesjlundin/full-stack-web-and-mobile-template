'use client';

import { CheckCircle, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const sentParam = searchParams.get('sent') === 'true';
  const tokenParam = searchParams.get('token');

  const [email, setEmail] = useState(emailParam ?? '');
  const [token, setToken] = useState(tokenParam ?? '');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showCheckEmailBanner, setShowCheckEmailBanner] = useState(sentParam);
  const [autoVerifying, setAutoVerifying] = useState(!!tokenParam);

  // Track if we've already attempted auto-verification
  const autoVerifyAttempted = useRef(false);

  // Update email when query param changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Auto-verify function
  const performVerification = useCallback(
    async (verifyToken: string) => {
      setError(null);
      setMessage(null);
      setLoading(true);

      try {
        const response = await fetch('/api/auth/email/verify/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token: verifyToken }),
        });

        const data = await response.json();

        if (data.ok) {
          setVerified(true);
          setMessage('Email verified successfully! You can now sign in.');
          toast.success('Email verified successfully');
          setDevToken(null);
          setToken('');
          setShowCheckEmailBanner(false);

          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 1500);
        } else {
          setError(data.error ?? 'Failed to verify email. The link may have expired.');
          setAutoVerifying(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error occurred');
        setAutoVerifying(false);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  // Auto-verify when token is in URL
  useEffect(() => {
    if (tokenParam && !autoVerifyAttempted.current && !verified) {
      autoVerifyAttempted.current = true;
      performVerification(tokenParam);
    }
  }, [tokenParam, verified, performVerification]);

  const handleRequestVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/email/verify/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('Verification email sent! Check your inbox.');
        setShowCheckEmailBanner(true);
        toast.success('Verification email sent');
        if (data.devToken) {
          setDevToken(data.devToken);
          setToken(data.devToken);
        }
      } else {
        setError(data.error ?? 'Failed to send verification email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setError(null);
    setMessage(null);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/email/verify/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage('Verification email resent! Check your inbox.');
        toast.success('Verification email resent');
        if (data.devToken) {
          setDevToken(data.devToken);
          setToken(data.devToken);
        }
      } else {
        setError(data.error ?? 'Failed to resend verification email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performVerification(token);
  };

  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Verify Email
            </CardTitle>
            <CardDescription>Verify your email address to access your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto-verifying state */}
            {autoVerifying && loading && !error && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Spinner size="lg" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}

            {/* Check your email banner */}
            {showCheckEmailBanner && !verified && !autoVerifying && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">
                  Check your email
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  We&apos;ve sent a verification email to{' '}
                  <span className="font-medium">{email}</span>. Click the link in the email or enter
                  the verification code below.
                </AlertDescription>
              </Alert>
            )}

            {/* Success message */}
            {message && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {message}
                  {verified && ' Redirecting to sign in...'}
                </AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!verified && !(autoVerifying && loading && !error) && (
              <>
                {/* Request Verification Form */}
                {!showCheckEmailBanner && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Step 1: Request Verification</h3>
                    <form onSubmit={handleRequestVerification} className="space-y-4">
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
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Spinner size="sm" className="mr-2" />}
                        Send verification email
                      </Button>
                    </form>
                  </div>
                )}

                {/* Resend option when banner is shown */}
                {showCheckEmailBanner && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendVerification}
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner size="sm" className="mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Resend verification email
                  </Button>
                )}

                {/* Dev Token Display */}
                {devToken && (
                  <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                      DEV MODE: Token received
                    </AlertTitle>
                    <AlertDescription className="space-y-2">
                      <code className="block break-all text-xs bg-yellow-100 dark:bg-yellow-900 p-2 rounded mt-2">
                        {devToken}
                      </code>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Token auto-filled below. Click confirm to verify.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Confirm Verification Form */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">
                    {showCheckEmailBanner
                      ? 'Enter verification code'
                      : 'Step 2: Confirm Verification'}
                  </h3>
                  <form onSubmit={handleConfirmVerification} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token">Verification Token</Label>
                      <Input
                        id="token"
                        type="text"
                        placeholder="Paste token from email"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !token}>
                      {loading && <Spinner size="sm" className="mr-2" />}
                      Verify email
                    </Button>
                  </form>
                </div>

                <Separator />

                <div className="text-sm text-center space-y-2">
                  <p className="text-muted-foreground">
                    <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                      Back to Sign in
                    </Link>
                  </p>
                  <p className="text-muted-foreground">
                    <Link
                      href="/reset-password"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function VerifyEmailLoading() {
  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Verify Email
            </CardTitle>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailForm />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect, Suspense } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { DividerWithText } from "@/components/auth/divider-with-text";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleAuthEnabled, setIsGoogleAuthEnabled] = useState(false);

  const nextUrl = searchParams.get("next") || "/app/home";
  const googleError = searchParams.get("error") === "google";

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setIsGoogleAuthEnabled(data.isGoogleAuthEnabled ?? false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (googleError) {
      setError("Failed to sign in with Google. Please try again.");
    }
  }, [googleError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/email-password/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));

        // If verification is required, redirect to verify page
        if (data.requiresVerification) {
          toast.info("Please verify your email to continue");
          router.push(`/auth/verify?email=${encodeURIComponent(data.email || email)}`);
          return;
        }

        toast.success("Signed in successfully");
        router.push(nextUrl);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setError(
        data?.message ?? "Unable to sign in. Check your credentials and try again."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md min-h-[440px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {isGoogleAuthEnabled && (
              <>
                <GoogleSignInButton callbackURL={nextUrl} mode="signin" />
                <DividerWithText text="or continue with email" />
              </>
            )}
          </CardContent>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-0">
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
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Spinner size="sm" className="mr-2" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-sm text-center space-y-2">
                <p className="text-muted-foreground">
                  Need an account?{" "}
                  <Link
                    href="/register"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
                <p className="text-muted-foreground">
                  <Link
                    href="/reset-password"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                  {" | "}
                  <Link
                    href="/auth/verify"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Verify email
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

function LoginLoading() {
  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md min-h-[440px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export default function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(false);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setSubmitted(true);
      toast.success("Reset link sent");
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
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
              {!submitted
                ? "Enter your email address and we'll send you a link to reset your password."
                : "Check your email for further instructions."}
            </CardDescription>
          </CardHeader>

          {!submitted ? (
            <form onSubmit={handleRequestReset}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
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
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
                <div className="text-sm text-center space-y-2">
                  <p className="text-muted-foreground">
                    <Link
                      href="/login"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Back to Sign in
                    </Link>
                  </p>
                  <p className="text-muted-foreground">
                    <Link
                      href="/reset-password/confirm"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Already have a reset token?
                    </Link>
                  </p>
                </div>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  If that email exists in our system, a reset link has been sent.
                  Please check your inbox.
                </AlertDescription>
              </Alert>

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
                      Use this token on the{" "}
                      <Link
                        href={`/reset-password/confirm?token=${encodeURIComponent(devToken)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        confirmation page
                      </Link>
                      .
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                    setDevToken(null);
                  }}
                >
                  Send another request
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/login">Back to Sign in</Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

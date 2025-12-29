"use client";

import { LogOut, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
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
import { Spinner } from "@/components/ui/spinner";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setStatus(null);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.message ?? "Failed to sign out. Please try again.");
        return;
      }

      setStatus("Signed out successfully.");
      toast.success("Signed out successfully");
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <LogOut className="h-6 w-6" />
              Sign out
            </CardTitle>
            <CardDescription>
              You are about to sign out of your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  {status}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={handleLogout}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading && <Spinner size="sm" className="mr-2" />}
              {loading ? "Signing out..." : "Sign out"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <p className="text-muted-foreground">
                Go back to the{" "}
                <Link
                  href="/"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  home page
                </Link>{" "}
                or{" "}
                <Link
                  href="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  sign in
                </Link>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}

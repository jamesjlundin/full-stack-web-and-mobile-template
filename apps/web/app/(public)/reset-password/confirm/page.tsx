"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect, Suspense } from "react";

function ResetConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleConfirmReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login?message=password_reset_success");
        }, 2000);
      } else {
        if (data.error === "invalid_or_expired_token") {
          setError("This link is invalid or has expired. Please request a new password reset.");
        } else {
          setError(data.error ?? "Failed to reset password");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section style={{ marginBottom: 32 }}>
        <p style={{ color: "#047857" }}>
          Your password has been reset successfully! Redirecting to sign in...
        </p>
        <p>
          <Link href="/login" style={{ color: "#1d4ed8" }}>
            Click here if you are not redirected
          </Link>
        </p>
      </section>
    );
  }

  return (
    <>
      <section style={{ marginBottom: 32 }}>
        <p>Enter your new password below.</p>
        <form onSubmit={handleConfirmReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!searchParams.get("token") && (
            <label>
              Reset Token
              <input
                type="text"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                placeholder="Paste token from email"
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </label>
          )}
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Enter new password (min 8 characters)"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Confirm new password"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
          <button type="submit" disabled={loading || !token || !newPassword || !confirmPassword} style={{ padding: "10px 12px" }}>
            {loading ? "Resetting..." : "Set new password"}
          </button>
        </form>
      </section>

      {error?.includes("invalid or has expired") && (
        <section style={{ marginBottom: 16 }}>
          <Link href="/reset-password" style={{ color: "#1d4ed8" }}>
            Request a new password reset
          </Link>
        </section>
      )}
    </>
  );
}

export default function ConfirmResetPage() {
  return (
    <main className="main">
      <h1>Set New Password</h1>

      <Suspense fallback={<p>Loading...</p>}>
        <ResetConfirmForm />
      </Suspense>

      <nav style={{ marginTop: 24 }}>
        <p>
          <Link href="/login">Back to Sign in</Link>
        </p>
        <p>
          <Link href="/reset-password">Request a new reset link</Link>
        </p>
      </nav>
    </main>
  );
}

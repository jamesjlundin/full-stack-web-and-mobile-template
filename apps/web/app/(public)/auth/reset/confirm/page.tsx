"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect, Suspense } from "react";

function ResetConfirmForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
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
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage("Password reset successfully! You can now sign in with your new password.");
        setToken("");
        setNewPassword("");
      } else {
        setError(data.error ?? "Failed to reset password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section style={{ marginBottom: 32 }}>
        <p>Enter your reset token and new password below.</p>
        <form onSubmit={handleConfirmReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              placeholder="Enter new password"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={loading || !token || !newPassword} style={{ padding: "10px 12px" }}>
            {loading ? "Resetting..." : "Set new password"}
          </button>
        </form>
      </section>

      {message ? (
        <section style={{ marginBottom: 32 }}>
          <p style={{ color: "#047857" }}>{message}</p>
          <p>
            <Link href="/login" style={{ color: "#1d4ed8" }}>
              Go to Sign in
            </Link>
          </p>
        </section>
      ) : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </>
  );
}

export default function ResetConfirmPage() {
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
          <Link href="/auth/reset">Request a new reset token</Link>
        </p>
      </nav>
    </main>
  );
}

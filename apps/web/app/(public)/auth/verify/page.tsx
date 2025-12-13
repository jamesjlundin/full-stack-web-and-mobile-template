"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/email/verify/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage("Verification email sent! Check your inbox (or use the dev token below).");
        if (data.devToken) {
          setDevToken(data.devToken);
          setToken(data.devToken);
        }
      } else {
        setError(data.error ?? "Failed to send verification email");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/email/verify/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage("Email verified successfully! You can now sign in.");
        setDevToken(null);
        setToken("");
      } else {
        setError(data.error ?? "Failed to verify email");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <h1>Verify Email</h1>

      {/* Request Verification Form */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Step 1: Request Verification</h2>
        <form onSubmit={handleRequestVerification} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={loading} style={{ padding: "10px 12px" }}>
            {loading ? "Sending..." : "Send verification email"}
          </button>
        </form>
      </section>

      {/* Dev Token Display (only in dev mode) */}
      {devToken ? (
        <section style={{ marginBottom: 32, padding: 12, backgroundColor: "#fef3c7", borderRadius: 4 }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "#92400e" }}>DEV MODE: Token received</p>
          <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{devToken}</code>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "#78350f" }}>
            Token auto-filled below. Click &quot;Confirm&quot; to verify.
          </p>
        </section>
      ) : null}

      {/* Confirm Verification Form */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Step 2: Confirm Verification</h2>
        <form onSubmit={handleConfirmVerification} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Verification Token
            <input
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
              placeholder="Paste token from email"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={loading || !token} style={{ padding: "10px 12px" }}>
            {loading ? "Verifying..." : "Confirm verification"}
          </button>
        </form>
      </section>

      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      <nav style={{ marginTop: 24 }}>
        <p>
          <Link href="/login">Back to Sign in</Link>
        </p>
        <p>
          <Link href="/auth/reset">Forgot password?</Link>
        </p>
      </nav>
    </main>
  );
}

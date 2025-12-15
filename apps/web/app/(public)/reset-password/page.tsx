"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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

      // Always show success to prevent email enumeration
      setSubmitted(true);
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
    <main className="main">
      <h1>Reset Password</h1>

      {!submitted ? (
        <section style={{ marginBottom: 32 }}>
          <p>Enter your email address and we&apos;ll send you a link to reset your password.</p>
          <form onSubmit={handleRequestReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </label>
            <button type="submit" disabled={loading} style={{ padding: "10px 12px" }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </section>
      ) : (
        <section style={{ marginBottom: 32 }}>
          <p style={{ color: "#047857" }}>
            If that email exists in our system, a reset link has been sent. Please check your inbox.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setDevToken(null);
            }}
            style={{ padding: "10px 12px", marginTop: 12 }}
          >
            Send another request
          </button>
        </section>
      )}

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {/* Dev Token Display (only in dev mode) */}
      {devToken ? (
        <section style={{ marginBottom: 32, padding: 12, backgroundColor: "#fef3c7", borderRadius: 4 }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "#92400e" }}>DEV MODE: Reset Token</p>
          <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{devToken}</code>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "#78350f" }}>
            Use this token on the{" "}
            <Link href={`/reset-password/confirm?token=${encodeURIComponent(devToken)}`} style={{ color: "#1d4ed8" }}>
              confirmation page
            </Link>
            .
          </p>
        </section>
      ) : null}

      <nav style={{ marginTop: 24 }}>
        <p>
          <Link href="/login">Back to Sign in</Link>
        </p>
        <p>
          <Link href="/reset-password/confirm">Already have a reset token?</Link>
        </p>
      </nav>
    </main>
  );
}

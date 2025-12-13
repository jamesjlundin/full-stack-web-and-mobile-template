"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
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
      const response = await fetch("/api/auth/password/reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setMessage("Password reset email sent! Check your inbox.");
        if (data.devToken) {
          setDevToken(data.devToken);
        }
      } else {
        setError(data.error ?? "Failed to send reset email");
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
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
          <button type="submit" disabled={loading} style={{ padding: "10px 12px" }}>
            {loading ? "Sending..." : "Request password reset"}
          </button>
        </form>
      </section>

      {message ? <p style={{ color: "#047857" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {/* Dev Token Display (only in dev mode) */}
      {devToken ? (
        <section style={{ marginBottom: 32, padding: 12, backgroundColor: "#fef3c7", borderRadius: 4 }}>
          <p style={{ margin: 0, fontWeight: "bold", color: "#92400e" }}>DEV MODE: Reset Token</p>
          <code style={{ wordBreak: "break-all", fontSize: "0.85rem" }}>{devToken}</code>
          <p style={{ margin: "8px 0 0 0", fontSize: "0.85rem", color: "#78350f" }}>
            Copy this token and use it on the{" "}
            <Link href={`/auth/reset/confirm?token=${encodeURIComponent(devToken)}`} style={{ color: "#1d4ed8" }}>
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
          <Link href="/auth/verify">Verify your email</Link>
        </p>
        <p>
          <Link href="/auth/reset/confirm">Already have a reset token?</Link>
        </p>
      </nav>
    </main>
  );
}

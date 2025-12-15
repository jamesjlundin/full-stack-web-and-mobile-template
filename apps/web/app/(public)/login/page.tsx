"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextUrl = searchParams.get("next") || "/app/(protected)/home";

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
        router.push(nextUrl);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setError(data?.message ?? "Unable to sign in. Check your credentials and try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        <button type="submit" disabled={loading} style={{ padding: "10px 12px" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p>
        Need an account? <Link href="/register">Create one</Link>
      </p>
      <p>
        <Link href="/reset-password">Forgot password?</Link> | <Link href="/auth/verify">Verify email</Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="main"><h1>Sign in</h1><p>Loading...</p></main>}>
      <LoginForm />
    </Suspense>
  );
}

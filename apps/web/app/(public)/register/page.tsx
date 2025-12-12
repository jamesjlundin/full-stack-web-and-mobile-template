"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const signupResponse = await fetch("/api/auth/email-password/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!signupResponse.ok) {
        const data = await signupResponse.json().catch(() => ({}));
        setError(data?.message ?? "Unable to sign up. Please try again.");
        return;
      }

      const signinResponse = await fetch("/api/auth/email-password/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (signinResponse.ok) {
        router.push("/app/(protected)/home");
        return;
      }

      const data = await signinResponse.json().catch(() => ({}));
      setError(data?.message ?? "Signed up but failed to sign in. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <h1>Create an account</h1>
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
          {loading ? "Signing up..." : "Create account"}
        </button>
      </form>
      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
      <p>
        Visit the protected <Link href="/app/(protected)/home">home page</Link>.
      </p>
    </main>
  );
}

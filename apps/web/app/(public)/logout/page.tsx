"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.message ?? "Failed to sign out. Please try again.");
        return;
      }

      setStatus("Signed out successfully.");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main">
      <h1>Sign out</h1>
      <p>You are about to sign out of your account.</p>
      {status ? <p style={{ color: "#16a34a" }}>{status}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
      <button onClick={handleLogout} disabled={loading} style={{ padding: "10px 12px" }}>
        {loading ? "Signing out..." : "Sign out"}
      </button>
      <p>
        Go back to the <Link href="/">home page</Link> or <Link href="/login">sign in</Link>.
      </p>
    </main>
  );
}

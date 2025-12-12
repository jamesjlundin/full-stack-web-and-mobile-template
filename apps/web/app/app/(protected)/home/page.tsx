"use client";

import Link from "next/link";

import { useUser } from "../../../_components/useUser";

export default function ProtectedHomePage() {
  const { user, loading, error, refresh } = useUser();

  return (
    <main className="main">
      <h1>Protected home</h1>
      {loading && <p>Loading your account...</p>}
      {error && <p style={{ color: "#b91c1c" }}>Error: {error.message}</p>}
      {!loading && !error && (
        <p>
          Signed in as <strong>{user?.email ?? "Unknown user"}</strong>
        </p>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={refresh} style={{ padding: "8px 12px" }}>
          Refresh session
        </button>
        <Link href="/logout">Sign out</Link>
      </div>
      <p>
        Return to the <Link href="/">public home</Link> or manage your account via the
        <Link href="/login"> login</Link> / <Link href="/register">register</Link> pages.
      </p>
    </main>
  );
}

import { cookies, headers } from "next/headers";
import Link from "next/link";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function getAuthStatus(): Promise<{ isAuthenticated: boolean; email?: string }> {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";

  try {
    const response = await fetch(`${protocol}://${host}/api/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { isAuthenticated: false };
    }

    const data = await response.json();
    return {
      isAuthenticated: !!data?.user,
      email: data?.user?.email,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

export default async function HomePage() {
  const { isAuthenticated, email } = await getAuthStatus();

  return (
    <main className="main">
      <h1 style={{ fontSize: "3rem", marginBottom: "8px" }}>Template Starter</h1>
      <p style={{ fontSize: "1.25rem", color: "#475569", marginBottom: "32px" }}>
        A full-stack foundation for your next project.
      </p>

      {isAuthenticated ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "#16a34a" }}>
            Welcome back{email ? `, ${email}` : ""}!
          </p>
          <Link
            href="/app/(protected)/home"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0f172a",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
              textAlign: "center",
            }}
          >
            Enter app
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0f172a",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Create account
          </Link>
          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#e2e8f0",
              color: "#0f172a",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Sign in
          </Link>
        </div>
      )}

      <details style={{ marginTop: "48px" }}>
        <summary style={{ cursor: "pointer", color: "#64748b", fontSize: "0.875rem" }}>
          Developer info
        </summary>
        <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "#f1f5f9", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            API endpoint: <span className="code">{apiUrl || "Not configured"}</span>
          </p>
        </div>
      </details>
    </main>
  );
}

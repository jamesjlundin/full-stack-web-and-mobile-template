import Link from "next/link";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  return (
    <main className="main">
      <h1>Welcome to ACME Web</h1>
      <p>Start building the web experience using Next.js App Router.</p>
      <p>
        API endpoint:
        <span className="code">{apiUrl}</span>
      </p>
      <p>
        Get started by <Link href="/register">creating an account</Link> or <Link href="/login">signing in</Link>.
        Visit the <Link href="/app/(protected)/home">protected home</Link> once authenticated.
      </p>
    </main>
  );
}

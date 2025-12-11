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
    </main>
  );
}

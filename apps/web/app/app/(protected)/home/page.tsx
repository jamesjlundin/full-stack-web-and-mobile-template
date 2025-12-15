import Link from "next/link";

import { getServerSession } from "../../../../lib/session";

import { SignOutButton } from "./_components/SignOutButton";

export default async function ProtectedHomePage() {
  const user = await getServerSession();

  // Display name: prefer name, fall back to email, then generic message
  const displayName = user?.name || user?.email || "Signed in";

  return (
    <main className="main">
      <h1>Protected Home</h1>
      <p>
        Signed in as <strong>{displayName}</strong>
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SignOutButton />
      </div>
      <p style={{ marginTop: "24px" }}>
        Return to the <Link href="/">public home</Link>.
      </p>
    </main>
  );
}

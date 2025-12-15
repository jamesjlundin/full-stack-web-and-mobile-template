import { redirect } from "next/navigation";

import { getServerSession } from "../../lib/session";

import type { ReactNode } from "react";


export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();

  if (!user) {
    // Redirect to login - middleware should have caught this, but this is a fallback
    redirect("/login?next=/app");
  }

  return <>{children}</>;
}

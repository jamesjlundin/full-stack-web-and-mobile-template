import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout";

import { getServerSession } from "../../lib/session";

import type { ReactNode } from "react";


export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerSession();

  if (!user) {
    redirect("/login?next=/app");
  }

  return (
    <AppShell user={{ email: user.email, name: user.name }}>
      {children}
    </AppShell>
  );
}

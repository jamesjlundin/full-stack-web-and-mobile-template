import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout';

import { getServerSession } from '../../lib/session';

import type { ReactNode } from 'react';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, config } = await getServerSession();

  if (!user) {
    redirect('/login?next=/app');
  }

  // Redirect to verification page if email verification is required but not verified
  if (config.isEmailVerificationRequired && !user.emailVerified) {
    redirect(`/auth/verify?email=${encodeURIComponent(user.email)}`);
  }

  return <AppShell user={{ email: user.email, name: user.name }}>{children}</AppShell>;
}

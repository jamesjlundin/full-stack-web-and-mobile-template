import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layout';

import { getServerSession } from '../../lib/session';

import type { ReactNode } from 'react';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, config } = await getServerSession();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/app/home';

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  // Redirect to verification page if email verification is required but not verified
  if (config.isEmailVerificationRequired && !user.emailVerified) {
    redirect(
      `/auth/verify?email=${encodeURIComponent(user.email)}&next=${encodeURIComponent(pathname)}`,
    );
  }

  return <AppShell user={{ email: user.email, name: user.name }}>{children}</AppShell>;
}

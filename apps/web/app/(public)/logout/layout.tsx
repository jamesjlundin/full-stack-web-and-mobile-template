import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign Out',
};

export default function LogoutLayout({ children }: { children: ReactNode }) {
  return children;
}

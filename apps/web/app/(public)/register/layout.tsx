import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}

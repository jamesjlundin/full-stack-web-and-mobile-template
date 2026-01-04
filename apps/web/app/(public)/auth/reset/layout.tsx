import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Reset Password',
};

export default function AuthResetLayout({ children }: { children: ReactNode }) {
  return children;
}

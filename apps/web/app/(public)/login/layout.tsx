import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}

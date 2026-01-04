import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Set New Password',
};

export default function ConfirmResetLayout({ children }: { children: ReactNode }) {
  return children;
}

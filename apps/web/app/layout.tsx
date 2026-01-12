import './globals.css';

import { GoogleAnalytics } from '@/components/google-analytics';
import { NavigationProgress } from '@/components/navigation-progress';
import { StaleDataBanner } from '@/components/stale-data-banner';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    template: '%s | Template',
    default: 'Template',
  },
  description: 'Full-stack web and mobile template.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavigationProgress />
          {children}
          <StaleDataBanner />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

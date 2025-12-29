'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface SignOutMenuItemProps {
  asMobileLink?: boolean;
}

export function SignOutMenuItem({ asMobileLink }: SignOutMenuItemProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (asMobileLink) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-medium text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {loading ? 'Signing out...' : 'Sign out'}
      </button>
    );
  }

  return (
    <DropdownMenuItem
      onClick={handleSignOut}
      disabled={loading}
      className="text-destructive focus:text-destructive cursor-pointer"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? 'Signing out...' : 'Sign out'}
    </DropdownMenuItem>
  );
}

'use client';

import { RefreshCw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useStaleState } from '@/hooks/use-stale-state';
import { cn } from '@/lib/utils';

interface StaleDataBannerProps {
  /**
   * How long (in ms) the tab must be hidden before showing the banner.
   * Default: 5 minutes
   */
  staleTime?: number;

  /**
   * Custom message to display
   */
  message?: string;

  /**
   * Position of the banner
   */
  position?: 'top' | 'bottom';
}

/**
 * A banner that appears when the user returns to a tab after a period of inactivity,
 * indicating that the displayed data may be outdated and offering to refresh.
 */
export function StaleDataBanner({
  staleTime = 5 * 60 * 1000,
  message = 'This page may have outdated information.',
  position = 'bottom',
}: StaleDataBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isStale, markFresh, hiddenDuration } = useStaleState({
    staleTime,
  });

  // Listen for refresh requests from the stale state hook
  useEffect(() => {
    const handleRefreshRequest = () => {
      handleRefresh();
    };

    window.addEventListener('stale-refresh-requested', handleRefreshRequest);
    return () => {
      window.removeEventListener('stale-refresh-requested', handleRefreshRequest);
    };
  }, []);

  // Reset dismissed state when data is marked fresh
  useEffect(() => {
    if (!isStale) {
      setDismissed(false);
    }
  }, [isStale]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();

    // Wait for the refresh to complete, then mark fresh
    setTimeout(() => {
      setIsRefreshing(false);
      markFresh();
    }, 1000);
  }, [router, markFresh]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Format the hidden duration for display
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour';
    return `${hours} hours`;
  };

  if (!isStale || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 flex items-center justify-between gap-4 bg-amber-500/90 px-4 py-2 text-sm text-amber-950 backdrop-blur-sm dark:bg-amber-600/90 dark:text-amber-50',
        position === 'top' ? 'top-0' : 'bottom-0',
      )}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
        <span>
          {message}
          {hiddenDuration > 0 && (
            <span className="ml-1 opacity-80">(away for {formatDuration(hiddenDuration)})</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-7 bg-amber-600/20 px-3 text-amber-950 hover:bg-amber-600/30 dark:text-amber-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-7 w-7 p-0 text-amber-950 hover:bg-amber-600/20 dark:text-amber-50"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

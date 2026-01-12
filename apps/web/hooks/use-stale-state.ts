'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseStaleStateOptions {
  /**
   * How long (in ms) the tab must be hidden before data is considered stale.
   * Default: 5 minutes
   */
  staleTime?: number;

  /**
   * Callback to run when the tab becomes visible after being stale.
   * Use this to trigger data refresh.
   */
  onStale?: () => void;

  /**
   * Whether to automatically refresh the page when stale.
   * Default: false
   */
  autoRefresh?: boolean;
}

interface UseStaleStateReturn {
  /**
   * Whether the current data is considered stale
   */
  isStale: boolean;

  /**
   * How long the tab has been hidden (in ms)
   */
  hiddenDuration: number;

  /**
   * Manually mark the data as fresh (e.g., after a successful refresh)
   */
  markFresh: () => void;

  /**
   * Whether a refresh is currently in progress
   */
  isRefreshing: boolean;

  /**
   * Trigger a refresh (calls router.refresh() and tracks state)
   */
  refresh: () => Promise<void>;
}

/**
 * Hook to detect when a browser tab has been hidden for too long
 * and the displayed data might be stale.
 *
 * This is useful for Next.js apps where server components may have
 * fetched data that becomes outdated when the user leaves a tab open.
 */
export function useStaleState(options: UseStaleStateOptions = {}): UseStaleStateReturn {
  const { staleTime = 5 * 60 * 1000, onStale, autoRefresh = false } = options;

  const [isStale, setIsStale] = useState(false);
  const [hiddenDuration, setHiddenDuration] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hiddenAtRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  const markFresh = useCallback(() => {
    setIsStale(false);
    setHiddenDuration(0);
    hasTriggeredRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Dispatch a custom event that components can listen to for refresh
      // The StaleDataBanner component uses router.refresh() to handle this
      window.dispatchEvent(new CustomEvent('stale-refresh-requested'));

      // Wait a bit for the refresh to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
      markFresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [markFresh]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden - record the time
        hiddenAtRef.current = Date.now();
        hasTriggeredRef.current = false;
      } else {
        // Tab is becoming visible
        if (hiddenAtRef.current) {
          const duration = Date.now() - hiddenAtRef.current;
          setHiddenDuration(duration);

          if (duration >= staleTime && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setIsStale(true);
            onStale?.();

            if (autoRefresh) {
              refresh();
            }
          }
        }
        hiddenAtRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [staleTime, onStale, autoRefresh, refresh]);

  return {
    isStale,
    hiddenDuration,
    markFresh,
    isRefreshing,
    refresh,
  };
}

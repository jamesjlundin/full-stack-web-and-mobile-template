'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * NavigationProgress displays a thin progress bar at the top of the viewport
 * during Next.js route transitions. It uses router events to detect navigation.
 */
export function NavigationProgress() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Track navigation using the experimental navigation API if available
    // Otherwise, we'll rely on click handlers on links

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    const startProgress = () => {
      setIsNavigating(true);
      setProgress(0);

      // Simulate progress - fast at first, then slows down
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            return prev; // Cap at 90% until complete
          }
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) * 0.1);
          return Math.min(90, prev + increment);
        });
      }, 100);
    };

    const completeProgress = () => {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
    };

    // Listen for click events on links to detect navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.target && !anchor.download) {
        const url = new URL(anchor.href, window.location.origin);
        // Only trigger for internal navigation
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          startProgress();
        }
      }
    };

    // Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      startProgress();
    };

    // Listen for the page to finish loading
    const handleLoad = () => {
      completeProgress();
    };

    // Use MutationObserver to detect when the main content changes (navigation complete)
    const observer = new MutationObserver(() => {
      if (isNavigating) {
        completeProgress();
      }
    });

    // Observe the body for changes that indicate navigation completed
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('load', handleLoad);

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      observer.disconnect();
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('load', handleLoad);
    };
  }, [isNavigating]);

  if (!isNavigating && progress === 0) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-0.5">
      <div
        className={cn(
          'h-full bg-primary transition-all duration-200 ease-out',
          progress === 100 && 'opacity-0',
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

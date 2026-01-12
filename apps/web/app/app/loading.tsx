import { Spinner } from '@/components/ui/spinner';

/**
 * Loading state for the protected app section.
 * This is shown while the server component fetches session data
 * and validates authentication.
 */
export default function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';

type User = {
  id?: string;
  email?: string;
  [key: string]: unknown;
};

type UseUserResult = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

let cachedUser: User | null | undefined;
let cachedError: Error | null = null;
let inflightRequest: Promise<User | null> | null = null;

async function fetchUser(): Promise<User | null> {
  if (!inflightRequest) {
    inflightRequest = fetch('/api/me', { credentials: 'include' })
      .then(async (response) => {
        if (response.status === 401) {
          cachedUser = null;
          cachedError = null;
          return null;
        }

        const data = await response.json().catch(() => ({ user: null }));
        const user = (data?.user as User | undefined) ?? null;

        cachedUser = user;
        cachedError = null;

        return user;
      })
      .catch((error) => {
        cachedError = error instanceof Error ? error : new Error('Failed to load user');
        throw cachedError;
      })
      .finally(() => {
        inflightRequest = null;
      });
  }

  return inflightRequest;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(cachedUser ?? null);
  const [error, setError] = useState<Error | null>(cachedError);
  const [loading, setLoading] = useState<boolean>(cachedUser === undefined && !cachedError);

  useEffect(() => {
    let isMounted = true;

    if (cachedUser === undefined && !cachedError) {
      setLoading(true);
      fetchUser()
        .then((result) => {
          if (!isMounted) return;
          setUser(result);
          setError(null);
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          setError(err);
        })
        .finally(() => {
          if (!isMounted) return;
          setLoading(false);
        });
    } else if (inflightRequest) {
      setLoading(true);
      inflightRequest
        .then((result) => {
          if (!isMounted) return;
          setUser(result);
          setError(null);
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          setError(err);
        })
        .finally(() => {
          if (!isMounted) return;
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    cachedUser = undefined;
    cachedError = null;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchUser();
      setUser(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, refresh };
}

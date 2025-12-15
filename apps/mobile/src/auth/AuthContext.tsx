import {createApiClient, type User} from '@acme/api-client';
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {API_BASE} from '../config/api';

import {clearToken, loadToken, saveToken} from './tokenStorage';

type AuthContextValue = {
  /** The currently authenticated user, or null if not authenticated */
  user: User | null;
  /** The current session token, or null if not authenticated */
  token: string | null;
  /** True while restoring session on app startup */
  loading: boolean;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account and sign in */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out and clear secure storage */
  signOut: () => Promise<void>;
  /** Re-validate the current session with the server */
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: PropsWithChildren) {
  const apiClient = useMemo(() => createApiClient({baseUrl: API_BASE}), []);

  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Bootstrap: On app startup, load token from secure storage
   * and validate it with the server
   */
  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const existingToken = await loadToken();

        if (!existingToken) {
          // No token stored - user needs to sign in
          return;
        }

        // Validate the token with the server
        try {
          const existingUser = await apiClient.getMe({token: existingToken});

          if (existingUser && isMounted) {
            setTokenState(existingToken);
            setUser(existingUser);
          } else if (isMounted) {
            // Token is invalid - clear it
            await clearToken();
          }
        } catch {
          // API call failed (token expired, server error, etc.)
          // Clear the invalid token
          if (isMounted) {
            await clearToken();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  /**
   * Sign in with email and password
   * Stores token in secure storage and updates state
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.signIn({
        email,
        password,
      });

      const nextToken = response.token;
      const nextUser = response.user;

      // These checks are defensive - apiClient.signIn throws if these are missing
      if (!nextToken || !nextUser) {
        throw new Error('Invalid sign-in response');
      }

      // Save token to secure storage first
      await saveToken(nextToken);

      // Then update state
      setTokenState(nextToken);
      setUser(nextUser);
    },
    [apiClient],
  );

  /**
   * Create a new account and automatically sign in
   */
  const signUp = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_BASE}/api/auth/email-password/sign-up`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({email, password}),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Sign-up failed with status ${response.status}${
            errorText ? `: ${errorText}` : ''
          }`,
        );
      }

      // After successful sign-up, sign in
      await signIn(email, password);
    },
    [signIn],
  );

  /**
   * Sign out: Clear secure storage and reset state
   */
  const signOut = useCallback(async () => {
    // Clear token from secure storage
    await clearToken();

    // Reset state
    setTokenState(null);
    setUser(null);
  }, []);

  /**
   * Refresh/re-validate the current session with the server
   * Useful after app comes to foreground or on network reconnect
   */
  const refreshSession = useCallback(async () => {
    const currentToken = await loadToken();

    if (!currentToken) {
      // No token - user is signed out
      setTokenState(null);
      setUser(null);
      return;
    }

    try {
      const refreshedUser = await apiClient.getMe({token: currentToken});

      if (refreshedUser) {
        setUser(refreshedUser);
        setTokenState(currentToken);
      } else {
        // Token is no longer valid
        await clearToken();
        setTokenState(null);
        setUser(null);
      }
    } catch {
      // API call failed - token may be expired
      await clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, [apiClient]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [loading, refreshSession, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

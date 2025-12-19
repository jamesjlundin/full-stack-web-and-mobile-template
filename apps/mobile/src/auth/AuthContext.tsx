import {createApiClient, type AppConfig, type User} from '@acme/api-client';
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

type SignUpResult = {
  requiresVerification: boolean;
  email: string;
};

type AuthContextValue = {
  /** The currently authenticated user, or null if not authenticated */
  user: User | null;
  /** The current session token, or null if not authenticated */
  token: string | null;
  /** True while restoring session on app startup */
  loading: boolean;
  /** App configuration including email verification requirements */
  config: AppConfig;
  /** Whether the user needs to verify their email (authenticated but unverified) */
  needsVerification: boolean;
  /** Email address pending verification (from sign-up or sign-in of unverified account) */
  pendingVerificationEmail: string | null;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Create a new account. Returns whether verification is required. */
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  /** Sign out and clear secure storage */
  signOut: () => Promise<void>;
  /** Re-validate the current session with the server */
  refreshSession: () => Promise<void>;
  /** Request a verification email to be sent */
  requestVerificationEmail: (email: string) => Promise<{ok: boolean; error?: string}>;
  /** Clear the pending verification email (e.g., when going back to sign-in) */
  clearPendingVerification: () => void;
};

const defaultConfig: AppConfig = {isEmailVerificationRequired: false};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: PropsWithChildren) {
  const apiClient = useMemo(() => createApiClient({baseUrl: API_BASE}), []);

  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Compute whether verification is needed
  const needsVerification = useMemo(() => {
    if (!user) return false;
    return config.isEmailVerificationRequired && !user.emailVerified;
  }, [user, config.isEmailVerificationRequired]);

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
          // Still fetch config
          try {
            const appConfig = await apiClient.getConfig();
            if (isMounted) {
              setConfig(appConfig);
            }
          } catch {
            // Ignore config fetch errors
          }
          return;
        }

        // Validate the token with the server
        try {
          const result = await apiClient.getMe({token: existingToken});

          if (result.user && isMounted) {
            setTokenState(existingToken);
            setUser(result.user);
            setConfig(result.config);
          } else if (isMounted) {
            // Token is invalid - clear it
            await clearToken();
            setConfig(result.config);
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
   * Throws an error with requiresVerification flag if email not verified
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.signIn({
        email,
        password,
      });

      // Check if verification is required
      if (!response.success) {
        // Fetch config to update state
        try {
          const appConfig = await apiClient.getConfig();
          setConfig(appConfig);
        } catch {
          // Ignore config fetch errors
        }

        // Set pending verification email to trigger verification screen
        setPendingVerificationEmail(response.email);
        return;
      }

      const nextToken = response.token;
      const nextUser = response.user;

      // Save token to secure storage first
      await saveToken(nextToken);

      // Then update state
      setTokenState(nextToken);
      setUser(nextUser);

      // Fetch latest config
      try {
        const result = await apiClient.getMe({token: nextToken});
        if (result.config) {
          setConfig(result.config);
        }
      } catch {
        // Ignore - we already have a default config
      }
    },
    [apiClient],
  );

  /**
   * Create a new account
   * Returns whether verification is required
   */
  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
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

      const data = await response.json().catch(() => ({}));

      // If verification is required, don't sign in - return the result
      if (data.requiresVerification) {
        // Fetch config to update state
        try {
          const appConfig = await apiClient.getConfig();
          setConfig(appConfig);
        } catch {
          // Ignore config fetch errors
        }

        return {
          requiresVerification: true,
          email: data.email || email,
        };
      }

      // No verification required - sign in
      await signIn(email, password);

      return {
        requiresVerification: false,
        email,
      };
    },
    [apiClient, signIn],
  );

  /**
   * Request a verification email
   */
  const requestVerificationEmail = useCallback(
    async (email: string): Promise<{ok: boolean; error?: string}> => {
      const result = await apiClient.requestVerificationEmail({
        email,
        token: token ?? undefined,
      });
      return {ok: result.ok, error: result.error};
    },
    [apiClient, token],
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
   * Clear the pending verification email
   * Used when navigating away from verification screen
   */
  const clearPendingVerification = useCallback(() => {
    setPendingVerificationEmail(null);
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
      const result = await apiClient.getMe({token: currentToken});

      if (result.user) {
        setUser(result.user);
        setTokenState(currentToken);
        setConfig(result.config);
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
      config,
      needsVerification,
      pendingVerificationEmail,
      signIn,
      signUp,
      signOut,
      refreshSession,
      requestVerificationEmail,
      clearPendingVerification,
    }),
    [
      clearPendingVerification,
      config,
      loading,
      needsVerification,
      pendingVerificationEmail,
      refreshSession,
      requestVerificationEmail,
      signIn,
      signOut,
      signUp,
      token,
      user,
    ],
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

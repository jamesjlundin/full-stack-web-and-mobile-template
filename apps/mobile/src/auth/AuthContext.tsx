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

import {clearToken, getToken, setToken} from './tokenStorage';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: PropsWithChildren) {
  const apiClient = useMemo(() => createApiClient({baseUrl: API_BASE}), []);

  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const existingToken = await getToken();

        if (!existingToken) {
          return;
        }

        const existingUser = await apiClient.getMe({token: existingToken});

        if (existingUser) {
          setTokenState(existingToken);
          setUser(existingUser);
        } else {
          await clearToken();
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

  const signIn = useCallback(
    async (email: string, password: string) => {
      const {token: nextToken, user: nextUser} = await apiClient.signIn({
        email,
        password,
      });

      await setToken(nextToken);
      setTokenState(nextToken);
      setUser(nextUser);
    },
    [apiClient],
  );

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

      await signIn(email, password);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, signIn, signOut, signUp, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}


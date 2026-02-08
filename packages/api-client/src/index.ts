import type { AppConfig, ChatChunk, User } from '@acme/types';

// Default timeout for API requests (10 seconds)
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Fetch with timeout support.
 * Prevents indefinite hangs when server is unreachable.
 */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit & { timeout?: number },
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchInit } = init ?? {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

type ApiClientConfig = {
  baseUrl?: string;
};

type SignInParams = {
  email: string;
  password: string;
};

export type StreamChatParams = {
  prompt: string;
  token?: string;
  signal?: AbortSignal;
};

export type GetMeParams = {
  token?: string;
};

export type GetMeResult = {
  user: User | null;
  config: AppConfig;
};

export type SignInResult =
  | {
      success: true;
      token: string;
      user: User;
    }
  | {
      success: false;
      requiresVerification: true;
      email: string;
    };

export type RequestVerificationParams = {
  email: string;
  token?: string;
};

export type RequestVerificationResult = {
  ok: boolean;
  error?: string;
  devToken?: string;
};

function resolveUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

export async function* streamFetch(url: string, init?: RequestInit): AsyncGenerator<ChatChunk> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is not readable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();

    if (value) {
      const text = decoder.decode(value, { stream: true });

      if (text) {
        yield { content: text };
      }
    }

    if (done) {
      break;
    }
  }

  const remaining = decoder.decode();

  if (remaining) {
    yield { content: remaining };
  }

  yield { content: '', done: true };
}

export function createApiClient({ baseUrl = '' }: ApiClientConfig = {}) {
  const buildUrl = (path: string) => resolveUrl(path, baseUrl);

  const defaultConfig: AppConfig = {
    isEmailVerificationRequired: false,
    isGoogleAuthEnabled: false,
    blobStorageEnabled: false,
    ai: { providers: [], defaultProvider: null },
    analytics: { googleAnalyticsId: null },
  };

  const getMe = async ({ token }: GetMeParams = {}): Promise<GetMeResult> => {
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetchWithTimeout(buildUrl('/api/me'), { headers });

      if (!response.ok) {
        return { user: null, config: defaultConfig };
      }

      const data = (await response.json().catch(() => null)) as {
        user?: User;
        config?: AppConfig;
      } | null;

      return {
        user: data?.user ?? null,
        config: data?.config ?? defaultConfig,
      };
    } catch {
      return { user: null, config: defaultConfig };
    }
  };

  const getConfig = async (): Promise<AppConfig> => {
    try {
      const response = await fetchWithTimeout(buildUrl('/api/config'));

      if (!response.ok) {
        return defaultConfig;
      }

      const data = (await response.json().catch(() => null)) as AppConfig | null;
      return data ?? defaultConfig;
    } catch {
      return defaultConfig;
    }
  };

  const signIn = async ({ email, password }: SignInParams): Promise<SignInResult> => {
    const response = await fetch(buildUrl('/api/auth/token'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Handle verification required response (403)
    if (response.status === 403) {
      const payload = (await response.json().catch(() => null)) as {
        requiresVerification?: boolean;
        email?: string;
      } | null;

      if (payload?.requiresVerification) {
        return {
          success: false,
          requiresVerification: true,
          email: payload.email || email,
        };
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Sign-in failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`,
      );
    }

    const payload = (await response.json().catch(() => null)) as {
      token?: string;
      user?: User;
    } | null;

    if (!payload?.token || !payload.user) {
      throw new Error('Invalid sign-in response');
    }

    return {
      success: true,
      token: payload.token,
      user: payload.user,
    };
  };

  const requestVerificationEmail = async ({
    email,
    token,
  }: RequestVerificationParams): Promise<RequestVerificationResult> => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl('/api/auth/email/verify/request'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ email }),
    });

    const data = (await response.json().catch(() => null)) as RequestVerificationResult | null;

    return data ?? { ok: false, error: 'Unknown error' };
  };

  const streamChat = async function* ({ prompt, token, signal }: StreamChatParams) {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = buildUrl('/api/chat/stream');

    yield* streamFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
      signal,
    });
  };

  return {
    getConfig,
    getMe,
    requestVerificationEmail,
    signIn,
    streamChat,
  };
}

const defaultClient = createApiClient();

export const getConfig = defaultClient.getConfig;
export const getMe = defaultClient.getMe;
export const requestVerificationEmail = defaultClient.requestVerificationEmail;
export const signIn = defaultClient.signIn;
export const streamChat = defaultClient.streamChat;

export type { AiModelInfo, AiProviderInfo, AppConfig, ChatChunk, User } from '@acme/types';

import type { ChatChunk, User } from "@acme/types";

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

function resolveUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

export async function* streamFetch(
  url: string,
  init?: RequestInit,
): AsyncGenerator<ChatChunk> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is not readable");
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

  yield { content: "", done: true };
}

export function createApiClient({ baseUrl = "" }: ApiClientConfig = {}) {
  const buildUrl = (path: string) => resolveUrl(path, baseUrl);

  const getMe = async ({ token }: GetMeParams = {}): Promise<User | null> => {
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildUrl("/api/me"), { headers });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => null)) as
      | { user?: User }
      | null;

    return data?.user ?? null;
  };

  const signIn = async ({ email, password }: SignInParams) => {
    const response = await fetch(buildUrl("/api/auth/token"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Sign-in failed with status ${response.status}${errorText ? `: ${errorText}` : ""}`,
      );
    }

    const payload = (await response.json().catch(() => null)) as
      | { token?: string; user?: User }
      | null;

    if (!payload?.token || !payload.user) {
      throw new Error("Invalid sign-in response");
    }

    return payload;
  };

  const streamChat = async function* ({ prompt, token, signal }: StreamChatParams) {
    const headers: HeadersInit = {
      "content-type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = buildUrl("/api/chat/stream");

    yield* streamFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt }),
      signal,
    });
  };

  return {
    getMe,
    signIn,
    streamChat,
  };
}

const defaultClient = createApiClient();

export const getMe = defaultClient.getMe;
export const signIn = defaultClient.signIn;
export const streamChat = defaultClient.streamChat;

export type { ChatChunk, User } from "@acme/types";

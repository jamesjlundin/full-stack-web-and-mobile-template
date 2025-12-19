export type ChatChunk = {
  content: string;
  done?: boolean;
};

export type User = {
  id: string;
  email: string;
  emailVerified?: boolean;
};

export type AiModelInfo = {
  id: string;
  name: string;
};

export type AiProviderInfo = {
  id: string;
  name: string;
  models: AiModelInfo[];
  defaultModel: string;
};

export type AppConfig = {
  isEmailVerificationRequired: boolean;
  isGoogleAuthEnabled: boolean;
  ai: {
    providers: AiProviderInfo[];
    defaultProvider: string | null;
  };
};

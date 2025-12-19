export type ChatChunk = {
  content: string;
  done?: boolean;
};

export type User = {
  id: string;
  email: string;
  emailVerified?: boolean;
};

export type AppConfig = {
  isEmailVerificationRequired: boolean;
};

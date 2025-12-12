export type ChatChunk = {
  content: string;
  done?: boolean;
};

export type User = {
  id: string;
  email: string;
};

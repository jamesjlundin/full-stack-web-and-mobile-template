import type { PromptDef } from '../types';

/**
 * Default chat prompt v1
 *
 * To create v2: Copy this file to default.v2.ts, update id/version/content,
 * then flip the router mapping in router.ts to use v2.
 */
export const chatDefaultV1: PromptDef = {
  id: 'chat.default',
  version: 1,
  content: `You are a helpful AI assistant. Respond concisely and accurately to user questions.

Guidelines:
- Be helpful and informative
- Provide clear and direct answers
- If you don't know something, say so
- Keep responses focused and relevant`,
};

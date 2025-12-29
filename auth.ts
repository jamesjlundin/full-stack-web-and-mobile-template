import { auth } from './packages/auth/src/index.js';

export { auth, authHandler, getCurrentUser } from './packages/auth/src/index.js';
export type { CurrentUserResult } from './packages/auth/src/index.js';

export default auth;

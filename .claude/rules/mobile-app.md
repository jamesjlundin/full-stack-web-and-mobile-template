---
paths:
  - 'apps/mobile/**'
---

# Mobile App Conventions (React Native)

## Structure

- Screens: apps/mobile/src/screens/
- Auth and token storage: apps/mobile/src/auth/

## Auth Model

- Mobile uses JWT-based auth; avoid web-session assumptions in mobile code.
- Access tokens are short-lived JWTs (15 min). Refresh tokens are long-lived (90 days) and rotate on each use.

## Authenticated API Calls — MANDATORY

**All authenticated API calls MUST use `useApiFetch` from `src/lib/api.ts`.**

This hook provides automatic 401 -> refresh token rotation -> retry, auth generation guards against stale requests, and consistent error handling via `ApiResponse<T>`.

**DO NOT:**

- Use raw `fetch()` with `Authorization: Bearer ${token}` headers
- Import `API_BASE` and construct URLs manually for authenticated requests
- Pull `token` from `useAuth()` just to pass it to fetch headers

**ONLY exceptions** (these files must use direct `fetch` because they ARE the auth infrastructure):

- `src/auth/AuthContext.tsx` — bootstrap, refreshSession, sign-out
- `src/lib/api.ts` — the `attemptRefresh` function itself

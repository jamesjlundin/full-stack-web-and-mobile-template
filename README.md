# Full-Stack Web & Mobile Template

A production-ready GitHub template for building full-stack applications with a shared codebase across web and mobile platforms. This monorepo provides everything you need to start a new project with authentication, database, API routes, AI chat streaming, and deployment automation—all wired up and ready to go.

---

## Quickstart: From Template to Production

### 1. Create Your Repository

1. On this repo, click **"Use this template"** → **"Create a new repository"**
2. Name your repo and click **"Create repository"**

### 2. Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** → select your new repo
3. Under **"Root Directory"**, click **"Edit"** → type `apps/web` → click **"Continue"**
4. Click **"Deploy"** — it will fail (that's OK, we need env vars first)

### 3. Create Neon Database

1. In your Vercel project, click the **"Storage"** tab
2. Click **"Create Database"** → select **"Postgres"**
3. Select **"Neon"** as provider → click **"Continue"** → **"Create"**

Vercel automatically adds these env vars to your project:
- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

### 4. Set Up Resend (Email)

1. Go to [resend.com](https://resend.com) and create an account
2. In the Resend dashboard, click **"API Keys"** → **"Create API Key"**
3. Copy the API key
4. (Optional) Click **"Domains"** → **"Add Domain"** to verify your domain, or use `onboarding@resend.dev` for testing

### 5. Configure Vercel Environment Variables

1. In your Vercel project, click **"Settings"** tab → **"Environment Variables"**
2. Add each variable below (click **"Add"** after each):

**Required** (you must add these manually):

| Variable | Value |
|----------|-------|
| `BETTER_AUTH_SECRET` | Random string, 32+ chars (run `openssl rand -base64 32` in terminal) |
| `APP_BASE_URL` | `https://your-project.vercel.app` (your Vercel URL) |
| `RESEND_API_KEY` | Your Resend API key from step 4 |
| `MAIL_FROM` | Your verified domain email or `onboarding@resend.dev` |

**Optional** (add if using these features):

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | For AI chat functionality |

### 6. Create Deploy Hook

1. In Vercel, click **"Settings"** → **"Git"** (left sidebar)
2. Scroll to **"Deploy Hooks"** → click **"Create Hook"**
3. Name: `GitHub Actions`, Branch: `main` → click **"Create Hook"**
4. Copy the generated URL

### 7. Disable Auto-Deploy

1. In Vercel **"Settings"** → **"Git"**, scroll to **"Ignored Build Step"**
2. Select **"Custom"** and enter: `exit 0`
3. Click **"Save"**

This prevents Vercel from auto-deploying; our GitHub Actions CI/CD handles deployments after running migrations.

### 8. Add GitHub Secrets

1. Go to your GitHub repo → **"Settings"** tab → **"Secrets and variables"** → **"Actions"**
2. Click **"New repository secret"** and add each:

**Required** (both are needed for CI/CD to work):

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Copy from Vercel: Settings → Environment Variables → click `DATABASE_URL` to reveal |
| `VERCEL_DEPLOY_HOOK_URL` | The deploy hook URL from step 6 |

These secrets allow GitHub Actions to run migrations against your production database and trigger Vercel deployments.

### 9. Clone and Set Up Locally

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
pnpm install
cp .env.example .env
```

Edit `.env` with local values:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/acme
BETTER_AUTH_SECRET=local-dev-secret-at-least-32-chars
APP_BASE_URL=http://localhost:3000
```

### 10. Run Locally

```bash
pnpm db:up              # Start local PostgreSQL (requires Docker)
pnpm -C packages/db migrate:apply  # Run migrations
pnpm -C apps/web dev    # Start dev server at localhost:3000
```

### 11. Deploy to Production

```bash
git add -A && git commit -m "Initial setup"
git push origin main
```

This triggers: GitHub Actions → runs migrations → calls Vercel deploy hook → production live.

**Verify:** Visit `https://your-project.vercel.app/api/health` — should return `{"ok":true}`

---

## Demo Features

This template includes demo features in `app/(demo)/` to showcase capabilities. **Remove these before building your production app.**

### AI Agent (`/agent`)

An interactive AI agent with tool calling. Sign in and visit `/agent` to try it.

Features:
- Streaming chat responses
- Tool calling (mock weather and time tools)
- Rate limiting per user

### Removing Demo Features

Before building your project, run these commands to remove demo code:

```bash
# Remove demo pages
rm -rf apps/web/app/\(demo\)

# Remove demo API routes
rm -rf apps/web/app/api/agent

# Remove agent prompt (optional)
rm -rf packages/ai/src/prompts/agent
# Also remove "agent" from PROMPT_MAPPING in packages/ai/src/router.ts
```

---

## What's Included

### Monorepo Architecture

- **pnpm workspaces** for dependency management across apps and packages
- **Turborepo** for fast, cached builds and parallel task execution
- Shared TypeScript configuration and tooling

### Applications

| App | Technology | Description |
|-----|------------|-------------|
| `apps/web` | Next.js 14+ | Server-rendered web app with App Router, middleware, and API routes |
| `apps/mobile` | React Native | Native iOS/Android app with shared API client |

### Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/db` | Drizzle ORM schema, migrations, and database client |
| `packages/auth` | Better Auth configuration and helpers |
| `packages/api-client` | Fetch-based API client with streaming support |
| `packages/ai` | OpenAI integration with Vercel AI SDK |
| `packages/security` | Rate limiting utilities |
| `packages/types` | Shared TypeScript types |
| `packages/tests` | Integration test suite |

### Web Application Features

- **Next.js App Router** with server and client components
- **Middleware-protected routes** with authentication checks
- **Authentication pages**: login, register, logout, email verification, password reset
- **API routes**: `/api/me`, `/api/health`, `/api/auth/*`
- **Streaming chat endpoint** using Vercel AI SDK (`/api/chat/stream`)
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **CORS configuration** for cross-origin requests

### Mobile Application Features

- **Bare React Native** app (no Expo)
- **Authentication flow**: login, register, logout screens
- **Token-based session handling** with AuthContext
- **Protected screens** with automatic auth state management
- **Streaming chat** integration with the API client

### Authentication (Better Auth)

- **Email/password authentication** out of the box
- **Web sessions** using secure HTTP-only cookies
- **Mobile JWT tokens** for API client authentication
- **Email verification** flow with token-based confirmation
- **Password reset** flow with secure token delivery
- **Resend integration** for production email sending
- **Dev mode token echoing** for testing without SMTP

### Database & ORM

- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database queries
- **Drizzle Kit** for schema migrations
- **Pre-configured schema** for users, sessions, accounts, and verifications

### Backend Features

- **Rate limiting** on auth (5 req/min) and chat (10 req/min) endpoints
- **CORS handling** with origin validation
- **JWT token generation** for mobile/API clients
- **Health check endpoint** for monitoring

### DevOps & CI/CD

- **GitHub Actions CI**: type checking, linting, build verification, integration tests
- **PostgreSQL test service** in CI for realistic testing
- **Migration-safe deploy workflow**: runs migrations before triggering Vercel
- **Vercel deploy hook integration** for automated production deployments
- **Neon/Postgres compatibility** for serverless database hosting

---

## Prerequisites

**Required:**
- Node.js 20+, pnpm (`npm install -g pnpm`), Git, Docker

**For mobile development:**
- iOS: Xcode + CocoaPods (`sudo gem install cocoapods`)
- Android: Android Studio with SDK configured

**Accounts:**
- GitHub, Vercel (free tier works), Resend (for email)

---

## Local Development Details

### No Docker?

If Docker is unavailable, install PostgreSQL directly:
```bash
sudo ./scripts/setup-postgres.sh
```

### Mobile App Setup

The mobile app requires the web app running locally for API access.

**iOS:**
```bash
cd apps/mobile/ios && pod install && cd ..
pnpm ios
```

**Android:**
```bash
pnpm android
```

The mobile app connects to `localhost:3000` (iOS) or `10.0.2.2:3000` (Android emulator).

### Database UI

When running `pnpm db:up`, pgweb is available at [http://localhost:8081](http://localhost:8081) for browsing your local database.

---

## Environment Variables Reference

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgres://user:pass@host:5432/db`) |
| `BETTER_AUTH_SECRET` | Secret key for auth tokens (minimum 32 characters) |
| `APP_BASE_URL` | Base URL for auth and email links (e.g., `https://your-app.vercel.app`) |

### Application URLs

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public API URL for client-side requests |
| `PORT` | Server port (default: `3000`) |

### Email Configuration (Resend)

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from [Resend](https://resend.com) |
| `MAIL_FROM` | Sender address (e.g., `"Your App <no-reply@yourdomain.com>"`) |
| `RESEND_DRY_RUN` | Set to `1` to log emails instead of sending (useful for CI) |

### AI/Chat Configuration

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (optional—uses mock responses if not set) |
| `AI_MODEL` | Model to use (default: `gpt-4o-mini`) |

### OAuth Providers (Optional)

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |

### Development/Testing

| Variable | Description |
|----------|-------------|
| `ALLOW_DEV_TOKENS` | Set to `true` to enable token echoing in production builds (testing only—never use in production) |

### Mobile Deep Linking (Optional)

| Variable | Description |
|----------|-------------|
| `MOBILE_APP_SCHEME` | Custom URL scheme for mobile deep links (default: `app-template`) |
| `MOBILE_DEEP_LINK_ENABLED` | Set to `1` to include mobile deep links in password reset emails |

---

## Password Reset Flow

The template includes a complete password reset flow for both web and mobile applications.

### How It Works

1. User navigates to `/reset-password` (web) or "Forgot Password" (mobile)
2. User enters their email address
3. Backend always returns success (prevents email enumeration)
4. If email exists, a reset link is sent via Resend (or logged to console in dev)
5. User clicks the reset link in email
6. User enters new password on `/reset-password/confirm` page
7. Password is updated and user is redirected to login

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/reset/request` | POST | Request password reset (body: `{ email }`) |
| `/api/auth/reset/confirm` | POST | Confirm password reset (body: `{ token, newPassword }`) |

Both endpoints are rate limited to 5 requests per minute per IP.

### Web Pages

- `/reset-password` - Request password reset form
- `/reset-password/confirm` - Set new password form (accepts `?token=` query param)

### Mobile Screens

- `ResetRequestScreen` - Request password reset
- `ResetConfirmScreen` - Enter new password

### Security Features

- **No email enumeration**: Request endpoint always returns 200
- **Rate limiting**: 5 requests per minute per IP
- **Token expiration**: Reset tokens expire after 10 minutes
- **Password validation**: Minimum 8 characters required
- **Dev mode safety**: Tokens only echoed in development or when `ALLOW_DEV_TOKENS=true`

### Development Mode

In development (`NODE_ENV !== "production"`), password reset tokens are:
1. Logged to the server console
2. Returned in the API response as `devToken`
3. Displayed in the UI for easy testing

No emails are sent in development mode.

### Mobile Deep Linking

When `MOBILE_DEEP_LINK_ENABLED=1`, password reset emails include a mobile deep link:

```
{MOBILE_APP_SCHEME}://reset?token={token}
```

To enable deep linking in your mobile app:

**iOS**: Add URL scheme to `Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>app-template</string>
    </array>
  </dict>
</array>
```

**Android**: Add intent filter to `AndroidManifest.xml`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="app-template" />
</intent-filter>
```

See `apps/mobile/src/linking/README.md` for detailed configuration instructions.

---

## Mobile Authentication & Protected Routes

The mobile app implements a secure authentication flow with protected routes using React Native's Keychain/Keystore for token storage.

### Architecture Overview

The mobile app uses a two-stack navigation pattern:

1. **AuthStack** - Screens for unauthenticated users:
   - `SignInScreen` - Email/password login
   - `SignUpScreen` - Account registration
   - `ResetRequestScreen` - Request password reset
   - `ResetConfirmScreen` - Confirm password reset

2. **AppStack** - Protected screens for authenticated users:
   - `ChatStream` - AI chat interface
   - `AccountScreen` - User profile and logout

3. **SplashScreen** - Shown during session restoration on app startup

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      RootNavigator                          │
│                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ loading │───►│ user == null│───►│    user != null     │ │
│  │  true   │    │             │    │                     │ │
│  └────┬────┘    └──────┬──────┘    └──────────┬──────────┘ │
│       │                │                       │            │
│       ▼                ▼                       ▼            │
│  SplashScreen     AuthStack               AppStack         │
└─────────────────────────────────────────────────────────────┘
```

1. **App Startup**: AuthProvider loads token from secure storage
2. **Token Validation**: If token exists, validates with `getMe()` API call
3. **Navigation Decision**: RootNavigator shows appropriate stack based on auth state

### Secure Token Storage

Tokens are stored securely using `react-native-keychain`:

```typescript
// apps/mobile/src/auth/tokenStorage.ts

// Save token after successful login
await saveToken(token);

// Load token on app startup
const token = await loadToken();

// Clear token on logout
await clearToken();
```

**Security Features:**
- iOS: Stored in iOS Keychain with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` accessibility
- Android: Stored in Android Keystore
- Never stored in plain text or AsyncStorage

### AuthContext API

The `AuthProvider` exposes the following via `useAuth()`:

```typescript
const {
  user,           // Current user object or null
  token,          // Current session token or null
  loading,        // True while restoring session on startup
  signIn,         // (email, password) => Promise<void>
  signUp,         // (email, password) => Promise<void>
  signOut,        // () => Promise<void>
  refreshSession, // () => Promise<void> - Re-validate current session
} = useAuth();
```

### Adding New Protected Screens

To add a new protected screen:

1. Create the screen component in `apps/mobile/src/screens/`:

```typescript
// apps/mobile/src/screens/NewScreen.tsx
import React from 'react';
import {SafeAreaView, Text} from 'react-native';
import {useAuth} from '../auth/AuthContext';

export default function NewScreen() {
  const {user} = useAuth();
  return (
    <SafeAreaView>
      <Text>Welcome, {user?.email}</Text>
    </SafeAreaView>
  );
}
```

2. Add the screen to the `AppStack` in `App.tsx`:

```typescript
// In AppStack type
type AppStackScreen = 'chat' | 'account' | 'newScreen';

// In AppStack component, add navigation and rendering
```

The screen is automatically protected—it can only be accessed when `user != null`.

### Adding New Auth Screens

To add a new auth screen (e.g., onboarding):

1. Create the screen in `apps/mobile/src/screens/`
2. Add to `AuthStackScreen` type in `App.tsx`
3. Add rendering logic in `AuthStack` component

### Session Lifecycle

| Event | Behavior |
|-------|----------|
| App Launch | Load token → Validate with server → Set user or clear |
| Sign In | API call → Save token → Update state → Show AppStack |
| Sign Up | Create account → Auto sign in → Show AppStack |
| Sign Out | Clear secure storage → Reset state → Show AuthStack |
| App Resume | (Optional) Call `refreshSession()` to re-validate |
| Token Invalid | Clear secure storage → Show AuthStack |

### Native Configuration

#### iOS (already configured)

Ensure your Podfile includes react-native-keychain:

```bash
cd apps/mobile/ios && pod install
```

#### Android (already configured)

No additional configuration needed. The library uses Android Keystore automatically.

---

## Project Structure

```
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/
│   │   │   ├── (public)/       # Public routes (login, register, etc.)
│   │   │   ├── app/(protected)/ # Protected routes (requires auth)
│   │   │   ├── api/            # API routes
│   │   │   │   ├── auth/       # Authentication endpoints
│   │   │   │   ├── chat/       # Chat streaming endpoint
│   │   │   │   ├── health/     # Health check
│   │   │   │   └── me/         # Current user endpoint
│   │   │   └── chat/           # Public chat page
│   │   ├── lib/                # Utilities (JWT, hooks)
│   │   └── middleware.ts       # Auth & security middleware
│   │
│   └── mobile/                 # React Native application
│       ├── src/
│       │   ├── auth/           # AuthContext and token storage
│       │   ├── screens/        # App screens
│       │   └── config/         # API configuration
│       ├── ios/                # iOS native code
│       └── android/            # Android native code
│
├── packages/
│   ├── db/                     # Database layer
│   │   ├── src/
│   │   │   ├── schema.ts       # Drizzle schema definitions
│   │   │   ├── client.ts       # Database client
│   │   │   └── migrate.ts      # Migration runner
│   │   ├── drizzle/            # Generated migrations
│   │   └── drizzle.config.ts   # Drizzle Kit config
│   │
│   ├── auth/                   # Better Auth configuration
│   │   └── src/index.ts        # Auth setup and helpers
│   │
│   ├── api-client/             # Shared API client
│   │   └── src/index.ts        # Fetch client with streaming
│   │
│   ├── ai/                     # AI/LLM integration
│   │   └── src/index.ts        # OpenAI streaming
│   │
│   ├── security/               # Security utilities
│   │   └── src/rateLimit.ts    # Rate limiter
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/index.ts        # Type definitions
│   │
│   └── tests/                  # Integration tests
│       └── src/                # Test files
│
├── .github/workflows/
│   ├── ci.yml                  # CI pipeline (tests, linting)
│   └── deploy.yml              # Migration-safe deploy pipeline
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── docker-compose.yml          # Local PostgreSQL setup
```

---

## Extending the Template

This template is designed to be a starting point. Here are some common ways to extend it:

### Authentication

- **Add OAuth providers**: Better Auth supports GitHub, Google, Discord, and more. Add providers in `packages/auth/src/index.ts`
- **Implement RBAC**: Add role columns to the user schema and check roles in middleware
- **Add MFA/2FA**: Better Auth has plugins for two-factor authentication

### Database

- **Add new models**: Define schemas in `packages/db/src/schema.ts` and generate migrations with `pnpm -C packages/db migrate:generate`
- **Add CRUD endpoints**: Create new API routes in `apps/web/app/api/`

### Mobile

- **Push notifications**: Add Firebase Cloud Messaging or Apple Push Notifications
- **Biometric authentication**: Extend `react-native-keychain` to require Face ID/Touch ID for token access

### Observability

- **Logging**: Integrate with services like Axiom, LogTail, or Datadog
- **Error tracking**: Add Sentry for error monitoring
- **Analytics**: Add Vercel Analytics, PostHog, or Mixpanel

### Features

- **File uploads**: Add S3/R2 storage integration
- **Background jobs**: Add a job queue with BullMQ or Inngest
- **Real-time**: Add WebSocket support with Pusher or Ably

---

Happy building!

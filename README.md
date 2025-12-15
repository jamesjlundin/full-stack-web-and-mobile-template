# Full-Stack Web & Mobile Template

A production-ready GitHub template for building full-stack applications with a shared codebase across web and mobile platforms. This monorepo provides everything you need to start a new project with authentication, database, API routes, AI chat streaming, and deployment automation—all wired up and ready to go.

**Use this template** to skip weeks of boilerplate setup and jump straight into building your product.

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

Before you begin, ensure you have the following installed:

- **Node.js 20** or newer
- **pnpm** (`npm install -g pnpm`)
- **Git**
- **Docker** (for local PostgreSQL development)

For mobile development:

- **iOS**: Xcode and CocoaPods (`sudo gem install cocoapods`)
- **Android**: Android Studio with SDK and emulator configured

Accounts needed:

- **GitHub** account
- **Vercel** account (free tier works)
- **Resend** account (optional, for production email delivery)

---

## Setup Guide

### Step 1: Create Your Repository

1. Click the **"Use this template"** button on the GitHub repository page
2. Name your new repository and create it
3. Clone your new repository locally:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Set Up Third-Party Services

#### Vercel Setup

1. Create a [Vercel account](https://vercel.com) if you don't have one
2. Create a new Vercel project and connect it to your GitHub repository
3. Configure project settings:

   **Git Settings** (Settings → Git):
   - Confirm the production branch is set to `main`
   - Optionally disable auto-deploy if using the migration-safe deploy pattern exclusively

   **Database** (Settings → Storage):
   - Click "Create Database"
   - Select **Postgres** and choose **Neon** as the provider
   - Copy the `DATABASE_URL` connection string

   **Environment Variables** (Settings → Environment Variables):
   Add all required environment variables (see [Environment Variables Reference](#environment-variables-reference))

   **Deploy Hook** (Settings → Git → Deploy Hooks):
   - Create a new deploy hook for the `main` branch
   - Name it something like "GitHub Actions Deploy"
   - Copy the generated webhook URL

#### GitHub Secrets Setup

Navigate to your repository: **Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string from Vercel |
| `VERCEL_DEPLOY_HOOK_URL` | The deploy hook URL from Vercel |

**How it works**: When you push to `main`, GitHub Actions runs your migrations against the production database using `DATABASE_URL`. If migrations succeed, the workflow triggers the `VERCEL_DEPLOY_HOOK_URL`, which starts a production deployment on Vercel.

### Step 4: Configure Local Development

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Start the local PostgreSQL database:

```bash
pnpm db:up
```

This starts PostgreSQL on port 5432 and pgweb (a database UI) on port 8081.

> **No Docker?** If Docker is unavailable (e.g., sandboxed CI or Codespaces), you can install PostgreSQL directly:
> ```bash
> sudo ./scripts/setup-postgres.sh
> ```

3. Run database migrations:

```bash
pnpm -C packages/db migrate:apply
```

4. Update your `.env` file with required values:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/acme
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000
```

### Step 5: Run the Project Locally

#### Web Application

```bash
pnpm -C apps/web dev
```

The web app will be available at [http://localhost:3000](http://localhost:3000).

#### Mobile Application

**iOS:**

```bash
cd apps/mobile/ios
pod install
cd ..
pnpm ios
```

**Android:**

```bash
pnpm android
```

Note: The mobile app connects to `localhost:3000` (iOS) or `10.0.2.2:3000` (Android emulator) by default. Ensure the web app is running.

### Step 6: Push to Main and Deploy

When you push to the `main` branch:

1. **GitHub Actions CI** runs:
   - Type checking
   - Linting
   - Web app build
   - Database preflight check
   - Database migrations
   - Deploy hook trigger

2. **Vercel** receives the webhook and:
   - Builds your application
   - Deploys to production

Monitor the Actions tab in your GitHub repository to see the pipeline progress.

### Step 7: Verify Production Deployment

After deployment completes, verify everything is working:

```bash
# Health check
curl https://your-app.vercel.app/api/health
# Expected: {"ok":true}

# Unauthenticated /api/me
curl https://your-app.vercel.app/api/me
# Expected: {"user":null}

# Test registration (replace with your domain)
curl -X POST https://your-app.vercel.app/api/auth/email-password/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"securepassword123"}'
```

Visit your production URL and test:

- User registration and login
- Protected routes (should redirect when not authenticated)
- Chat streaming functionality

---

## Environment Variables Reference

### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgres://user:pass@host:5432/db`) |
| `BETTER_AUTH_SECRET` | Secret key for auth tokens (minimum 32 characters) |
| `BETTER_AUTH_URL` | Base URL for auth (e.g., `https://your-app.vercel.app`) |

### Application URLs

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Public API URL for client-side requests |
| `APP_BASE_URL` | Base URL for email links (e.g., verification, password reset) |
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

### Security & CORS

| Variable | Description |
|----------|-------------|
| `ALLOWED_ORIGIN` | Allowed CORS origin in production (e.g., `https://your-app.vercel.app`) |

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

- **Secure token storage**: Replace the in-memory token storage in `apps/mobile/src/auth/tokenStorage.ts` with `react-native-keychain` or `expo-secure-store`
- **Push notifications**: Add Firebase Cloud Messaging or Apple Push Notifications

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

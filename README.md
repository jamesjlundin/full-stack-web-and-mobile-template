# Full-Stack Web & Mobile Template

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A production-ready GitHub template for building full-stack applications with a shared codebase across web and mobile platforms. This monorepo provides everything you need to start a new project with authentication, database, API routes, AI chat streaming, email sending, and deployment automation—all wired up and ready to go.

## Why This Template?

**Stop wasting time on boilerplate.** This template gives you a complete, production-ready foundation so you can focus on building your actual product:

- **One codebase, two platforms** — Share business logic between Next.js web app and React Native mobile app
- **Auth that just works** — Email/password + OAuth with secure token handling for both web and mobile
- **AI-ready** — OpenAI integration with streaming, tool calling, and rate limiting built-in
- **Deploy in minutes** — CI/CD pipeline with automatic migrations and Vercel deployment
- **Type-safe end-to-end** — TypeScript everywhere with shared types across all packages

## Features at a Glance

| Feature                   | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| **Monorepo Architecture** | pnpm workspaces + Turborepo for fast, cached builds      |
| **Next.js 16 Web App**    | App Router, Server Components, Middleware, API Routes    |
| **React Native Mobile**   | Bare workflow iOS & Android app with shared API client   |
| **Better Auth**           | Email/password + OAuth, sessions for web, JWT for mobile |
| **PostgreSQL + Drizzle**  | Type-safe ORM with auto-generated migrations             |
| **AI Agent Demo**         | Streaming chat with tool calling & image generation      |
| **Rate Limiting**         | Upstash Redis-powered protection on auth & API routes    |
| **Email Integration**     | Resend for verification & password reset emails          |
| **CI/CD Pipeline**        | GitHub Actions with tests, migrations, and auto-deploy   |
| **iOS TestFlight**        | Fastlane + Match workflow for automated iOS releases     |

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quickstart](#quickstart-from-template-to-production)
- [Demo Features](#demo-features)
- [What's Included](#whats-included)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development-details)
- [Environment Variables](#environment-variables-reference)
- [Password Reset Flow](#password-reset-flow)
- [Mobile Authentication](#mobile-authentication--protected-routes)
- [Project Structure](#project-structure)

---

## Prerequisites

**Required:**

- Node.js 20+, pnpm (`npm install -g pnpm`), Git, Docker, TypeScript

**For mobile development:**

- iOS: Xcode + CocoaPods (`sudo gem install cocoapods`)
- Android: Android Studio with SDK configured

**Accounts:**

- GitHub, Vercel (free tier works), Resend (for email)
- Apple Developer Program ($99/year) for iOS TestFlight deployment

## Quickstart: From Template to Production

### 1. Create Your Repository

1. On this repo, click **"Use this template"** → **"Create a new repository"**
2. Name your repo and click **"Create repository"**

### 2. Create note to temporarily store creds over the next couple of steps that we will put into Vercel environment variables and github actions all at once later

### 3. Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** → select your new repo
3. Under **"Root Directory"**, click **"Edit"** → type `apps/web` → click **"Continue"**
4. Click **"Deploy"**
5. Get the domain name Vercel has deployed the app too and store it in the note from step 2 as `APP_BASE_URL`

### 4. Create Neon Database

1. In your Vercel project, click the **"Storage"** tab
2. Click **"Create Database"** → select **"Neon Serverless Postgres"**
3. Click **"Continue"** → name the database → **"Create"**

Vercel automatically adds these env vars to your project:

- `DATABASE_URL`
- `POSTGRES_URL`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

### 5. Create Upstash Redis (Optional)

1. In your Vercel project, click the **"Storage"** tab
2. Click **"Create Database"** → select dropdown for **"Upstash Serverless DB"** → select Upstash for Redis
3. Click **"Continue"** → name the database → **"Create"**

Vercel automatically adds these env vars to your project:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 6. Set Up Vercel Blob Storage (Optional)

If you want image upload and generation features in the AI Agent:

1. In your Vercel project, click the **"Storage"** tab
2. Click **"Create Database"** → select **"Blob"**
3. Name it → click **"Create"**

Vercel automatically adds this env var to your project:

- `BLOB_READ_WRITE_TOKEN`

This enables:

- User image uploads in chat
- AI-generated image storage
- Image input to vision-capable models

### 7. Add Custom Domain (Optional)

If you want to use a custom domain instead of the default `.vercel.app` URL:

1. In your Vercel project, click **"Settings"** → **"Domains"**
2. Enter your domain name and click **"Add"**
3. If you don't own a domain, click **"Buy"** to purchase one through Vercel
4. If you own a domain elsewhere, follow the DNS configuration instructions shown
5. Configure and connect your domain to your vercel project
6. Overwrite the `APP_BASE_URL` field in your note from step 2 with your custom domain name

### 8. Create Deploy Hook (In Vercel)

1. In Vercel, click **"Settings"** → **"Git"** (left sidebar)
2. Scroll to **"Deploy Hooks"** → click **"Create Hook"**
3. Name: `GitHub Actions`, Branch: `main` → click **"Create Hook"**
4. Add the generated url for the hook to the note from step 2 as `VERCEL_DEPLOY_HOOK_URL`

This prevents Vercel from auto-deploying; our GitHub Actions CI/CD handles deployments after running migrations.

### 9. Set Up Resend (Email) (Optional)

If you want email functionality (verification emails, password reset):

1. Go to [resend.com](https://resend.com) and create an account
2. In the Resend dashboard, click **"API Keys"** → **"Create API Key"**
3. Add the api key to your note from step 2 as `RESEND_API_KEY`
4. (Optional) Click **"Domains"** → **"Add Domain"** to verify your domain, if you don't verify a domain you can only send emails from `onboarding@resend.dev` for testing purposes.
5. (Optional) if you did create a custom domain, add an email address from that custom domain to the note from step 2 as `MAIL_FROM`

### 10. Set Up Google OAuth (Optional)

If you want users to sign in with their Google account:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Open the project sidebar and navigate to **"APIs & Services"** → **"Credentials"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** user type
   - Fill in app name, user support email, and developer contact email
5. Click **"Create Credentials"** → **"OAuth client ID"**
6. Back in Credentials, create an OAuth client ID:
   - Application type: **"Web application"**
   - Name: Your app name
   - Authorized JavaScript origins: Add `https://your-domain.com` (or your Vercel domain), and `http://localhost:3000` for local development. This is required so the OAuth flow can redirect properly.
   - Authorized redirect URIs: Add `https://your-domain.com/api/auth/callback/google` (replace with your custom domain, or use your default Vercel domain like `https://your-app.vercel.app/api/auth/callback/google` if you haven't set up a custom domain). For local development, also add: `http://localhost:3000/api/auth/callback/google`
7. Add the **Client ID** and **Client Secret** to your note from step 2 as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 11. Get LLM tokens if you plan to use them, get only the ones you would like to use (Optional) I personally like to generate 2 keys for each provider one being for the CI/CD evals and the other being for use in the application just so you can break down the different usage. If you would like to do that as well just store the CI/CD value in Github actions secrets and the application value in Vercel in steps 14 and 15

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys), create an API key, and add it to the note from step 2 as `OPENAI_API_KEY`
2. Go to [Anthropic Console](https://console.anthropic.com/settings/keys), generate an API key, and add it to the note from step 2 as `ANTHROPIC_API_KEY`
3. Go to [Google Generative AI Studio](https://makersuite.google.com/app/apikey), create an API key, and add it to the note from step 2 as `GOOGLE_GENERATIVE_AI_API_KEY`

### 12. Set Up Google Analytics (Optional)

If you want to track website traffic and user engagement:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click **"Admin"** (gear icon in bottom left)
3. Click **"Create"** → **"Account"** (if you don't have one) or **"Property"**
4. Follow the setup wizard to create a **GA4 Property**
5. During the setup flow (or under **"Data Streams"**), select **"Web"** as your platform
6. Enter your website URL (use your Vercel URL or custom domain from previous steps) and a stream name
7. Click **"Create stream"**. You will be presented with a **"Setup Google tag"** screen; you can **close this window**, as the template handles the tag injection for you.
8. After closing the tag setup, you will see the **"Web stream details"**. Copy the **"Measurement ID"** (format: `G-XXXXXXXXXX`) from the top right.
9. Add it to the note from step 2 as `NEXT_PUBLIC_GA_TRACKING_ID`

### 13. Add custom secrets

There are two locations where we need to generate our own custom secrets, feel free to use any generator that satisifed the requirements of the secrets but I will show what I use for generation below.

1. Create a secret key (recommendation is to run `openssl rand -base64 32` in terminal) and store it in the note from step 2 as `BETTER_AUTH_SECRET`
2. Create a secret key (recommendation is to run `openssl rand -hex 32` in terminal) and store it in the note from step 2 as `CRON_SECRET`

### 14. Configure Vercel Environment Variables

1. In your Vercel project, click **"Settings"** tab → **"Environment Variables"**
2. Add each variable below (click **"Add"** after each):

**Required** (you must add these manually and they should all be in the note from step 2):

| Variable             | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET` | Random string, 32+ chars (run `openssl rand -base64 32` in terminal) |
| `APP_BASE_URL`       | `https://your-project.vercel.app` (your Vercel URL)                  |
| `CRON_SECRET`        | Random string for cron auth (run `openssl rand -hex 32` in terminal) |

**Optional** (add if using these features):

| Variable                       | Value                                                 |
| ------------------------------ | ----------------------------------------------------- |
| `OPENAI_API_KEY`               | For AI chat functionality                             |
| `ANTHROPIC_API_KEY`            | For AI chat functionality                             |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For AI chat functionality                             |
| `RESEND_API_KEY`               | Your Resend API key                                   |
| `MAIL_FROM`                    | Your verified domain email or `onboarding@resend.dev` |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID                                |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret                            |
| `NEXT_PUBLIC_GA_TRACKING_ID`   | Google Analytics Measurement ID                       |

### 15. Add GitHub Secrets

1. Go to your GitHub repo → **"Settings"** tab → **"Secrets and variables"** → **"Actions"**
2. Click **"New repository secret"** and add each:

**Required** (both are needed for CI/CD to work):

| Secret                   | Value                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Copy from Vercel: Settings → Environment Variables → click `DATABASE_URL` to reveal |
| `VERCEL_DEPLOY_HOOK_URL` | The deploy hook URL from step 8                                                     |

**Optional** (add if using LLM evaluations or related features):

| Secret                         | Value                                  |
| ------------------------------ | -------------------------------------- |
| `OPENAI_API_KEY`               | For LLM-powered eval jobs (if enabled) |
| `ANTHROPIC_API_KEY`            | For LLM-powered eval jobs (if enabled) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For LLM-powered eval jobs (if enabled) |

> _Optional LLM API keys should be set if you want GitHub Actions (such as LLM eval workflows) to access LLM providers for evaluations or checks. If these are omitted, those features will be skipped in CI._

These secrets allow GitHub Actions to run migrations against your production database and trigger Vercel deployments as well as optionally LLM evals.

### 16. Delete your custom note with secrets (or store in a reliable encrypted password storage system)

### 17. Clone and Set Up Locally

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
pnpm install
pnpm env:init
```

The `env:init` command creates a `.env` file from `.env.example` with local development defaults and automatically generates required secrets like `BETTER_AUTH_SECRET`. It also distributes these environment variables to all packages and apps (as `.env.local` for apps to support Next.js).

To add optional environment variables (like `OPENAI_API_KEY`) and ensure they are propagated correctly:

```bash
pnpm env:set OPENAI_API_KEY=your_key_here
```

You can set multiple variables at once:

```bash
pnpm env:set RESEND_API_KEY=re_xxx GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx
```

### 18. Run Locally

```bash
pnpm db:up              # Start local PostgreSQL (requires Docker)
pnpm -C packages/db migrate:apply  # Run migrations
pnpm -C apps/web dev    # Start dev server at localhost:3000
```

### 19. Deploy to Production

```bash
git add -A && git commit -m "Initial setup"
git push origin main
```

This triggers: GitHub Actions → runs migrations → calls Vercel deploy hook → production live.

**Verify:** Visit `https://your-domain/api/health` — should return `{"ok":true}`

---

## Demo Features

This template includes an AI Agent demo to showcase capabilities. **Remove these before building your production app.**

### AI Agent (`/app/agent`)

An interactive AI agent with tool calling. Sign in and visit `/app/agent` to try it.

Features:

- Streaming chat responses
- Tool calling (mock weather and time tools)
- Image upload and vision (requires Vercel Blob)
- Image generation via `/image` command (requires OpenAI API key)
- Rate limiting per user

### Removing Demo Features

Before building your project, run these commands to remove demo code:

```bash
# Remove demo page
rm -rf apps/web/app/app/\(protected\)/agent

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

| App           | Technology   | Description                                                         |
| ------------- | ------------ | ------------------------------------------------------------------- |
| `apps/web`    | Next.js 14+  | Server-rendered web app with App Router, middleware, and API routes |
| `apps/mobile` | React Native | Native iOS/Android app with shared API client                       |

### Shared Packages

| Package               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `packages/db`         | Drizzle ORM schema, migrations, and database client |
| `packages/auth`       | Better Auth configuration and helpers               |
| `packages/api-client` | Fetch-based API client with streaming support       |
| `packages/ai`         | OpenAI integration with Vercel AI SDK               |
| `packages/security`   | Rate limiting utilities                             |
| `packages/types`      | Shared TypeScript types                             |
| `packages/tests`      | Integration test suite                              |

### Web Application Features

- **Next.js App Router** with server and client components
- **Middleware-protected routes** with authentication checks
- **Authentication pages**: login, register, logout, email verification, password reset
- **API routes**: `/api/me`, `/api/health`, `/api/auth/*`, `/api/agent/stream`
- **AI Agent endpoint** using Vercel AI SDK with tool calling (`/api/agent/stream`)
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **CORS configuration** for cross-origin requests

### Mobile Application Features

- **Bare React Native** app (no Expo)
- **Authentication flow**: welcome, login, register, password reset screens
- **Token-based session handling** with AuthContext
- **Protected screens** with drawer navigation (home, agent, account)
- **AI Agent demo** with streaming responses

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

- **Rate limiting** on auth (5 req/min) and agent (5 req/24h) endpoints
- **CORS handling** with origin validation
- **JWT token generation** for mobile/API clients
- **Health check endpoint** for monitoring

### DevOps & CI/CD

- **GitHub Actions CI**: type checking, linting, build verification, integration tests
- **PostgreSQL test service** in CI for realistic testing
- **Migration-safe deploy workflow**: runs migrations before triggering Vercel
- **Vercel deploy hook integration** for automated production deployments
- **iOS TestFlight workflow**: automated builds and uploads via Fastlane + Match
- **Neon/Postgres compatibility** for serverless database hosting

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
cd apps/mobile/ios && bundle exec pod install && cd ..
pnpm ios
```

**Android:**

```bash
pnpm android
```

The mobile app connects to `localhost:3000` (iOS) or `10.0.2.2:3000` (Android emulator).

### iOS TestFlight Deployment

This template includes a GitHub Actions workflow for automated TestFlight deployments. Follow these steps to set it up.

#### Mobile Prerequisites

- **Apple Developer Program membership** ($99/year) - [developer.apple.com/programs](https://developer.apple.com/programs/)
- Access to **App Store Connect** - [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

#### 1. Create Your App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps** → **+ New App**
2. Select **iOS** platform
3. Enter app name, bundle ID (must match `APP_IDENTIFIER`), and SKU
4. Select your team

#### 2. Generate App Store Connect API Key

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Integrations** tab
3. Select **App Store Connect API** → **Team Keys**
4. Click **Generate API Key** (or **+** if you already have keys)
5. Name it (e.g., "CI/CD Key") and select **App Manager** role (sufficient for CI/CD, follows least privilege)
6. Click **Generate**
7. Note the **Issuer ID** (shown at top of keys table) and **Key ID** (in table)
8. Download the `.p8` file immediately — you can only download it **once**

> **Note:** Only Account Holder or Admin can generate Team Keys.

#### 3. Create a Private Git Repository for Certificates (Match)

1. Create a new **private** GitHub repository (e.g., `ios-certificates`)
2. This stores your encrypted signing certificates and provisioning profiles
3. Note the SSH URL: `git@github.com:yourorg/ios-certificates.git`

#### 4. Configure GitHub Secrets

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 7 required secrets:

| Secret                          | Value                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `APP_IDENTIFIER`                | Your bundle ID (e.g., `com.yourcompany.yourapp`)                                                                    |
| `APPLE_TEAM_ID`                 | Your 10-character Team ID (find at [developer.apple.com/account](https://developer.apple.com/account) → Membership) |
| `APP_STORE_CONNECT_ISSUER_ID`   | From API Keys page (shown above the keys table)                                                                     |
| `APP_STORE_CONNECT_KEY_ID`      | From API Keys page (in the table)                                                                                   |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Contents of the `.p8` file                                                                                          |
| `MATCH_GIT_URL`                 | `git@github.com:yourorg/ios-certificates.git`                                                                       |
| `MATCH_PASSWORD`                | A strong password for encrypting certs (generate with `openssl rand -base64 32`)                                    |

#### 5. Update Bundle Identifier in Xcode

Ensure your Xcode project uses the correct bundle identifier:

1. Open `apps/mobile/ios/mobile.xcworkspace` in Xcode
2. Select the project → **Signing & Capabilities** tab
3. Set the bundle identifier to match your `APP_IDENTIFIER` secret
4. Ensure "Automatically manage signing" is enabled

Or edit `apps/mobile/ios/mobile.xcodeproj/project.pbxproj` directly to set `PRODUCT_BUNDLE_IDENTIFIER`.

#### 6. Bootstrap Code Signing (First-Time Only)

Run locally to initialize certificates:

```bash
cd apps/mobile/ios
bundle install

# Set environment variables
export APP_IDENTIFIER="com.yourcompany.yourapp"
export APPLE_TEAM_ID="XXXXXXXXXX"
export APP_STORE_CONNECT_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export APP_STORE_CONNECT_KEY_ID="XXXXXXXXXX"
export APP_STORE_CONNECT_PRIVATE_KEY="$(cat ~/path/to/AuthKey_XXXXXXXXXX.p8)"
export MATCH_GIT_URL="git@github.com:yourorg/ios-certificates.git"
export MATCH_PASSWORD="your-secure-password"

# Initialize certificates and profiles
bundle exec fastlane ios bootstrap_signing
```

This creates/syncs your signing certificates to the Match repository.

#### 7. Trigger the Workflow

1. Go to your GitHub repo → **Actions** tab
2. Select **"iOS TestFlight Upload"** workflow
3. Click **"Run workflow"** → **"Run workflow"**
4. Monitor the build progress

Once complete, builds will automatically upload to TestFlight. Invite testers from App Store Connect.

#### Troubleshooting

- **"Path is invalid" error**: Ensure Fastlane paths point to `mobile.xcodeproj`, not directories
- **Keychain password prompt**: Enter your Mac login password (used to access local Keychain)
- **Missing secrets**: Run `bundle exec fastlane ios preflight` to check which secrets are missing

### Database UI

When running `pnpm db:up`, pgweb is available at [http://localhost:8081](http://localhost:8081) for browsing your local database.

---

## Environment Variables Reference

### Required Variables

| Variable                   | Description                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | PostgreSQL connection string (e.g., `postgres://user:pass@host:5432/db`)                                              |
| `BETTER_AUTH_SECRET`       | Secret key for auth tokens (minimum 32 characters)                                                                    |
| `APP_BASE_URL`             | Base URL for auth and email links (e.g., `https://your-app.vercel.app`)                                               |
| `CRON_SECRET`              | Secret for cron job auth (generate with `openssl rand -hex 32`). Vercel sends this as `Authorization: Bearer` header. |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis URL for rate limiting (from Vercel Marketplace → Upstash)                                               |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token for rate limiting (auto-set when connected via Vercel)                                            |

### Application URLs

| Variable              | Description                             |
| --------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Public API URL for client-side requests |
| `PORT`                | Server port (default: `3000`)           |

### Email Configuration (Resend)

| Variable         | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com)                     |
| `MAIL_FROM`      | Sender address (e.g., `"Your App <no-reply@yourdomain.com>"`) |
| `RESEND_DRY_RUN` | Set to `1` to log emails instead of sending (useful for CI)   |

### AI/Chat Configuration

| Variable         | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `OPENAI_API_KEY` | OpenAI API key (optional—uses mock responses if not set) |
| `AI_MODEL`       | Model to use (default: `gpt-4o-mini`)                    |

### OAuth Providers (Optional)

| Variable               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID (enables "Sign in with Google") |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                             |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app client ID                             |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret                         |

### Development/Testing

| Variable           | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `ALLOW_DEV_TOKENS` | Set to `true` to enable token echoing in production builds (testing only—never use in production) |

### Mobile Deep Linking (Optional)

| Variable                   | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `MOBILE_APP_SCHEME`        | Custom URL scheme for mobile deep links (default: `app-template`) |
| `MOBILE_DEEP_LINK_ENABLED` | Set to `1` to include mobile deep links in password reset emails  |

---

## Password Reset Flow

The template includes a complete password reset flow for both web and mobile applications.

### How Password Reset Works

1. User navigates to `/reset-password` (web) or "Forgot Password" (mobile)
2. User enters their email address
3. Backend always returns success (prevents email enumeration)
4. If email exists, a reset link is sent via Resend (or logged to console in dev)
5. User clicks the reset link in email
6. User enters new password on `/reset-password/confirm` page
7. Password is updated and user is redirected to login

### API Endpoints

| Endpoint                  | Method | Description                                             |
| ------------------------- | ------ | ------------------------------------------------------- |
| `/api/auth/reset/request` | POST   | Request password reset (body: `{ email }`)              |
| `/api/auth/reset/confirm` | POST   | Confirm password reset (body: `{ token, newPassword }`) |

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

```xml
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
   - `WelcomeScreen` - Landing page with branding
   - `SignInScreen` - Email/password login
   - `SignUpScreen` - Account registration (with name field)
   - `ResetRequestScreen` - Request password reset
   - `ResetConfirmScreen` - Confirm password reset

2. **AppStack** - Protected screens with drawer navigation:
   - `HomeScreen` - Dashboard with account info
   - `AgentScreen` - AI Agent demo with streaming
   - `AccountScreen` - User profile and logout

3. **SplashScreen** - Shown during session restoration on app startup

4. **VerifyEmailScreen** - Shown when email verification is required

### How It Works

```txt
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
  user, // Current user object or null
  token, // Current session token or null
  loading, // True while restoring session on startup
  signIn, // (email, password) => Promise<void>
  signUp, // (email, password) => Promise<void>
  signOut, // () => Promise<void>
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
   type AppStackScreen = "home" | "agent" | "account" | "newScreen";

   // Add to MENU_ITEMS for drawer navigation
   const MENU_ITEMS = [
     { id: "home", label: "Dashboard" },
     { id: "agent", label: "AI Agent" },
     { id: "account", label: "Account" },
     { id: "newScreen", label: "New Screen" },
   ];

   // In AppStack component, add screen rendering in renderScreen()
   ```

The screen is automatically protected—it can only be accessed when `user != null`.

### Adding New Auth Screens

To add a new auth screen (e.g., onboarding):

1. Create the screen in `apps/mobile/src/screens/`
2. Add to `AuthStackScreen` type in `App.tsx`
3. Add rendering logic in `AuthStack` component

### Session Lifecycle

| Event         | Behavior                                              |
| ------------- | ----------------------------------------------------- |
| App Launch    | Load token → Validate with server → Set user or clear |
| Sign In       | API call → Save token → Update state → Show AppStack  |
| Sign Up       | Create account → Auto sign in → Show AppStack         |
| Sign Out      | Clear secure storage → Reset state → Show AuthStack   |
| App Resume    | (Optional) Call `refreshSession()` to re-validate     |
| Token Invalid | Clear secure storage → Show AuthStack                 |

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

```txt
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── app/
│   │   │   ├── (public)/       # Public routes (login, register, etc.)
│   │   │   ├── app/(protected)/ # Protected routes (requires auth)
│   │   │   ├── api/            # API routes
│   │   │   │   ├── auth/       # Authentication endpoints
│   │   │   │   ├── agent/      # AI Agent streaming endpoint
│   │   │   │   ├── health/     # Health check
│   │   │   │   └── me/         # Current user endpoint
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## GitHub Topics

This repository uses the following topics for discoverability. If you fork this template, consider adding similar topics to your repository:

`nextjs` `react-native` `typescript` `monorepo` `full-stack` `template` `boilerplate` `vercel` `postgresql` `drizzle-orm` `better-auth` `authentication` `ai` `openai` `tailwindcss` `turborepo` `pnpm` `react` `mobile-development` `starter-template`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

If you find this template helpful, please consider giving it a star on GitHub!

Happy building!

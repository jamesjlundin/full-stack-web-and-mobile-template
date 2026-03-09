---
name: getting-started
description: Interactive setup wizard for customizing this template into your own project. Renames packages, configures mobile bundle IDs, sets up branding, checks ports, and generates environment secrets.
triggers:
  - /getting-started
  - 'set up this template'
  - 'customize template'
  - 'initialize project'
  - 'rename acme'
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - AskUserQuestion
---

# Template Setup Wizard

Guide the user through customizing this template for their new project. Work through each phase interactively, asking for user input before making changes.

## Important

- ALWAYS ask the user for their values before making any changes
- Show what will change before doing it
- Make changes incrementally so the user can verify each phase
- Run `pnpm install` after renaming packages to update the lockfile
- Run `pnpm typecheck` after all changes to verify nothing broke

## Phase 1: Project Identity

Ask the user for ALL of the following before making changes:

| Value                  | Default    | Example                 | Used For                                   |
| ---------------------- | ---------- | ----------------------- | ------------------------------------------ |
| **Organization scope** | `acme`     | `mycompany`             | Package names (`@acme/*` → `@mycompany/*`) |
| **Project name**       | `acme`     | `my-app`                | Root package.json `name` field             |
| **App display name**   | `Template` | `My App`                | Web page titles, mobile display name       |
| **App description**    | (none)     | `A task management app` | Web metadata, App Store description        |

### Files to update for org scope (`@acme/*` → `@{org}/*`)

This is a global find-and-replace across the entire repo. Key locations:

**Package definitions** (the `name` field in each):

- `packages/auth/package.json`
- `packages/api-client/package.json`
- `packages/types/package.json`
- `packages/db/package.json`
- `packages/security/package.json`
- `packages/ai/package.json`
- `packages/rag/package.json`
- `packages/tools/package.json`
- `packages/evals/package.json`
- `packages/config/package.json`
- `packages/obs/package.json`
- `packages/tools-testing/package.json`
- `packages/tests/package.json`

**Package consumers** (dependency and import references):

- `apps/web/package.json` — dependencies
- `apps/web/next.config.mjs` — `transpilePackages` array
- `apps/mobile/package.json` — dependencies
- `apps/mobile/metro.config.js` — package resolution map
- All `import { ... } from '@acme/...'` across source files
- `turbo.json` — if it references package names
- `pnpm-workspace.yaml` — usually glob-based, unlikely to need changes

**Strategy**: Use `grep -r '@acme/' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.json'` to find all references, then do a global replace.

**Root package.json**: Update the `name` field to the project name.

### Files to update for app display name

- `apps/web/app/layout.tsx` — `metadata.title` template and default
- `apps/mobile/app.json` — `name` and `displayName`
- `apps/mobile/ios/mobile/Info.plist` — `CFBundleDisplayName`
- `.env.example` — `MAIL_FROM` placeholder

## Phase 2: Mobile App Identity

Ask the user for:

| Value                    | Default                                    | Example               | Used For                          |
| ------------------------ | ------------------------------------------ | --------------------- | --------------------------------- |
| **iOS bundle ID**        | `com.jamesjlundin.fullstacktemplatemobile` | `com.mycompany.myapp` | App Store identity, signing       |
| **Android package name** | `com.mobile`                               | `com.mycompany.myapp` | Play Store identity               |
| **URL scheme**           | `app-template`                             | `myapp`               | Deep links, password reset emails |

### iOS bundle ID

- `apps/mobile/ios/mobile.xcodeproj/project.pbxproj` — `PRODUCT_BUNDLE_IDENTIFIER` (appears twice: Debug and Release)

### Android package name

- `apps/mobile/android/app/build.gradle` — `namespace` and `applicationId`
- `apps/mobile/android/app/src/main/java/com/mobile/MainActivity.kt` — `package` declaration
- `apps/mobile/android/app/src/main/java/com/mobile/MainApplication.kt` — `package` declaration

**Important**: If the Android package name changes from `com.mobile` to something like `com.mycompany.myapp`, the Java/Kotlin source files need to move to the matching directory structure:

```
src/main/java/com/mobile/ → src/main/java/com/mycompany/myapp/
```

### URL scheme (deep linking)

- `.env.example` — `MOBILE_APP_SCHEME=app-template`
- `apps/web/app/api/_lib/passwordResetEmail.ts` — fallback value
- `apps/mobile/src/linking/README.md` — documentation examples
- iOS and Android native config must also be updated (document this for the user)

## Phase 3: Branding, Marketing & Content

Ask the user for ALL of the following. Explain that these values will be used to replace template placeholder text across the landing page, auth screens, emails, and metadata.

| Value                                  | Default                               | Example                                                          | Used For                                                  |
| -------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| **Tagline / badge text**               | `Full-Stack Template`                 | `AI-Powered CRM`                                                 | Badge on landing page (web + mobile)                      |
| **Headline**                           | `Build your next great project`       | `Manage your customers smarter`                                  | Landing page h1 (web + mobile)                            |
| **Subheadline / description**          | `A complete full-stack foundation...` | `The all-in-one platform for sales teams to close deals faster.` | Landing page description, meta description (web + mobile) |
| **Signup call-to-action context**      | `Sign up to start chatting`           | `Sign up to get started`                                         | Mobile signup subtitle                                    |
| **Do you have a logo/icon?**           | Template defaults                     | Path to image file                                               | Favicon, app icons                                        |
| **Primary brand color**                | `#3B82F6`                             | `#10B981`                                                        | Mobile accent color, can note for future theming          |
| **Social links or website** (optional) | Creator links removed                 | `https://twitter.com/myapp`                                      | Footer/branding section replacement, or remove entirely   |

### Landing page content (web)

**File**: `apps/web/app/page.tsx`

Replace ALL template copy with user's values:

- Badge text: `"Full-Stack Template"` → user's tagline
- Heading: `"Build your next"` / `"great project"` → user's headline
- Description paragraph: `"A complete full-stack foundation..."` → user's subheadline
- **Remove the entire creator branding section** (lines between `{/* Creator Branding */}` and `{/* End Creator Branding */}`) — replace with user's own footer content or social links, or remove entirely
- The `Github` and `Linkedin` imports from `lucide-react` can be removed if creator section is deleted

### Landing page content (mobile)

**File**: `apps/mobile/src/screens/WelcomeScreen.tsx`

Mirror the same changes:

- Badge text: `"Full-Stack Template"` → user's tagline
- Title: `"Build your next"` / `"great project"` → user's headline
- Subtitle: `"A complete full-stack foundation..."` → user's subheadline
- **Remove the entire creator section** (`creatorSection` view with James Lundin name, bio, GitHub/LinkedIn links)
- Update `styles.titleAccent` color if user provided a primary brand color

### Meta tags & SEO

**File**: `apps/web/app/layout.tsx`

- `metadata.title.template`: `'%s | Template'` → `'%s | {App Name}'`
- `metadata.title.default`: `'Template'` → `'{App Name}'`
- `metadata.description`: `'Full-stack web and mobile template.'` → user's subheadline/description

**File**: `apps/web/app/app/layout.tsx`

- Title template if present: `'%s | App'` → `'%s | {App Name}'`

### Auth screen copy

**File**: `apps/mobile/src/screens/SignUpScreen.tsx`

- Subtitle: `"Sign up to start chatting"` → user's signup CTA context (e.g., `"Sign up to get started"`)

The web auth pages (`login/page.tsx`, `register/page.tsx`, `reset-password/page.tsx`) use generic copy ("Sign in", "Create an account") that works for most apps. Only update these if the user wants custom copy.

### Email templates

**File**: `apps/web/app/api/_lib/passwordResetEmail.ts`

- Email subject and body are generic ("Reset your password"). Ask if the user wants to brand these with their app name (e.g., `"Reset your MyApp password"`).

**File**: `apps/web/app/api/_lib/mailer.ts`

- Email verification subject and body. Same — offer to brand with app name.

### App icons (tell user, don't automate)

Tell the user they need to provide:

- **Web**: Favicon at `apps/web/app/favicon.ico` and OG image
- **iOS**: App icon set in `apps/mobile/ios/mobile/Images.xcassets/AppIcon.appiconset/`
- **Android**: Adaptive icon in `apps/mobile/android/app/src/main/res/`

Recommend tools like [Icon Kitchen](https://icon.kitchen) or [App Icon Generator](https://www.appicon.co/) for generating all required sizes from a single image.

## Phase 4: Infrastructure & Ports

Ask the user:

| Value                 | Default | Example | Service               |
| --------------------- | ------- | ------- | --------------------- |
| **Database name**     | `acme`  | `myapp` | PostgreSQL            |
| **Web port**          | `3000`  | `3001`  | Next.js dev server    |
| **PostgreSQL port**   | `5432`  | `5433`  | Docker PostgreSQL     |
| **pgweb port**        | `8082`  | `8083`  | pgweb UI              |
| **Redis port**        | `6379`  | `6380`  | Redis                 |
| **Upstash HTTP port** | `8079`  | `8080`  | serverless-redis-http |

Before asking, run `lsof -i -P -n | grep LISTEN` to check which ports are already in use on the user's machine. Show conflicts and suggest alternatives.

### Database name

- `docker-compose.yml` — `POSTGRES_DB` and pgweb `DATABASE_URL`
- `.env.example` — `DATABASE_URL` connection string

### Port changes

- `docker-compose.yml` — all port mappings
- `.env.example` — `DATABASE_URL` port, `KV_REST_API_URL` port, `PORT`, `NEXT_PUBLIC_API_URL`
- `apps/web/package.json` — if dev script specifies port
- AGENTS.md / CLAUDE.md — "Key Facts" section mentioning default port

## Phase 5: Environment Secrets

Help the user generate and configure required secrets:

```bash
# Generate BETTER_AUTH_SECRET (required)
openssl rand -base64 32

# Generate CRON_SECRET (required for production)
openssl rand -hex 32
```

Walk them through:

1. Copy `.env.example` to `.env`
2. Generate and set `BETTER_AUTH_SECRET`
3. Generate and set `CRON_SECRET`
4. Optionally configure: `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`/`SECRET`, `RESEND_API_KEY`

## Phase 6: Verify & Clean Up

After all changes:

1. Run `pnpm install` to regenerate lockfile with new package names
2. Run `pnpm typecheck` to verify no broken imports
3. Run `pnpm lint` to check for issues
4. Run `pnpm dev` to start Docker, run migrations, and launch the web server — verify it works at `http://localhost:3000`
5. If building mobile: in separate terminals, run `pnpm metro` and then `pnpm mobile` — verify the app launches on the simulator

### Final cleanup checklist (present to user)

- [ ] Update `README.md` with your project's description
- [ ] Delete the demo AI agent feature if not needed (`apps/web/app/app/agent/`, related API routes)
- [ ] Set up Vercel project and add environment variables
- [ ] Configure GitHub repository secrets for CI/CD
- [ ] Set up Neon database for production
- [ ] (If using mobile) Configure Apple Developer / Google Play accounts
- [ ] (If using mobile) Set up Fastlane signing credentials
- [ ] Make initial commit on a fresh git history: `rm -rf .git && git init`

## Phase 7: You're Ready

Present the user with the commands they'll use for day-to-day development:

```
pnpm dev       — Start Docker, run migrations, launch web server (localhost:3000)
pnpm metro     — Start the React Native Metro bundler (in a separate terminal)
pnpm mobile    — Build and install the iOS app on the simulator (in a separate terminal)
```

Notes to mention:

- `pnpm dev` handles everything for web — Docker, database migrations, and the dev server in one command
- For a specific iOS simulator: `pnpm mobile -- --simulator="iPhone 16e"`
- First-time iOS setup requires CocoaPods: `cd apps/mobile/ios && pod install && cd -`
- Database UI (pgweb) is available at `http://localhost:8082` after running `pnpm dev`

## Phase Order

Always work through phases in order (1 → 7). The user can skip phases that don't apply (e.g., skip Phase 2 if not building mobile). After each phase, confirm with the user before proceeding to the next.

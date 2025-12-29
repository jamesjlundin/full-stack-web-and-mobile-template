# Template Web

A Next.js App Router frontend located in `apps/web`.

## Getting Started

1. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

2. Verify local environment config (already scaffolded):

   ```bash
   cat apps/web/.env.local
   ```

3. Run the development server:

   ```bash
   pnpm -C apps/web dev
   ```

4. Build for production:

   ```bash
   pnpm -C apps/web build
   ```

## Email Verification (Resend Integration)

Email verification uses [Resend](https://resend.com) for sending emails in production.

### Configuration

Set the following environment variables:

| Variable         | Description                                                   | Required      |
| ---------------- | ------------------------------------------------------------- | ------------- |
| `RESEND_API_KEY` | Your Resend API key                                           | In production |
| `MAIL_FROM`      | Sender email address (must be verified in Resend)             | In production |
| `APP_BASE_URL`   | Base URL for verification links (e.g., `https://yourapp.com`) | Yes           |
| `RESEND_DRY_RUN` | Set to `"1"` to log email payload without sending             | Optional      |

### Behavior by Environment

- **Development** (`NODE_ENV !== "production"`): Returns `devToken` in API response for testing. No emails are sent.
- **Production with `RESEND_API_KEY`**: Sends verification email via Resend. Returns `{ ok: true }`.
- **Production with `RESEND_DRY_RUN=1`**: Logs email payload to console. Returns `{ ok: true, devNote: "dry_run: email payload logged" }`.
- **Production without `RESEND_API_KEY`**: Returns error (email service not configured).

### Vercel Deployment

1. Add `RESEND_API_KEY` to your Vercel project's environment variables
2. Set `MAIL_FROM` to a verified sender/domain in Resend (e.g., `"Your App <no-reply@yourdomain.com>"`)
3. Set `APP_BASE_URL` to your production URL (e.g., `https://yourapp.com`)

## RAG Query Validation

The web app includes a RAG (Retrieval-Augmented Generation) query endpoint for semantic search over document chunks.

### Prerequisites

1. Run the pgvector migration:

   ```bash
   pnpm -C packages/db migrate:apply
   ```

2. (Optional) Seed sample data (requires `OPENAI_API_KEY`):
   ```bash
   pnpm rag:seed
   ```

### Testing the Endpoint

**Without API key** (expect 400 error):

```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**With API key and seeded data** (expect 200 with results):

```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is TypeScript?", "k": 3}'
```

### Response Format

```json
{
  "chunks": [
    {
      "id": "01HX...",
      "doc_id": "seed-typescript",
      "text": "TypeScript is a strongly typed...",
      "score": 0.1234,
      "metadata": { "source": "Introduction to TypeScript" }
    }
  ],
  "took_ms": 123
}
```

### Environment Variables

| Variable         | Description                                | Required        |
| ---------------- | ------------------------------------------ | --------------- |
| `DATABASE_URL`   | PostgreSQL connection string with pgvector | Yes             |
| `OPENAI_API_KEY` | OpenAI API key for embeddings              | For RAG queries |

## Protected Routes

The web app uses a two-layer approach to route protection:

1. **Middleware** (`middleware.ts`): Intercepts requests and redirects unauthenticated users to `/login`
2. **Server-side fallback** (`app/app/layout.tsx`): Secondary protection in case middleware is bypassed

### Default Protected Paths

The following path prefixes are protected by default:

- `/app/*` - Main application routes
- `/dashboard/*` - Dashboard routes
- `/account/*` - Account management routes
- `/protected/*` - Generic protected routes

### Adding New Protected Paths

To protect additional routes, edit the `PROTECTED_PATH_PREFIXES` array in `middleware.ts`:

```typescript
const PROTECTED_PATH_PREFIXES = [
  '/app',
  '/dashboard',
  '/account',
  '/protected',
  '/my-new-route', // Add your new protected path here
];
```

### How Redirects Work

When an unauthenticated user tries to access a protected route:

1. Middleware intercepts the request
2. User is redirected to `/login?next=/original-path`
3. After successful login, user is redirected back to the original path

The `next` query parameter preserves the intended destination so users land where they wanted to go after authentication.

### Server-Side Protection

The `app/app/layout.tsx` provides a server-side session check as a fallback. This ensures protection even in edge cases where middleware might not run (e.g., certain deployment configurations).

To add server-side protection to other route groups, you can use the `getServerSession` function from `lib/session.ts`:

```typescript
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MyProtectedPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login?next=/my-protected-page");
  }

  return <div>Protected content for {user.email}</div>;
}
```

## Design System

This web app uses [shadcn/ui](https://ui.shadcn.com/) as its component library, built on [Radix UI](https://www.radix-ui.com/) primitives and styled with [Tailwind CSS](https://tailwindcss.com/).

### Component Location

UI components are located in `components/ui/`. Each component is a separate file that can be customized as needed:

```
components/
├── ui/
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── checkbox.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── sonner.tsx (toast notifications)
│   ├── spinner.tsx
│   ├── textarea.tsx
│   ├── tooltip.tsx
│   └── index.ts (barrel export)
├── layout/
│   ├── header.tsx
│   ├── app-shell.tsx
│   ├── theme-toggle.tsx
│   └── index.ts
└── theme-provider.tsx
```

### Adding New Components

To add new shadcn/ui components, use the CLI:

```bash
# From the apps/web directory
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add accordion
npx shadcn@latest add tabs
npx shadcn@latest add table
```

The CLI will automatically place components in `components/ui/` based on the `components.json` configuration.

### Theme Configuration

The theme uses CSS variables defined in `app/globals.css`. Colors use HSL format for easy customization:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

To customize the theme:

1. Edit the CSS variables in `app/globals.css`
2. Adjust colors in `tailwind.config.ts` if needed

### Dark Mode

Dark mode is enabled via the `class` strategy and managed by `next-themes`:

- The `ThemeProvider` is set up in `app/layout.tsx`
- Use the `ThemeToggle` component to switch themes
- System preference is respected by default

To programmatically control the theme:

```tsx
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle theme</button>
  );
}
```

### Toast Notifications

Toast notifications use [Sonner](https://sonner.emilkowal.ski/). The `Toaster` component is already added to the root layout.

To show a toast:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Operation completed');

// Error
toast.error('Something went wrong');

// Custom
toast('Event has been created', {
  description: 'Monday, January 3rd at 6:00pm',
});
```

### Utility Functions

The `cn()` utility function in `lib/utils.ts` merges Tailwind classes safely:

````tsx
import { cn } from "@/lib/utils";

<div className={cn("base-class", conditional && "conditional-class", className)} />

## Background & Cron Jobs

The web app includes a background job system using Vercel Cron Jobs and a `runInBackground` helper for post-response work.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CRON_SECRET` | Secret for authenticating cron requests | `dev-secret` |
| `BACKGROUND_ENABLED` | Enable/disable background work | `1` (enabled) |
| `APP_BASE_URL` | Base URL for the application | `http://localhost:3000` |

**Important**: In production, set `CRON_SECRET` to a secure random value.

### Cron Endpoints

All cron endpoints require authentication via the `x-cron-secret` header.

| Endpoint | Method | Schedule | Description |
|----------|--------|----------|-------------|
| `/api/cron/heartbeat` | GET | Daily 12pm UTC | Health check canary |
| `/api/cron/nightly` | GET/POST | Daily 5am UTC | Maintenance tasks |
| `/api/cron/run` | POST | Manual | Trigger any job on demand |

### Vercel Cron Configuration

Cron schedules are defined in `vercel.json` at the repository root. Vercel automatically calls these endpoints on the specified schedule.

**Note**: Vercel Hobby plan limits cron jobs to 2 jobs with daily minimum frequency. Pro plan allows more frequent schedules (e.g., every 15 minutes). Adjust schedules in `vercel.json` based on your plan.

To add a new scheduled job, first create the route handler in `app/api/cron/[jobname]/route.ts` and the job logic in `server/jobs/[jobname].ts`, then add an entry to `vercel.json`.

### Job Logic

Job logic is factored into pure functions in `server/jobs/` for testability and reuse. Route handlers are thin wrappers that handle authentication and invoke these functions.

To add a new job, create a new file in `server/jobs/` with an async function, export it from `server/jobs/index.ts`, and create a corresponding route handler.

### Manual Triggers (Local Development)

To test cron endpoints locally, use curl with the secret header.

Test heartbeat: curl -H "x-cron-secret: dev-secret" http://localhost:3000/api/cron/heartbeat

Test nightly: curl -H "x-cron-secret: dev-secret" http://localhost:3000/api/cron/nightly

Test without secret (should return 401): curl http://localhost:3000/api/cron/heartbeat

Run any job via the trigger endpoint: curl -X POST -H "x-cron-secret: dev-secret" -H "Content-Type: application/json" -d '{"job":"heartbeat"}' http://localhost:3000/api/cron/run

### Background Work Helper

The `runInBackground` helper from `@acme/obs` allows you to schedule work that runs after the HTTP response is sent. This is useful for analytics, cache warming, or other non-critical tasks.

On Vercel, it uses `waitUntil` to keep the function running. In other environments, it falls back to safe fire-and-forget execution with error logging.

```typescript
import { runInBackground } from "@acme/obs";

export async function GET() {
  // Main work...

  // Schedule background work (won't block response)
  runInBackground(async () => {
    await sendAnalytics();
    await warmCache();
  }, undefined, "post-response-tasks");

  return Response.json({ ok: true });
}
````

Use `runInBackground` when:

- The work is non-critical and can fail silently
- You want to reduce response latency
- The task doesn't need to complete before responding

Do not use it for work that must succeed before the user sees a result.

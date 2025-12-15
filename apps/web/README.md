# ACME Web

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

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key | In production |
| `MAIL_FROM` | Sender email address (must be verified in Resend) | In production |
| `APP_BASE_URL` | Base URL for verification links (e.g., `https://yourapp.com`) | Yes |
| `RESEND_DRY_RUN` | Set to `"1"` to log email payload without sending | Optional |

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

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string with pgvector | Yes |
| `OPENAI_API_KEY` | OpenAI API key for embeddings | For RAG queries |

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
  "/app",
  "/dashboard",
  "/account",
  "/protected",
  "/my-new-route",  // Add your new protected path here
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

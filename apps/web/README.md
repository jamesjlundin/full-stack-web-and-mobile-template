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

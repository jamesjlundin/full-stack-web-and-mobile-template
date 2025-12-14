# @acme/ai

AI utilities package with prompt and schema versioning support.

## Prompt Versioning

Prompts are versioned using file naming conventions:

```
src/prompts/{feature}/{name}.v{version}.ts
```

### Bumping a Prompt Version

1. Create a new version file alongside the existing one:
   ```
   src/prompts/chat/default.v1.ts  (existing)
   src/prompts/chat/default.v2.ts  (new)
   ```

2. Export the new prompt in `src/prompts/index.ts`:
   ```typescript
   export { chatDefaultV2 } from "./chat/default.v2.js";
   ```

3. Update the router mapping in `src/router.ts`:
   ```typescript
   import { chatDefaultV2 } from "./prompts/chat/default.v2.js";

   const PROMPT_MAPPING = {
     chat: {
       default: chatDefaultV2,  // Changed from chatDefaultV1
     },
   };
   ```

## Schema Versioning

JSON schemas are stored in `src/schemas/{namespace}/{name}.json` with version in the `$id` field.

### Adding a New Schema

1. Create the JSON schema file:
   ```
   src/schemas/tools/search.json
   ```

2. Set the `$id` to include version:
   ```json
   {
     "$id": "tools.search.v1",
     "type": "object",
     ...
   }
   ```

3. Register in `src/schemas/index.ts`:
   ```typescript
   import searchSchema from "./tools/search.json" with { type: "json" };

   export const schemas = {
     // ...existing schemas
     toolsSearch: createSchemaInfo(searchSchema),
   };
   ```

4. Use the compiled validator:
   ```typescript
   const ajv = configureAjv();
   const validator = ajv.getValidator("toolsSearch");
   const result = validator.validate(data);
   ```

## Version Headers

The streaming endpoint adds version headers to responses:

| Header | Description |
|--------|-------------|
| `X-Prompt-Id` | Active prompt identifier |
| `X-Prompt-Version` | Prompt version number |
| `X-Schema-Id` | Schema identifier |
| `X-Schema-Version` | Schema version number |
| `X-Rag-Config-Version` | RAG config version (when implemented) |
| `X-Embed-Model` | Embedding model identifier |

### Debug Endpoint

Check current versions at: `GET /api/debug/versions`

```bash
curl http://localhost:3000/api/debug/versions
```

## Building

```bash
pnpm -C packages/ai build
# or from root:
pnpm ai:build
```

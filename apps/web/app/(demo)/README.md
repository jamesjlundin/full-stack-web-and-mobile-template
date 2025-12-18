# Demo Features

This folder contains demo features that showcase the template's capabilities. **Delete this folder before building your production application.**

## What's Included

### AI Agent (`/agent`)

An interactive AI agent with tool calling capabilities:

- Streaming chat with GPT-4o-mini (or mock responses without API key)
- Mock tools: `get_weather`, `get_time`
- Rate limiting per authenticated user (20 req/min)
- Tool call visualization in the UI

## Cleanup Instructions

To remove all demo features from your project:

```bash
# 1. Remove demo pages (this folder)
rm -rf apps/web/app/\(demo\)

# 2. Remove demo API routes
rm -rf apps/web/app/api/agent

# 3. Remove agent prompt (optional - only if not using agents)
rm -rf packages/ai/src/prompts/agent

# 4. Update router.ts to remove "agent" from PROMPT_MAPPING
#    Edit: packages/ai/src/router.ts
#    Remove the "agent" entry from PROMPT_MAPPING
```

That's it! The demo code is self-contained and has no impact on other features.

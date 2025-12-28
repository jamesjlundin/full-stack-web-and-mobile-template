# MCP Server Research for Full-Stack Web & Mobile Template

> **Research Date**: December 2025
> **Focus**: Free MCP servers with high-value use cases for this monorepo

---

## Executive Summary

After deep research into the current MCP landscape, I recommend **5-7 carefully selected MCP servers** for this repository. This is intentional—studies show that too many MCPs degrade performance due to:

1. **Token consumption**: Each MCP server's tool definitions consume context window tokens
2. **Inference slowdown**: More tools = more parsing overhead for the LLM
3. **Decision fatigue**: LLMs perform worse with excessive tool options

> "LLM-reliability often negatively correlates with the amount of instructional context it's provided. As servers get bigger and users integrate more of them, an assistant's performance will degrade while increasing the cost of every single request."
> — [CData MCP Limitations Analysis](https://www.cdata.com/blog/navigating-the-hurdles-mcp-limitations)

---

## Recommended MCP Servers

### Tier 1: Essential (Install These)

#### 1. GitHub MCP Server (Official)
**Repository**: [github/github-mcp-server](https://github.com/github/github-mcp-server)
**Cost**: Free
**Why for this repo**: Direct integration with your CI/CD workflows, issue management, and PR automation.

**Key Features**:
- Repository browsing and code search
- Issue and PR management (create, update, review)
- GitHub Actions workflow monitoring
- Security findings and Dependabot alerts
- Lockdown mode and content filtering for security

**Setup Options**:
- **Remote** (recommended): No local install needed, auto-updates
- **Local**: Run via `npx @anthropic-ai/mcp-github`

**Configuration**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

---

#### 2. Context7 (by Upstash)
**Repository**: [upstash/context7](https://github.com/upstash/context7)
**Cost**: Free
**Why for this repo**: Your stack uses cutting-edge versions (Next.js 16, React 19, Drizzle ORM) that are beyond most LLM training cutoffs.

**Key Features**:
- Up-to-date documentation for 1000+ libraries
- Version-specific context (critical for Next.js 16, React 19)
- Reduces hallucinations by grounding LLM in actual docs
- Token-efficient (default 5000 tokens, configurable)

**Supported Libraries Relevant to Your Stack**:
- Next.js 16+, React 19+
- Drizzle ORM, Tailwind CSS 4
- Better Auth, Vercel AI SDK
- React Native, Expo

**Configuration**:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Usage**: Add `use context7` to your prompts for library-specific questions.

---

#### 3. Neon MCP Server
**Repository**: [neondatabase/mcp-server-neon](https://github.com/neondatabase/mcp-server-neon)
**Cost**: Free
**Why for this repo**: You use Neon serverless PostgreSQL. This is purpose-built for your database layer.

**Key Features**:
- Natural language database queries
- Branch management (create dev branches instantly)
- Schema introspection and migrations
- Project management via conversation
- OAuth authentication (no API key management)

**Configuration (Remote - Recommended)**:
```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/sse"]
    }
  }
}
```

**Security Note**: Intended for local development only—not recommended for production use.

---

#### 4. ESLint MCP Server (Official)
**Repository**: [eslint/eslint](https://eslint.org/docs/latest/use/mcp)
**Cost**: Free
**Why for this repo**: Your PreCommit hook runs `pnpm eslint .`—this gives AI direct linting capabilities.

**Key Features**:
- Direct ESLint integration with LLMs
- Run linting checks within AI workflows
- Get fix suggestions for violations
- Works with your TypeScript ESLint config

**Configuration**:
```json
{
  "mcpServers": {
    "eslint": {
      "command": "npx",
      "args": ["-y", "@eslint/mcp"]
    }
  }
}
```

**Note**: For TypeScript configs (`eslint.config.ts`), you may need: `npx -p jiti @eslint/mcp`

---

### Tier 2: High Value (Strongly Recommended)

#### 5. Playwright MCP Server (Microsoft Official)
**Repository**: [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
**Cost**: Free
**Why for this repo**: Your integration tests need browser automation; this enables AI-driven testing.

**Key Features**:
- Browser automation without vision models
- Uses accessibility tree (fast, deterministic)
- Multi-browser support (Chromium, Firefox, WebKit)
- Device emulation for mobile testing
- Screenshot and state capture

**Use Cases for Your Repo**:
- Generate integration tests for `apps/web`
- Validate UI components in real browsers
- Debug visual issues with AI assistance

**Configuration**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-playwright"]
    }
  }
}
```

---

#### 6. Sequential Thinking (Anthropic Reference)
**Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
**Cost**: Free
**Why for this repo**: Complex debugging and architectural decisions benefit from structured reasoning.

**Key Features**:
- Step-by-step problem decomposition
- Dynamic thought revision and branching
- Hypothesis generation and verification
- Works well for debugging monorepo issues

**Use Cases**:
- Debug complex cross-package issues
- Plan database migrations
- Architect new features across web/mobile

**Configuration**:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

---

### Tier 3: Situational (Install When Needed)

#### 7. Drizzle MCP Server
**Repository**: [defrex/drizzle-mcp](https://github.com/defrex/drizzle-mcp)
**Cost**: Free
**Why for this repo**: Direct Drizzle ORM operations and drizzle-kit CLI access.

**Key Features**:
- Generate and run migrations
- Execute SQL queries with parameter support
- Schema introspection
- Multi-database support (PostgreSQL primary)

**Note**: Some overlap with Neon MCP—consider using only one for database work to reduce tool bloat.

**Configuration**:
```json
{
  "mcpServers": {
    "drizzle": {
      "command": "npx",
      "args": ["-y", "drizzle-mcp"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

---

#### 8. React Native MCP
**Repository**: [MrNitro360/React-Native-MCP](https://github.com/MrNitro360/React-Native-MCP)
**Cost**: Free
**Why for this repo**: Your `apps/mobile` needs React Native-specific guidance.

**Key Features**:
- Code analysis with RN best practices
- iOS and Android specific optimizations
- Security auditing for mobile
- Performance optimization suggestions

**Alternative**: [Expo MCP Server](https://docs.expo.dev/eas/ai/mcp/) if using Expo SDK 54+

**Configuration**:
```json
{
  "mcpServers": {
    "react-native": {
      "command": "npx",
      "args": ["-y", "@mrnitro360/react-native-mcp-guide"]
    }
  }
}
```

---

#### 9. Upstash MCP Server
**Repository**: [upstash/mcp-server](https://github.com/upstash/mcp-server)
**Cost**: Free
**Why for this repo**: You use Upstash Redis for rate limiting.

**Key Features**:
- Manage Redis databases via natural language
- Create/list/delete keys
- Database backups
- Rate limit configuration

**Configuration**:
```json
{
  "mcpServers": {
    "upstash": {
      "command": "npx",
      "args": ["-y", "@upstash/mcp-server"],
      "env": {
        "UPSTASH_EMAIL": "<your-email>",
        "UPSTASH_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

---

### Paid Options Worth Considering

#### Sentry MCP Server
**Documentation**: [Sentry MCP Setup](https://docs.sentry.io/product/insights/ai/mcp/getting-started/)
**Cost**: Requires Sentry subscription
**Why consider**: If you add Sentry for observability, this provides AI-assisted debugging.

**Key Features**:
- Real-time error monitoring in AI context
- Root cause analysis with SEER AI
- Automated fix suggestions
- 50M+ requests/month across their platform

---

## MCP Servers NOT Recommended

### 1. Filesystem MCP Server
**Why skip**: Claude Code already has excellent file operations built-in (Read, Write, Edit, Glob, Grep). Adding this would be redundant.

### 2. Memory/Knowledge Graph MCP
**Why skip**: Useful for persistent memory across sessions, but adds complexity. Consider only if you need cross-session context retention.

### 3. Fetch MCP Server
**Why skip**: Claude Code has built-in WebFetch capability. Redundant.

### 4. Docker/Kubernetes MCP
**Why skip**: Your deployment is Vercel-based, not container-orchestrated. Would add unused tools.

---

## Recommended Configuration Strategy

### Minimal Setup (5 servers)
For most development work:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<token>" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.neon.tech/sse"]
    },
    "eslint": {
      "command": "npx",
      "args": ["-y", "@eslint/mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### Extended Setup (7 servers)
Add when doing testing or mobile work:

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "context7": { /* ... */ },
    "neon": { /* ... */ },
    "eslint": { /* ... */ },
    "sequential-thinking": { /* ... */ },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-playwright"]
    },
    "react-native": {
      "command": "npx",
      "args": ["-y", "@mrnitro360/react-native-mcp-guide"]
    }
  }
}
```

---

## Best Practices

### 1. Start Small
Begin with 3-5 servers, add more only when you hit specific needs.

### 2. Use Remote Servers When Available
- Neon and GitHub offer remote MCP servers
- No local install, automatic updates
- Better security (OAuth vs API keys)

### 3. Disable Unused Servers
If not doing mobile work, disable the React Native MCP temporarily.

### 4. Monitor Token Usage
Watch for:
- Slower response times
- Increased costs
- LLM confusion between similar tools

### 5. Prefer Official Servers
Prioritize servers from:
- Anthropic/MCP official repo
- Actual product vendors (GitHub, Neon, Microsoft, Upstash)
- Well-maintained community projects (1000+ stars, active commits)

---

## Quick Reference: Server-to-Stack Mapping

| Your Stack Component | Recommended MCP Server |
|---------------------|------------------------|
| Next.js 16 + React 19 | Context7 |
| PostgreSQL + Drizzle | Neon MCP, (optionally Drizzle MCP) |
| GitHub + CI/CD | GitHub MCP |
| Upstash Redis | Upstash MCP |
| TypeScript + ESLint | ESLint MCP |
| React Native | React Native MCP |
| Integration Testing | Playwright MCP |
| Complex Debugging | Sequential Thinking |

---

## Sources

- [MCP Best Practices](https://modelcontextprotocol.info/docs/best-practices/)
- [Official MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [CData MCP Limitations](https://www.cdata.com/blog/navigating-the-hurdles-mcp-limitations)
- [6 Challenges of MCP - Merge](https://www.merge.dev/blog/mcp-challenges)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Context7 by Upstash](https://github.com/upstash/context7)
- [Neon MCP Server](https://github.com/neondatabase/mcp-server-neon)
- [ESLint MCP Setup](https://eslint.org/docs/latest/use/mcp)
- [Playwright MCP by Microsoft](https://github.com/microsoft/playwright-mcp)
- [Sequential Thinking MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- [Sentry MCP Monitoring](https://blog.sentry.io/introducing-mcp-server-monitoring/)
- [Docker's Top MCP Servers 2025](https://www.docker.com/blog/top-mcp-servers-2025/)
- [Vercel MCP Deployment Guide](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)

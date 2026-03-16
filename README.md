# LORE — Architectural Memory for AI Coding

> AI forgets why your code was built this way. LORE remembers.

## The Problem

Every new AI coding session starts fresh.
No context. No history. No "why".

Your team decided to use PostgreSQL over MongoDB.
Your authentication uses JWT with 24h expiry.
Your API follows REST with /api/v1/ versioning.

**The next AI session knows none of this.**

## The Solution
```bash
cd your-project
lore init
```

LORE reads your existing codebase and automatically
extracts architectural decisions — no manual work needed.

Every future AI session starts with full context.

## Demo
```
$ cd my-project
$ lore init

LORE — Architectural Memory for AI Coding
→ Analyzing: /home/user/my-project

✓ Found 5 architectural decisions
✓ LORE.md created
✓ .lore/ initialized
```

Generated `LORE.md`:
```
## Database
### 🟢 PostgreSQL as primary database
**Why**: Found pg/postgres in dependencies
**Rules**: Use connection pooling always

## Authentication
### 🟢 JWT-based authentication
**Rules**: Never store secrets in code
```

## Quick Start
```bash
npm install -g lore-mcp
cd your-project
lore init
```

## MCP Integration (Claude Code / Cursor)

Add to your MCP settings:
```json
{
  "mcpServers": {
    "lore": {
      "command": "node",
      "args": ["/path/to/lore-mcp/dist/index.js"]
    }
  }
}
```

## What LORE Detects Automatically

- Database choices (PostgreSQL, MongoDB, MySQL, SQLite)
- Authentication patterns (JWT, Passport, NextAuth)
- Web frameworks (Express, Fastify, Next.js)
- Validation libraries (Zod, Yup, Joi)
- Caching strategies (Redis, Memcached)
- Testing frameworks (Jest, Vitest)
- Security rules and constraints

## Tools

| Tool | Description |
|------|-------------|
| `record_decision` | Record an architectural decision |
| `get_context` | Get all decisions for current project |
| `get_gaps` | Find decisions with unmet constraints |

## Built by

[@TheEliotShift](https://x.com/TheEliotShift) — Developer from Morocco 🇲🇦

---

*If LORE saved you time → ⭐*

<p align="center">
  <img src="logo.png" width="200" alt="LORE"/>
</p>

<h1 align="center">LORE — Architectural Memory for AI Coding</h1>

<p align="center">
  <a href="https://npmjs.com/package/lore-mcp"><img src="https://img.shields.io/npm/v/lore-mcp?color=4f6ef7&label=npm" alt="npm"/></a>
  <a href="https://npmjs.com/package/lore-mcp"><img src="https://img.shields.io/npm/dm/lore-mcp?color=4f6ef7" alt="downloads"/></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license"/>
</p>

<p align="center"><em>AI forgets why your code was built this way. LORE remembers.</em></p>

---

## Demo

<p align="center">
  <img src="demo.svg" alt="LORE Demo"/>
</p>

---

## The Problem

Every new AI coding session starts fresh.
No context. No history. No "why".

Your team decided to use PostgreSQL over MongoDB.  
Your authentication uses JWT with 24h expiry.  
4 of your API routes have no auth middleware.  
Your bug-fix ratio is dangerously high.

**The next AI session knows none of this.**

## The Solution
```bash
cd your-project
lore init
```

LORE reads your codebase and automatically extracts up to **24 architectural decisions** including security gaps, risk patterns, and the WHY behind your choices.

## Quick Start
```bash
npm install -g lore-mcp
cd your-project
lore init
lore status
```

## Commands

| Command | Description |
|---------|-------------|
| `lore init` | Analyze project and extract all decisions |
| `lore status` | View decisions by category with risk indicators |
| `lore decide "reason"` | Record WHY behind a decision manually |
| `lore doctor` | Diagnose LORE setup issues |
| `lore --version` | Show version |

## What LORE Detects

**From dependencies:**
- Databases (PostgreSQL, MongoDB, MySQL, SQLite)
- Auth (JWT, Passport, NextAuth)
- Frameworks (Express, Fastify, Next.js, Hono)
- Validation (Zod, Yup, Joi)
- Caching (Redis, Memcached)
- Security (bcrypt, helmet, cors, dotenv)

**From source code:**
- API versioning patterns (`/api/v1/`)
- Unprotected routes (security gaps)
- Error handling coverage %
- Architecture patterns (MVC, Service/Model)
- Environment variables usage

**From git history:**
- Project age and contributors
- High churn files (risk indicators)
- Bug-fix ratio (code quality signal)
- Commit message quality score
- Security-related commit patterns

## Capture the WHY
```bash
lore decide "chose PostgreSQL over MongoDB because we need ACID transactions for payments"
lore decide "rejected Redis sessions — JWT scales better for our microservices"
```

## MCP Integration (Claude Code / Cursor)
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

## Built by

[@TheEliotShift](https://x.com/TheEliotShift) — Developer from Morocco 🇲🇦

---

*If LORE saved you time → ⭐*

<h1 align="center">LORE — Architectural Memory for AI Coding</h1>

<p align="center">
  <img src="logo.png" width="350" alt="LORE"/>
</p>

<p align="center">
  <a href="https://npmjs.com/package/lore-mcp"><img src="https://img.shields.io/npm/v/lore-mcp?color=4f6ef7&label=npm&style=flat-square" alt="npm"/></a>
  <a href="https://npmjs.com/package/lore-mcp"><img src="https://img.shields.io/npm/dm/lore-mcp?color=4f6ef7&style=flat-square" alt="downloads"/></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"/>
  <img src="https://img.shields.io/github/actions/workflow/status/EliotShift/lore-mcp/test.yml?style=flat-square&label=CI" alt="CI"/>
  <img src="https://img.shields.io/badge/tested%20on-Linux%20%26%20macOS-blue?style=flat-square" alt="platforms"/>
  <img src="https://img.shields.io/badge/local--first-no%20data%20leaves-brightgreen?style=flat-square" alt="local-first"/>
</p>

<p align="center"><em>AI forgets why your code was built this way. LORE remembers.</em></p>

[![lore-mcp MCP server](https://glama.ai/mcp/servers/EliotShift/lore-mcp/badges/card.svg)](https://glama.ai/mcp/servers/EliotShift/lore-mcp)

---

## See it in action

<p align="center">
  <img src="demo.svg" alt="LORE Demo" width="700"/>
</p>

---

## Why LORE?

Every time you open Claude Code or Cursor, it starts with zero context.

**Without LORE**, you manually explain every session:
- "We use PostgreSQL because we need ACID transactions"
- "JWT expiry is 24h due to mobile requirements"
- "4 of our API routes have no auth middleware"

**With LORE**, one command gives AI full context automatically:
```bash
npx lore-mcp init
```

---

## Quick Start
```bash
npm install -g lore-mcp
cd your-project
lore init
lore status
```

---

## What LORE detects

| Source | What it finds |
|--------|---------------|
| `package.json` | Databases, frameworks, auth, security libs |
| Source code | Unprotected routes, error handling %, MVC patterns |
| Git history | Bug-fix ratio, high churn files, commit quality |
| Manual input | WHY behind decisions via `lore decide` |

---

## CLI
```bash
lore init                        # Analyze project → extract 24 decisions
lore status                      # View all decisions by category
lore decide "reason"             # Record WHY behind a decision
lore doctor                      # Diagnose setup issues
lore --version                   # Show version
```

---

## Capture the WHY

Automated extraction finds WHAT. `lore decide` captures WHY:
```bash
lore decide "chose PostgreSQL over MongoDB — need ACID for payments"
lore decide "rejected Redis sessions — JWT scales better for microservices"
lore decide "helmet enabled — security audit requirement Q1 2026"
```

---

## MCP Integration

Add to Claude Code / Cursor settings:
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

---

## What LORE finds in a real project
```
SECURITY
  ● bcrypt for password hashing
  ● Helmet.js for HTTP security headers
  ● 3 of 5 routes may lack auth middleware  ← security gap
  ● JWT secrets must be in environment variables

RISK
  ● High bug-fix ratio: 3/5 recent commits are fixes
  ● Low commit message quality: 0%
  ● High churn file: src/services/userService.ts
```

---

## Built by

[@TheEliotShift](https://x.com/TheEliotShift) — Developer from Morocco 🇲🇦

---

*If LORE saved you time → ⭐*
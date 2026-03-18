#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const args = process.argv.slice(2);
const command = args[0];

// Colors
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

// Version
const VERSION = "0.1.1";

function log(msg: string) { console.log(msg); }
function ok(msg: string) { log(`${GREEN}✓${RESET} ${msg}`); }
function warn(msg: string) { log(`${YELLOW}⚠${RESET}  ${msg}`); }
function err(msg: string) { log(`${RED}✗${RESET} ${msg}`); }
function info(msg: string) { log(`${BLUE}→${RESET} ${msg}`); }

// ──────────────────────────────────────────
// HELP
// ──────────────────────────────────────────

function showHelp() {
  log(`\n${BOLD}LORE${RESET} — Architectural Memory for AI Coding`);
  log(`${CYAN}v${VERSION}${RESET}\n`);
  log(`${BOLD}Usage:${RESET}`);
  log(`  lore <command>\n`);
  log(`${BOLD}Commands:${RESET}`);
  log(`  ${GREEN}init${RESET}      Analyze project and create LORE.md`);
  log(`  ${GREEN}doctor${RESET}    Check LORE setup and diagnose issues`);
  log(`  ${GREEN}status${RESET}    Show current project decisions`);
  log(`  ${GREEN}--version${RESET} Show version number`);
  log(`  ${GREEN}--help${RESET}    Show this help\n`);
  log(`${BOLD}Examples:${RESET}`);
  log(`  cd my-project && lore init`);
  log(`  npx lore-mcp init\n`);
  log(`${BOLD}Docs:${RESET} github.com/EliotShift/lore-mcp\n`);
}

// ──────────────────────────────────────────
// DOCTOR: diagnose setup issues
// ──────────────────────────────────────────

async function doctor() {
  log(`\n${BOLD}LORE Doctor${RESET} — Checking your setup\n`);

  let allGood = true;

  // Check Node version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0]);
  if (major >= 18) {
    ok(`Node.js ${nodeVersion} — compatible`);
  } else {
    err(`Node.js ${nodeVersion} — requires v18+`);
    info(`Run: nvm install 18`);
    allGood = false;
  }

  // Check project directory
  const projectPath = process.cwd();
  const hasPackage = fs.existsSync(path.join(projectPath, "package.json"));
  const hasGit = fs.existsSync(path.join(projectPath, ".git"));
  const hasPython = fs.existsSync(path.join(projectPath, "requirements.txt"));

  if (hasPackage || hasGit || hasPython) {
    ok(`Project detected at ${projectPath}`);
  } else {
    warn(`No project detected — run lore init from your project root`);
    allGood = false;
  }

  // Check .lore/ directory
  const loreDir = path.join(projectPath, ".lore");
  if (fs.existsSync(loreDir)) {
    ok(`.lore/ directory exists`);
  } else {
    warn(`.lore/ not found — run lore init first`);
    allGood = false;
  }

  // Check LORE.md
  const loreMd = path.join(projectPath, "LORE.md");
  if (fs.existsSync(loreMd)) {
    ok(`LORE.md exists`);
  } else {
    warn(`LORE.md not found — run lore init`);
    allGood = false;
  }

  // Check decisions.json
  const decisionsJson = path.join(loreDir, "decisions.json");
  if (fs.existsSync(decisionsJson)) {
    try {
      const data = JSON.parse(fs.readFileSync(decisionsJson, "utf-8"));
      ok(`Found ${data.decisions?.length || 0} decisions stored`);
    } catch {
      err(`decisions.json is corrupted — run lore init again`);
      allGood = false;
    }
  }

  log("");
  if (allGood) {
    ok(`Everything looks good! LORE is ready.\n`);
  } else {
    warn(`Some issues found. Fix them and run lore doctor again.\n`);
  }
}

// ──────────────────────────────────────────
// STATUS: show current decisions
// ──────────────────────────────────────────

function status() {
  const projectPath = process.cwd();
  const decisionsJson = path.join(projectPath, ".lore", "decisions.json");

  if (!fs.existsSync(decisionsJson)) {
    warn(`No LORE data found. Run lore init first.\n`);
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(decisionsJson, "utf-8"));
    const decisions = data.decisions || [];

    log(`\n${BOLD}LORE Status${RESET} — ${projectPath}\n`);
    log(`Last updated: ${new Date(data.lastUpdated).toLocaleString()}`);
    log(`Total decisions: ${BOLD}${decisions.length}${RESET}\n`);

    const byCategory: Record<string, any[]> = {};
    for (const d of decisions) {
      if (!byCategory[d.category]) byCategory[d.category] = [];
      byCategory[d.category].push(d);
    }

    for (const [category, items] of Object.entries(byCategory)) {
      log(`${CYAN}${category.toUpperCase()}${RESET}`);
      for (const d of items) {
        const badge = d.confidence === "HIGH" ? GREEN : d.confidence === "MEDIUM" ? YELLOW : RED;
        log(`  ${badge}●${RESET} ${d.decision}`);
      }
      log("");
    }
  } catch (e) {
    err(`Failed to read decisions: ${String(e)}\n`);
  }
}

// ──────────────────────────────────────────
// INIT: analyze project and extract decisions
// ──────────────────────────────────────────

async function init() {
  const projectPath = process.cwd();

  log(`\n${BOLD}LORE${RESET} — Architectural Memory for AI Coding\n`);
  info(`Analyzing: ${projectPath}\n`);

  // Validate project directory
  const hasPackage = fs.existsSync(path.join(projectPath, "package.json"));
  const hasGit = fs.existsSync(path.join(projectPath, ".git"));
  const hasPython = fs.existsSync(path.join(projectPath, "requirements.txt"));
  const hasCompose = fs.existsSync(path.join(projectPath, "docker-compose.yml"));

  if (!hasPackage && !hasGit && !hasPython && !hasCompose) {
    warn("This doesn't look like a project directory.");
    warn("Make sure you're in your project root.");
    info("Run: cd your-project && lore init\n");
    process.exit(1);
  }

  // Create .lore/
  const loreDir = path.join(projectPath, ".lore");
  if (!fs.existsSync(loreDir)) {
    fs.mkdirSync(loreDir, { recursive: true });
  }

  // Extract decisions
  const decisions = extractDecisions(projectPath);

  if (decisions.length === 0) {
    warn("No architectural patterns detected yet.");
    info("Add more code and run lore init again.\n");
  } else {
    ok(`Found ${decisions.length} architectural decisions\n`);
  }

  // Save decisions
  const store = {
    projectPath,
    decisions,
    lastUpdated: new Date().toISOString(),
    loreVersion: VERSION,
  };

  fs.writeFileSync(
    path.join(loreDir, "decisions.json"),
    JSON.stringify(store, null, 2)
  );

  // Generate LORE.md
  generateLoreMd(store, projectPath);

  ok("LORE.md created");
  ok(".lore/ initialized\n");

  log(`${BOLD}Next steps:${RESET}`);
  log(`  1. Open LORE.md and review detected decisions`);
  log(`  2. Add LORE to your MCP settings (see README)`);
  log(`  3. Run ${CYAN}lore status${RESET} to see all decisions`);
  log(`  4. Start coding — AI now has full context\n`);
}

// ──────────────────────────────────────────
// EXTRACTOR: read code and extract decisions
// ──────────────────────────────────────────

function extractDecisions(projectPath: string) {
  const decisions: any[] = [];

  // package.json analysis
  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const deps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      // Database
      if (deps["pg"] || deps["pg-pool"] || deps["postgres"]) {
        decisions.push(makeDecision(
          "database", "PostgreSQL as primary database",
          "Found pg/postgres in dependencies", "HIGH"
        ));
      }
      if (deps["mongoose"] || deps["mongodb"]) {
        decisions.push(makeDecision(
          "database", "MongoDB as primary database",
          "Found mongoose/mongodb in dependencies", "HIGH"
        ));
      }
      if (deps["mysql2"] || deps["mysql"]) {
        decisions.push(makeDecision(
          "database", "MySQL as primary database",
          "Found mysql2 in dependencies", "HIGH"
        ));
      }
      if (deps["better-sqlite3"] || deps["sqlite3"]) {
        decisions.push(makeDecision(
          "database", "SQLite as database",
          "Found sqlite3 in dependencies", "HIGH"
        ));
      }

      // ORM
      if (deps["prisma"] || deps["@prisma/client"]) {
        decisions.push(makeDecision(
          "database", "Prisma as ORM",
          "Found prisma in dependencies", "HIGH"
        ));
      }
      if (deps["typeorm"]) {
        decisions.push(makeDecision(
          "database", "TypeORM as ORM",
          "Found typeorm in dependencies", "HIGH"
        ));
      }
      if (deps["drizzle-orm"]) {
        decisions.push(makeDecision(
          "database", "Drizzle as ORM",
          "Found drizzle-orm in dependencies", "HIGH"
        ));
      }

      // Auth
      if (deps["jsonwebtoken"] || deps["jose"]) {
        decisions.push(makeDecision(
          "authentication", "JWT-based authentication",
          "Found jsonwebtoken/jose in dependencies", "HIGH",
          [], ["Never store secrets in code", "Always validate token expiry"]
        ));
      }
      if (deps["passport"]) {
        decisions.push(makeDecision(
          "authentication", "Passport.js for authentication",
          "Found passport in dependencies", "HIGH"
        ));
      }
      if (deps["next-auth"] || deps["@auth/core"]) {
        decisions.push(makeDecision(
          "authentication", "NextAuth for authentication",
          "Found next-auth in dependencies", "HIGH"
        ));
      }

      // Framework
      if (deps["express"]) {
        decisions.push(makeDecision(
          "architecture", "Express.js as web framework",
          "Found express in dependencies", "HIGH"
        ));
      }
      if (deps["fastify"]) {
        decisions.push(makeDecision(
          "architecture", "Fastify as web framework",
          "Found fastify in dependencies", "HIGH"
        ));
      }
      if (deps["next"]) {
        decisions.push(makeDecision(
          "architecture", "Next.js as fullstack framework",
          "Found next in dependencies", "HIGH"
        ));
      }
      if (deps["hono"]) {
        decisions.push(makeDecision(
          "architecture", "Hono as web framework",
          "Found hono in dependencies", "HIGH"
        ));
      }

      // Testing
      if (deps["jest"] || deps["@jest/globals"]) {
        decisions.push(makeDecision(
          "testing", "Jest as testing framework",
          "Found jest in dependencies", "HIGH"
        ));
      }
      if (deps["vitest"]) {
        decisions.push(makeDecision(
          "testing", "Vitest as testing framework",
          "Found vitest in dependencies", "HIGH"
        ));
      }

      // Cache
      if (deps["redis"] || deps["ioredis"]) {
        decisions.push(makeDecision(
          "performance", "Redis for caching/sessions",
          "Found redis in dependencies", "HIGH",
          [], ["Use Redis for all session storage", "Set appropriate TTL"]
        ));
      }

      // Queue
      if (deps["bull"] || deps["bullmq"]) {
        decisions.push(makeDecision(
          "architecture", "Bull/BullMQ for job queues",
          "Found bull/bullmq in dependencies", "HIGH"
        ));
      }

      // Validation
      if (deps["zod"]) {
        decisions.push(makeDecision(
          "architecture", "Zod for schema validation",
          "Found zod in dependencies", "HIGH",
          ["yup", "joi"], ["Validate all API inputs with Zod"]
        ));
      }

      // Language
      if (deps["typescript"] || pkg.devDependencies?.["typescript"]) {
        decisions.push(makeDecision(
          "architecture", "TypeScript as primary language",
          "Found typescript in dependencies", "HIGH",
          ["JavaScript"], ["Use strict mode", "No any types without comment"]
        ));
      }

    } catch (e) {
      warn(`Could not parse package.json: ${String(e)}`);
    }
  }

  // .env.example analysis
  const envExample = path.join(projectPath, ".env.example");
  if (fs.existsSync(envExample)) {
    try {
      const content = fs.readFileSync(envExample, "utf-8");
      if (content.includes("DATABASE_URL")) {
        if (content.includes("postgresql") || content.includes("postgres")) {
          const already = decisions.some(d => d.decision.includes("PostgreSQL"));
          if (!already) {
            decisions.push(makeDecision(
              "database", "PostgreSQL (from .env.example)",
              "DATABASE_URL points to PostgreSQL", "MEDIUM"
            ));
          }
        }
      }
      if (content.includes("JWT_SECRET") || content.includes("JWT_")) {
        decisions.push(makeDecision(
          "security", "JWT secrets must be in environment variables",
          "Found JWT_SECRET in .env.example", "HIGH",
          [], ["Never hardcode JWT secrets", "Rotate secrets regularly"]
        ));
      }
    } catch (e) {
      warn(`Could not parse .env.example: ${String(e)}`);
    }
  }

  // docker-compose.yml analysis
  const composePath = path.join(projectPath, "docker-compose.yml");
  if (fs.existsSync(composePath)) {
    try {
      const content = fs.readFileSync(composePath, "utf-8");
      if (content.includes("postgres") || content.includes("postgresql")) {
        const already = decisions.some(d => d.decision.includes("PostgreSQL"));
        if (!already) {
          decisions.push(makeDecision(
            "deployment", "PostgreSQL runs in Docker",
            "Found postgres service in docker-compose", "HIGH"
          ));
        }
      }
      if (content.includes("redis")) {
        const already = decisions.some(d => d.decision.includes("Redis"));
        if (!already) {
          decisions.push(makeDecision(
            "deployment", "Redis runs in Docker",
            "Found redis service in docker-compose", "HIGH"
          ));
        }
      }
      decisions.push(makeDecision(
        "deployment", "Docker Compose for local development",
        "Found docker-compose.yml", "HIGH"
      ));
    } catch (e) {
      warn(`Could not parse docker-compose.yml: ${String(e)}`);
    }
  }

  return decisions;
}

function makeDecision(
  category: string,
  decision: string,
  reason: string,
  confidence: "HIGH" | "MEDIUM" | "LOW",
  alternatives: string[] = [],
  constraints: string[] = []
) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    category,
    decision,
    reason,
    alternatives,
    constraints,
    author: "LORE",
    confidence,
  };
}

// ──────────────────────────────────────────
// GENERATE LORE.md
// ──────────────────────────────────────────

function generateLoreMd(store: any, projectPath: string) {
  const mdPath = path.join(projectPath, "LORE.md");

  const byCategory: Record<string, any[]> = {};
  for (const d of store.decisions) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }

  let md = `# LORE — Architectural Memory\n\n`;
  md += `> Auto-generated by LORE v${VERSION}. Last updated: ${new Date().toLocaleDateString()}\n\n`;
  md += `---\n\n`;

  if (store.decisions.length === 0) {
    md += `*No decisions detected yet.*\n\n`;
    md += `Run \`lore init\` after adding code to extract decisions.\n`;
  } else {
    for (const [category, decisions] of Object.entries(byCategory)) {
      md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;

      for (const d of decisions as any[]) {
        const badge =
          d.confidence === "HIGH" ? "🟢" :
          d.confidence === "MEDIUM" ? "🟡" : "🔴";

        md += `### ${badge} ${d.decision}\n`;
        md += `**Why**: ${d.reason}\n\n`;

        if (d.alternatives.length > 0) {
          md += `**Rejected alternatives**: ${d.alternatives.join(", ")}\n\n`;
        }
        if (d.constraints.length > 0) {
          md += `**Rules**:\n`;
          for (const c of d.constraints) {
            md += `- ⚠️  ${c}\n`;
          }
          md += `\n`;
        }
        md += `*Detected: ${d.timestamp.split("T")[0]}*\n\n`;
      }
    }
  }

  md += `---\n\n`;
  md += `*LORE is an open source MCP server.*\n`;
  md += `*github.com/EliotShift/lore-mcp*\n`;

  fs.writeFileSync(mdPath, md);
}

// ──────────────────────────────────────────
// COMMANDS ROUTER
// ──────────────────────────────────────────

switch (command) {
  case "init":
    init().catch((e) => {
      err(`Unexpected error: ${String(e)}`);
      info("Run 'lore doctor' to diagnose issues.");
      process.exit(1);
    });
    break;
  case "doctor":
    doctor().catch((e) => {
      err(`Doctor failed: ${String(e)}`);
      process.exit(1);
    });
    break;
  case "status":
    status();
    break;
  case "--version":
  case "-v":
    log(`lore-mcp v${VERSION}`);
    break;
  case "--help":
  case "-h":
  case undefined:
    showHelp();
    break;
  default:
    err(`Unknown command: ${command}`);
    info(`Run 'lore --help' to see available commands.\n`);
    process.exit(1);
}

#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const args = process.argv.slice(2);
const command = args[0];
// ألوان
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
function log(msg) { console.log(msg); }
function ok(msg) { log(`${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { log(`${YELLOW}⚠${RESET}  ${msg}`); }
function err(msg) { log(`${RED}✗${RESET} ${msg}`); }
function info(msg) { log(`${BLUE}→${RESET} ${msg}`); }
// ──────────────────────────────────────────
// INIT: يقرأ المشروع ويستخرج القرارات
// ──────────────────────────────────────────
async function init() {
    const projectPath = process.cwd();
    log(`\n${BOLD}LORE${RESET} — Architectural Memory for AI Coding\n`);
    info(`Analyzing: ${projectPath}\n`);
    // تحقق أنه مشروع حقيقي
    const hasPackage = fs.existsSync(path.join(projectPath, "package.json"));
    const hasGit = fs.existsSync(path.join(projectPath, ".git"));
    const hasPython = fs.existsSync(path.join(projectPath, "requirements.txt"));
    const hasCompose = fs.existsSync(path.join(projectPath, "docker-compose.yml"));
    if (!hasPackage && !hasGit && !hasPython && !hasCompose) {
        warn("This doesn't look like a project directory.");
        warn("Make sure you're in your project root.\n");
        process.exit(1);
    }
    // إنشاء .lore/
    const loreDir = path.join(projectPath, ".lore");
    if (!fs.existsSync(loreDir)) {
        fs.mkdirSync(loreDir, { recursive: true });
    }
    // استخراج القرارات
    const decisions = extractDecisions(projectPath);
    if (decisions.length === 0) {
        warn("No architectural patterns detected yet.");
        info("Add more code and run `lore init` again.\n");
    }
    else {
        ok(`Found ${decisions.length} architectural decisions\n`);
    }
    // حفظ
    const store = {
        projectPath,
        decisions,
        lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(loreDir, "decisions.json"), JSON.stringify(store, null, 2));
    // توليد LORE.md
    generateLoreMd(store, projectPath);
    ok("LORE.md created");
    ok(".lore/ initialized\n");
    log(`${BOLD}Next steps:${RESET}`);
    log(`  1. Open LORE.md and review detected decisions`);
    log(`  2. Add LORE to your MCP settings (see README)`);
    log(`  3. Start coding — AI now has full context\n`);
}
// ──────────────────────────────────────────
// EXTRACTOR: قراءة الكود واستخراج القرارات
// ──────────────────────────────────────────
function extractDecisions(projectPath) {
    const decisions = [];
    // ── package.json analysis ──
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
                decisions.push(makeDecision("database", "PostgreSQL as primary database", "Found pg/postgres in dependencies", "HIGH"));
            }
            if (deps["mongoose"] || deps["mongodb"]) {
                decisions.push(makeDecision("database", "MongoDB as primary database", "Found mongoose/mongodb in dependencies", "HIGH"));
            }
            if (deps["mysql2"] || deps["mysql"]) {
                decisions.push(makeDecision("database", "MySQL as primary database", "Found mysql2 in dependencies", "HIGH"));
            }
            if (deps["better-sqlite3"] || deps["sqlite3"]) {
                decisions.push(makeDecision("database", "SQLite as database", "Found sqlite3 in dependencies", "HIGH"));
            }
            // ORM
            if (deps["prisma"] || deps["@prisma/client"]) {
                decisions.push(makeDecision("database", "Prisma as ORM", "Found prisma in dependencies", "HIGH"));
            }
            if (deps["typeorm"]) {
                decisions.push(makeDecision("database", "TypeORM as ORM", "Found typeorm in dependencies", "HIGH"));
            }
            if (deps["drizzle-orm"]) {
                decisions.push(makeDecision("database", "Drizzle as ORM", "Found drizzle-orm in dependencies", "HIGH"));
            }
            // Auth
            if (deps["jsonwebtoken"] || deps["jose"]) {
                decisions.push(makeDecision("authentication", "JWT-based authentication", "Found jsonwebtoken/jose in dependencies", "HIGH", [], ["Never store secrets in code", "Always validate token expiry"]));
            }
            if (deps["passport"]) {
                decisions.push(makeDecision("authentication", "Passport.js for authentication", "Found passport in dependencies", "HIGH"));
            }
            if (deps["next-auth"] || deps["@auth/core"]) {
                decisions.push(makeDecision("authentication", "NextAuth for authentication", "Found next-auth in dependencies", "HIGH"));
            }
            // Framework
            if (deps["express"]) {
                decisions.push(makeDecision("architecture", "Express.js as web framework", "Found express in dependencies", "HIGH"));
            }
            if (deps["fastify"]) {
                decisions.push(makeDecision("architecture", "Fastify as web framework", "Found fastify in dependencies", "HIGH"));
            }
            if (deps["next"]) {
                decisions.push(makeDecision("architecture", "Next.js as fullstack framework", "Found next in dependencies", "HIGH"));
            }
            // Testing
            if (deps["jest"] || deps["@jest/globals"]) {
                decisions.push(makeDecision("testing", "Jest as testing framework", "Found jest in dependencies", "HIGH"));
            }
            if (deps["vitest"]) {
                decisions.push(makeDecision("testing", "Vitest as testing framework", "Found vitest in dependencies", "HIGH"));
            }
            // Cache
            if (deps["redis"] || deps["ioredis"]) {
                decisions.push(makeDecision("performance", "Redis for caching/sessions", "Found redis in dependencies", "HIGH", [], ["Use Redis for all session storage", "Set appropriate TTL"]));
            }
            // Queue
            if (deps["bull"] || deps["bullmq"]) {
                decisions.push(makeDecision("architecture", "Bull/BullMQ for job queues", "Found bull/bullmq in dependencies", "HIGH"));
            }
            // Validation
            if (deps["zod"]) {
                decisions.push(makeDecision("architecture", "Zod for schema validation", "Found zod in dependencies", "HIGH", ["yup", "joi"], ["Validate all API inputs with Zod"]));
            }
            // Language
            if (deps["typescript"] || pkg.devDependencies?.["typescript"]) {
                decisions.push(makeDecision("architecture", "TypeScript as primary language", "Found typescript in dependencies", "HIGH", ["JavaScript"], ["Use strict mode", "No any types without comment"]));
            }
        }
        catch { }
    }
    // ── .env.example analysis ──
    const envExample = path.join(projectPath, ".env.example");
    if (fs.existsSync(envExample)) {
        const content = fs.readFileSync(envExample, "utf-8");
        if (content.includes("DATABASE_URL")) {
            // تحقق من نوع DB من URL
            if (content.includes("postgresql") || content.includes("postgres")) {
                // تجنب التكرار
                const already = decisions.some(d => d.decision.includes("PostgreSQL"));
                if (!already) {
                    decisions.push(makeDecision("database", "PostgreSQL (from .env.example)", "DATABASE_URL points to PostgreSQL", "MEDIUM"));
                }
            }
        }
        if (content.includes("JWT_SECRET") || content.includes("JWT_")) {
            decisions.push(makeDecision("security", "JWT secrets must be in environment variables", "Found JWT_SECRET in .env.example", "HIGH", [], ["Never hardcode JWT secrets", "Rotate secrets regularly"]));
        }
    }
    // ── docker-compose.yml ──
    const composePath = path.join(projectPath, "docker-compose.yml");
    if (fs.existsSync(composePath)) {
        const content = fs.readFileSync(composePath, "utf-8");
        if (content.includes("postgres") || content.includes("postgresql")) {
            const already = decisions.some(d => d.decision.includes("PostgreSQL"));
            if (!already) {
                decisions.push(makeDecision("deployment", "PostgreSQL runs in Docker", "Found postgres service in docker-compose", "HIGH"));
            }
        }
        if (content.includes("redis")) {
            const already = decisions.some(d => d.decision.includes("Redis"));
            if (!already) {
                decisions.push(makeDecision("deployment", "Redis runs in Docker", "Found redis service in docker-compose", "HIGH"));
            }
        }
        decisions.push(makeDecision("deployment", "Docker Compose for local development", "Found docker-compose.yml", "HIGH"));
    }
    return decisions;
}
function makeDecision(category, decision, reason, confidence, alternatives = [], constraints = []) {
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
function generateLoreMd(store, projectPath) {
    const mdPath = path.join(projectPath, "LORE.md");
    const byCategory = {};
    for (const d of store.decisions) {
        if (!byCategory[d.category])
            byCategory[d.category] = [];
        byCategory[d.category].push(d);
    }
    let md = `# LORE — Architectural Memory\n\n`;
    md += `> Auto-generated by LORE. Last updated: ${new Date().toLocaleDateString()}\n\n`;
    md += `---\n\n`;
    if (store.decisions.length === 0) {
        md += `*No decisions detected yet.*\n\n`;
        md += `Run \`lore init\` after adding code to extract decisions.\n`;
    }
    else {
        for (const [category, decisions] of Object.entries(byCategory)) {
            md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
            for (const d of decisions) {
                const badge = d.confidence === "HIGH" ? "🟢" :
                    d.confidence === "MEDIUM" ? "🟡" : "🔴";
                md += `### ${badge} ${d.decision}\n`;
                md += `**Why**: ${d.reason}\n\n`;
                if (d.alternatives.length > 0) {
                    md += `**Rejected**: ${d.alternatives.join(", ")}\n\n`;
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
    md += `*github.com/TheEliotShift/lore-mcp*\n`;
    fs.writeFileSync(mdPath, md);
}
// ──────────────────────────────────────────
// COMMANDS
// ──────────────────────────────────────────
if (command === "init") {
    init().catch((e) => {
        err(String(e));
        process.exit(1);
    });
}
else {
    log(`\n${BOLD}LORE${RESET} — Architectural Memory for AI Coding\n`);
    log(`Commands:`);
    log(`  lore init     Analyze project and create LORE.md`);
    log(`  lore --help   Show this help\n`);
}

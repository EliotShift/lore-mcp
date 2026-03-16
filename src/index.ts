import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ==============================
// TYPES
// ==============================

interface Decision {
  id: string;
  timestamp: string;
  category: string;
  decision: string;
  reason: string;
  alternatives: string[];
  constraints: string[];
  author: "AI" | "human";
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

interface LoreStore {
  projectPath: string;
  decisions: Decision[];
  lastUpdated: string;
}

// ==============================
// HELPERS
// ==============================

function findLoreRoot(startDir: string): string {
  let current = startDir;
  const root = path.parse(current).root;

  while (current !== root) {
    const lorePath = path.join(current, ".lore");
    if (fs.existsSync(lorePath)) return current;
    current = path.dirname(current);
  }

  return startDir;
}

function getLoreDir(): string {
  const workspace =
    process.env.WORKSPACE_FOLDER ||
    process.env.PWD ||
    process.cwd();

  const projectRoot = findLoreRoot(workspace);
  const loreDir = path.join(projectRoot, ".lore");

  if (!fs.existsSync(loreDir)) {
    fs.mkdirSync(loreDir, { recursive: true });
  }

  return loreDir;
}

function readStore(): LoreStore {
  const loreDir = getLoreDir();
  const storePath = path.join(loreDir, "decisions.json");

  if (!fs.existsSync(storePath)) {
    return {
      projectPath: path.dirname(loreDir),
      decisions: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const raw = fs.readFileSync(storePath, "utf-8");
  return JSON.parse(raw) as LoreStore;
}

function writeStore(store: LoreStore): void {
  const loreDir = getLoreDir();
  const storePath = path.join(loreDir, "decisions.json");
  store.lastUpdated = new Date().toISOString();
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  generateLoreMd(store);
}

function generateLoreMd(store: LoreStore): void {
  const loreDir = getLoreDir();
  const mdPath = path.join(path.dirname(loreDir), "LORE.md");

  const byCategory: Record<string, Decision[]> = {};
  for (const d of store.decisions) {
    if (!byCategory[d.category]) byCategory[d.category] = [];
    byCategory[d.category].push(d);
  }

  let md = `# LORE — Architectural Memory\n\n`;
  md += `> Generated automatically. Do not edit manually.\n`;
  md += `> Last updated: ${store.lastUpdated}\n\n`;

  if (store.decisions.length === 0) {
    md += `No decisions recorded yet.\n\n`;
    md += `Use \`lore decide\` or ask your AI to record decisions.\n`;
  } else {
    for (const [category, decisions] of Object.entries(byCategory)) {
      md += `## ${category.toUpperCase()}\n\n`;
      for (const d of decisions) {
        md += `### ${d.decision}\n`;
        md += `- **Reason**: ${d.reason}\n`;
        md += `- **Confidence**: ${d.confidence}\n`;
        md += `- **Date**: ${d.timestamp.split("T")[0]}\n`;
        if (d.alternatives.length > 0) {
          md += `- **Rejected alternatives**: ${d.alternatives.join(", ")}\n`;
        }
        if (d.constraints.length > 0) {
          md += `- **Constraints**: ${d.constraints.join(", ")}\n`;
        }
        md += `\n`;
      }
    }
  }

  fs.writeFileSync(mdPath, md);
}

// ==============================
// MCP SERVER
// ==============================

const server = new Server(
  {
    name: "lore-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// LIST TOOLS
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "record_decision",
        description:
          "Record an architectural decision. Call this whenever you make a technical choice that affects the codebase structure.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Category: database, authentication, architecture, api, testing, deployment, security, performance, other",
            },
            decision: {
              type: "string",
              description: "Short description of the decision made",
            },
            reason: {
              type: "string",
              description: "Why this decision was made",
            },
            alternatives: {
              type: "array",
              items: { type: "string" },
              description: "Alternatives that were considered and rejected",
            },
            constraints: {
              type: "array",
              items: { type: "string" },
              description: "Constraints or rules that should not be violated",
            },
            author: {
              type: "string",
              enum: ["AI", "human"],
              description: "Who made this decision",
            },
          },
          required: ["category", "decision", "reason"],
        },
      },
      {
        name: "get_context",
        description:
          "Get all architectural decisions for this project. Call this at the START of every session to understand the codebase.",
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Filter by category (optional)",
            },
            query: {
              type: "string",
              description: "Search for specific decisions (optional)",
            },
          },
        },
      },
      {
        name: "get_gaps",
        description:
          "Find architectural gaps — decisions that were made but may not be fully implemented.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// CALL TOOLS
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // ── record_decision ──
  if (name === "record_decision") {
    const store = readStore();

    const decision: Decision = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      category: (args?.category as string) || "other",
      decision: args?.decision as string,
      reason: args?.reason as string,
      alternatives: (args?.alternatives as string[]) || [],
      constraints: (args?.constraints as string[]) || [],
      author: (args?.author as "AI" | "human") || "AI",
      confidence: "HIGH",
    };

    // dedup: لا نسجل نفس القرار مرتين
    const exists = store.decisions.some(
      (d) =>
        d.decision.toLowerCase().trim() ===
        decision.decision.toLowerCase().trim()
    );

    if (exists) {
      return {
        content: [
          {
            type: "text",
            text: `⚠️  Decision already exists: "${decision.decision}"`,
          },
        ],
      };
    }

    store.decisions.push(decision);
    writeStore(store);

    return {
      content: [
        {
          type: "text",
          text: `✓ Decision recorded: "${decision.decision}"\n→ LORE.md updated`,
        },
      ],
    };
  }

  // ── get_context ──
  if (name === "get_context") {
    const store = readStore();

    if (store.decisions.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No architectural decisions recorded yet.\n\nRun `lore init` to extract decisions from existing code.",
          },
        ],
      };
    }

    let decisions = store.decisions;

    // filter by category
    if (args?.category) {
      decisions = decisions.filter((d) =>
        d.category
          .toLowerCase()
          .includes((args.category as string).toLowerCase())
      );
    }

    // filter by query
    if (args?.query) {
      const q = (args.query as string).toLowerCase();
      decisions = decisions.filter(
        (d) =>
          d.decision.toLowerCase().includes(q) ||
          d.reason.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }

    const summary = decisions
      .map(
        (d) =>
          `[${d.category.toUpperCase()}] ${d.decision}\n` +
          `  → Reason: ${d.reason}\n` +
          `  → Constraints: ${
            d.constraints.length > 0
              ? d.constraints.join(", ")
              : "none"
          }`
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text:
            `LORE Context — ${decisions.length} decisions\n` +
            `${"─".repeat(40)}\n\n` +
            summary,
        },
      ],
    };
  }

  // ── get_gaps ──
  if (name === "get_gaps") {
    const store = readStore();

    const gaps = store.decisions.filter(
      (d) => d.constraints.length > 0
    );

    if (gaps.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No gaps found. All decisions have been recorded without constraints.",
          },
        ],
      };
    }

    const report = gaps
      .map(
        (d) =>
          `⚠️  ${d.decision}\n` +
          `   Constraints: ${d.constraints.join(", ")}\n` +
          `   Recorded: ${d.timestamp.split("T")[0]}`
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `Architectural Gaps Found:\n\n${report}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// ==============================
// START
// ==============================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LORE MCP Server running...");
}

main().catch(console.error);

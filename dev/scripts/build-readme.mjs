#!/usr/bin/env node
/**
 * Regenerates the data-driven blocks of README.md from the repository itself.
 *
 *   node dev/scripts/build-readme.mjs           # rewrite README.md in place
 *   node dev/scripts/build-readme.mjs --check   # exit 1 if it is out of date
 *
 * Everything between a pair of `<!-- AUTOGEN:<id> START/END -->` markers is
 * owned by this script — edit the source of truth, not the block:
 *
 *   hosting   → vercel.json
 *   ci        → .github/workflows/ci.yml
 *   tests     → the dev/tests/<tier>/ directories + package.json
 *   scripts   → package.json
 *
 * `dev/tests/unit/readme.test.mjs` runs `--check`, so a README that drifts from
 * the workflow or the script list fails the unit tier in ~2s rather than
 * quietly becoming fiction. This is the same rule the rest of the repo follows:
 * no hand-maintained lists of things the repo can enumerate itself.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const readmePath = join(root, "README.md");
const read = (...parts) => readFileSync(join(root, ...parts), "utf8");

// ---------------------------------------------------------------------------
// A deliberately small YAML reader. It understands exactly the shape of
// ci.yml — two-space job keys, scalar values, `needs` as a flow list or a
// scalar, and folded `if:` blocks — and nothing else. That is cheaper and more
// predictable here than pulling a YAML parser in as a direct dependency for
// one file we control.
// ---------------------------------------------------------------------------
function parseWorkflow(text) {
  const lines = text.split(/\r?\n/);
  const jobsAt = lines.indexOf("jobs:");
  const jobs = [];
  let current = null;

  for (let i = jobsAt + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const header = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (header) {
      current = { id: header[1], name: header[1], needs: [], if: "", steps: [] };
      jobs.push(current);
      continue;
    }
    if (!current) continue;

    const field = /^ {4}([a-z-]+):\s*(.*)$/.exec(line);
    if (field) {
      const [, key, rawValue] = field;
      let value = rawValue.trim();
      // Folded scalars (`if: >-`) carry their content on the following lines.
      if (value === ">-" || value === "|" || value === "") {
        const parts = [];
        for (let j = i + 1; j < lines.length && /^ {6}\S/.test(lines[j]); j += 1) {
          parts.push(lines[j].trim());
        }
        value = parts.join(" ");
      }
      if (key === "name") current.name = value;
      if (key === "if") current.if = value;
      if (key === "needs") {
        current.needs = value
          .replace(/^\[|\]$/g, "")
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);
      }
      continue;
    }

    const stepName = /^ {6}- name:\s*(.+)$/.exec(line);
    if (stepName) current.steps.push(stepName[1].trim());
  }
  return jobs;
}

/**
 * A job name fit for prose. Matrix jobs carry a `${{ … }}` expression in their
 * name — raw it is noise in the table, and inside a mermaid node label the
 * braces break the diagram outright. A sharded job is named once and its
 * fan-out noted instead.
 */
function displayName(job) {
  const sharded = /\$\{\{/.test(job.name);
  const clean = job.name
    .replace(/\s*\(\$\{\{[^)]*\}\}\)/g, "")
    .replace(/\$\{\{[^}]*\}\}/g, "")
    .trim();
  return { name: clean, sharded };
}

/** Plain-English trigger, read off the job's `if:` guard. */
function triggerOf(job) {
  const cond = job.if;
  if (!cond) return "every push and PR";
  const scheduled = cond.includes("'schedule'") && !cond.includes("!=");
  const prOnly = cond.includes("pull_request") && !cond.includes("push");
  const mainOnly = cond.includes("refs/heads/main");
  if (mainOnly) return "main only";
  if (scheduled) return "weekly + manual";
  if (prOnly) return "PRs + manual";
  if (cond.includes("!= 'schedule'")) return "push and PR";
  return "conditional";
}

// ---------------------------------------------------------------------------
// Block builders
// ---------------------------------------------------------------------------
const pkg = JSON.parse(read("package.json"));
const jobs = parseWorkflow(read(".github", "workflows", "ci.yml"));

function ciBlock() {
  const out = ["```mermaid", "flowchart LR"];
  const nodeId = (id) => id.replace(/-/g, "_");
  const label = (job) => {
    const { name, sharded } = displayName(job);
    return sharded ? `${name} — sharded` : name;
  };

  const gates = jobs.filter((j) => j.needs.length === 0);
  const dependents = jobs.filter((j) => j.needs.length > 0);

  // "No `needs`" is the only claim this grouping can make honestly — some of
  // these jobs build and some don't; what they share is starting immediately.
  out.push('  subgraph gate["Start immediately, in parallel"]');
  out.push("    direction TB");
  for (const job of gates) out.push(`    ${nodeId(job.id)}["${label(job)}"]`);
  out.push("  end");

  for (const job of dependents) out.push(`  ${nodeId(job.id)}["${label(job)}"]`);
  for (const job of dependents) {
    for (const need of job.needs) out.push(`  ${nodeId(need)} --> ${nodeId(job.id)}`);
  }
  out.push("```");
  out.push("");
  out.push("| Job | Runs on | Waits for |");
  out.push("| --- | --- | --- |");
  for (const job of jobs) {
    const needs = job.needs.length ? job.needs.map((n) => `\`${n}\``).join(", ") : "—";
    out.push(`| **${label(job)}** | ${triggerOf(job)} | ${needs} |`);
  }
  return out.join("\n");
}

const TIERS = [
  {
    dir: "unit",
    script: "test:unit",
    needs: "pure logic only",
    covers: "shop hours, notices, chat answers, arcade, transcripts, suite wiring",
  },
  {
    dir: "server",
    script: "test:server",
    needs: "`npm run build` → `dist/server`",
    covers: "server-rendered HTML, per-service SEO",
  },
  {
    dir: "static",
    script: "test:static",
    needs: "`npm run build:static` → `dist/client`",
    covers: "static export, route discovery and classification",
  },
];

function testsBlock() {
  const out = [
    "| Tier | Command | Files | Needs a build? | Covers |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const tier of TIERS) {
    const files = readdirSync(join(root, "dev", "tests", tier.dir)).filter((f) =>
      f.endsWith(".test.mjs"),
    ).length;
    const build = tier.needs === "pure logic only" ? "**No**" : "Yes";
    out.push(
      `| \`${tier.dir}\` | \`npm run ${tier.script}\` | ${files} | ${build} — ${tier.needs} | ${tier.covers} |`,
    );
  }
  out.push("");
  out.push(`\`npm test\` runs all three in order: \`${pkg.scripts.test}\`.`);
  return out.join("\n");
}

function scriptsBlock() {
  const groups = [
    ["Everyday", ["dev", "build", "build:static", "start", "format", "lint", "typecheck"]],
    ["Tests", ["test", "test:unit", "test:server", "test:static"]],
    ["Gates and reports", ["check", "check:all", "report", "readme"]],
  ];
  const described = new Set(groups.flatMap(([, names]) => names));
  const audits = Object.keys(pkg.scripts).filter(
    (name) => name.startsWith("check:") && !described.has(name),
  );
  groups.push(["Individual audits", audits]);

  const out = [];
  for (const [heading, names] of groups) {
    const present = names.filter((n) => pkg.scripts[n]);
    if (!present.length) continue;
    out.push(`**${heading}**`, "", "| Command | Runs |", "| --- | --- |");
    for (const name of present) out.push(`| \`npm run ${name}\` | \`${pkg.scripts[name]}\` |`);
    out.push("");
  }
  return out.join("\n").trimEnd();
}

function hostingBlock() {
  const vercel = JSON.parse(read("vercel.json"));
  return [
    "| | Production (Vercel) | Cloudflare Worker | GitHub Pages |",
    "| --- | --- | --- | --- |",
    "| **Status** | Live — the public site | Built and tested every run | Optional mirror |",
    `| **Build command** | \`${vercel.buildCommand}\` | \`npm run build\` | \`${vercel.buildCommand}\` |`,
    `| **Serves** | \`${vercel.outputDirectory}\` — pre-rendered HTML | Worker + Cloudflare Images | \`${vercel.outputDirectory}\` |`,
    `| **Framework preset** | \`${vercel.framework ?? "none"}\` — this repo owns its build | vinext (Vite + Workers) | none |`,
    "| **Config** | [`vercel.json`](vercel.json) | [`src/worker/index.ts`](src/worker/index.ts) | `package-pages` + `deploy` jobs |",
  ].join("\n");
}

// ---------------------------------------------------------------------------
const blocks = {
  hosting: hostingBlock(),
  ci: ciBlock(),
  tests: testsBlock(),
  scripts: scriptsBlock(),
};

const original = readFileSync(readmePath, "utf8");
let next = original;
for (const [id, body] of Object.entries(blocks)) {
  // Deliberately tolerant of whatever sits between the markers, including
  // nothing at all — the pair is the contract, not the spacing.
  const pattern = new RegExp(`<!-- AUTOGEN:${id} START -->[\\s\\S]*?<!-- AUTOGEN:${id} END -->`);
  if (!pattern.test(next)) {
    console.error(`README.md is missing the AUTOGEN:${id} markers.`);
    process.exit(1);
  }
  next = next.replace(
    pattern,
    () => `<!-- AUTOGEN:${id} START -->\n${body}\n<!-- AUTOGEN:${id} END -->`,
  );
}

if (process.argv.includes("--check")) {
  if (next !== original) {
    console.error("README.md is out of date. Run `npm run readme`.");
    process.exit(1);
  }
  console.log("README.md is up to date.");
} else {
  writeFileSync(readmePath, next, "utf8");
  console.log(`README.md regenerated (${Object.keys(blocks).length} blocks).`);
}

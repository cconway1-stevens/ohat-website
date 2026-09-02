#!/usr/bin/env node
/**
 * Code-bloat guard: a role-aware line-count reporter.
 *
 * A flat "no file over N lines" rule is unfair — a data dictionary is
 * legitimately long, a UI component should be lean. This script classifies
 * each source file by its path and applies a per-role budget, then reports
 * every file that exceeds its budget, ranked worst-first.
 *
 * Advisory by default (exits 0) so it never blocks a merge on its own; pass
 * `--strict` to exit non-zero when any file is over budget. Run it locally
 * with `npm run check:bloat`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SRC = join(ROOT, "src");
const STRICT = process.argv.includes("--strict");

// Roles are matched in order; the first pattern that matches wins. Budgets are
// line counts. Keep these generous enough that a real feature fits, tight
// enough that a file that "just grew" gets flagged for a split.
const ROLES = [
  {
    role: "data dictionary",
    budget: 800,
    match: (rel) =>
      /^lib\/(services|makes)\.ts$/.test(rel) ||
      /^lib\/arcade\/(arcade-words|word-search|crossword|tow-chain)\.ts$/.test(rel),
  },
  {
    role: "audio engine",
    budget: 800,
    match: (rel) => rel === "lib/arcade/garage-audio.ts",
  },
  {
    role: "arcade game",
    budget: 600,
    match: (rel) => /^components\/arcade\/.+\.tsx$/.test(rel),
  },
  {
    role: "page",
    budget: 300,
    match: (rel) => /^app\/(?:.*\/)?page\.tsx$/.test(rel),
  },
  {
    role: "ui/layout component",
    budget: 200,
    match: (rel) => /^components\/(ui|layout)\/.+\.tsx$/.test(rel),
  },
  {
    role: "stylesheet",
    budget: 2000,
    match: (rel) => rel.endsWith(".css"),
  },
];

const DEFAULT_BUDGET = 300;
const IGNORED = new Set(["node_modules", "dist", ".next", ".wrangler", ".vinext"]);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (IGNORED.has(entry.name)) return [];
      return walk(join(dir, entry.name));
    }
    return [join(dir, entry.name)];
  });
}

function classify(rel) {
  const normalized = rel.split(sep).join("/");
  for (const { role, budget, match } of ROLES) {
    if (match(normalized)) return { role, budget };
  }
  return { role: "default", budget: DEFAULT_BUDGET };
}

const files = walk(SRC)
  .filter((file) => /\.(ts|tsx|mjs|css)$/.test(file))
  .map((file) => {
    const rel = relative(SRC, file).split(sep).join("/");
    const lines = readFileSync(file, "utf8").split("\n").length;
    const { role, budget } = classify(rel);
    return { rel, lines, role, budget, over: lines - budget };
  })
  .filter((file) => file.over > 0)
  .sort((a, b) => b.over - a.over);

if (files.length === 0) {
  console.log("Code-bloat check: every source file is within its role budget.");
  process.exit(0);
}

console.log(`Code-bloat check: ${files.length} file(s) over their role budget.\n`);
const rows = files.map((f) => ({
  file: f.rel,
  role: f.role,
  lines: f.lines,
  budget: f.budget,
  over: f.over,
}));
const width = Math.max(...rows.map((r) => r.file.length));
for (const r of rows) {
  console.log(
    `  ${r.file.padEnd(width)}  ${r.role.padEnd(18)}  ${String(r.lines).padStart(5)} lines  ` +
      `(budget ${r.budget}, +${r.over})`,
  );
}

console.log(
  `\n${STRICT ? "Failing" : "Advisory"} — run \`npm run check:bloat -- --strict\` to enforce.`,
);
process.exit(STRICT ? 1 : 0);

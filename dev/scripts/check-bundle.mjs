#!/usr/bin/env node
/**
 * Bundle-size budget: fails when the shipped JS+CSS grows past a threshold.
 *
 * Measures the total bytes of `.js` and `.css` files under `dist/client`
 * (the static export served to browsers) and compares against a budget. The
 * budget is a ceiling, not a target — it should only move when a feature
 * genuinely needs the room, and that move should be a deliberate commit.
 *
 * Run after `npm run build:static`. Override the budget with BUDGET_KB.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
// Raised 800 → 1400 for the Parts Counter 3D cabinet, then to 1650 for the
// vinext 1.0 runtime and Agent studio, then to 1680 to give the nine /agent
// route files (one per tab) their own metadata and entry chunks, then to 1720
// for the local chat transcript, announcement, and expanded contact/hour UI,
// then to 1760 for the 2D '57 Chevy radio dash — that rebuild deleted the
// Three.js radio scene outright, but the hand-built chrome faceplate, dial,
// and station guide cost more CSS than the scene it replaced saved here.
// Three.js remains the largest lazy chunk. The ceiling should only move again
// for a deliberate feature change.
const BUDGET_KB = Number(process.env.BUDGET_KB ?? 1760);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (!statSync(CLIENT, { throwIfNoEntry: false })) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

const assets = walk(CLIENT)
  .filter((file) => /\.(js|css)$/.test(file))
  .map((file) => {
    const rel = relative(CLIENT, file).split(sep).join("/");
    const bytes = statSync(file).size;
    return { rel, bytes };
  })
  .sort((a, b) => b.bytes - a.bytes);

const totalBytes = assets.reduce((sum, a) => sum + a.bytes, 0);
const totalKb = totalBytes / 1024;

console.log(`Bundle-size budget: ${totalKb.toFixed(1)} KB / ${BUDGET_KB} KB`);
console.log(`  ${assets.length} JS/CSS asset(s), largest first:`);
for (const a of assets.slice(0, 10)) {
  console.log(`    ${(a.bytes / 1024).toFixed(1).padStart(8)} KB  ${a.rel}`);
}

if (totalKb > BUDGET_KB) {
  console.error(
    `\nBundle exceeds budget by ${(totalKb - BUDGET_KB).toFixed(1)} KB. ` +
      `Raise BUDGET_KB deliberately, or trim the bundle.`,
  );
  process.exit(1);
}
console.log("\nBundle is within budget.");

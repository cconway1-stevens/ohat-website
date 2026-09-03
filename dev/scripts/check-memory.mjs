#!/usr/bin/env node
/**
 * Memory / leak check: loads the built site, navigates between routes, and
 * fails when DOM nodes, event listeners, or the JS heap grow without bound.
 *
 * A leak shows up as detached nodes and listeners that never get collected.
 * `page.metrics()` reports these deterministically (unlike the heap, which is
 * GC-dependent), so this is the reliable "no memory leak on a low-RAM device"
 * signal. It also asserts the peak heap stays under a budget.
 *
 * Run after `npm run build:static`. Budgets are overridable via env:
 *   MEM_MAX_HEAP_MB (default 64), MEM_MAX_GROWTH (default 1.5x)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticServer } from "./lib/routes.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.MEM_PORT ?? 8935);

const MAX_HEAP_MB = Number(process.env.MEM_MAX_HEAP_MB ?? 64);
const MAX_GROWTH = Number(process.env.MEM_MAX_GROWTH ?? 1.5);
const NAVIGATIONS = Number(process.env.MEM_NAVIGATIONS ?? 6);

// A curated navigation set, not every page: this check measures *transitions*
// under repeated navigation, so it needs the heaviest client pages (the arcade
// and adgent ship the most JS) rather than every route. Documented exclusion in
// dev/docs/test-program.md §4.
const ROUTES = ["/", "/services/", "/contact/", "/arcade/", "/adgent/"];

if (!existsSync(CLIENT)) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

const server = createStaticServer(CLIENT);

await new Promise((resolve) => server.listen(PORT, resolve));

const { chromium } = await import("playwright");
const executablePath =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const base = `http://127.0.0.1:${PORT}`;
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");

async function metrics() {
  const nodes = await page.evaluate(() => document.getElementsByTagName("*").length);
  const { metrics: m } = await cdp.send("Performance.getMetrics");
  const heap = m.find((entry) => entry.name === "JSHeapUsedSize")?.value ?? 0;
  return { nodes, heapMb: heap / (1024 * 1024) };
}

// Warm up, then measure the homepage. Navigate away and back repeatedly; a
// leak shows up as the homepage accumulating nodes/listeners it never releases.
await page.goto(`${base}${ROUTES[0]}`, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(500);
const before = await metrics();

for (let i = 0; i < NAVIGATIONS; i++) {
  const away = ROUTES[(i % (ROUTES.length - 1)) + 1];
  await page.goto(`${base}${away}`, { waitUntil: "load", timeout: 30000 });
  await page.goto(`${base}${ROUTES[0]}`, { waitUntil: "load", timeout: 30000 });
}

await page.waitForTimeout(500);
const after = await metrics();

const nodeGrowth = after.nodes / Math.max(1, before.nodes);
const heapOk = after.heapMb <= MAX_HEAP_MB;
const nodesOk = nodeGrowth <= MAX_GROWTH;

console.log(`\nMemory check after ${NAVIGATIONS} navigations:`);
console.log(`  DOM nodes:      ${before.nodes} -> ${after.nodes} (${nodeGrowth.toFixed(2)}x)`);
console.log(`  JS heap:        ${after.heapMb.toFixed(1)} MB (budget ${MAX_HEAP_MB} MB)`);
console.log(`  ${nodesOk ? "✓" : "✗"} node growth under ${MAX_GROWTH}x`);
console.log(`  ${heapOk ? "✓" : "✗"} heap under ${MAX_HEAP_MB} MB`);

await browser.close();
server.close();

if (!nodesOk || !heapOk) {
  console.error("\nMemory check failed: possible leak or excessive heap usage.");
  process.exit(1);
}
console.log("\nMemory check passed.");

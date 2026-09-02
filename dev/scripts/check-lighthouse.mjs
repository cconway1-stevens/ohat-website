#!/usr/bin/env node
/**
 * Lighthouse audit: runs Google's Lighthouse against the built static site and
 * fails when any category drops below its threshold.
 *
 * This is the same engine behind PageSpeed Insights. It needs a Chromium
 * binary; it reuses the Playwright-installed Chromium (the same one
 * `check-assets.mjs` uses) so CI does not download a second browser.
 *
 * Run after `npm run build:static`. Thresholds are overridable via env:
 *   LH_PERF, LH_A11Y, LH_BP, LH_SEO  (0-100)
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.LH_PORT ?? 8932);

const THRESHOLDS = {
  performance: Number(process.env.LH_PERF ?? 60),
  accessibility: Number(process.env.LH_A11Y ?? 100),
  "best-practices": Number(process.env.LH_BP ?? 100),
  seo: Number(process.env.LH_SEO ?? 100),
};

const ROUTES = process.env.LH_ROUTES?.split(",") ?? ["/"];

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
};

if (!existsSync(CLIENT)) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(CLIENT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});

await new Promise((resolve) => server.listen(PORT, resolve));

const { default: lighthouse } = await import("lighthouse");
const { chromium } = await import("playwright");

// Launch Chromium ourselves (Playwright knows where it is on every platform)
// and point Lighthouse at its debugging port. This avoids chrome-launcher's
// platform-specific Chrome discovery, which fails on the Playwright build.
const DEBUG_PORT = Number(process.env.LH_DEBUG_PORT ?? 9222);
const browser = await chromium.launch({
  args: [`--remote-debugging-port=${DEBUG_PORT}`],
});

let failed = false;
for (const route of ROUTES) {
  const url = `http://127.0.0.1:${PORT}${route}`;
  const result = await lighthouse(url, {
    port: DEBUG_PORT,
    output: "json",
    logLevel: "error",
    onlyCategories: Object.keys(THRESHOLDS),
  });

  const report = JSON.parse(result.report);
  const scores = report.categories;
  console.log(`\nLighthouse — ${route}`);
  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const score = Math.round(scores[key].score * 100);
    const pass = score >= threshold;
    console.log(`  ${pass ? "✓" : "✗"} ${key.padEnd(16)} ${score} / ${threshold}`);
    if (!pass) failed = true;
  }
}

await browser.close();
server.close();
if (failed) {
  console.error("\nLighthouse audit failed: one or more categories below threshold.");
  process.exit(1);
}
console.log("\nLighthouse audit passed.");

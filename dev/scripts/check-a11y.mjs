#!/usr/bin/env node
/**
 * Accessibility audit: runs axe-core against the built static site and fails
 * on any WCAG 2.1 AA violation.
 *
 * Uses the same Playwright Chromium as `check-assets.mjs`. axe-core is
 * injected into each page and run with the WCAG 2.1 AA tag set, matching the
 * "zero axe-core WCAG 2.1 AA violations" bar in the README.
 *
 * Run after `npm run build:static`.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.A11Y_PORT ?? 8933);

const ROUTES = (
  process.env.A11Y_ROUTES ?? "/,/services/,/our-shop/,/contact/,/reviews/,/offers/"
).split(",");

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

const { chromium } = await import("playwright");
const axeSource = readFileSync(join(ROOT, "node_modules", "axe-core", "axe.min.js"), "utf8");
const executablePath =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

let totalViolations = 0;
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
  });
  const violations = results.violations;
  totalViolations += violations.length;
  console.log(`\naxe — ${route}: ${violations.length} violation(s)`);
  for (const v of violations) {
    console.log(`  ✗ ${v.id}: ${v.help} (${v.impact})`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`      ${node.target.join(" ")}`);
    }
  }
  await page.close();
}

await browser.close();
server.close();

if (totalViolations > 0) {
  console.error(`\nAccessibility audit failed: ${totalViolations} violation(s).`);
  process.exit(1);
}
console.log("\nAccessibility audit passed: zero WCAG 2.1 AA violations.");

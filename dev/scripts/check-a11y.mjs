#!/usr/bin/env node
/**
 * Accessibility audit: runs axe-core against the built static site and fails
 * on any WCAG 2.1 AA violation.
 *
 * Uses the same Playwright Chromium as `check-assets.mjs`. axe-core is
 * injected into each page and run with the WCAG 2.1 AA tag set, matching the
 * "zero axe-core WCAG 2.1 AA violations" bar in the README.
 *
 * Audits EVERY public page, discovered automatically from the static export
 * (see dev/scripts/lib/routes.mjs). Redirect stubs and the 404 page are not
 * audited.
 *
 * Run after `npm run build:static`.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditableRoutes, createStaticServer } from "./lib/routes.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.A11Y_PORT ?? 8933);

if (!existsSync(CLIENT)) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

const server = createStaticServer(CLIENT);
await new Promise((resolve) => server.listen(PORT, resolve));

const { chromium } = await import("playwright");
const axeSource = readFileSync(join(ROOT, "node_modules", "axe-core", "axe.min.js"), "utf8");
const executablePath =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

const routes = process.env.A11Y_ROUTES?.split(",").filter(Boolean) ?? auditableRoutes(CLIENT);

let totalViolations = 0;
for (const route of routes) {
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
  console.error(
    `\nAccessibility audit failed: ${totalViolations} violation(s) across ${routes.length} page(s).`,
  );
  process.exit(1);
}
console.log(
  `\nAccessibility audit passed: zero WCAG 2.1 AA violations across ${routes.length} page(s).`,
);

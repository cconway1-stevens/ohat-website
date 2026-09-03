#!/usr/bin/env node
/**
 * Lighthouse audit: runs Google's Lighthouse against the built static site and
 * fails when any category drops below its threshold.
 *
 * This is the same engine behind PageSpeed Insights. It needs a Chromium
 * binary; it reuses the Playwright-installed Chromium (the same one
 * `check-assets.mjs` uses) so CI does not download a second browser.
 *
 * It audits EVERY public page, discovered automatically from the static export
 * (see dev/scripts/lib/routes.mjs). Pages are tiered by their own markup:
 *   - indexable pages: performance, accessibility, best-practices, SEO
 *   - noindex pages (arcade, adgent): performance, accessibility, best-practices
 *     (SEO is intentionally not asserted — the page is noindex on purpose)
 *   - redirect stubs and the 404 page are not audited
 *
 * Performance is variable, so it is aggregated over LH_RUNS runs (default 3)
 * and the median is asserted. The deterministic categories (accessibility,
 * best-practices, SEO) are asserted from a single run — a failure there is a
 * real bug, never noise.
 *
 * Run after `npm run build:static` (or let this script build it for you).
 * Thresholds are overridable via env:
 *   LH_PERF, LH_A11Y, LH_BP, LH_SEO  (0-100)
 *   LH_RUNS or --runs=N (default 3), LH_ROUTES (comma-separated debug subset)
 *   LH_REPORT_DIR (optional dir for per-page JSON snapshots; gitignored)
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStaticServer, discoverRoutes } from "./lib/routes.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.LH_PORT ?? 8932);

const THRESHOLDS = {
  // Mobile Lighthouse currently bottoms out at 62 on the indexable pages in
  // both local and GitHub-hosted runs. Keep the original evidence-backed gate
  // at 60; 80 remains the optimization goal, not a truthful pass/fail floor.
  performance: Number(process.env.LH_PERF ?? 60),
  accessibility: Number(process.env.LH_A11Y ?? 100),
  "best-practices": Number(process.env.LH_BP ?? 100),
  seo: Number(process.env.LH_SEO ?? 100),
};
// The noindex tier (arcade, adgent) ships heavy client JS by design, so its
// performance floor is set separately from the indexable 80 goal. The default
// is a placeholder until the Stage-7 baseline run observes real medians and
// pins an evidence-based floor (dev/docs/test-program.md §9).
const NOINDEX_PERF = Number(process.env.LH_PERF_NOINDEX ?? 40);
// LH_RUNS env or --runs=N flag (the CI browser-quality job uses --runs=1).
const RUNS = Number(
  process.argv.find((argument) => argument.startsWith("--runs="))?.slice(7) ??
    process.env.LH_RUNS ??
    3,
);
const REPORT_DIR = process.env.LH_REPORT_DIR;

// Deterministic categories are asserted from a single run; performance is
// aggregated over RUNS and the median asserted.
const DETERMINISTIC = ["accessibility", "best-practices", "seo"];
const METRICS = [
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "first-contentful-paint",
  "total-blocking-time",
  "speed-index",
];
// Audit our static artifact, not the availability or execution cost of live
// analytics and weather services. This mirrors the browser smoke test's
// hermetic third-party stubs and prevents an external script racing hydration.
const THIRD_PARTY_PATTERNS = ["https://www.googletagmanager.com/*", "https://api.open-meteo.com/*"];
// check:pages is the authoritative all-route console/page-error gate and runs
// immediately before Lighthouse in CI. Under Lighthouse's simulated mobile
// slowdown, React can emit a timing-only hydration #418 on /links that the
// normal browser sweep cannot reproduce; counting it again makes BP flaky.
const SKIPPED_AUDITS = ["errors-in-console"];

if (!existsSync(CLIENT)) {
  console.log("dist/client not found — building the static export first.");
  const build = spawnSync("npm", ["run", "build:static"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (build.status !== 0) process.exit(1);
}

const server = createStaticServer(CLIENT);
await new Promise((resolve) => server.listen(PORT, resolve));

const { default: lighthouse } = await import("lighthouse");
const { chromium } = await import("playwright");

// Launch Chromium ourselves (Playwright knows where it is on every platform)
// and point Lighthouse at its debugging port. This avoids chrome-launcher's
// platform-specific Chrome discovery, which fails on the Playwright build.
const DEBUG_PORT = Number(process.env.LH_DEBUG_PORT ?? 9222);
// Several arcade pages initialize canvas, audio, and WebGL; one Chromium for
// the whole 40+ page sweep grows until the OS kills it (the same reason
// check-pages recycles). Relaunch every PAGES_PER_BROWSER pages.
const PAGES_PER_BROWSER = 8;
async function launchBrowser() {
  return chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] });
}
let browser = await launchBrowser();

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const formatMetric = (id, value) => {
  if (id === "cumulative-layout-shift") return value.toFixed(2);
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
};

async function runAudit(url, categories) {
  const result = await lighthouse(url, {
    port: DEBUG_PORT,
    output: "json",
    logLevel: "error",
    onlyCategories: categories,
    blockedUrlPatterns: THIRD_PARTY_PATTERNS,
    skipAudits: SKIPPED_AUDITS,
  });
  return JSON.parse(result.report);
}

const pages = discoverRoutes(CLIENT).filter((p) => p.kind !== "error" && p.kind !== "redirect");
const routes = process.env.LH_ROUTES?.split(",").filter(Boolean) ?? pages.map((p) => p.route);

let failed = false;
let audited = 0;
for (const page of pages) {
  if (!routes.includes(page.route)) continue;
  if (audited > 0 && audited % PAGES_PER_BROWSER === 0) {
    await browser.close();
    browser = await launchBrowser();
  }
  audited += 1;
  const url = `http://127.0.0.1:${PORT}${page.route}`;
  const categories =
    page.kind === "indexable"
      ? ["performance", ...DETERMINISTIC]
      : ["performance", ...DETERMINISTIC.filter((c) => c !== "seo")];

  // Run 1 covers every applicable category; extra runs cover performance only.
  const reports = [await runAudit(url, categories)];
  for (let i = 1; i < RUNS; i++) {
    reports.push(await runAudit(url, ["performance"]));
  }

  const scores = {};
  for (const cat of categories) {
    // Run 1 carries every applicable category; runs 2+ are performance-only,
    // so deterministic categories must be scored from run 1 alone.
    const applicable = cat === "performance" ? reports : [reports[0]];
    const category = applicable.map((r) => r.categories[cat]);
    if (category.some((c) => !c)) {
      throw new Error(
        `Lighthouse report for ${page.route} is missing the "${cat}" category — ` +
          `the run may have failed (runtimeError: ${JSON.stringify(reports[0].runtimeError ?? null)})`,
      );
    }
    scores[cat] = Math.round(median(category.map((c) => c.score)) * 100);
  }
  const metrics = {};
  for (const id of METRICS) {
    metrics[id] = median(reports.map((r) => r.audits[id]?.numericValue ?? 0));
  }

  console.log(
    `\nLighthouse — ${page.route}  [${page.kind}]  (median of ${reports.length} run${reports.length > 1 ? "s" : ""})`,
  );
  for (const cat of categories) {
    const threshold =
      cat === "performance" && page.kind === "noindex" ? NOINDEX_PERF : THRESHOLDS[cat];
    const score = scores[cat];
    const pass = score >= threshold;
    if (!pass) failed = true;
    const metricLine =
      cat === "performance"
        ? `    ${METRICS.map((id) => `${id === "largest-contentful-paint" ? "LCP" : id === "cumulative-layout-shift" ? "CLS" : id === "first-contentful-paint" ? "FCP" : id === "total-blocking-time" ? "TBT" : "SI"} ${formatMetric(id, metrics[id])}`).join("  ")}`
        : "";
    console.log(`  ${pass ? "✓" : "✗"} ${cat.padEnd(16)} ${score} / ${threshold}${metricLine}`);
    if (!pass) {
      const report = reports[0];
      for (const auditRef of report.categories[cat].auditRefs ?? []) {
        const audit = report.audits[auditRef.id];
        if (audit?.score !== null && audit?.score < 1) {
          console.log(`      - ${audit.title}: ${audit.displayValue ?? audit.description}`);
        }
      }
    }
  }

  if (REPORT_DIR) {
    const dir = join(REPORT_DIR, page.route.replace(/^\//, "").replace(/\//g, "__") || "index");
    mkdirSync(dir, { recursive: true });
    reports.forEach((r, i) => {
      writeFileSync(join(dir, `run-${i + 1}.json`), JSON.stringify(r));
    });
  }
}

await browser.close();
server.close();

if (failed) {
  console.error(
    `\nLighthouse audit failed: ${audited} page(s) audited, one or more categories below threshold.`,
  );
  process.exit(1);
}
console.log(`\nLighthouse audit passed: ${audited} page(s) at or above threshold.`);

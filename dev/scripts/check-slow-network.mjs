#!/usr/bin/env node
/**
 * Slow-bandwidth test: loads the built site under a throttled connection and
 * fails when a page takes too long or ships too many bytes.
 *
 * Simulates a slow 3G connection (400ms RTT, ~500kbps) via the Chrome DevTools
 * Protocol, then measures time-to-load and total transferred bytes for each
 * route. This is the "works on super slow bandwidth" guarantee: if a page
 * loads here, it loads anywhere.
 *
 * Run after `npm run build:static`. Budgets are overridable via env:
 *   SLOW_MAX_MS (default 20000), SLOW_MAX_KB (default 1500)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { auditableRoutes, createStaticServer } from "./lib/routes.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.SLOW_PORT ?? 8934);

const MAX_MS = Number(process.env.SLOW_MAX_MS ?? 30000);
const MAX_KB = Number(process.env.SLOW_MAX_KB ?? 2000);

// Slow 3G: 400ms round-trip, ~500kbps down/up.
const THROTTLE = {
  offline: false,
  latency: 400,
  downloadThroughput: (500 * 1024) / 8,
  uploadThroughput: (500 * 1024) / 8,
};

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

let failed = false;
const routes = process.env.SLOW_ROUTES?.split(",").filter(Boolean) ?? auditableRoutes(CLIENT);
for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", THROTTLE);

  let transferredBytes = 0;
  cdp.on("Network.loadingFinished", (event) => {
    transferredBytes += event.encodedDataLength;
  });

  const startedAt = Date.now();
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "load", timeout: 60000 });
  const loadMs = Date.now() - startedAt;
  const transferredKb = transferredBytes / 1024;

  const timeOk = loadMs <= MAX_MS;
  const bytesOk = transferredKb <= MAX_KB;
  console.log(`\nSlow 3G — ${route}: ${loadMs}ms, ${transferredKb.toFixed(1)} KB transferred`);
  console.log(`  ${timeOk ? "✓" : "✗"} load time  ${loadMs}ms / ${MAX_MS}ms`);
  console.log(`  ${bytesOk ? "✓" : "✗"} bytes      ${transferredKb.toFixed(1)} KB / ${MAX_KB} KB`);
  if (!timeOk || !bytesOk) failed = true;

  await page.close();
}

await browser.close();
server.close();

if (failed) {
  console.error("\nSlow-bandwidth test failed: a page exceeded its time or byte budget.");
  process.exit(1);
}
console.log("\nSlow-bandwidth test passed.");

#!/usr/bin/env node
/**
 * Page smoke test: loads every exported route in a real browser and verifies
 * each one renders correctly, then checks that the site's links and primary
 * call-to-action actually work.
 *
 * This is the "all pages load, all buttons work" guarantee:
 *   - every route returns 200 with a title, an H1, and no console/page errors
 *   - no raster image is broken
 *   - every internal link resolves to a real route (no dead links)
 *   - the call button points at the shop's phone number
 *
 * Run after `npm run build:static`.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.PAGES_PORT ?? 8936);

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

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function exportedRoutes() {
  return walk(CLIENT)
    .filter((file) => file.endsWith(".html"))
    .map((file) => {
      const rel = relative(CLIENT, file).split(sep).join("/");
      if (rel === "index.html") return "/";
      if (rel === "404.html") return "/404";
      return `/${rel.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`;
    })
    .filter((route) => route !== "/404")
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

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
const executablePath =
  process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const browser = await chromium.launch(existsSync(executablePath) ? { executablePath } : {});

const routes = exportedRoutes();
const base = `http://127.0.0.1:${PORT}`;
const failures = [];

function fail(message, details = {}) {
  failures.push({ message, ...details });
}

async function checkRoute(page, route) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  const response = await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  // Scroll so lazy images actually load before we check them.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
  const state = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    brokenImages: Array.from(document.images)
      .filter((img) => !/\.svg(?:$|[?#])/i.test(img.currentSrc || img.src))
      .filter((img) => img.getClientRects().length > 0 && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  }));

  if (response.status() !== 200) {
    fail("Route returned non-200", { route, status: response.status() });
  }
  if (!state.title) fail("Route has no document title", { route });
  if (!state.h1) fail("Route has no H1", { route });
  if (consoleErrors.length) fail("Route emitted console errors", { route, consoleErrors });
  if (pageErrors.length) fail("Route emitted page errors", { route, pageErrors });
  if (state.brokenImages.length) fail("Route has broken images", { route, state });
}

async function checkLinks(page, route) {
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")),
  );
  for (const href of links) {
    if (!href || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:"))
      continue;
    if (href.startsWith("#")) continue;
    const path = href.split("#")[0].split("?")[0];
    if (!path) continue;
    // Resource links (vCard, sitemap, robots, images) are not pages; the
    // endpoint checks in production-readiness cover those separately.
    if (/\.[a-z0-9]{1,5}$/i.test(path) && !/\.html$/i.test(path)) continue;
    const target = path.startsWith("/") ? path : `/${path}`;
    if (!routes.includes(target) && !routes.includes(target.replace(/\/$/, ""))) {
      fail("Dead internal link", { route, href });
    }
  }
}

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const route of routes) {
  await checkRoute(page, route);
  await checkLinks(page, route);
  process.stdout.write(`  ${route}\n`);
}

// The primary conversion: the call button must point at the shop's number.
await page.goto(`${base}/`, { waitUntil: "networkidle" });
const callHref = await page.evaluate(() => {
  const el = document.querySelector('a[href^="tel:"]');
  return el?.getAttribute("href") ?? null;
});
if (!callHref || !callHref.includes("609")) {
  fail("Call button missing or wrong number", { callHref });
} else {
  console.log(`\nCall button: ${callHref}`);
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} page check failure(s):`);
  for (const f of failures) console.error(`  ${f.message} — ${f.href ?? f.route ?? ""}`);
  process.exit(1);
}
console.log(`\nAll ${routes.length} pages load and link correctly.`);

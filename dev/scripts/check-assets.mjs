/**
 * Loads the built site in a real browser and fails on any request that 404s.
 *
 * This is the check that would have caught the broken hero image. The
 * server-rendered HTML was correct — a plain srcset over pre-generated
 * variants — but `next/image` recomputes its URL on the client, and without
 * `unoptimized` it points at vinext's optimiser endpoint, which does not exist
 * in a static export. Grepping the HTML finds nothing wrong; only running the
 * page does.
 *
 * Two deliberate choices:
 *
 *   - It checks the *network*, not the DOM. Counting `naturalWidth === 0`
 *     reports every lazy off-screen image as broken (the brand marquee never
 *     scrolls into view), which buries real failures in false ones.
 *
 *   - It scrolls each page, so lazy images actually get requested.
 *
 * Requires `npm run build:static` to have produced dist/client.
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../dist/client", import.meta.url));
const PORT = Number(process.env.ASSET_CHECK_PORT ?? 8931);

// Routes worth loading: one of each layout rather than all 49, so this stays
// quick enough that people actually run it.
const ROUTES = [
  "/",
  "/services/",
  "/services/brake-repair/",
  "/our-shop/",
  "/contact/",
  "/offers/",
  "/vehicle-drop-off/",
  "/links/",
  "/reviews/",
  "/privacy/",
];

// Absent on a local static server by design: Vercel serves these at its edge.
const EXPECTED_ABSENT = ["/_vercel/"];

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
  ".vcf": "text/vcard",
};

if (!existsSync(ROOT)) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
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

const failures = [];
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() < 400) return;
    if (!url.startsWith(`http://127.0.0.1:${PORT}`) && !url.startsWith(`http://localhost:${PORT}`))
      return;
    if (EXPECTED_ABSENT.some((p) => url.includes(p))) return;
    failures.push({ route, url: url.replace(/^https?:\/\/[^/]+/, ""), status: res.status() });
  });
  await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: "networkidle" });
  // Scroll so lazy images are actually requested.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(700);
  await page.close();
  process.stdout.write(`  ${route}\n`);
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} failed request(s):`);
  for (const f of failures) console.error(`  ${f.status}  ${f.route}  ->  ${f.url}`);
  process.exit(1);
}
console.log(`  no failed requests across ${ROUTES.length} routes`);

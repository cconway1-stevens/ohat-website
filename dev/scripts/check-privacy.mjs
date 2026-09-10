#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChromium } from "./lib/browser.mjs";

const PROJECT = fileURLToPath(new URL("../..", import.meta.url));
const ROOT = join(PROJECT, "dist/client");
const PORT = Number(process.env.PRIVACY_CHECK_PORT ?? 8937);
const registry = JSON.parse(readFileSync(join(PROJECT, "dev/privacy-services.json"), "utf8"));

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(?:ts|tsx|js|mjs)$/.test(path)
        ? [path]
        : [];
  });
}

const policy = [
  join(PROJECT, "src/app/privacy/page.tsx"),
  ...sourceFiles(join(PROJECT, "src/components/privacy")),
]
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

const source = sourceFiles(join(PROJECT, "src"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
const failures = [];

for (const entry of registry) {
  for (const marker of entry.sourceMarkers) {
    if (!source.includes(marker))
      failures.push(`${entry.service}: source marker missing: ${marker}`);
  }
  for (const marker of entry.policyMarkers) {
    if (!policy.includes(marker))
      failures.push(`${entry.service}: privacy policy missing: ${marker}`);
  }
  if (entry.activation === "klaro") {
    const controls = readFileSync(
      join(PROJECT, "src/components/analytics/privacy-controls.tsx"),
      "utf8",
    );
    if (!controls.includes(`name: "${entry.klaroService}"`)) {
      failures.push(`${entry.service}: Klaro service ${entry.klaroService} is not configured`);
    }
  }
}

const executableFiles = sourceFiles(join(PROJECT, "src")).filter((file) => {
  const body = readFileSync(file, "utf8");
  return /fetch\(|<iframe|createElement\(["']script["']\)|@vercel\/analytics/.test(body);
});
const executableSource = executableFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const documentedDomains = new Set(registry.flatMap((entry) => entry.domains));
for (const match of executableSource.matchAll(/https:\/\/([\w.-]+)/g)) {
  const host = match[1];
  if (!documentedDomains.has(host) && host !== "open-meteo.com") {
    failures.push(`Unregistered third-party executable URL: ${host}`);
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `  - ${failure}`).join("\n"));
  process.exit(1);
}
if (process.argv.includes("--inventory-only")) {
  console.log(`Privacy inventory passed: ${registry.length} executable services documented.`);
  process.exit(0);
}
if (!existsSync(ROOT)) {
  console.error("  - dist/client not found — run `npm run build:static` first");
  process.exit(1);
}

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file) || statSync(file).isDirectory()) return res.writeHead(404).end("not found");
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const browser = await launchChromium();
const base = `http://127.0.0.1:${PORT}`;
const optional =
  /googletagmanager\.com|google-analytics\.com|api\.open-meteo\.com|\/_vercel\/insights|\/_vercel\/speed-insights|maps\.google\.com|api\.radio-browser\.info/;

async function auditChoice(label, gpc = false) {
  const context = await browser.newContext();
  if (gpc) {
    await context.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", { value: true }),
    );
  }
  const requests = [];
  const page = await context.newPage();
  page.on("request", (request) => {
    if (optional.test(request.url())) requests.push(request.url());
  });
  await page.route(optional, (route) => route.abort());
  await page.goto(base, { waitUntil: "networkidle" });
  for (const choice of [
    "Allow all optional services",
    "Use essential services only",
    "Choose my services",
  ]) {
    await page.getByRole("button", { name: choice, exact: true }).waitFor();
  }
  if (requests.length) failures.push(`Optional request before consent: ${requests[0]}`);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.waitForTimeout(label === "Allow all optional services" ? 3400 : 400);
  const ga = requests.some((url) => url.includes("googletagmanager.com"));
  const weather = requests.some((url) => url.includes("api.open-meteo.com"));
  if (label === "Use essential services only" && requests.length) {
    failures.push(`Optional request after essential-only choice: ${requests[0]}`);
  }
  if (label === "Allow all optional services" && !gpc && (!ga || !weather)) {
    failures.push("Allow all did not activate both Google Analytics and shop weather");
  }
  if (gpc && ga) failures.push("Google Analytics loaded despite Global Privacy Control");
  await context.close();
}

try {
  await auditChoice("Use essential services only");
  await auditChoice("Allow all optional services");
  await auditChoice("Allow all optional services", true);

  // The map has two independent gates: the stored Klaro choice, and the click.
  // Declining consent must leave no way to reach Google at all; consenting must
  // still hold the iframe back until the visitor presses the button.
  const context = await browser.newContext();
  const page = await context.newPage();
  const mapRequests = [];
  await page.route(/maps\.google\.com/, (route) => {
    mapRequests.push(route.request().url());
    return route.abort();
  });
  await page.goto(`${base}/contact/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Use essential services only", exact: true }).click();
  await page.waitForTimeout(250);
  if (mapRequests.length) failures.push("Google Map loaded before consent");
  if (await page.getByRole("button", { name: "Load Google Map", exact: true }).count()) {
    failures.push("Google Map offered a load button without consent");
  }
  await page.evaluate(() => {
    window.localStorage.setItem(
      "ohat-klaro-consent-v1",
      JSON.stringify({ googleMaps: true, radioBrowser: true }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  if (mapRequests.length) failures.push("Google Map loaded on consent alone, without the click");
  await page.getByRole("button", { name: "Load Google Map", exact: true }).click();
  await page.waitForTimeout(250);
  if (!mapRequests.length) failures.push("Google Map did not load after consent and its click");
  await context.close();
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`Privacy audit failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log(
  `Privacy audit passed: ${registry.length} services inventoried; consent gates verified.`,
);

/**
 * Shared page discovery and classification for the browser page-level checks.
 *
 * The static export (`dist/client`) is the single source of truth for what a
 * user can reach. Every page-level check (pages, lighthouse, a11y, slow-network)
 * discovers routes here so a newly added page is tested automatically and no
 * hand-maintained route list can drift from the build.
 *
 * Each emitted HTML file is classified by its own markup:
 *   - "error"     — the 404 page (filename 404.html)
 *   - "redirect"  — a legacy meta-refresh stub (http-equiv="refresh")
 *   - "noindex"   — a real page that intentionally blocks indexing (arcade, adgent)
 *   - "indexable" — a normal content page
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, sep } from "node:path";

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

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function routeFromFile(clientDir, file) {
  const rel = relative(clientDir, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel === "404.html") return "/404";
  return `/${rel.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`;
}

/**
 * Classify a single emitted HTML file.
 * @param {string} clientDir absolute path to dist/client
 * @param {string} file absolute path to an .html file
 * @returns {{ route: string, kind: "error"|"redirect"|"noindex"|"indexable" }}
 */
export function classifyPage(clientDir, file) {
  const route = routeFromFile(clientDir, file);
  if (route === "/404") return { route, kind: "error" };
  const html = readFileSync(file, "utf8");
  if (/http-equiv="refresh"/i.test(html)) return { route, kind: "redirect" };
  if (/name="robots" content="noindex/i.test(html)) return { route, kind: "noindex" };
  return { route, kind: "indexable" };
}

/**
 * Discover every emitted page and its class.
 * @param {string} clientDir absolute path to dist/client
 * @returns {{ route: string, kind: "error"|"redirect"|"noindex"|"indexable" }[]}
 */
export function discoverRoutes(clientDir) {
  return walk(clientDir)
    .filter((file) => extname(file) === ".html")
    .map((file) => classifyPage(clientDir, file))
    .sort((a, b) => a.route.length - b.route.length || a.route.localeCompare(b.route));
}

/**
 * The routes a browser page-level audit should actually load: everything except
 * the error page. Redirect stubs are real HTML and load fine, so they are
 * included where a check wants to exercise them (e.g. the page smoke test).
 * @param {string} clientDir absolute path to dist/client
 */
export function auditableRoutes(clientDir) {
  return discoverRoutes(clientDir)
    .filter((page) => page.kind !== "error")
    .map((page) => page.route);
}

/**
 * A static file server over dist/client, shared by every browser check so the
 * serving logic (and its MIME table) lives in exactly one place.
 * @param {string} clientDir absolute path to dist/client
 */
export function createStaticServer(clientDir) {
  return createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(clientDir, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
}

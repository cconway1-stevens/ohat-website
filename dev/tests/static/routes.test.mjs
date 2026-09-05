// Guards the shared page-discovery module (dev/scripts/lib/routes.mjs).
//
// Every browser page-level check discovers routes here, so a regression in the
// classifier silently shrinks or mis-tests the page set. These tests pin the
// classification rules against the real static export (dist/client), which
// `npm test` builds before this file runs.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { classifyPage, discoverRoutes } from "../../scripts/lib/routes.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const clientDir = join(root, "dist", "client");

test("static export exists for route discovery", () => {
  assert.ok(existsSync(clientDir), "dist/client missing — run the build first");
});

test("every emitted page is discovered and classified", () => {
  const pages = discoverRoutes(clientDir);
  const counts = pages.reduce((acc, p) => {
    acc[p.kind] = (acc[p.kind] ?? 0) + 1;
    return acc;
  }, {});
  // Pinned to the census in dev/docs/test-program.md §2. If the site grows a
  // new page class or a page changes tier, update both together.
  assert.deepEqual(counts, { indexable: 24, noindex: 26, redirect: 9, error: 1 });
});

test("known pages classify into the right tier", () => {
  const byRoute = new Map(discoverRoutes(clientDir).map((p) => [p.route, p.kind]));
  assert.equal(byRoute.get("/"), "indexable");
  assert.equal(byRoute.get("/hours"), "indexable");
  assert.equal(byRoute.get("/services/brake-repair"), "indexable");
  assert.equal(byRoute.get("/privacy"), "indexable");
  assert.equal(byRoute.get("/arcade"), "noindex");
  assert.equal(byRoute.get("/arcade/parts-counter-3d"), "noindex");
  assert.equal(byRoute.get("/agent"), "noindex");
  assert.equal(byRoute.get("/agent/motion"), "noindex");
  assert.equal(byRoute.get("/agent/testdrive"), "noindex");
  assert.equal(byRoute.get("/agent/brain"), "noindex");
  assert.equal(byRoute.get("/agent/engine"), "noindex");
  assert.equal(byRoute.get("/agent/results"), "noindex");
  assert.equal(byRoute.get("/agent/feedback"), "noindex");
  assert.equal(byRoute.get("/agent/options"), "noindex");
  assert.equal(byRoute.get("/agent/source"), "noindex");
  assert.equal(byRoute.get("/links/qr"), "noindex");
  assert.equal(byRoute.get("/auto-repair"), "redirect");
  assert.equal(byRoute.get("/services/tires-alignments"), "redirect");
  assert.equal(byRoute.get("/404"), "error");
});

test("classifyPage reads a single file without walking", () => {
  const page = classifyPage(clientDir, join(clientDir, "index.html"));
  assert.equal(page.route, "/");
  assert.equal(page.kind, "indexable");
});

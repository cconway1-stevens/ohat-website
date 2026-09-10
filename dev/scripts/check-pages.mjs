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
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { launchChromium } from "./lib/browser.mjs";
import { createStaticServer, discoverRoutes } from "./lib/routes.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BUILD_CLIENT = join(ROOT, "dist", "client");
const PORT = Number(process.env.PAGES_PORT ?? 8936);
const EXPECTED_ABSENT = ["/_vercel/"];

if (!existsSync(BUILD_CLIENT)) {
  console.error("dist/client not found — run `npm run build:static` first.");
  process.exit(1);
}

// A developer preview and a production build both use `dist`. Snapshot the
// completed export so an overlapping dev rebuild cannot turn a valid page
// sweep into random 404s or mixed-version hydration errors.
const snapshotRoot = mkdtempSync(join(tmpdir(), "ohat-pages-"));
const CLIENT = join(snapshotRoot, "client");
cpSync(BUILD_CLIENT, CLIENT, { recursive: true });
process.once("exit", () => rmSync(snapshotRoot, { recursive: true, force: true }));

const server = createStaticServer(CLIENT);

await new Promise((resolve) => server.listen(PORT, resolve));

let browser = await launchChromium();

const pages = discoverRoutes(CLIENT).filter((p) => p.kind !== "error");
const allRoutes = pages.map((p) => p.route);
const kindByRoute = new Map(pages.map((p) => [p.route, p.kind]));
const routes = process.env.PAGE_ROUTES?.split(",").filter(Boolean) ?? allRoutes;
const base = `http://127.0.0.1:${PORT}`;
const failures = [];

function fail(message, details = {}) {
  failures.push({ message, ...details });
}

async function checkRoute(page, route) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedResponses = [];
  const onConsole = (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  };
  const onPageError = (e) => pageErrors.push(e.message);
  const onResponse = (response) => {
    const url = response.url();
    if (response.status() < 400 || !url.startsWith(base)) return;
    if (EXPECTED_ABSENT.some((path) => url.includes(path))) return;
    failedResponses.push({ status: response.status(), url: url.replace(base, "") });
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  // Redirect stubs carry a `content="0"` meta-refresh that navigates away
  // immediately — sometimes before "domcontentloaded" even returns control
  // here. Waiting for "networkidle" races that navigation and can hang
  // Chromium indefinitely; evaluating the DOM afterward races it too
  // ("Execution context was destroyed"). A stub has nothing worth inspecting
  // beyond its own HTTP status anyway, so skip straight past both.
  const isRedirect = kindByRoute.get(route) === "redirect";
  // The same immediate-navigation race can make `goto` itself resolve with a
  // null response (Playwright loses track of which document to report on),
  // even though the request plainly succeeded. `onResponse` above observed
  // the real response independently, so redirects are judged by the absence
  // of a failure there rather than by this return value.
  const response = await page.goto(`${base}${route}`, {
    waitUntil: isRedirect ? "domcontentloaded" : "load",
  });

  // "networkidle" as a hard `goto` condition has hung the full 30s timeout
  // three times in CI, always on the first real navigation of a fresh page,
  // never twice for the same reason — it is an environment flake, not a page
  // defect, and it took the whole sweep down via the thrown TimeoutError.
  // Settling is still useful (deferred chunks, lazy fonts), so wait for it
  // bounded and best-effort: genuine failures are caught independently by
  // the response listener (status >= 400), the console/pageerror listeners,
  // and the post-scroll broken-image check below, none of which depend on
  // network quiescence.
  if (!isRedirect) {
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  }

  if (isRedirect) {
    if (failedResponses.length) fail("Route requested missing assets", { route, failedResponses });
    if (consoleErrors.length) fail("Route emitted console errors", { route, consoleErrors });
    if (pageErrors.length) fail("Route emitted page errors", { route, pageErrors });
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
    // The meta-refresh is still in flight (or about to be) on this page even
    // though we've stopped waiting on it. Left alone, that in-flight
    // navigation lands on whatever route the next iteration checks — and
    // when a redirect's own target is the very next route in the list (as
    // /tire-rotation's is /services/tires), it collides with that route's
    // own `goto`, reproducing the same hang one route later. Drain it with
    // bounded waits (never the unbounded "networkidle" that started this)
    // so the next route starts from a settled page. Forcing it off with a
    // hard navigation to about:blank was tried and rejected: Chromium's
    // favicon fetch for the page being left can outlive the navigation and
    // then gets blocked by Private Network Access from the "null" origin,
    // adding a spurious console error to whichever route is checking next.
    await page
      .waitForURL((url) => url.href !== `${base}${route}`, { timeout: 3000 })
      .catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    return;
  }

  if (!response || response.status() !== 200) {
    fail("Route returned non-200", { route, status: response?.status() ?? null });
  }

  // `loading="lazy"` only starts a fetch once the browser judges an image
  // close enough to the viewport, and that judgment is re-evaluated as
  // scroll position changes — scrolling through the page and back to the
  // top, as this used to, could leave an image that had only just come into
  // range deprioritized again before its fetch ever started, reporting it
  // broken when it had simply never been asked to load. Forcing every image
  // eager and waiting for each to decode checks what this route actually
  // ships, not how quickly a real visitor's scroll would have seen it.
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const img of images) img.loading = "eager";
    await Promise.all(images.map((img) => (img.complete ? null : img.decode().catch(() => {}))));
  });
  const state = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    brokenImages: Array.from(document.images)
      .filter((img) => !/\.svg(?:$|[?#])/i.test(img.currentSrc || img.src))
      .filter((img) => img.getClientRects().length > 0 && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  }));

  if (!state.title) fail("Route has no document title", { route });
  if (!state.h1) fail("Route has no H1", { route });
  if (consoleErrors.length) fail("Route emitted console errors", { route, consoleErrors });
  if (pageErrors.length) fail("Route emitted page errors", { route, pageErrors });
  if (failedResponses.length) fail("Route requested missing assets", { route, failedResponses });
  if (state.brokenImages.length) fail("Route has broken images", { route, state });

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);
}

// Every page fires live third-party requests — Google's gtag.js and, on
// pages with the weather reading, Open-Meteo's forecast API — that this
// smoke test has no business depending on. Left alone, an ordinary network
// hiccup out to the real internet from the CI runner either hangs
// "networkidle" for the full 30s on whatever page happens to load next, or
// surfaces as an unattributable "Failed to load resource" console error:
// two failure shapes that each showed up on a different, unrelated route in
// consecutive CI runs. Stubbing every non-base request with an empty,
// always-successful response makes the whole run hermetic: it verifies this
// export renders correctly, not whether Google's or Open-Meteo's servers
// answered a request from this runner today. Both call sites already treat
// a failed or absent reading as a normal, silent case, so an empty stub
// changes nothing they render.
async function stubThirdPartyRequests(page) {
  await page.route(
    (url) => !url.href.startsWith(base),
    (route) => {
      const isScript = route.request().resourceType() === "script";
      route.fulfill({
        status: 200,
        contentType: isScript ? "application/javascript" : "application/json",
        body: isScript ? "" : "{}",
      });
    },
  );
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
    if (!allRoutes.includes(target) && !allRoutes.includes(target.replace(/\/$/, ""))) {
      fail("Dead internal link", { route, href });
    }
  }
}

// Reuse a page for a small batch, then recycle Chromium. Several arcade routes
// initialize canvas, audio, and WebGL; one process for the entire export grows
// until Windows kills it, while one browser per route wastes CI time.
const ROUTES_PER_BROWSER = 8;
for (let start = 0; start < routes.length; start += ROUTES_PER_BROWSER) {
  const routePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await stubThirdPartyRequests(routePage);
  // A brand-new page's very first navigation is the flaky one in this CI
  // environment (see the bounded-networkidle note in checkRoute). A
  // throwaway navigation first gives the page's navigation/network tracking
  // a chance to settle before anything timed depends on it.
  await routePage.goto("about:blank").catch(() => {});
  for (const route of routes.slice(start, start + ROUTES_PER_BROWSER)) {
    try {
      await checkRoute(routePage, route);
      // A redirect stub's own frame is gone by now (its meta-refresh already
      // navigated it away) — its one link is the canonical target, already
      // covered by kind classification, and the target page gets checked in
      // its own right when its turn in `routes` comes up.
      if (kindByRoute.get(route) !== "redirect") await checkLinks(routePage, route);
    } catch (err) {
      // A single route timing out (this environment's "networkidle" has
      // hung on a first-of-batch navigation in CI three times now, never
      // twice for the same reason) used to take the whole 50-route sweep
      // down with it via an uncaught exception. One bad route is a real
      // failure worth reporting; it should not hide the other 49 results.
      fail("Route check threw", { route, error: err.message });
    }
    process.stdout.write(`  ${route}\n`);
  }
  await routePage.close();
  if (start + ROUTES_PER_BROWSER < routes.length) {
    await browser.close();
    browser = await launchChromium();
  }
}

// The primary conversion: the call button must point at the shop's number.
const homePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await stubThirdPartyRequests(homePage);
// Same bounded settle as checkRoute — this is a fresh page's first
// navigation, the exact case where a hard "networkidle" has hung in CI.
await homePage.goto(`${base}/`, { waitUntil: "load" });
await homePage.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
const callHref = await homePage.evaluate(() => {
  const el = document.querySelector('a[href^="tel:"]');
  return el?.getAttribute("href") ?? null;
});
if (!callHref || !callHref.includes("609")) {
  fail("Call button missing or wrong number", { callHref });
} else {
  console.log(`\nCall button: ${callHref}`);
}
await homePage.close();

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} page check failure(s):`);
  for (const f of failures) {
    console.error(`  ${f.message} — ${f.href ?? f.route ?? ""}`);
    for (const error of f.consoleErrors ?? []) console.error(`    console: ${error}`);
    for (const error of f.pageErrors ?? []) console.error(`    page: ${error}`);
    for (const response of f.failedResponses ?? []) {
      console.error(`    response: ${response.status} ${response.url}`);
    }
  }
  process.exit(1);
}
console.log(`\nAll ${routes.length} pages load and link correctly.`);

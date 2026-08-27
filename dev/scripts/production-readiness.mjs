#!/usr/bin/env node
import { createServer } from "node:net";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = new URL("../..", import.meta.url).pathname;
const artifactRoot = join(root, "artifacts", "production-readiness");
const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replace(/\.\d+Z$/, "Z");
const runDir = join(artifactRoot, stamp);
const screenshotDir = join(runDir, "screenshots");
const commandLogDir = join(runDir, "command-logs");
const forceInstall = process.argv.includes("--install");
const skipCommands = process.argv.includes("--skip-commands");
const keepServer = process.argv.includes("--keep-server");
const skipBrowserInstall = process.argv.includes("--skip-browser-install");
const desktopViewport = { width: 1440, height: 1100 };
const mobileViewport = { width: 390, height: 844 };
const mobileRoutes = new Set(["/", "/services", "/our-shop", "/contact"]);

mkdirSync(screenshotDir, { recursive: true });
mkdirSync(commandLogDir, { recursive: true });

const failures = [];

function fail(message, details = {}) {
  failures.push({ message, ...details });
}

function routeToFilename(route, suffix = "desktop") {
  const clean =
    route === "/"
      ? "home"
      : route
          .replace(/^\//, "")
          .replace(/\/$/, "")
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-|-$/g, "");
  return `${clean || "route"}-${suffix}.png`;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * Provider-specific tags hardcoded into the *exported HTML* are the hazard:
 * those files ship to whatever host serves them, and a `/_vercel/` path 404s
 * on every page load anywhere but Vercel. This is what bit the site before.
 *
 * Deliberately reads the built files rather than the live DOM. The DOM check
 * this replaces also flagged scripts appended at runtime by a client
 * component — which is exactly how the official @vercel/analytics package
 * loads, and which is safe, since it no-ops when the endpoint is absent.
 */
function checkExportedProviderScripts() {
  const clientDir = join(root, "dist", "client");
  const offenders = walk(clientDir)
    .filter((file) => file.endsWith(".html"))
    .filter((file) => /<script[^>]+src=["'][^"']*\/_vercel\//.test(readFileSync(file, "utf8")))
    .map((file) => relative(clientDir, file).split(sep).join("/"));

  if (offenders.length) {
    fail("Exported HTML hardcodes a provider-specific script", {
      files: offenders.slice(0, 10),
      total: offenders.length,
    });
  }
}

function exportedRoutes() {
  const clientDir = join(root, "dist", "client");
  const htmlFiles = walk(clientDir).filter((file) => file.endsWith(".html"));
  return htmlFiles
    .map((file) => {
      const rel = relative(clientDir, file).split(sep).join("/");
      if (rel === "index.html") return "/";
      if (rel === "404.html") return "/404";
      return `/${rel.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`;
    })
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

async function availablePort(preferred) {
  for (let port = preferred; port < preferred + 100; port += 1) {
    const usable = await new Promise((resolve) => {
      const server = createServer()
        .once("error", () => resolve(false))
        .once("listening", () => server.close(() => resolve(true)))
        .listen(port, "127.0.0.1");
    });
    if (usable) return port;
  }
  throw new Error(`No available port found from ${preferred} to ${preferred + 99}`);
}

async function runCommand(name, args, options = {}) {
  const logFile = join(commandLogDir, `${name.replace(/[^a-z0-9]+/gi, "-")}.log`);
  const output = [];
  const child = spawn(args[0], args.slice(1), {
    cwd: root,
    env: { ...process.env, ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    output.push(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    output.push(chunk);
  });

  const code = await new Promise((resolve) => child.on("close", resolve));
  writeFileSync(logFile, Buffer.concat(output));
  if (code !== 0) {
    throw new Error(`${name} failed with exit code ${code}; see ${relative(root, logFile)}`);
  }
  return { code, logFile };
}

function startPreview(port) {
  const logFile = join(commandLogDir, "production-preview.log");
  const output = [];
  const child = spawn("npm", ["start"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    output.push(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    output.push(chunk);
  });
  child.on("close", () => writeFileSync(logFile, Buffer.concat(output)));
  return { child, logFile };
}

async function waitForServer(baseUrl, preview) {
  const deadline = Date.now() + 30_000;
  let lastError = "";
  while (Date.now() < deadline) {
    if (preview.child.exitCode !== null) {
      throw new Error(`Production preview exited early with code ${preview.child.exitCode}`);
    }
    try {
      const response = await fetch(baseUrl, { headers: { accept: "text/html" } });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Production preview did not become ready: ${lastError}`);
}

async function stopPreview(preview) {
  if (!preview || preview.child.exitCode !== null) return;
  preview.child.kill("SIGTERM");
  const exited = await Promise.race([
    new Promise((resolve) => preview.child.once("close", resolve)),
    new Promise((resolve) => setTimeout(() => resolve("timeout"), 5_000)),
  ]);
  if (exited === "timeout") {
    preview.child.kill("SIGKILL");
  }
}

async function scrollAndSettle(page) {
  await page.evaluate(async () => {
    const step = Math.max(480, Math.floor(window.innerHeight * 0.75));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 300));
    window.scrollTo(0, 0);
  });
}

async function waitForRasterImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter(
      (img) =>
        !/\.svg(?:$|[?#])/i.test(img.currentSrc || img.src) &&
        img.getClientRects().length > 0 &&
        img.getBoundingClientRect().width > 0 &&
        img.getBoundingClientRect().height > 0,
    );
    await Promise.race([
      Promise.all(
        images.map((img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }).then(() => img.decode?.().catch(() => undefined)),
        ),
      ),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
  });
}

async function inspectPage(page) {
  return page.evaluate(() => ({
    contentType: document.contentType,
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim() ?? null,
    bodyHasAppError: /Application error|Unhandled Runtime Error|This page could not be found/i.test(
      document.body?.innerText ?? "",
    ),
    brokenRasterImages: Array.from(document.images)
      .filter((img) => !/\.svg(?:$|[?#])/i.test(img.currentSrc || img.src))
      .filter((img) => {
        const rect = img.getBoundingClientRect();
        return img.getClientRects().length > 0 && rect.width > 0 && rect.height > 0;
      })
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => ({
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })),
  }));
}

async function checkRoute(browser, baseUrl, route, viewport, suffix) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  const badResponses = [];
  const startedAt = Date.now();

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl)) {
      requestFailures.push({
        url,
        failure: request.failure()?.errorText ?? "request failed",
      });
    }
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.startsWith(baseUrl) && response.status() >= 400) {
      badResponses.push({ url, status: response.status() });
    }
  });

  const response = await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 7_000 }).catch(() => {});
  await scrollAndSettle(page);
  await waitForRasterImages(page);
  const state = await inspectPage(page);
  const screenshot = join(screenshotDir, routeToFilename(route, suffix));
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.close();

  return {
    route,
    viewport: suffix,
    status: response?.status() ?? null,
    ok: response?.ok() ?? false,
    durationMs: Date.now() - startedAt,
    screenshot: relative(root, screenshot),
    consoleErrors,
    pageErrors,
    requestFailures,
    badResponses,
    state,
  };
}

async function check404(browser, baseUrl) {
  const route = `/__production-readiness-missing-${Date.now()}`;
  const result = await checkRoute(browser, baseUrl, route, desktopViewport, "404");
  const statusOk = result.status === 404;
  const h1Ok = Boolean(result.state.h1);
  if (!statusOk || !h1Ok || result.state.bodyHasAppError) {
    fail("404 route did not render the expected not-found page", {
      route,
      status: result.status,
      h1: result.state.h1,
      screenshot: result.screenshot,
    });
  }
  return result;
}

async function checkTextEndpoint(baseUrl, route, expectedStatus, expectedText, label) {
  const response = await fetch(`${baseUrl}${route}`);
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const ok = response.status === expectedStatus && text.includes(expectedText);
  if (!ok) {
    fail(`${label} endpoint failed`, {
      route,
      status: response.status,
      contentType,
      expectedText,
    });
  }
  return { route, status: response.status, contentType, bytes: text.length, ok };
}

async function checkBinaryEndpoint(baseUrl, route, expectedStatus, expectedContentType, label) {
  const response = await fetch(`${baseUrl}${route}`);
  const bytes = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") ?? "";
  const ok =
    response.status === expectedStatus &&
    contentType.toLowerCase().startsWith(expectedContentType) &&
    bytes.byteLength > 0;
  if (!ok) {
    fail(`${label} endpoint failed`, {
      route,
      status: response.status,
      contentType,
      bytes: bytes.byteLength,
      expectedContentType,
    });
  }
  return { route, status: response.status, contentType, bytes: bytes.byteLength, ok };
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (
      skipBrowserInstall ||
      !/Executable doesn't exist|Please run the following command/i.test(error.message)
    ) {
      throw error;
    }
    console.log("Playwright browser runtime missing; installing Chromium...");
    await runCommand("playwright-install-chromium", ["npx", "playwright", "install", "chromium"]);
    return chromium.launch();
  }
}

function validateRouteResult(result, expectedStatus = 200) {
  const state = result.state;
  if (result.status !== expectedStatus) {
    fail("Route returned unexpected HTTP status", {
      route: result.route,
      viewport: result.viewport,
      status: result.status,
      expectedStatus,
      screenshot: result.screenshot,
    });
  }
  if (!state.title) {
    fail("Route rendered without a document title", {
      route: result.route,
      viewport: result.viewport,
      screenshot: result.screenshot,
    });
  }
  if (!state.h1) {
    fail("Route rendered without an H1", {
      route: result.route,
      viewport: result.viewport,
      screenshot: result.screenshot,
    });
  }
  if (state.bodyHasAppError) {
    fail("Route rendered app error text", {
      route: result.route,
      viewport: result.viewport,
      screenshot: result.screenshot,
    });
  }
  if (state.brokenRasterImages.length) {
    fail("Route has broken raster images", {
      route: result.route,
      viewport: result.viewport,
      images: state.brokenRasterImages,
      screenshot: result.screenshot,
    });
  }
  if (result.consoleErrors.length || result.pageErrors.length) {
    fail("Route emitted browser errors", {
      route: result.route,
      viewport: result.viewport,
      consoleErrors: result.consoleErrors,
      pageErrors: result.pageErrors,
      screenshot: result.screenshot,
    });
  }
  const badResponses = result.badResponses.filter(
    (entry) =>
      !entry.url.endsWith(result.route) && !entry.url.includes("/__production-readiness-missing-"),
  );
  if (badResponses.length || result.requestFailures.length) {
    fail("Route had failed same-origin resources", {
      route: result.route,
      viewport: result.viewport,
      badResponses,
      requestFailures: result.requestFailures,
      screenshot: result.screenshot,
    });
  }
}

async function main() {
  const commands = [];
  if (forceInstall || !statSync(join(root, "node_modules"), { throwIfNoEntry: false })) {
    commands.push(["install:ci", ["npm", "run", "install:ci"]]);
  }
  commands.push(["lint", ["npm", "run", "lint"]]);
  commands.push(["test", ["npm", "test"]]);

  if (!skipCommands) {
    for (const [name, command] of commands) {
      await runCommand(name, command);
    }
  }

  checkExportedProviderScripts();

  const allRoutes = exportedRoutes();
  const pageRoutes = allRoutes.filter((route) => route !== "/404");
  const port = await availablePort(Number(process.env.QA_PORT ?? 3001));
  const baseUrl = `http://127.0.0.1:${port}`;
  const preview = startPreview(port);
  let browser;

  try {
    await waitForServer(baseUrl, preview);
    browser = await launchBrowser();
    const routeResults = [];
    for (const route of pageRoutes) {
      const result = await checkRoute(browser, baseUrl, route, desktopViewport, "desktop");
      routeResults.push(result);
      validateRouteResult(result);
      if (mobileRoutes.has(route)) {
        const mobile = await checkRoute(browser, baseUrl, route, mobileViewport, "mobile");
        routeResults.push(mobile);
        validateRouteResult(mobile);
      }
    }

    const notFound = await check404(browser, baseUrl);
    const endpoints = [
      await checkTextEndpoint(baseUrl, "/contact-card.vcf", 200, "BEGIN:VCARD", "vCard"),
      await checkTextEndpoint(baseUrl, "/sitemap.xml", 200, "<urlset", "sitemap"),
      await checkTextEndpoint(baseUrl, "/robots.txt", 200, "Sitemap:", "robots"),
      await checkBinaryEndpoint(baseUrl, "/favicon.ico", 200, "image/x-icon", "favicon ico"),
      await checkBinaryEndpoint(baseUrl, "/favicon-32.png", 200, "image/png", "favicon png"),
      await checkBinaryEndpoint(
        baseUrl,
        "/apple-touch-icon.png",
        200,
        "image/png",
        "apple touch icon",
      ),
    ];

    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      routeCount: pageRoutes.length,
      mobileRouteCount: [...mobileRoutes].filter((route) => pageRoutes.includes(route)).length,
      artifactDir: relative(root, runDir),
      routes: routeResults,
      notFound,
      endpoints,
      failures,
    };
    writeFileSync(join(runDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(
      join(runDir, "summary.md"),
      [
        "# Production Readiness Report",
        "",
        `Generated: ${report.generatedAt}`,
        `Base URL: ${baseUrl}`,
        `Routes checked: ${routeResults.length}`,
        `Screenshots: ${relative(root, screenshotDir)}`,
        `Failures: ${failures.length}`,
        "",
        failures.length
          ? failures.map((entry) => `- ${entry.message}: ${entry.route ?? ""}`).join("\n")
          : "No production readiness failures found.",
        "",
      ].join("\n"),
    );

    if (failures.length) {
      console.error(
        `Production QA failed with ${failures.length} issue(s). See ${relative(root, runDir)}.`,
      );
      process.exitCode = 1;
    } else {
      console.log(`Production QA passed. Captures saved to ${relative(root, runDir)}.`);
    }
  } catch (error) {
    fail("Production QA crashed", { error: error.message });
    writeFileSync(
      join(runDir, "report.json"),
      `${JSON.stringify({ generatedAt: new Date().toISOString(), failures }, null, 2)}\n`,
    );
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (!keepServer) await stopPreview(preview);
  }
}

main();

// Guards the Vercel deployment path.
//
// `npm test` builds the Cloudflare Worker, but Vercel runs a different
// command (`npm run build:static`) that produces a plain static tree. That
// path once broke in production only — the image-variant script shelled out
// to Python Pillow, which exists locally but not in Vercel's build image — so
// these tests cover the command Vercel actually runs and the output it
// actually serves.
//
// The build itself runs earlier in the `npm test` pipeline; a failure there
// fails the run before this file executes. What follows verifies the result.
import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const outDir = join(root, vercel.outputDirectory);

test("vercel.json still points at the build this suite exercises", () => {
  // If either value changes, the pipeline in package.json's `test` script has
  // to change with it — otherwise these assertions silently guard nothing.
  assert.equal(vercel.buildCommand, "npm run build:static");
  assert.equal(vercel.outputDirectory, "dist/client");
});

test("build tooling depends only on npm-installed packages", () => {
  // The Pillow regression: a build script spawned `python3`, which Vercel's
  // build image does not carry. Anything the build needs must come from
  // node_modules so the deployment environment cannot differ from ours.
  const scriptsDir = join(root, "scripts");
  const buildScripts = readdirSync(scriptsDir).filter((file) =>
    file.endsWith(".mjs"),
  );
  assert.ok(buildScripts.length > 0, "expected build scripts to scan");

  const foreignTooling = /\bpython3?\b|\bpip\b|\bmagick\b|\bimagemagick\b|\bffmpeg\b/i;
  for (const file of buildScripts) {
    const source = readFileSync(join(scriptsDir, file), "utf8");
    assert.doesNotMatch(
      source,
      foreignTooling,
      `scripts/${file} reaches for a binary outside node_modules, which may ` +
        `not exist in Vercel's build image`,
    );
  }
});

test("static export produced a deployable tree", () => {
  const required = [
    "index.html",
    "404.html",
    "sitemap.xml",
    "robots.txt",
    "contact-card.vcf",
    ".nojekyll",
  ];
  for (const file of required) {
    assert.ok(
      existsSync(join(outDir, file)),
      `${vercel.outputDirectory}/${file} is missing from the export`,
    );
  }
});

test("every service page exports as its own HTML document", () => {
  // Read the slugs from the source of truth so a new service cannot ship
  // without a corresponding exported page.
  const servicesSource = readFileSync(join(root, "lib/services.ts"), "utf8");
  const slugs = [...servicesSource.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map(
    (match) => match[1],
  );
  assert.ok(slugs.length >= 12, `expected the full service list, got ${slugs.length}`);

  for (const slug of slugs) {
    assert.ok(
      existsSync(join(outDir, "services", slug, "index.html")),
      `/services/${slug} did not export`,
    );
  }
});

test("legacy URLs export redirect stubs that point somewhere real", () => {
  const legacy = [
    "auto-repair",
    "contact-us",
    "coupons",
    "oil-changes",
    "tire-rotation",
    "alignments",
    "services/tires-alignments",
  ];

  for (const from of legacy) {
    const file = join(outDir, from, "index.html");
    assert.ok(existsSync(file), `/${from} has no redirect stub`);

    const html = readFileSync(file, "utf8");
    const target = html.match(/content="0; url=([^"]+)"/)?.[1];
    assert.ok(target, `/${from} stub has no meta refresh`);
    assert.match(html, /name="robots" content="noindex"/, `/${from} should be noindex`);
    assert.ok(
      existsSync(join(outDir, target, "index.html")),
      `/${from} redirects to ${target}, which did not export`,
    );
  }
});

test("exported pages carry no Worker-only image URLs", () => {
  // `next/image` emits the optimizer endpoint, which exists only in the
  // Worker runtime — left in place every one of those requests 404s on a
  // static host, and the page renders without its photographs.
  const pages = walk(outDir).filter((file) => file.endsWith(".html"));
  assert.ok(pages.length > 20, `expected the full page set, got ${pages.length}`);

  for (const page of pages) {
    assert.doesNotMatch(
      readFileSync(page, "utf8"),
      /\/_vinext\/image\?/,
      `${page.slice(outDir.length)} still points at the Worker image optimizer`,
    );
  }
});

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

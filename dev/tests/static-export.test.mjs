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

const root = fileURLToPath(new URL("../..", import.meta.url));
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
  const scriptsDir = join(root, "dev", "scripts");
  const buildScripts = readdirSync(scriptsDir).filter((file) => file.endsWith(".mjs"));
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
  const servicesSource = readFileSync(join(root, "src/lib/services.ts"), "utf8");
  const slugs = [...servicesSource.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((match) => match[1]);
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
    "logo-match",
    "arcade/drag-strip",
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

test("arcade pages are noindex and stay out of the sitemap", () => {
  // The arcade is an easter egg with no service intent; indexed game pages
  // would compete with the pages that earn calls.
  const sitemap = readFileSync(join(outDir, "sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /\/arcade/, "sitemap should not list arcade routes");

  const arcadeDir = join(outDir, "arcade");
  assert.ok(existsSync(join(arcadeDir, "index.html")), "arcade hub did not export");
  for (const page of walk(arcadeDir).filter((file) => file.endsWith(".html"))) {
    assert.match(
      readFileSync(page, "utf8"),
      /<meta name="robots" content="noindex/,
      `${page.slice(outDir.length)} should carry noindex`,
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

test("mobile homepage images use compact modern formats", () => {
  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.match(html, /\/media\/logo-transparent\.avif/);
  assert.match(html, /\/media\/ase-certified\.webp/);
  assert.match(
    html,
    /\/media\/rs\/cecf1b30-365d-430d-b925-1fd22429c9e1-768\.avif 768w/,
    "homepage hero should offer a phone-sized AVIF candidate",
  );
});

test("only the latin font subset is preloaded", () => {
  // The font loader preloads every unicode subset it emits, so an English
  // site was spending ~46 KiB of high-priority bandwidth on Cyrillic and
  // Vietnamese glyphs it never draws — bandwidth the hero image wanted. The
  // build strips those preloads; this guards that it still does.
  const pages = walk(outDir).filter((file) => file.endsWith(".html"));

  let preloadingPages = 0;
  for (const page of pages) {
    const html = readFileSync(page, "utf8");
    const preloaded = [...html.matchAll(/<link\b[^>]*\bas="font"[^>]*>/g)];
    if (preloaded.length === 0) continue;
    preloadingPages += 1;

    assert.equal(
      preloaded.length,
      1,
      `${page.slice(outDir.length)} preloads ${preloaded.length} font subsets, expected only latin`,
    );
    // The `@font-face` rules stay put — `unicode-range` keeps the other
    // subsets available on demand, which is what makes dropping the
    // unconditional preloads safe rather than lossy.
    assert.ok(
      html.split("@font-face").length - 1 > 1,
      `${page.slice(outDir.length)} dropped the non-latin @font-face rules, not just their preloads`,
    );
  }

  assert.ok(preloadingPages > 20, `expected the full page set, got ${preloadingPages}`);
});

test("the page warms the origins it fetches from", () => {
  // Open-Meteo is called from a client component in the masthead, so without
  // a hint the browser does not resolve the origin until hydration.
  const html = readFileSync(join(outDir, "index.html"), "utf8");
  const origins = [...html.matchAll(/<link\b[^>]*rel="preconnect"[^>]*>/g)];

  assert.match(html, /rel="preconnect"[^>]*href="https:\/\/api\.open-meteo\.com"/);
  // Past four, preconnects start competing with the requests they exist to
  // accelerate.
  assert.ok(origins.length <= 4, `${origins.length} preconnects is more than the guidance allows`);
});

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

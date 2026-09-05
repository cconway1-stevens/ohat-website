// Post-processes a `STATIC_EXPORT=1` vinext build into a directory a plain
// static host (GitHub Pages) can serve, filling the gaps the export leaves:
// worker-only image URLs, the vCard route handler, sitemap/robots, and the
// server-side legacy redirects.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import imageManifest from "../../src/lib/image-manifest.json" with { type: "json" };
import { contactCard } from "../../src/lib/shop/contact-card.mjs";
import { shop } from "../../src/lib/shop/shop.mjs";

const OUT_DIR = "dist/client";
const SITE_URL = shop.siteUrl;
const basePath = process.env.BASE_PATH ?? "";

// Legacy URLs from the previous website. The app serves these with a server
// redirect, which a static host cannot do, so they become meta-refresh pages.
const LEGACY_REDIRECTS = {
  "auto-repair": "/services",
  "contact-us": "/contact",
  coupons: "/offers",
  "oil-changes": "/services/oil-maintenance",
  "tire-rotation": "/services/tires",
  alignments: "/services/wheel-alignment",
  // Split into /services/tires and /services/wheel-alignment; tires is the
  // closer match for the combined page's primary content.
  "services/tires-alignments": "/services/tires",
  // The single game page grew into the arcade.
  "logo-match": "/arcade/logo-match",
  // The reaction cabinet was replaced by the garage crossword.
  "arcade/drag-strip": "/arcade/crossword",
};

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

// Reshape `about.html` into `about/index.html`. Hosts disagree about whether
// `/about` should resolve to `about.html` or `about/index.html` — and here
// both `services.html` and a `services/` directory exist — so emit only the
// directory form, which every static host resolves the same way.
for (const file of walk(OUT_DIR).filter((f) => f.endsWith(".html"))) {
  const route = relative(OUT_DIR, file);
  if (route === "index.html" || route === "404.html" || route.endsWith(`${sep}index.html`)) {
    continue;
  }
  const target = join(OUT_DIR, route.replace(/\.html$/, ""), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  // Newer vinext releases emit both `about.html` and `about/index.html`.
  // Prefer the already-canonical directory form and remove the duplicate.
  // This also makes the post-processor safe to run more than once.
  if (existsSync(target)) unlinkSync(file);
  else renameSync(file, target);
}

const htmlFiles = walk(OUT_DIR).filter((file) => file.endsWith(".html"));

// The font loader emits an `@font-face` per unicode subset — cyrillic-ext,
// cyrillic, vietnamese, latin-ext, latin — and then preloads all five, even
// though `subsets: ["latin"]` was what we asked for. The `@font-face` rules
// themselves are harmless: `unicode-range` means a subset is only fetched if
// the page actually contains one of its characters, and an English-language
// garage in New Jersey never will. The preloads are the problem, because a
// preload is unconditional and high priority — so ~46 KiB of Cyrillic and
// Vietnamese glyphs race the hero image for bandwidth on a slow connection
// and then go unused.
//
// Keep the preload for any subset covering basic latin (U+0000-00FF) and drop
// the rest. If the markup ever stops looking like this the parse yields
// nothing and every preload survives, which is the safe direction to fail in.
function trimFontPreloads(html) {
  const droppable = new Set();
  for (const block of html.match(/@font-face\s*{[^}]*}/g) ?? []) {
    const file = block.match(/[^/"')\s]+\.woff2/)?.[0];
    const range = block.match(/unicode-range:\s*([^;}]*)/)?.[1];
    if (!file || !range) continue;
    if (!/U\+0000-00FF/i.test(range)) droppable.add(file);
  }
  if (droppable.size === 0) return html;

  return html.replace(/<link\b[^>]*\bas="font"[^>]*>/g, (tag) => {
    const file = tag.match(/href="[^"]*?([^/"]+\.woff2)"/)?.[1];
    return file && droppable.has(file) ? "" : tag;
  });
}

// `next/image` still emits the optimizer endpoint, which only exists in the
// Worker. Point every one of those at the original asset instead.
let rewritten = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  // Emitted unprefixed; the base-path pass below handles public/ assets.
  const next = html.replace(
    /\/_vinext\/image\?url=([^"&\s]+)(?:&(?:amp;)?[^"\s]*)?/g,
    (_match, encoded) => decodeURIComponent(encoded),
  );
  if (next !== html) {
    writeFileSync(file, next);
    rewritten += 1;
  }
}

// `<Image priority>` components now point `src` straight at a pre-built AVIF
// (see the note in src/app/page.tsx) so the client-side preload React 19
// inserts for priority images — which always uses `src` verbatim, unaware of
// the rewriting below — fetches the small variant instead of the multi-MB
// source. That means `src`/`href` values reaching this file are sometimes
// already a `/media/rs/<stem>-<width>.<ext>` path rather than a manifest key,
// so resolve either form back to the same manifest entry.
function resolveManifestEntry(url) {
  if (!url) return null;
  if (imageManifest[url]) return imageManifest[url];
  const stem = url.match(/^\/media\/rs\/(.+)-\d+\.avif$/)?.[1];
  if (!stem) return null;
  return Object.values(imageManifest).find((entry) => entry.stem === stem) ?? null;
}

// `next/image` emits a srcset with width descriptors but, without an optimizer
// (and with vinext honouring neither a custom loader nor `unoptimized`), every
// entry points at the same full-size file — so a phone downloads the 2004px
// hero. Repoint each entry at the nearest pre-built variant.
let responsive = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const next = html.replace(/(srcset|srcSet)="([^"]+)"/g, (_match, attr, value) => {
    const entries = value.split(",").map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/);
      const width = Number.parseInt(descriptor, 10);
      const image = resolveManifestEntry(url);
      if (!image || !Number.isFinite(width)) return entry.trim();
      const variant = image.widths.find((candidate) => candidate >= width);
      return variant
        ? `/media/rs/${image.stem}-${variant}.${image.extension} ${descriptor}`
        : entry.trim();
    });
    const rebuilt = entries.join(", ");
    if (rebuilt !== value) responsive += 1;
    return `${attr}="${rebuilt}"`;
  });
  // Images rendered with `fill` come out with no srcset whatsoever — just a
  // full-size src — so give them the ladder outright. The original is never a
  // candidate: for the hero it is a multi-megabyte PNG, and the largest AVIF
  // variant (1920w) is visually indistinguishable at a fraction of the bytes.
  const withHeroSrcsets = next.replace(/<img\b[^>]*>/g, (tag) => {
    if (/srcset=/i.test(tag)) return tag;
    const src = tag.match(/\ssrc="([^"]+)"/)?.[1];
    const image = src && resolveManifestEntry(src);
    if (!image) return tag;
    const candidates = image.widths
      .map((w) => `/media/rs/${image.stem}-${w}.${image.extension} ${w}w`)
      .join(", ");
    // The `src` fallback is the full-size original — a multi-megabyte PNG for
    // the hero. Browsers that ignore srcset (or double-fetch the fallback
    // alongside the srcset pick) would download the whole thing, so point the
    // fallback at a compact AVIF variant instead. 1200w covers a 520px desktop
    // slot at 2x and a phone at 3x; smaller ladders fall back to their largest
    // variant.
    const fallbackWidth =
      image.widths.find((w) => w >= 1200) ?? image.widths[image.widths.length - 1];
    const fallback = `/media/rs/${image.stem}-${fallbackWidth}.${image.extension}`;
    const withFallback = tag.replace(/\ssrc="[^"]+"/, ` src="${fallback}"`);
    // vinext's unoptimized next/image shim drops the `sizes` attribute, so the
    // browser falls back to 100vw and can over-fetch on wide screens. Restore a
    // sane default for fill images that do not already carry one.
    const withSizes = /sizes=/i.test(withFallback)
      ? withFallback
      : withFallback.replace(/<img\b/, `<img sizes="100vw"`);
    responsive += 1;
    return withSizes.replace(/<img\b/, `<img srcset="${candidates}"`);
  });

  // A priority image also gets a preload pointing at the full-size file. Left
  // alone it fetches the original *and* the srcset pick, so it needs the same
  // candidate list to choose from.
  const withPreloads = withHeroSrcsets.replace(/<link\b[^>]*rel="preload"[^>]*>/g, (tag) => {
    if (!/as="image"/.test(tag) || /imagesrcset=/i.test(tag)) return tag;
    const href = tag.match(/\shref="([^"]+)"/)?.[1];
    const image = href && resolveManifestEntry(href);
    if (!image) return tag;
    const candidates = image.widths
      .map((w) => `/media/rs/${image.stem}-${w}.${image.extension} ${w}w`)
      .join(", ");
    return tag.replace(/<link\b/, `<link imagesrcset="${candidates}"`);
  });

  const withTrimmedFontPreloads = trimFontPreloads(withPreloads);

  if (withTrimmedFontPreloads !== html) writeFileSync(file, withTrimmedFontPreloads);
}

// Route handlers are not part of a static export.
writeFileSync(join(OUT_DIR, "contact-card.vcf"), contactCard);

// Derive the sitemap from what was actually emitted so it cannot drift from
// the routes that exist. Legacy redirects and the 404 stay out of it.
// Pages that deliberately carry `noindex`. Listing a noindex URL in the
// sitemap asks Google to crawl something it is then told not to index.
const isNoindexRoute = (route) =>
  route === "/arcade" ||
  route.startsWith("/arcade/") ||
  route === "/links/qr" ||
  route === "/agent" ||
  route.startsWith("/agent/");

const routes = htmlFiles
  .map(
    (file) =>
      "/" +
      relative(OUT_DIR, file)
        .split(sep)
        .join("/")
        .replace(/(?:^|\/)index\.html$/, "")
        .replace(/\.html$/, ""),
  )
  .filter((route) => route !== "/404")
  .filter((route) => !isNoindexRoute(route))
  .filter((route) => !(route.slice(1) in LEGACY_REDIRECTS))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

// /links is a utility hub for social-profile bios rather than a page meant to
// rank, so it sits below the service pages instead of level with /contact.
const priority = (route) =>
  route === "/"
    ? "1.0"
    : route === "/privacy"
      ? "0.3"
      : route === "/links"
        ? "0.5"
        : route.includes("/services/")
          ? "0.7"
          : "0.8";

// `lastmod` is the one sitemap hint Google still acts on. The build date is
// the honest value here: these pages are published by this build.
const lastmod = new Date().toISOString().slice(0, 10);

writeFileSync(
  join(OUT_DIR, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      (route) =>
        `  <url><loc>${SITE_URL}${route === "/" ? "/" : route}</loc><lastmod>${lastmod}</lastmod><priority>${priority(route)}</priority></url>`,
    )
    .join("\n")}\n</urlset>\n`,
);

writeFileSync(
  join(OUT_DIR, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);

// Meta-refresh stand-ins for the server redirects, with a canonical pointing
// at the destination so search engines consolidate on the new URL.
for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
  const target = basePath + to;
  mkdirSync(join(OUT_DIR, from), { recursive: true });
  writeFileSync(
    join(OUT_DIR, from, "index.html"),
    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Redirecting to ${to}</title>\n<link rel="canonical" href="${SITE_URL}${to}">\n<meta name="robots" content="noindex">\n<meta http-equiv="refresh" content="0; url=${target}">\n</head>\n<body>\n<p>This page moved. <a href="${target}">Continue to ${to}</a>.</p>\n</body>\n</html>\n`,
  );
}

// Stop GitHub Pages from running Jekyll, which would drop underscore paths.
writeFileSync(join(OUT_DIR, ".nojekyll"), "");

// Subdirectory hosting (a GitHub Pages *project* site) is not supported, and
// the failure is in the framework rather than anything fixable here: vinext's
// prerenderer ignores `basePath` — it fetches unprefixed paths from a prefixed
// server, so the dynamic service routes never export — and it does not
// implement `assetPrefix`, so the JS and CSS it loads at runtime stay pinned to
// the domain root. Rewriting URLs afterwards leaves the client chunks and the
// RSC router requesting `/assets/*.js` and `/services.txt`, which 404 under a
// subpath: the pages still render, but scripts and navigation break.
if (basePath) {
  console.error(
    `BASE_PATH=${basePath} is set, but this site must be served from the root ` +
      `of a domain — a custom domain, or an <owner>.github.io repository.`,
  );
  process.exit(1);
}

console.log(
  `Static site ready in ${OUT_DIR}: ${htmlFiles.length} pages ` +
    `(${rewritten} with image URLs rewritten, ${responsive} srcsets made ` +
    `responsive), ${routes.length} in sitemap.`,
);

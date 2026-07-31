// Post-processes a `STATIC_EXPORT=1` vinext build into a directory a plain
// static host (GitHub Pages) can serve, filling the gaps the export leaves:
// worker-only image URLs, the vCard route handler, sitemap/robots, and the
// server-side legacy redirects.
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { contactCard } from "../lib/contact-card.mjs";

const OUT_DIR = "dist/client";
const SITE_URL = "https://oceanheightsautorepair.com";
const basePath = process.env.BASE_PATH ?? "";

// Legacy URLs from the previous website. The app serves these with a server
// redirect, which a static host cannot do, so they become meta-refresh pages.
const LEGACY_REDIRECTS = {
  "auto-repair": "/services",
  "contact-us": "/contact",
  coupons: "/offers",
  "oil-changes": "/services/oil-maintenance",
  "tire-rotation": "/services/tires-alignments",
  alignments: "/services/tires-alignments",
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
  if (route === "index.html" || route === "404.html") continue;
  const target = join(OUT_DIR, route.replace(/\.html$/, ""), "index.html");
  mkdirSync(dirname(target), { recursive: true });
  renameSync(file, target);
}

const htmlFiles = walk(OUT_DIR).filter((file) => file.endsWith(".html"));

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

// Route handlers are not part of a static export.
writeFileSync(join(OUT_DIR, "contact-card.vcf"), contactCard);

// Links back to the homepage prefetch `/.rsc`, but the export names the root
// payload `index.rsc`. Without this copy every page logs a 404 and soft
// navigation home falls back to a full reload.
copyFileSync(join(OUT_DIR, "index.rsc"), join(OUT_DIR, ".rsc"));

// Derive the sitemap from what was actually emitted so it cannot drift from
// the routes that exist. Legacy redirects and the 404 stay out of it.
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
  .filter((route) => !(route.slice(1) in LEGACY_REDIRECTS))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const priority = (route) =>
  route === "/" ? "1.0" : route.includes("/services/") ? "0.7" : "0.8";

writeFileSync(
  join(OUT_DIR, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      (route) =>
        `  <url><loc>${SITE_URL}${route === "/" ? "/" : route}</loc><priority>${priority(route)}</priority></url>`,
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
// RSC router requesting `/assets/*.js` and `/services.rsc`, which 404 under a
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
    `(${rewritten} with image URLs rewritten), ${routes.length} in sitemap.`,
);

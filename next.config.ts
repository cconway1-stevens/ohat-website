import type { NextConfig } from "next";

// The Cloudflare Worker build is the default. Setting STATIC_EXPORT=1 produces
// a fully pre-rendered copy of the site for a plain static host (GitHub Pages).
//
// Subdirectory hosting is not configurable here: vinext's prerenderer ignores
// `basePath` (it fetches unprefixed paths from a prefixed server, so the
// dynamic service routes fail to export) and it does not implement
// `assetPrefix` at all. The static site must be served from a domain root.
const nextConfig: NextConfig =
  process.env.STATIC_EXPORT === "1"
    ? {
        output: "export",
        // vinext honours neither a custom loader nor `unoptimized` here, so
        // the emitted srcset entries are repointed at the width ladder from
        // scripts/generate-image-variants.mjs in scripts/build-static.mjs.
        images: { unoptimized: true },
      }
    : {};

export default nextConfig;

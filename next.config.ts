import type { NextConfig } from "next";

// The Cloudflare Worker build is the default. Setting STATIC_EXPORT=1 produces
// a fully pre-rendered copy of the site for a plain static host (GitHub Pages),
// where BASE_PATH covers project sites served from a subdirectory.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = staticExport
  ? {
      output: "export",
      images: { unoptimized: true },
      ...(basePath ? { basePath, assetPrefix: basePath } : {}),
    }
  : {};

export default nextConfig;

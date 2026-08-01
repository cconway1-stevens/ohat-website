"use client";

import { Analytics } from "@vercel/analytics/react";
import { isVercelHost } from "@/lib/analytics";

/**
 * Vercel Web Analytics, via Vercel's own package.
 *
 * This replaced a hand-rolled script tag. Some history, because the tag has
 * moved three times: it was originally a plain
 * `<script src="/_vercel/insights/script.js">` in the layout, which 404'd on
 * every page load of the GitHub Pages copy of the site, since that path is
 * served only by Vercel's edge. It was removed for that reason, and
 * `scripts/production-readiness.mjs` still fails the build on any `/_vercel/`
 * script found in exported HTML.
 *
 * The package injects the script from a client effect, so the exported HTML
 * stays free of provider-specific tags. It does not, however, detect whether
 * the current host serves Vercel's endpoint; without the gate below it asks
 * every non-Vercel deployment for a file that can only return 404.
 *
 * `@vercel/analytics/react` rather than `/next`, deliberately. The `/next`
 * entry imports `usePathname` and `useSearchParams` from `next/navigation`.
 * This project builds on vinext, not Next itself, and `useSearchParams`
 * additionally forces a Suspense boundary during static export — a real risk
 * for a `output: "export"` build. The React entry has no framework coupling
 * and tracks navigation through the History API, which is what this mostly
 * static site needs.
 *
 * Cookieless and collects no personal data — see docs/privacy-compliance.md.
 */
export function VercelAnalytics() {
  const enabled = typeof window !== "undefined" && isVercelHost(window.location.hostname);
  return enabled ? <Analytics /> : null;
}

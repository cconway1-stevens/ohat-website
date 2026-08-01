"use client";

import { useEffect } from "react";
import { isVercelHost } from "@/lib/analytics";

/**
 * Loads Vercel Web Analytics, but only when the page is actually being served
 * from Vercel.
 *
 * The tag used to sit in the layout as a plain <script src="/_vercel/…">. It
 * was removed because that path exists only on Vercel's edge, and this site is
 * published to Vercel *and* GitHub Pages from the same static export — so on
 * Pages it 404'd on every page load. `scripts/production-readiness.mjs` now
 * fails the build outright on any `/_vercel/` script found in a rendered page,
 * which is the right check: a hardcoded tag is broken on half the deployments.
 *
 * Injecting it at runtime satisfies both. The exported HTML contains no
 * provider-specific script, so the readiness check passes and Pages stays
 * clean; on a Vercel host the script is appended and analytics works normally.
 *
 * Cookieless and collects no personal data, so there is nothing here for the
 * consent story — see docs/privacy-compliance.md.
 */
export function VercelAnalytics() {
  useEffect(() => {
    if (!isVercelHost(window.location.hostname)) return;

    const SRC = "/_vercel/insights/script.js";
    if (document.querySelector(`script[src="${SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SRC;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return null;
}

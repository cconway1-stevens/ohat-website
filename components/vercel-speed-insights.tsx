"use client";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { isVercelHost } from "@/lib/analytics";

/**
 * Vercel Speed Insights, gated the same way as `VercelAnalytics`: the script
 * lives on Vercel's edge and 404s on the GitHub Pages copy of this same
 * static export, so it only renders on a Vercel host.
 *
 * `@vercel/speed-insights/react` rather than `/next`, for the same reason as
 * `vercel-analytics.tsx` — this project builds on vinext, not Next itself.
 */
export function VercelSpeedInsights() {
  const enabled = typeof window !== "undefined" && isVercelHost(window.location.hostname);
  return enabled ? <SpeedInsights /> : null;
}

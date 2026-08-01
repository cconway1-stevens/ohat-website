/**
 * Google Analytics 4 measurement ID for the shop's property.
 *
 * Kept here rather than inline in the layout so the tag in <head> and the
 * event reporting in components/analytics.tsx can never point at two
 * different properties.
 */
export const gaMeasurementId = "G-GXWDZMS0FL";

/**
 * Vercel Web Analytics ships from Vercel's own edge at `/_vercel/insights/*`.
 * That path only exists on a Vercel deployment, and this site is published to
 * two places at once — Vercel (vercel.json) and GitHub Pages
 * (.github/workflows/deploy-pages.yml) — so a hardcoded tag 404s on every
 * Pages page load. That is why the tag was removed rather than kept.
 *
 * Hence a host check instead of a build flag: the static export is a single
 * set of files served from both hosts, so which analytics is available cannot
 * be known until the page is actually running somewhere.
 */
export const vercelHostSuffixes = [".vercel.app"];

export function isVercelHost(hostname: string): boolean {
  return vercelHostSuffixes.some(
    (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix),
  );
}

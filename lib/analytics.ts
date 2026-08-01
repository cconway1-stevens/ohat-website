import { shop } from "./shop";

/**
 * Google Analytics 4 measurement ID for the shop's property.
 *
 * Kept here rather than inline in the layout so the tag in <head> and the
 * event reporting in components/analytics.tsx can never point at two
 * different properties.
 */
export const gaMeasurementId = "G-GXWDZMS0FL";

/**
 * Hosts served by Vercel, where Vercel Web Analytics can actually load.
 *
 * The script comes from Vercel's own edge at `/_vercel/insights/*`, a path
 * that exists only on a Vercel deployment. A hardcoded tag therefore 404s
 * anywhere else, which is why it was removed once already, and why
 * `scripts/production-readiness.mjs` fails the build if it finds one in a
 * rendered page.
 *
 * The list has to include the production domain, not just `*.vercel.app`.
 * A custom domain pointed at Vercel is still a Vercel deployment, but its
 * hostname looks nothing like a preview URL — matching only the preview
 * suffix would quietly switch analytics off on the one host that matters.
 *
 * `shop.siteUrl` is the source for the production host so it cannot drift
 * from the canonical URL used everywhere else.
 */
const productionHost = new URL(shop.siteUrl).hostname;

export const vercelHosts = {
  /** Preview and default deployment URLs. */
  suffixes: [".vercel.app"],
  /** Exact hostnames, with and without `www.`. */
  exact: [productionHost, `www.${productionHost}`],
};

export function isVercelHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    vercelHosts.exact.includes(host) ||
    vercelHosts.suffixes.some((suffix) => host.endsWith(suffix))
  );
}

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
 * Vercel Web Analytics is served from a host-relative `/_vercel/` endpoint.
 * The site also runs in local previews, on Sites, and as a static export, so
 * loading that endpoint everywhere creates one failed request on every page.
 */
const productionHost = new URL(shop.siteUrl).hostname;

export const vercelHosts = {
  exact: [productionHost, `www.${productionHost}`],
  suffixes: [".vercel.app"],
};

export function isVercelHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    vercelHosts.exact.includes(host) || vercelHosts.suffixes.some((suffix) => host.endsWith(suffix))
  );
}

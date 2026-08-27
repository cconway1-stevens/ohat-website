// Profile links and contact details, all sourced from the single shop config
// in lib/shop.mjs. Kept as a module because several pages import these names
// directly; edit the values in lib/shop.mjs, never here.
import { shop, sameAs } from "./shop.mjs";

export const carfaxUrl = shop.profiles.carfax;
export const yelpUrl = shop.profiles.yelp;
export const facebookUrl = shop.profiles.facebook;
export const googleUrl = shop.profiles.google;

export const contactEmail = shop.email.service;
export const receiptsEmail = shop.email.receipts;

export const profileLinks = [
  { name: "Google", href: googleUrl, detail: "Reviews, hours, and directions" },
  {
    name: "CARFAX",
    href: carfaxUrl,
    detail: `${shop.rating.value}-star rating across hundreds of verified reviews, as of ${shop.rating.observed}`,
  },
  {
    name: "Yelp",
    href: yelpUrl,
    detail: "See the current Ocean Heights business profile",
  },
  {
    name: "Facebook",
    href: facebookUrl,
    detail: "Follow shop news and community updates",
  },
] as const;

export { sameAs };

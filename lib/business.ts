// Single source of truth for the shop's public profile links, which were
// previously copy-pasted across the homepage, reviews, links, and footer.

export const carfaxUrl =
  "https://www.carfax.com/Reviews-Ocean-Heights-Auto-And-Tire-Egg-Harbor-Township-NJ_BLQLOZM001";
export const yelpUrl =
  "https://www.yelp.com/biz/ocean-heights-auto-and-tire-egg-harbor-township-2";
export const facebookUrl = "https://www.facebook.com/OceanHeightsAuto/";

// Google Business Profile is where most "mechanic near me" searches land, so
// the shop needs to be reachable from the site. Until the owner supplies the
// profile's own URL (or Place ID), this uses Google's documented Maps search
// URL, which resolves to the listing without inventing an identifier. Swap in
// the real profile link when it is available — and add it to `sameAs` below,
// which is deliberately limited to canonical profile URLs.
export const googleUrl =
  "https://www.google.com/maps/search/?api=1&query=Ocean+Heights+Auto+%26+Tire%2C+1178+Ocean+Heights+Avenue%2C+Egg+Harbor+Township%2C+NJ+08234";

export const profileLinks = [
  { name: "Google", href: googleUrl, detail: "Reviews, hours, and directions" },
  {
    name: "CARFAX",
    href: carfaxUrl,
    detail: "5.0-star rating across hundreds of verified reviews",
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

export const sameAs = [carfaxUrl, yelpUrl, facebookUrl];

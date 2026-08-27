// Typed re-export of the shared shop config. Components import from here;
// the plain-Node build scripts import `./shop.mjs` directly. Both read the
// same file, so there is exactly one place to edit the shop's details.
export {
  shop,
  sameAs,
  autoRepairSchema,
  businessRef,
  breadcrumbSchema,
  faqSchema,
} from "./shop.mjs";

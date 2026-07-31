// Shared by the /contact-card.vcf route handler and the static-export build,
// so the downloadable card is identical on both hosts.
import { contactPhotoBase64 } from "./contact-photo.mjs";

export const contactCardFilename = "ocean-heights-auto-tire.vcf";

// Long vCard values must fold at 75 octets, continuation lines starting with
// a single space — some contacts apps refuse unfolded base64 photos.
function fold(line) {
  const chunks = [];
  for (let i = 0; i < line.length; i += 73) {
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + 73));
  }
  return chunks.join("\r\n");
}

// Profile URLs duplicated from lib/business.ts, which is TypeScript and out
// of reach for the plain-Node static build that also imports this file.
// Update both together.
export const contactCard = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:Ocean Heights Auto & Tire",
  "ORG:Ocean Heights Auto & Tire",
  "TEL;TYPE=WORK,VOICE:+16092411546",
  "ADR;TYPE=WORK:;;1178 Ocean Heights Avenue;Egg Harbor Township;NJ;08234;USA",
  fold(`PHOTO;ENCODING=b;TYPE=JPEG:${contactPhotoBase64}`),
  // Labelled URLs (Apple's item syntax) so each link shows a readable name
  // in Contacts instead of a bare address.
  "item1.URL:https://oceanheightsautorepair.com",
  "item1.X-ABLabel:Website",
  // Points at the prototype host for now; swap to the production domain's
  // /links when the site launches on oceanheightsautorepair.com.
  "item2.URL:https://ohat-website.vercel.app/links",
  "item2.X-ABLabel:All our links",
  "item3.URL:https://www.facebook.com/OceanHeightsAuto/",
  "item3.X-ABLabel:Facebook",
  "item4.URL:https://www.carfax.com/Reviews-Ocean-Heights-Auto-And-Tire-Egg-Harbor-Township-NJ_BLQLOZM001",
  "item4.X-ABLabel:CARFAX reviews",
  "item5.URL:https://www.yelp.com/biz/ocean-heights-auto-and-tire-egg-harbor-township-2",
  "item5.X-ABLabel:Yelp",
  "X-SOCIALPROFILE;TYPE=facebook:https://www.facebook.com/OceanHeightsAuto/",
  "NOTE:Family-run auto repair. Monday-Friday, 8:00 AM-5:00 PM.",
  "END:VCARD",
].join("\r\n");

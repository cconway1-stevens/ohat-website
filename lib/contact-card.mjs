// Shared by the /contact-card.vcf route handler and the static-export build,
// so the downloadable card is identical on both hosts.
export const contactCardFilename = "ocean-heights-auto-tire.vcf";

export const contactCard = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:Ocean Heights Auto & Tire",
  "ORG:Ocean Heights Auto & Tire",
  "TEL;TYPE=WORK,VOICE:+16092411546",
  "ADR;TYPE=WORK:;;1178 Ocean Heights Avenue;Egg Harbor Township;NJ;08234;USA",
  "URL:https://oceanheightsautorepair.com",
  "NOTE:Family-run auto repair. Monday-Friday, 8:00 AM-5:00 PM.",
  "END:VCARD",
].join("\r\n");

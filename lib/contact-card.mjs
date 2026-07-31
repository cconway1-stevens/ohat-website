// Shared by the /contact-card.vcf route handler and the static-export build,
// so the downloadable card is identical on both hosts. Every value comes from
// the single shop config — nothing here is hand-maintained.
import { contactPhotoBase64 } from "./contact-photo.mjs";
import { shop } from "./shop.mjs";

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

const { address, email, phone } = shop;

// Keep one canonical website entry in the card. Social and secondary links
// belong on the website rather than cluttering a customer's address book.
const websiteUrl = [
  `item1.URL:${shop.siteUrl}/`,
  "item1.X-ABLabel:Website",
];

export const contactCard = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  `FN:${shop.name}`,
  `ORG:${shop.name}`,
  `TEL;TYPE=WORK,VOICE:${phone.e164.replace(/-/g, "")}`,
  `EMAIL;TYPE=WORK,INTERNET:${email.service}`,
  `ADR;TYPE=WORK:;;${address.street};${address.city};${address.state};${address.zip};USA`,
  fold(`PHOTO;ENCODING=b;TYPE=JPEG:${contactPhotoBase64}`),
  ...websiteUrl,
  `NOTE:Family-run auto repair. ${shop.hours.display}.`,
  "END:VCARD",
].join("\r\n");

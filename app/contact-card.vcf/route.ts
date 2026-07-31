import { contactCard, contactCardFilename } from "@/lib/contact-card.mjs";

export async function GET() {
  return new Response(contactCard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${contactCardFilename}"`,
    },
  });
}

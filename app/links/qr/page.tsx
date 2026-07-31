import type { Metadata } from "next";
import Link from "next/link";
import { LinksQrPageBody } from "@/components/links-qr-page";

// A share tool, not a landing page — kept out of search and the sitemap.
export const metadata: Metadata = {
  title: "Share Our Links — QR Code",
  description:
    "A QR code for the Ocean Heights Auto & Tire link hub — scan it, print it, or share it.",
  alternates: { canonical: "/links/qr" },
  robots: { index: false, follow: true },
};

export default function LinksQrPage() {
  return (
    <main className="link-hub">
      <div className="link-hub-checker" aria-hidden="true" />
      <section className="link-hub-card" aria-labelledby="links-qr-title">
        <p className="link-hub-kicker">Pass it along</p>
        <h1 id="links-qr-title">Scan for every link.</h1>
        <p className="link-hub-intro">
          Point a phone camera here and it opens our link hub — calls,
          directions, drop-off, reviews, all of it. Print it for the counter or
          share it straight from this page.
        </p>
        <LinksQrPageBody />
        <Link className="link-hub-home" href="/links">← Back to the links</Link>
      </section>
    </main>
  );
}

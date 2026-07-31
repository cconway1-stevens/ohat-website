import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { DirectionsTrigger } from "@/components/directions-dialog";
import { CopyButton } from "@/components/copy-field";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { contactEmail, receiptsEmail } from "@/lib/business";
import { autoRepairSchema, shop } from "@/lib/shop";

// The wording is page-specific SEO copy and stays here, but the details
// inside it come from the config so a number or address change can't leave a
// stale value sitting in a meta description.
export const metadata: Metadata = {
  title: "Contact Us & Directions",
  description:
    `Call ${shop.phone.display}, email the shop, or get directions to ${shop.name} at ${shop.address.full}. Hours, map, parking and after-hours drop-off.`,
  alternates: { canonical: "/contact" },
};

const ways = [
  {
    number: "01",
    title: "Call the shop",
    detail: phoneDisplay,
    href: phoneHref,
    copy: "The fastest way to reach us. Tell us what the car is doing and we'll find a time.",
    action: { kind: "call" as const },
  },
  {
    number: "02",
    title: "Email us",
    detail: contactEmail,
    href: `mailto:${contactEmail}`,
    copy: "Good for questions, quotes, and anything you'd rather put in writing. We answer during shop hours.",
    action: { kind: "email" as const },
  },
  {
    number: "03",
    title: "Stop by",
    detail: shop.address.street,
    copy: `${shop.address.cityLine}. Customer parking is right out front.`,
    action: { kind: "directions" as const },
  },
];

export default function ContactPage() {
  // ContactPage tells search engines what this page is for; the business
  // block comes from the shared config so it can never disagree with the
  // details rendered on the page.
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${shop.name}`,
    url: `${shop.siteUrl}/contact`,
    mainEntity: autoRepairSchema(),
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
        />

        <section className="inner-hero contact-hero">
          <div className="shell contact-hero-grid">
            <div>
              <p className="eyebrow">Call the crew</p>
              <h1>Contact {shop.name}.</h1>
              <p>
                No perfect diagnosis needed—just tell us what you&apos;re hearing,
                seeing, or feeling behind the wheel. We&apos;ll talk it through
                and find a time that works.
              </p>
              <div className="contact-hero-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
                <a className="button button-ghost" href={`mailto:${contactEmail}`}>
                  Email the shop
                </a>
              </div>
            </div>
            <Image
              src="/media/building8-21-14.4.jpg"
              width={700}
              height={520}
              alt="Ocean Heights Auto and Tire shop exterior"
            />
          </div>
        </section>

        <section className="section contact-section">
          <div className="shell contact-grid">
            {ways.map((way) => (
              <article key={way.number}>
                <span>{way.number}</span>
                <h2>{way.title}</h2>
                {way.action.kind === "directions" ? (
                  <DirectionsTrigger className="contact-address-trigger">
                    {way.detail}
                  </DirectionsTrigger>
                ) : (
                  <a href={way.href}>{way.detail}</a>
                )}
                <p>{way.copy}</p>
                {way.action.kind === "email" ? (
                  <CopyButton value={contactEmail} label="email" />
                ) : null}
                {way.action.kind === "directions" ? (
                  <CopyButton value={shop.address.full} label="address" />
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section contact-facts">
          <div className="shell contact-facts-grid">
            <div className="contact-fact-card">
              <p className="eyebrow dark">Shop hours</p>
              <dl className="hours-list">
                <div>
                  <dt>Monday – Friday</dt>
                  <dd>{shop.hours.display.split(", ")[1]}</dd>
                </div>
                <div>
                  <dt>Saturday &amp; Sunday</dt>
                  <dd>Closed</dd>
                </div>
              </dl>
              <p>
                {shop.hours.closedNote} Dropping off outside those
                hours? The{" "}
                <Link href="/vehicle-drop-off">secure night drop</Link> runs
                around the clock.
              </p>
            </div>

            <div className="contact-fact-card">
              <p className="eyebrow dark">Good to know</p>
              <ul className="contact-checklist">
                <li>Customer parking right out front—no garage maze, no meters.</li>
                <li>A clean, comfortable waiting area if you stay with the car.</li>
                <li>We call with findings and pricing before any work is done.</li>
                <li>Gas, diesel, hybrid, EV and classic vehicles all welcome.</li>
              </ul>
            </div>

            {/* The POS address is outbound-only. Naming it here keeps
                receipts out of spam without inviting mail nobody reads. */}
            <div className="contact-fact-card contact-receipts">
              <p className="eyebrow dark">About your receipt</p>
              <h2>Digital receipts arrive from a different address.</h2>
              <p>
                Our point-of-sale system sends receipts from{" "}
                <strong>{receiptsEmail}</strong>. It&rsquo;s an automated
                outbound mailbox—nobody reads replies sent there—so add it to
                your contacts to keep receipts out of your spam folder.
              </p>
              <p className="contact-receipts-note">
                For anything you need answered, write to{" "}
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a> or call
                the shop.
              </p>
              <CopyButton value={receiptsEmail} label="receipt address" />
            </div>
          </div>
        </section>

        <section className="shop-map-section" aria-labelledby="shop-map-title">
          <div className="shell">
            <p className="eyebrow dark">Find the garage</p>
            <h2 id="shop-map-title">Look for the sign on Ocean Heights Avenue.</h2>
            <figure className="shop-map">
              <div className="shop-map-frame">
                <iframe
                  title={`Map showing ${shop.name} at ${shop.address.full}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.address.full)}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <figcaption>
                <span>Map · {shop.address.street}</span>
                <DirectionsTrigger className="shop-map-cta">
                  Open in your maps app <span aria-hidden="true">↗︎</span>
                </DirectionsTrigger>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="directions-band">
          <div className="shell">
            <div>
              <p className="eyebrow">Serving South Jersey drivers</p>
              <h2>Right here in Egg Harbor Township.</h2>
              <p>Mays Landing, Linwood, and nearby communities are welcome.</p>
            </div>
            <DirectionsTrigger className="button button-primary">
              Get directions
            </DirectionsTrigger>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

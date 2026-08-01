import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { DirectionsTrigger } from "@/components/directions-dialog";
import { CopyButton } from "@/components/copy-field";
import { RouteShield } from "@/components/route-shield";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { contactEmail, receiptsEmail } from "@/lib/business";
import { ShopHoursStatus } from "@/components/shop-hours-status";
import { autoRepairSchema, breadcrumbSchema, shop } from "@/lib/shop";

// The wording is page-specific SEO copy and stays here, but the details
// inside it come from the config so a number or address change can't leave a
// stale value sitting in a meta description.
export const metadata: Metadata = {
  title: "Contact Ocean Heights Auto & Tire in Egg Harbor Township, NJ",
  description: `Call ${shop.phone.display}, email the shop, or get directions to ${shop.name}, an auto repair and tire shop at ${shop.address.full}. See hours, parking and after-hours drop-off details.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact ${shop.name}`,
    description: `Call ${shop.phone.display}, email the shop, or get directions to our Egg Harbor Township auto repair and tire shop.`,
    url: "/contact",
    type: "website",
  },
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
  const breadcrumbs = breadcrumbSchema([["Contact", "/contact"]]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />

        <section className="inner-hero contact-hero">
          <div className="shell contact-hero-grid">
            <div>
              <p className="eyebrow">Egg Harbor Township auto repair</p>
              <h1>Contact {shop.name}</h1>
              <p>
                Call, email, or stop by the shop on Ocean Heights Avenue. Tell us what you&apos;re
                hearing, seeing, or feeling behind the wheel and we&apos;ll find the right next
                step.
              </p>
              <div className="contact-hero-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
                <a className="button button-ghost" href={`mailto:${contactEmail}`}>
                  Email the shop
                </a>
                <a className="button button-contact-card" href="/contact-card.vcf" download>
                  Add us to contacts
                </a>
              </div>
            </div>
            <Image
              src="/media/building8-21-14.4.jpg"
              width={750}
              height={520}
              alt="Ocean Heights Auto and Tire shop exterior"
            />
          </div>
        </section>

        <section className="section contact-section road-map">
          {/* Decorative only: the folded-map paper, the route running behind
              the cards, and the compass. All aria-hidden — none of it carries
              meaning a screen reader needs. */}
          <span className="road-map-compass" aria-hidden="true">
            <b>N</b>
          </span>
          <div className="shell contact-grid">
            {ways.map((way) => (
              <article key={way.number}>
                {/* A highway route shield standing in for the step number.
                    Decorative and sequential only — the heading right after
                    it is what actually says what the step is. */}
                <RouteShield number={way.number} />
                {way.action.kind === "directions" ? (
                  // The one card with a physical destination gets the map's
                  // own "you are headed here" pin, tying it to the same red
                  // dot in the legend below rather than inventing new iconography.
                  <span className="map-pin" aria-hidden="true" />
                ) : null}
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
          <div className="shell road-legend">
            <span className="road-legend-title">Map key</span>
            <span>
              <i className="key-swatch key-shop" aria-hidden="true" />
              You are headed here
            </span>
            <span>
              <i className="key-swatch key-route" aria-hidden="true" />
              Ocean Heights Ave
            </span>
            <span>
              <i className="key-swatch key-hours" aria-hidden="true" />
              Open Mon&ndash;Fri, 8&ndash;5
            </span>
            <span className="road-legend-scale" aria-hidden="true">
              0<em />
              <em />
              <em />5 mi
            </span>
          </div>
        </section>

        <section className="section contact-facts road-map road-map-sheet">
          <div className="shell contact-dashboard">
            <div className="contact-dashboard-copy">
              <p className="eyebrow dark">Before you come by</p>
              <h2>Hours, parking, drop-off, and receipts in one place.</h2>

              <div className="contact-facts-grid">
                <div className="contact-fact-card map-inset" data-stop="A">
                  <p className="eyebrow dark">Shop hours</p>
                  <dl className="hours-list">
                    <div>
                      <dt>{shop.hours.weekdayLabel}</dt>
                      <dd>{shop.hours.display.split(", ")[1]}</dd>
                    </div>
                    <div>
                      <dt>{shop.hours.weekendLabel}</dt>
                      <dd>{shop.hours.weekendValue}</dd>
                    </div>
                  </dl>
                  <ShopHoursStatus />
                  <p>
                    {shop.hours.closedNote} The{" "}
                    <Link href="/vehicle-drop-off">secure night drop</Link> runs around the clock.
                  </p>
                </div>

                <div className="contact-fact-card map-inset" data-stop="B">
                  <p className="eyebrow dark">Good to know</p>
                  <ul className="contact-checklist">
                    <li>Customer parking is right out front.</li>
                    <li>Comfortable waiting area if you stay.</li>
                    <li>We call with findings before work begins.</li>
                    <li>Gas, diesel, hybrid, EV and classic vehicles welcome.</li>
                  </ul>
                </div>

                {/* The POS address is outbound-only. Naming it here keeps
                    receipts out of spam without inviting mail nobody reads. */}
                <div className="contact-fact-card contact-receipts map-inset" data-stop="C">
                  <p className="eyebrow dark">Receipts</p>
                  <h3>Digital receipts come from {receiptsEmail}.</h3>
                  <p>
                    That mailbox is automated. For replies, write to{" "}
                    <a href={`mailto:${contactEmail}`}>{contactEmail}</a> or call the shop.
                  </p>
                  <CopyButton value={receiptsEmail} label="receipt address" />
                </div>
              </div>
            </div>

            <aside className="contact-map-panel" aria-labelledby="shop-map-title">
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
            </aside>
          </div>
        </section>

        <section className="directions-band">
          <div className="shell">
            <div>
              <p className="eyebrow">Serving {shop.region} drivers</p>
              <h2>Right here in Egg Harbor Township.</h2>
              <p>
                On Ocean Heights Avenue in {shop.nickname}, minutes from{" "}
                {shop.areaServed.slice(1).join(", ")} and the rest of {shop.county}.
              </p>
            </div>
            <DirectionsTrigger className="button button-primary">Get directions</DirectionsTrigger>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

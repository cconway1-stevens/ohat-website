import type { Metadata } from "next";
import Link from "next/link";
import { TirePal } from "@/components/contact/tire-pal";
import { SiteFooter } from "@/components/layout/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/layout/site-header";
import { ShopHoursStatus } from "@/components/shop/shop-hours-status";
import { EmailCopyAction } from "@/components/ui/copy-field";
import { DirectionsTrigger } from "@/components/ui/directions-dialog";
import { contactEmail } from "@/lib/shop/business";
import { autoRepairSchema, breadcrumbSchema, shop } from "@/lib/shop/shop";

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

export default function ContactPage() {
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

        <section className="contact-route" aria-labelledby="contact-title">
          <div className="shell contact-route-grid">
            <div className="contact-route-panel">
              <div className="contact-route-details">
                <header className="contact-route-intro">
                  <p className="contact-route-marker">Your next stop</p>
                  <h1 id="contact-title">Contact the garage</h1>
                  <p>
                    Tell us what the car is doing. We&apos;ll help you choose the right next step.
                  </p>
                </header>

                <div className="contact-primary-actions" aria-label="Primary contact actions">
                  <a className="contact-action contact-action-call" href={phoneHref}>
                    <span>Call the shop</span>
                    <strong>{phoneDisplay}</strong>
                  </a>
                  <DirectionsTrigger className="contact-action contact-action-directions">
                    <span>Plan your route</span>
                    <strong>Get directions</strong>
                  </DirectionsTrigger>
                  <EmailCopyAction
                    email={contactEmail}
                    className="contact-action contact-action-email"
                  />
                  <a
                    className="contact-action contact-action-vcard"
                    href="/contact-card.vcf"
                    download
                  >
                    <svg
                      className="contact-action-icon"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="6" y="2.5" width="12" height="20" rx="2.5" />
                      <line x1="10" y1="5.5" x2="14" y2="5.5" />
                      <line x1="12" y1="1" x2="12" y2="12.5" />
                      <polyline points="9.5,10 12,12.5 14.5,10" />
                    </svg>
                    <span>Save to phone</span>
                    <strong>Add contact</strong>
                  </a>
                  <div className="contact-primary-status">
                    <ShopHoursStatus />
                  </div>
                </div>

                <div className="contact-stop-card">
                  <div className="contact-hours-block">
                    <dl className="contact-hours-list">
                      <div>
                        <dt>{shop.hours.weekdayLabel}</dt>
                        <dd>{shop.hours.display.split(", ")[1]}</dd>
                      </div>
                      <div>
                        <dt>{shop.hours.weekendLabel}</dt>
                        <dd>{shop.hours.weekendValue}</dd>
                      </div>
                    </dl>
                    <p className="contact-hours-note">
                      Holiday hours can vary. The{" "}
                      <Link href="/vehicle-drop-off">secure night drop</Link> is available around
                      the clock.
                    </p>
                  </div>
                  <div className="contact-address-line">
                    <address>
                      <span>Ocean Heights Auto &amp; Tire</span>
                      <strong>{shop.address.street}</strong>
                      <span>{shop.address.cityLine}</span>
                    </address>
                  </div>
                </div>
              </div>

              <section className="contact-arrival" aria-labelledby="arrival-title">
                <p className="contact-section-label">Arrival notes</p>
                <h2 id="arrival-title">Easy in. Easy out.</h2>
                <ul className="contact-checklist">
                  <li>Customer parking is right out front.</li>
                  <li>Comfortable waiting area if you stay.</li>
                  <li>We call with findings before work begins.</li>
                  <li>Gas, diesel, hybrid, EV and classics welcome.</li>
                </ul>
              </section>
            </div>

            <aside className="contact-map-panel" aria-labelledby="shop-map-title">
              <h2 className="sr-only" id="shop-map-title">
                Map and directions to {shop.name}
              </h2>
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
                  <span>
                    <small>Destination</small>
                    <strong>{shop.address.street}</strong>
                  </span>
                  <DirectionsTrigger className="shop-map-cta">
                    Open directions <span aria-hidden="true">&#8599;</span>
                  </DirectionsTrigger>
                </figcaption>
              </figure>
              <p className="contact-map-region">
                In {shop.nickname}, minutes from {shop.areaServed.slice(1).join(", ")} and the rest
                of {shop.county}.
              </p>
            </aside>
          </div>
        </section>
      </main>
      <TirePal />
      <SiteFooter />
    </>
  );
}

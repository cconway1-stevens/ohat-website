import type { Metadata } from "next";
import Link from "next/link";
import { ChatWidget } from "@/components/contact/chat-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/layout/site-header";
import { HoursCardNotice } from "@/components/shop/hours-card-notice";
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call the shop</span>
                    <strong>{phoneDisplay}</strong>
                  </a>
                  <DirectionsTrigger className="contact-action contact-action-directions">
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
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>Plan your route</span>
                    <strong>Get directions</strong>
                  </DirectionsTrigger>
                  {/* TRYING: full hours card moved onto the map as a corner
                      badge (see contact-map-panel below) — commented out
                      here instead of deleted so it's a one-line swap back
                      if the badge doesn't earn its keep. */}
                  {/* <div className="contact-hours-card">
                    <p className="contact-hours-title">Shop hours</p>
                    <ShopHoursStatus />
                    <dl className="contact-hours-list">
                      <div>
                        <dt>{shop.hours.weekdayLabel}</dt>
                        <dd>{shop.hours.weekdayHours}</dd>
                      </div>
                      <div>
                        <dt>{shop.hours.fridayLabel}</dt>
                        <dd>{shop.hours.fridayHours}</dd>
                      </div>
                      <div>
                        <dt>{shop.hours.weekendLabel}</dt>
                        <dd>{shop.hours.weekendValue}</dd>
                      </div>
                    </dl>
                    <HoursCardNotice />
                    <p className="contact-hours-note">
                      <Link href="/vehicle-drop-off">Secure night drop</Link> available 24/7.
                    </p>
                  </div> */}
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
                  {/* The hours card (commented out above) now lives here:
                      status sign + any active holiday notice, floated in
                      the map's corner. */}
                  <div className="shop-map-hours-badge">
                    <ShopHoursStatus hideMore />
                    <HoursCardNotice />
                  </div>
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
      <ChatWidget />
      <SiteFooter />
    </>
  );
}

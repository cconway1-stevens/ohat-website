import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { DirectionsTrigger } from "@/components/directions-dialog";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Contact & Directions",
  description:
    "Call Ocean Heights Auto & Tire at (609) 241-1546 or get directions to 1178 Ocean Heights Avenue in Egg Harbor Township, NJ.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="inner-hero contact-hero">
          <div className="shell contact-hero-grid">
            <div>
              <p className="eyebrow">Call the crew</p>
              <h1>Tell us what the car&apos;s doing.</h1>
              <p>
                No perfect diagnosis needed—just tell us what you&apos;re hearing,
                seeing, or feeling behind the wheel. We&apos;ll talk it through
                and find a time that works.
              </p>
              <a className="button button-primary" href={phoneHref}>
                Call {phoneDisplay}
              </a>
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
            <article>
              <span>01</span>
              <h2>Call the shop</h2>
              <a href={phoneHref}>{phoneDisplay}</a>
              <p>Call to book service or talk through a vehicle concern.</p>
            </article>
            <article>
              <span>02</span>
              <h2>Visit us</h2>
              <DirectionsTrigger className="contact-address-trigger">
                1178 Ocean Heights Avenue<br />
                Egg Harbor Township, NJ 08234
              </DirectionsTrigger>
              <p>Monday–Friday, 8:00 AM–5:00 PM.</p>
            </article>
            <article>
              <span>03</span>
              <h2>Drop off after hours</h2>
              <Link href="/vehicle-drop-off">See the secure drop-off guide →</Link>
              <p>Use the key box by the side door for scheduled service.</p>
            </article>
          </div>
        </section>

        <section className="dropoff-checklist">
          <div className="shell checklist-grid">
            <div>
              <p className="eyebrow">Good to know before you visit</p>
              <h2>What to expect at the shop.</h2>
            </div>
            <ul>
              <li>Customer parking is right out front—no garage maze, no meters.</li>
              <li>A clean, comfortable waiting area if you stay with the car.</li>
              <li>
                Running late or after hours? The secure key drop by the side
                door works around the clock for scheduled service.
              </li>
              <li>
                No repairs happen without your say-so—we call with findings and
                pricing before any work is done.
              </li>
            </ul>
          </div>
        </section>

        <section className="shop-map-section" aria-labelledby="shop-map-title">
          <div className="shell">
            <p className="eyebrow dark">Find the garage</p>
            <h2 id="shop-map-title">Look for the sign on Ocean Heights Avenue.</h2>
            <figure className="shop-map">
              <div className="shop-map-frame">
                <iframe
                  title="Map showing Ocean Heights Auto & Tire at 1178 Ocean Heights Avenue, Egg Harbor Township, New Jersey"
                  src="https://maps.google.com/maps?q=1178%20Ocean%20Heights%20Avenue%2C%20Egg%20Harbor%20Township%2C%20NJ%2008234&z=15&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <figcaption>
                <span>Map · 1178 Ocean Heights Avenue</span>
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

import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { phoneHref, SiteHeader } from "@/components/site-header";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Auto Repair Services in Egg Harbor Township, NJ",
  description:
    "Explore complete auto repair, tires, diagnostics, brakes, maintenance, hybrid, EV, diesel and electrical service from Ocean Heights Auto & Tire.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="services-board">
          <div className="shell services-board-grid">
            <div>
              <p className="board-label">The service board</p>
              <h1>Every system.<br /><span>One trusted pit crew.</span></h1>
            </div>
            <div className="bay-counter" aria-label={`${services.length} service categories`}>
              <strong>{services.length}</strong>
              <span>service bays<br />under one roof</span>
            </div>
            <p className="board-copy">
              Gas, diesel, hybrid, EV, old favorite, or brand-new daily driver:
              choose what your vehicle needs, then call us to reserve a time.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="shell service-directory">
            {services.map((service, index) => (
              <article key={service.slug}>
                <span className="catalog-card-number" aria-hidden="true">
                  Bay {String(index + 1).padStart(2, "0")}
                </span>
                <span className="catalog-card-tag">Call for quote</span>
                <h2>{service.name}</h2>
                <p>{service.short}</p>
                <Link href={`/services/${service.slug}`}>Open catalog page →</Link>
              </article>
            ))}
          </div>
        </section>
        <section className="inner-cta">
          <div className="shell">
            <div>
              <p className="eyebrow">Not sure what you need?</p>
              <h2>Tell us what the vehicle is doing.</h2>
            </div>
            <a className="button button-primary" href={phoneHref}>Call the shop</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

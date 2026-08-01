import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { phoneHref, SiteHeader } from "@/components/site-header";
import { services } from "@/lib/services";
import { ServiceIcon } from "@/components/service-icon";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, businessRef, shop } from "@/lib/shop";

export const metadata = pageMetadata({
  title: "Auto Repair Services in Egg Harbor Township, NJ",
  description:
    "Explore complete auto repair, tires, diagnostics, brakes, maintenance, hybrid, EV, diesel and electrical service from Ocean Heights Auto & Tire.",
  path: "/services",
  ogTitle: "Auto Repair Services in Egg Harbor Township, NJ",
});

export default function ServicesPage() {
  // An ItemList of the catalogue gives Google the shape of the section: one
  // hub page linking sixteen distinct services, each at its own URL.
  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Auto repair services at ${shop.name}`,
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: service.name,
      url: `${shop.siteUrl}/services/${service.slug}`,
    })),
  };
  // Attached to the business node by @id rather than restating it: this is
  // the same shop, described here with the catalogue it offers.
  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    ...businessRef,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Auto repair and tire services",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.short,
          url: `${shop.siteUrl}/services/${service.slug}`,
        },
      })),
    },
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema([["Services", "/services"]])),
          }}
        />
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
              We look after drivers across {shop.nickname} and {shop.county}.
            </p>
          </div>
        </section>
        <section className="section">
          <div className="shell service-directory-frame">
            <div className="service-directory-heading" aria-hidden="true">
              <span>Service catalog</span>
              <span>Bays 01—{String(services.length).padStart(2, "0")}</span>
            </div>
            <div className="service-directory">
              {services.map((service, index) => {
                const followsCurve = index % 4 === 1 || index % 4 === 2;

                return (
                  <article
                    className={followsCurve ? "service-card-reverse" : undefined}
                    key={service.slug}
                  >
                    <span className="catalog-card-number" aria-hidden="true">
                      Bay {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="catalog-card-tag">Call for quote</span>
                    <ServiceIcon slug={service.slug} />
                    <h2>{service.name}</h2>
                    <p>{service.short}</p>
                    <Link href={`/services/${service.slug}`}>Open catalog page →</Link>
                  </article>
                );
              })}
            </div>
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

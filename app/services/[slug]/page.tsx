import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { DirectionsTrigger } from "@/components/directions-dialog";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { serviceBySlug, services } from "@/lib/services";
import { autoRepairSchema, shop } from "@/lib/shop";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return {};
  return {
    title: service.metaTitle ?? `${service.name} in Egg Harbor Township, NJ`,
    description:
      service.metaDescription ??
      `${service.short} Schedule ${service.name.toLowerCase()} with Ocean Heights Auto & Tire in Egg Harbor Township, NJ.`,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.intro,
    areaServed: {
      "@type": "City",
      name: shop.address.city,
    },
    provider: autoRepairSchema(),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${shop.siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: `${shop.siteUrl}/services`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.name,
        item: `${shop.siteUrl}/services/${service.slug}`,
      },
    ],
  };
  const serviceNumber = String(
    services.findIndex((item) => item.slug === service.slug) + 1,
  ).padStart(2, "0");
  const relatedServices = service.related
    .map((relatedSlug) => serviceBySlug(relatedSlug))
    .filter((related) => related !== undefined);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <section className={`repair-ticket repair-ticket-${Number(serviceNumber) % 4}`}>
          <div className="shell repair-ticket-grid">
            <div className="ticket-number" aria-hidden="true">
              <span>Bay</span>
              <strong>{serviceNumber}</strong>
            </div>
            <div className="ticket-copy">
              <Link className="back-link" href="/services">← Service board</Link>
              <p className="ticket-status">Now writing repair orders</p>
              <h1>
                {service.name}{" "}<span className="ticket-locale">in {shop.address.city}, {shop.address.state}</span>
              </h1>
              <p>{service.intro}</p>
              <div className="ticket-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
                <DirectionsTrigger className="button button-ghost">
                  Get directions <span aria-hidden="true">↗︎</span>
                </DirectionsTrigger>
              </div>
            </div>
            <div className="part-stamp" aria-hidden="true">
              <i /><i /><i /><i /><i /><i />
              <span>OHAT</span>
            </div>
          </div>
        </section>
        <section className="section service-detail">
          <div className="shell detail-grid">
            <div>
              <p className="eyebrow dark">When to call us</p>
              <h2>Signs your vehicle needs attention</h2>
              <ul>
                {service.signs.map((sign) => <li key={sign}>{sign}</li>)}
              </ul>
            </div>
            <div className="includes-card">
              <p className="eyebrow dark">What we handle</p>
              <h2>Complete, evidence-led service</h2>
              <ul>
                {service.includes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>
        <section className="section service-detail service-depth">
          <div className="shell detail-grid">
            <div>
              <p className="eyebrow dark">How the work starts</p>
              <h2>How we inspect and diagnose</h2>
              <p>{service.diagnosis}</p>
            </div>
            <div className="includes-card">
              <p className="eyebrow dark">The family-shop difference</p>
              <h2>Why Egg Harbor Township drivers choose us</h2>
              <p>{service.whyUs}</p>
            </div>
          </div>
        </section>
        <section className="section service-detail">
          <div className="shell">
            <p className="eyebrow dark">Straight talk on pricing</p>
            <h2>What affects the cost</h2>
            <p className="service-cost-copy">{service.cost}</p>
          </div>
        </section>
        {service.resources ? (
          <section className="section service-detail">
            <div className="shell">
              <p className="eyebrow dark">Official resources</p>
              <h2>Check for yourself, free</h2>
              <ul className="service-resource-list">
                {service.resources.map((resource) => (
                  <li key={resource.href}>
                    <a href={resource.href} target="_blank" rel="noreferrer">
                      {resource.label} ↗︎
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <p>{resource.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        <section className="section review-themes">
          <div className="shell">
            <p className="eyebrow dark">From the service counter</p>
            <h2>{service.name} questions we hear most</h2>
            <div className="theme-grid">
              {service.faqs.map((faq, index) => (
                <article key={faq.question}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        {relatedServices.length > 0 ? (
          <section className="section service-detail">
            <div className="shell">
              <p className="eyebrow dark">Related services</p>
              <h2>Often serviced together</h2>
              <ul className="service-related-list">
                {relatedServices.map((related) => (
                  <li key={related.slug}>
                    <Link href={`/services/${related.slug}`}>
                      {related.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        <section className="inner-cta">
          <div className="shell">
            <div>
              <p className="eyebrow">Classic care. Modern capability.</p>
              <h2>Let’s get you safely back on the road.</h2>
            </div>
            <a className="button button-primary" href={phoneHref}>Schedule by phone</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

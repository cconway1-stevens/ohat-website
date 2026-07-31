import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { serviceBySlug, services } from "@/lib/services";

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
    title: `${service.name} in Egg Harbor Township, NJ`,
    description: `${service.short} Schedule ${service.name.toLowerCase()} with Ocean Heights Auto & Tire in Egg Harbor Township, NJ.`,
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
      name: "Egg Harbor Township",
    },
    provider: {
      "@type": "AutoRepair",
      name: "Ocean Heights Auto & Tire",
      telephone: "+1-609-241-1546",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1178 Ocean Heights Avenue",
        addressLocality: "Egg Harbor Township",
        addressRegion: "NJ",
        postalCode: "08234",
      },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://oceanheightsautorepair.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: "https://oceanheightsautorepair.com/services",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.name,
        item: `https://oceanheightsautorepair.com/services/${service.slug}`,
      },
    ],
  };
  const serviceNumber = String(
    services.findIndex((item) => item.slug === service.slug) + 1,
  ).padStart(2, "0");

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader inner />
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
              <h1>{service.name}</h1>
              <p>{service.intro}</p>
              <a className="button button-primary" href={phoneHref}>
                Call {phoneDisplay}
              </a>
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

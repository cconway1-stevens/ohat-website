import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/layout/site-header";
import { DirectionsTrigger } from "@/components/ui/directions-dialog";
import { pageMetadata } from "@/lib/seo";
import { serviceBySlug, services } from "@/lib/services";
import { autoRepairSchema, breadcrumbSchema, businessRef, faqSchema, shop } from "@/lib/shop/shop";

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
  return pageMetadata({
    title: service.metaTitle ?? `${service.name} in Egg Harbor Township, NJ`,
    description:
      service.metaDescription ??
      `${service.short} Schedule ${service.name.toLowerCase()} with Ocean Heights Auto & Tire in Egg Harbor Township, NJ.`,
    path: `/services/${service.slug}`,
    ogTitle: `${service.name} | ${shop.name}`,
    absoluteTitle: true,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();
  const url = `${shop.siteUrl}/services/${service.slug}`;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.name,
    description: service.intro,
    url,
    serviceType: service.name,
    areaServed: shop.areaServed.map((name) => ({ "@type": "City", name })),
    // A reference rather than a second copy of the business: the full node
    // ships on the homepage, and repeating it here would ask Google to
    // reconcile sixteen near-identical AutoRepair entities.
    provider: businessRef,
  };
  const breadcrumbs = breadcrumbSchema([
    ["Services", "/services"],
    [service.name, `/services/${service.slug}`],
  ]);
  // Keep structured FAQs aligned with the visible, expandable answers.
  const faqs = faqSchema(service.faqs, { url });

  const relatedServices = service.related
    .map((relatedSlug) => serviceBySlug(relatedSlug))
    .filter((related) => related !== undefined);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(autoRepairSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }}
        />
        <section className="inner-hero privacy-hero service-detail-hero">
          <div className="shell privacy-hero-grid">
            <div className="privacy-hero-copy">
              <nav className="service-breadcrumbs" aria-label="Breadcrumb">
                <ol>
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  <li>
                    <Link href="/services">Services</Link>
                  </li>
                  <li aria-current="page">{service.name}</li>
                </ol>
              </nav>
              <h1>
                {service.name}
                <span className="service-detail-location">
                  in {shop.address.city}, {shop.address.state}
                </span>
              </h1>
              <p>{service.short}</p>
              <div className="privacy-hero-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call about this service
                </a>
                <a className="button button-ghost" href="#service-includes">
                  See what we handle
                </a>
              </div>
            </div>
            <aside className="service-detail-summary" aria-label="Service at a glance">
              <h2>Plan your visit</h2>
              <dl>
                <div>
                  <dt>Service</dt>
                  <dd>{service.name}</dd>
                </div>
                <div>
                  <dt>Have ready</dt>
                  <dd>Your year, make, model, and what needs attention</dd>
                </div>
                <div>
                  <dt>Pricing</dt>
                  <dd>Based on your vehicle and the work needed</dd>
                </div>
              </dl>
              <p>Not sure what you need? Tell us what your vehicle is doing when you call.</p>
            </aside>
          </div>
        </section>
        <section className="section service-detail-section">
          <div className="shell service-detail-layout">
            <aside className="service-detail-nav">
              <nav aria-label="Service page sections">
                <p>On this page</p>
                <a href="#service-overview">Overview</a>
                <a href="#service-signs">When to call</a>
                <a href="#service-includes">What we handle</a>
                <a href="#service-process">What to expect</a>
                <a href="#service-cost">Pricing</a>
                <a href="#service-questions">Common questions</a>
                {service.resources?.length ? (
                  <a href="#service-resources">Official resources</a>
                ) : null}
              </nav>
              <DirectionsTrigger className="service-detail-directions">
                Get directions to the shop
              </DirectionsTrigger>
            </aside>
            <div className="service-detail-content">
              <section id="service-overview">
                <p className="eyebrow dark">About this service</p>
                <h2>Care that starts with understanding your vehicle</h2>
                <p>{service.intro}</p>
              </section>
              <section id="service-signs">
                <h2>When to contact us</h2>
                <ul className="service-detail-list">
                  {service.signs.map((sign) => (
                    <li key={sign}>{sign}</li>
                  ))}
                </ul>
              </section>
              <section id="service-includes">
                <h2>What we handle</h2>
                <ul className="service-detail-list">
                  {service.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section id="service-process">
                <h2>What to expect</h2>
                <ol className="service-detail-steps">
                  <li>
                    <h3>Talk with the shop</h3>
                    <p>
                      Describe the work you need or the symptoms you have noticed. Call to confirm
                      availability and discuss bringing your vehicle in.
                    </p>
                  </li>
                  <li>
                    <h3>Inspect and understand</h3>
                    <p>{service.diagnosis}</p>
                  </li>
                  <li>
                    <h3>Discuss the next step</h3>
                    <p>
                      Ask the team to explain the findings, recommended work, and estimate before
                      you approve repairs.
                    </p>
                  </li>
                </ol>
                <h3>Our approach</h3>
                <p>{service.whyUs}</p>
              </section>
              <section id="service-cost" className="service-detail-cost">
                <h2>What affects the cost</h2>
                <p>{service.cost}</p>
                <p>
                  For a quote, call <a href={phoneHref}>{phoneDisplay}</a> with your vehicle details
                  and the service you need.
                </p>
              </section>
              <section id="service-questions">
                <h2>Common questions</h2>
                <div className="service-detail-faqs">
                  {service.faqs.map((faq) => (
                    <details key={faq.question}>
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
              {service.resources?.length ? (
                <section id="service-resources">
                  <h2>Official resources</h2>
                  <ul className="service-detail-resources">
                    {service.resources.map((resource) => (
                      <li key={resource.href}>
                        <a href={resource.href} target="_blank" rel="noreferrer">
                          {resource.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                        <p>{resource.note}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {relatedServices.length ? (
                <section aria-labelledby="related-heading">
                  <h2 id="related-heading">Related services</h2>
                  <div className="service-detail-related">
                    {relatedServices.map((related) => (
                      <Link key={related.slug} href={`/services/${related.slug}`}>
                        {related.name}
                        <span aria-hidden="true"> →</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </section>
        <section className="inner-cta">
          <div className="shell">
            <div>
              <p className="eyebrow">Classic care. Modern capability.</p>
              <h2>Let’s get you safely back on the road.</h2>
            </div>
            <a className="button button-primary" href={phoneHref}>
              Schedule by phone
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

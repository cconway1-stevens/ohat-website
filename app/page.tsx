import { SiteFooter } from "@/components/site-footer";
import Image from "next/image";
import Link from "next/link";
import {
  phoneDisplay,
  phoneHref,
  SiteHeader,
} from "@/components/site-header";
import { DirectionsTrigger } from "@/components/directions-dialog";
import { services } from "@/lib/services";
import { MakeGrid } from "@/components/make-grid";
import { brandSrc, heroMakes } from "@/lib/makes";

import { carfaxUrl } from "@/lib/business";
import { autoRepairSchema, shop } from "@/lib/shop";
import { ShopHoursStatus } from "@/components/shop-hours-status";

export default function Home() {
  // One @graph rather than several stand-alone blocks, so the WebSite, the
  // homepage and the business are linked nodes instead of three unrelated
  // things Google has to guess a relationship between. The business node is
  // the canonical copy; every other page references it by @id.
  const homeSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${shop.siteUrl}/#website`,
        url: `${shop.siteUrl}/`,
        name: shop.name,
        inLanguage: "en-US",
        publisher: { "@id": `${shop.siteUrl}/#business` },
      },
      {
        "@type": "WebPage",
        "@id": `${shop.siteUrl}/#webpage`,
        url: `${shop.siteUrl}/`,
        name: "Auto Repair & Tire Shop in Egg Harbor Township, NJ",
        isPartOf: { "@id": `${shop.siteUrl}/#website` },
        about: { "@id": `${shop.siteUrl}/#business` },
        primaryImageOfPage: `${shop.siteUrl}/media/ocean-heights-cover.jpg`,
      },
      autoRepairSchema({
        image: `${shop.siteUrl}/media/cecf1b30-365d-430d-b925-1fd22429c9e1.png`,
        slogan: shop.tagline,
        // The full catalogue lives on /services as an OfferCatalog attached
        // to this same @id; listing it twice would only add noise.
        knowsAbout: services.map((service) => service.name),
      }),
    ],
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
        />
        <section className="catalog-cover-hero" id="top">
          <div className="cover-shell">
            <article className="cover-sheet">
              <p className="cover-topline" aria-label="Catalog edition">
                <span>Egg Harbor Township, N.J.</span>
                <span className="cover-topline-title">
                  Service &amp; repair annual
                </span>
                <span>Issue No. 1178</span>
              </p>

              <h1>
                Auto Repair &amp; Tire Shop
                <em>in Egg Harbor Township, NJ</em>
              </h1>
              <p className="cover-tagline">Car care, done right. No detours.</p>
              <p className="cover-lede">
                Dealer-level diagnostics. Family-garage honesty. From
                carbureted classics to brand-new EVs, every car in your
                driveway is welcome here — and every driver in EHT, Atlantic
                County, and the shore towns around us.
              </p>

              <div className="cover-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
                <DirectionsTrigger className="button button-ghost">
                  Get directions <span aria-hidden="true">↗︎</span>
                </DirectionsTrigger>
              </div>

              <ul
                className="cover-index"
                aria-label="Why drivers choose Ocean Heights"
              >
                <li>
                  <span>No. 01</span>
                  <strong>Dealer-level tools</strong>
                  <small>We don&rsquo;t guess. We test.</small>
                </li>
                <li>
                  <span>No. 02</span>
                  <strong>Your whole driveway</strong>
                  <small>Gas, diesel, hybrid, EV &amp; classics</small>
                </li>
                <li>
                  <span>No. 03</span>
                  <strong>Neighbor-level care</strong>
                  <small>Family owned &amp; operated</small>
                </li>
              </ul>

              <figure className="cover-plate">
                <div className="cover-plate-image">
                  <Image
                    src="/media/cecf1b30-365d-430d-b925-1fd22429c9e1.png"
                    alt="Ocean Heights Auto and Tire with an electric car, classic car, and work truck outside the Egg Harbor Township shop"
                    fill
                    priority
                    sizes="(max-width: 1220px) 100vw, 1180px"
                  />
                </div>
                <span className="cover-stamp" aria-hidden="true">
                  <strong>All makes</strong>
                  <em>All eras</em>
                </span>
                <figcaption>
                  <span>Fig. 1 — Classics, dailies &amp; EVs, one driveway</span>
                </figcaption>
              </figure>
            </article>
          </div>
        </section>

        <section
            className="garage-credentials"
            aria-labelledby="garage-credentials-title"
          >
            <div className="garage-locator">
              <DirectionsTrigger
                className="garage-locator-address"
                label={`Choose a directions app for ${shop.address.street}`}
              >
                <span>Find us down the Shore</span>
                <strong>{shop.address.street}</strong>
                <em>{shop.address.region}</em>
              </DirectionsTrigger>
              <DirectionsTrigger className="garage-locator-trigger">
                Get directions <span aria-hidden="true">↗︎</span>
              </DirectionsTrigger>
            </div>

            <div className="garage-credentials-grid">
              <div className="garage-service-promise">
                <p className="garage-issue-line">
                  Service counter · all makes desk
                </p>
                <h2 id="garage-credentials-title">
                  Every car in the driveway. One family garage.
                </h2>
                <p>
                  New commuter, old favorite, work truck, or weekend classic—we
                  have the tools and experience to keep it moving.
                </p>
                <ul aria-label="Vehicle types serviced">
                  {["Gas", "Diesel", "Hybrid", "Electric", "Classic"].map((type) => (
                    <li key={type}>{type}</li>
                  ))}
                </ul>
              </div>

              <div
                className="garage-proof-tickets"
                aria-label="Shop credentials"
              >
                <div className="garage-proof-ticket garage-proof-ase">
                  <Image
                    src="/media/ase-certified.webp"
                    alt="ASE"
                    width={70}
                    height={52}
                    unoptimized
                  />
                  <span>
                    <strong>ASE Certified</strong>
                    <small>Technicians</small>
                  </span>
                </div>
                <div className="garage-proof-ticket garage-proof-family">
                  <span className="garage-ticket-number">40+</span>
                  <span>
                    <strong>Family Run</strong>
                    <small>Local &amp; proud</small>
                  </span>
                </div>
                <a
                  className="garage-proof-ticket garage-proof-carfax"
                  href={carfaxUrl}
                >
                  <span className="garage-carfax-seal" aria-hidden="true">
                    <small>CARFAX</small>
                    <b>★★★★★</b>
                  </span>
                  <span>
                    <strong>2025 Top-Rated</strong>
                    <small>CARFAX Service Center</small>
                  </span>
                </a>
              </div>
            </div>

            <div className="garage-makes-deck">
              <div className="garage-makes-label">
                <strong>All makes</strong>
                <span>All eras</span>
              </div>
              <div className="catalog-make-marquee">
              <span className="sr-only">
                We service Toyota, Ford, Honda, Chevrolet, Jeep, Subaru,
                Volkswagen, BMW, Audi, Tesla, Volvo, Porsche, and more.
              </span>
              <div className="catalog-make-track" aria-hidden="true">
                {[...heroMakes, ...heroMakes].map((name, index) => (
                  <span className="catalog-make-logo" key={`${name}-${index}`}>
                    <Image src={brandSrc(name)} width={40} height={40} alt="" />
                    <strong>{name}</strong>
                  </span>
                ))}
              </div>
              </div>
            </div>
            <div className="garage-credentials-checker" aria-hidden="true" />
        </section>

        <section className="section services-intro" id="services">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow dark">Complete auto care</p>
                <h2>One trusted shop. Every mile covered.</h2>
              </div>
              <p>
                From routine maintenance to difficult diagnostics, our family
                takes the time to find the real problem, explain your options,
                and fix it right. And if a recall notice shows up in the mail,
                we&rsquo;ll help you check it against the official NHTSA lookup
                and explain exactly what to do next.
              </p>
            </div>
            <div className="service-preview">
              {[
                ["Diagnostics", "Check-engine lights & complex electrical", "/services/advanced-diagnostics"],
                ["Brakes & tires", "Safer stops, smoother rides, and longer tread life", "/services/tires"],
                ["Maintenance", "Oil, fluids, filters & factory schedules", "/services/oil-maintenance"],
              ].map(([title, copy, href], index) => (
                <article key={title}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <Link href={href}>Explore this service →</Link>
                </article>
              ))}
            </div>
            <Link className="text-link" href="/services">
              See all {services.length} service categories →
            </Link>
          </div>
        </section>

        <section className="technology-section" id="technology">
          <div className="shell technology-grid">
            <div className="technology-copy">
              <p className="eyebrow">Dealer-level technology</p>
              <h2>We don’t guess. We test.</h2>
              <p>
                Today’s vehicles demand more than a basic code reader. Our
                cutting-edge diagnostic process combines full-system scanning,
                live data, circuit testing, technical information, and real
                mechanical experience.
              </p>
              <p>
                That capability often finds the root cause after a dealership
                or another shop has left the problem unresolved—without losing
                the clear explanations and personal accountability of a
                family-owned shop.
              </p>
              <ul className="tech-list">
                <li>Full-system computer diagnostics</li>
                <li>Advanced electrical testing</li>
                <li>Hybrid and EV-aware service</li>
                <li>Factory service information</li>
              </ul>
              <Link className="button button-primary" href="/services/advanced-diagnostics">
                Explore diagnostics
              </Link>
            </div>
            <div className="scan-panel" aria-label="Diagnostic process illustration">
              <div className="scan-head">
                <span>Vehicle health scan</span>
                <strong>21 systems online</strong>
              </div>
              <div className="scan-lines" aria-hidden="true">
                {[78, 92, 64, 86, 71, 96].map((width, index) => (
                  <span key={width} style={{ "--scan-width": `${width}%`, "--delay": `${index * 120}ms` } as React.CSSProperties} />
                ))}
              </div>
              <div className="scan-result">
                <span>01</span>
                <div>
                  <small>Root cause located</small>
                  <strong>A repair plan based on evidence</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="makes-section" aria-labelledby="makes-title">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow dark">Old-school care. New-school capability.</p>
                <h2 id="makes-title">Your whole driveway. One family garage.</h2>
              </div>
              <p>
                Gas, diesel, hybrid, electric, imports, domestics, work trucks,
                performance cars, and classics. Dealer-level know-how meets
                family-garage care.
              </p>
            </div>
            <ul className="ride-track" aria-label="Vehicle types we service">
              <li>
                <Link href="/services/oil-maintenance">
                  <span aria-hidden="true">G</span>
                  <strong>Gas</strong>
                  <small>Everyday heroes</small>
                </Link>
              </li>
              <li>
                <Link href="/services/hybrid-ev-service">
                  <span aria-hidden="true">⌁</span>
                  <strong>Electric</strong>
                  <small>New-school spark</small>
                </Link>
              </li>
              <li>
                <Link href="/services/hybrid-ev-service">
                  <span aria-hidden="true">◐</span>
                  <strong>Hybrid</strong>
                  <small>Two worlds, one shop</small>
                </Link>
              </li>
              <li>
                <Link href="/services/diesel-service">
                  <span aria-hidden="true">D</span>
                  <strong>Diesel</strong>
                  <small>Workday muscle</small>
                </Link>
              </li>
              <li>
                <Link href="/services">
                  <span aria-hidden="true">★</span>
                  <strong>Classics</strong>
                  <small>Forever cars welcome</small>
                </Link>
              </li>
            </ul>
            <div className="driveway-callout">
              <span aria-hidden="true">✓</span>
              <strong>Nearly every make. Every generation.</strong>
              <p>Bring us the commuter, the family hauler, the workhorse, or the keeper.</p>
            </div>
            <MakeGrid />
          </div>
        </section>

        <section className="award-section">
          <div className="shell award-grid">
            <div className="award-badge" aria-hidden="true">
              <span>CARFAX</span>
              <strong>TOP-RATED</strong>
              <small>SERVICE CENTER</small>
              <b>★★★★★</b>
            </div>
            <div>
              <p className="eyebrow">Recognition earned from real service</p>
              <h2>A CARFAX Top-Rated Service Center.</h2>
              <p>
                {shop.rating.source} customers rated Ocean Heights{" "}
                {shop.rating.value} out of {shop.rating.scale} across hundreds
                of verified reviews, as of {shop.rating.observed}. That
                recognition reflects what our regulars already know: honest
                advice, fair rates, and repairs done with care.
              </p>
              <a className="button button-ghost" href={carfaxUrl}>
                Read verified CARFAX reviews <span aria-hidden="true">↗︎</span>
              </a>
            </div>
          </div>
        </section>

        <section className="section reviews-section" id="reviews">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow dark">Community trusted</p>
                <h2>People remember how you treat them.</h2>
              </div>
              <a className="text-link" href={carfaxUrl}>See CARFAX reviews →</a>
            </div>
            <div className="review-grid">
              <blockquote>
                <div aria-label="5 out of 5 stars">★★★★★</div>
                <p>
                  “It&apos;s been a long time since I really trusted a place
                  with my car.”
                </p>
                <cite>Jim K.</cite>
              </blockquote>
              <blockquote>
                <div aria-label="5 out of 5 stars">★★★★★</div>
                <p>
                  “You won&apos;t find a more honest and affordable mechanic in
                  the area. They make sure our cars are fixed right.”
                </p>
                <cite>Kimberly J.</cite>
              </blockquote>
              <blockquote>
                <div aria-label="5 out of 5 stars">★★★★★</div>
                <p>
                  “They handled even my exacting custom camber and toe request
                  perfectly—and took time to explain the tradeoffs.”
                </p>
                <cite>Kevin B.</cite>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="visit-section" id="visit">
          <div className="shell visit-grid">
            <div className="visit-copy">
              <p className="eyebrow">Let’s take care of your car</p>
              <h2>Easy to reach. Easy to trust.</h2>
              <p>
                Call to schedule, stop in during business hours, or use our
                secure early-bird and night-owl key drop when your day doesn’t
                fit ours.
              </p>
              <div className="visit-actions">
                <a className="button button-primary" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
                <DirectionsTrigger className="button button-ghost">
                  Get directions <span aria-hidden="true">↗︎</span>
                </DirectionsTrigger>
              </div>
            </div>
            <div className="visit-card">
              <DirectionsTrigger className="visit-card-location">
                <small>Address</small>
                <strong>{shop.address.street}</strong>
                <span>{shop.address.cityLine}</span>
              </DirectionsTrigger>
              <div>
                <small>Shop hours</small>
                <strong>{shop.hours.weekdayLabel}</strong>
                <span>{shop.hours.display.split(", ")[1]}</span>
                <ShopHoursStatus />
              </div>
              <div>
                <small>Service area</small>
                <strong>{shop.areaServed[0]}</strong>
                <span>{shop.areaServed.slice(1).join(" · ")} · nearby communities</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/shop";

export const metadata = pageMetadata({
  title: "Our Family Auto Repair Shop in Egg Harbor Township, NJ",
  description:
    "Meet Ocean Heights Auto & Tire, a family-run Egg Harbor Township shop with deep automotive experience, a welcoming waiting room, and modern diagnostic capability.",
  path: "/our-shop",
  ogTitle: "Our Family Auto Repair Shop",
});

const gallery = [
  ["/media/1527173976927-building8-21-14.31.jpg", "Ocean Heights Auto and Tire exterior"],
  ["/media/1527174021415-building8-21-141.jpg", "Clean customer service counter"],
  ["/media/photo5.jpg", "Bright Ocean Heights service bays"],
  ["/media/photo21.jpg", "Comfortable customer waiting area"],
] as const;

export default function OurShopPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema([["Our Shop", "/our-shop"]])),
          }}
        />
        <section className="inner-hero story-hero">
          <div className="shell">
            <p className="eyebrow">The modern family garage</p>
            <h1>We know cars. We know our neighbors.</h1>
            <p>
              Ocean Heights is family-run, family-first, and proudly rooted in
              Egg Harbor Township. We pair decades of parts and repair
              experience with the modern tools today&apos;s vehicles demand.
            </p>
            <a className="button button-primary" href={phoneHref}>
              Call {phoneDisplay}
            </a>
          </div>
        </section>

        <section className="section story-section">
          <div className="shell story-grid">
            <div>
              <p className="eyebrow dark">Experience you can talk to</p>
              <h2>Classic care. No dealership runaround.</h2>
            </div>
            <div className="story-copy">
              <p>
                The family&apos;s automotive background spans more than 40
                years in auto parts and more than 15 years running a repair
                shop. That experience shapes how we work: listen carefully,
                test thoroughly, explain clearly, and recommend only what the
                vehicle needs.
              </p>
              <p>
                Our ASE-certified technicians service the cars families drive
                every day—imports, domestics, work vehicles, classics, diesel,
                hybrid, and electric models. Advanced equipment helps us take
                on many of the same complex jobs drivers expect from a dealer,
                with local accountability and competitive rates.
              </p>
            </div>
          </div>
        </section>

        <section className="shop-gallery" aria-labelledby="gallery-title">
          <div className="shell">
            <p className="eyebrow dark">Come on in</p>
            <h2 id="gallery-title">A real shop, a clean wait, a familiar face.</h2>
            <div className="gallery-grid">
              {gallery.map(([src, alt], index) => (
                <figure key={src} className={index === 0 ? "gallery-wide" : ""}>
                  <Image src={src} width={900} height={600} alt={alt} />
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className="community-band">
          <div className="shell">
            <span aria-hidden="true">EHT</span>
            <div>
              <p className="eyebrow">Built to keep our town moving</p>
              <h2>Proud to support the Egg Harbor Township community.</h2>
              <p>
                Your car carries the people and plans that matter. Our job is
                to help keep those everyday miles safe, dependable, and a
                little less stressful.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

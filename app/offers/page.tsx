import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Auto Repair Offers & Coupons",
  description:
    "See current Ocean Heights Auto & Tire offers and call the shop to confirm availability before service.",
  alternates: { canonical: "/offers" },
};

export default function OffersPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="inner-hero">
          <div className="shell">
            <p className="eyebrow">Straightforward value</p>
            <h1>Good care. Fair rates. No fine-print games.</h1>
            <p>
              Offers can change. Call before your visit and we&apos;ll confirm
              what currently applies to your vehicle and service.
            </p>
            <a className="button button-primary" href={phoneHref}>
              Call {phoneDisplay}
            </a>
          </div>
        </section>

        <section className="section offer-section">
          <div className="shell offer-grid">
            <div>
              <p className="eyebrow dark">Legacy coupon</p>
              <h2>Saved from the original website.</h2>
              <p>
                This historical offer image is preserved for continuity.
                Pricing and eligibility may have changed; please call the shop
                before relying on any pictured discount.
              </p>
              <a className="button button-primary" href={phoneHref}>Confirm an offer</a>
            </div>
            <figure>
              <Image
                src="/media/auto-tire-coupon.jpg"
                width={1000}
                height={627}
                alt="Historical Ocean Heights Auto and Tire coupon; call to confirm current offers"
              />
              <figcaption>Historical coupon—call to confirm current terms.</figcaption>
            </figure>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

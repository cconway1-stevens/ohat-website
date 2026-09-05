import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/layout/site-header";
import { HoursForecast } from "@/components/shop/hours-forecast";
import { ShopHoursStatus } from "@/components/shop/shop-hours-status";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, shop } from "@/lib/shop/shop";

// A support page, not a landing page: customers arrive from the placard's
// "Full hours" link to answer one question — are the doors open, and is
// anything closed coming up? Keep it short.
export const metadata = pageMetadata({
  title: "Hours & Closures",
  description:
    "Regular hours and upcoming closures for Ocean Heights Auto & Tire in Egg Harbor Township, NJ. Hours can vary on posted holidays — please call before stopping by.",
  path: "/hours",
  ogTitle: "Hours & closures — Ocean Heights Auto & Tire",
});

export default function HoursPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema([["Hours", "/hours"]])),
          }}
        />
        <section className="inner-hero hours-hero">
          <div className="shell">
            <p className="eyebrow">Hours &amp; closures</p>
            <h1>Are we open?</h1>
            <div className="hours-hero-actions">
              <a className="button button-primary" href={phoneHref}>
                Call {phoneDisplay}
              </a>
              <ShopHoursStatus onDark hideMore />
            </div>
          </div>
        </section>

        <section className="section hours-body">
          <div className="shell hours-grid">
            <div className="hours-card">
              <h2>Regular hours</h2>
              <dl className="hours-list">
                <div className="is-open">
                  <dt>{shop.hours.weekdayLabel}</dt>
                  <dd>{shop.hours.weekdayHours}</dd>
                </div>
                <div className="is-open">
                  <dt>{shop.hours.fridayLabel}</dt>
                  <dd>{shop.hours.fridayHours}</dd>
                </div>
                <div className="is-closed">
                  <dt>{shop.hours.weekendLabel}</dt>
                  <dd>{shop.hours.weekendValue}</dd>
                </div>
              </dl>
              <p className="hours-note">{shop.hours.closedNote}</p>
            </div>

            <div className="hours-card">
              <h2>Upcoming closures</h2>
              <HoursForecast />
            </div>
          </div>
          <p className="hours-footnote shell">
            Holiday hours can vary — please call <a href={phoneHref}>{phoneDisplay}</a> to
            confirm. The <Link href="/vehicle-drop-off">secure night drop</Link> is available
            around the clock.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

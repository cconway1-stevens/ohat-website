import { phoneDisplay, phoneHref } from "@/components/layout/site-header";
import { ShopHoursStatus } from "@/components/shop/shop-hours-status";
import { DirectionsTrigger } from "@/components/ui/directions-dialog";
import { SiteImage } from "@/components/ui/site-image";

export function MainHero() {
  return (
    <section className="home-hero" id="top" aria-label="Ocean Heights Auto and Tire">
      <div className="home-hero-shell">
        <div className="home-hero-copy">
          <div className="home-hero-brand">
            <SiteImage
              className="home-hero-logo"
              src="/media/logo-transparent.avif"
              width={176}
              height={129}
              alt="Ocean Heights Auto and Tire"
              loading="eager"
            />
            <p>
              <span>Family owned &amp; operated</span>
              Egg Harbor Township, New Jersey
            </p>
          </div>

          <p className="home-hero-kicker">Complete auto repair &amp; tire service</p>
          <h1>
            Your whole driveway.
            <span>One trusted shop.</span>
          </h1>
          <p className="home-hero-lede">
            Dealer-level diagnostics and straight answers for daily drivers, work trucks, classics,
            hybrids, and EVs.
          </p>

          <div className="home-hero-actions">
            <a className="button button-primary" href={phoneHref}>
              Call {phoneDisplay}
            </a>
            <DirectionsTrigger className="button home-hero-directions">
              Get directions <span aria-hidden="true">↗︎</span>
            </DirectionsTrigger>
          </div>

          <div className="home-hero-meta">
            <ShopHoursStatus />
            <p>
              <strong>1178 Ocean Heights Ave.</strong>
              Egg Harbor Township, NJ
            </p>
          </div>
        </div>

        <figure className="home-hero-photo">
          <div className="home-hero-photo-image">
            <SiteImage
              src="/media/rs/cecf1b30-365d-430d-b925-1fd22429c9e1-1200.avif"
              alt="Ocean Heights Auto and Tire with a red car, yellow classic, and white work truck outside the service bays"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 58vw"
            />
          </div>
          <figcaption>
            <span>All makes. All eras.</span>
            <strong>Gas · Diesel · Hybrid · Electric · Classic</strong>
          </figcaption>
          <span className="home-hero-photo-tag" aria-hidden="true">
            <b>40+</b>
            Years of parts experience
          </span>
        </figure>
      </div>

      <div className="home-hero-proof" aria-label="Shop credentials">
        <span>ASE Certified Technicians</span>
        <span>Family Run &amp; Local</span>
        <span>CARFAX Top-Rated Service Center</span>
      </div>
    </section>
  );
}

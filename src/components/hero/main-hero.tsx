import { phoneDisplay, phoneHref } from "@/components/layout/site-header";
import { ShopHoursStatus } from "@/components/shop/shop-hours-status";
import { DirectionsTrigger } from "@/components/ui/directions-dialog";
import { SiteImage } from "@/components/ui/site-image";

export function MainHero() {
  return (
    <section className="home-hero" id="top" aria-label="Ocean Heights Auto and Tire">
      <div className="home-hero-shell">
        <div className="home-hero-copy">
          <p className="home-hero-kicker">Auto repair &amp; tire shop · Egg Harbor Township</p>
          <h1>
            <span>Ocean Heights</span>
            Auto &amp; Tire
          </h1>
          <p className="home-hero-promise">Honest advice. Clear options. Repairs done right.</p>
          <p className="home-hero-lede">
            ASE-certified technicians for maintenance, tires, advanced diagnostics, and repairs on
            everyday cars, work trucks, classics, hybrids, and EVs.
          </p>

          <div className="home-hero-actions">
            <a
              className="button button-primary home-hero-call"
              href={phoneHref}
              aria-label={`Call Ocean Heights Auto and Tire at ${phoneDisplay}`}
            >
              <span className="retro-phone-mark" aria-hidden="true">
                ☎︎
              </span>
              <span className="home-hero-call-copy">
                <small>Call the shop</small>
                <strong>{phoneDisplay}</strong>
              </span>
            </a>
            <DirectionsTrigger className="button home-hero-directions">
              Get directions <span aria-hidden="true">↗︎</span>
            </DirectionsTrigger>
          </div>

          <div className="home-hero-meta">
            <ShopHoursStatus />
            <p className="home-hero-address">
              <span className="home-hero-pin" aria-hidden="true" />
              <span className="home-hero-address-copy">
                <span>1178 Ocean Heights Ave.</span>
                <span>Egg Harbor Township, NJ</span>
              </span>
            </p>
          </div>
        </div>

        <figure className="home-hero-photo">
          <div className="home-hero-photo-image">
            <SiteImage
              src="/media/rs/OHAT-Main-Building-1920.avif"
              alt="Ocean Heights Auto and Tire with a red car, yellow classic, and white work truck outside the service bays"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 58vw"
            />
            <span className="home-hero-logo-plate">
              <SiteImage
                className="home-hero-logo"
                src="/media/logo-transparent.avif"
                width={176}
                height={129}
                alt=""
                loading="eager"
              />
            </span>
          </div>
          <span className="home-hero-checker" aria-hidden="true" />
          <figcaption>
            <span>Your local family garage</span>
            <strong>Gas · Diesel · Hybrid · Electric · Classic</strong>
          </figcaption>
          <span className="home-hero-photo-tag" aria-hidden="true">
            <b>40+</b>
            Years of parts experience
          </span>
        </figure>
      </div>

      <div className="home-hero-proof" aria-label="Shop credentials">
        <span>ASE-Certified Technicians</span>
        <span>Family-Owned &amp; Local</span>
        <span>CARFAX Top-Rated Service Center</span>
      </div>
    </section>
  );
}

import Link from "next/link";
import { DirectionsTrigger } from "./directions-dialog";
import { MakerRibbon } from "./maker-ribbon";
import { shop } from "@/lib/shop";
import { BrandMark, phoneDisplay, phoneHref } from "./site-header";

import { profileLinks } from "@/lib/business";

const socialLinks = profileLinks.map(({ name, href }) => [name, href]);

export function SiteFooter() {
  return (
    <>
      <section className="drive-cta" aria-labelledby="drive-cta-title">
        <div className="drive-sky">
          <div className="shell drive-copy">
            <div>
              <p>Next stop: a smoother ride</p>
              <h2 id="drive-cta-title">Pull into the family garage.</h2>
            </div>
            <a className="button button-primary" href={phoneHref}>
              Call the crew · {phoneDisplay}
            </a>
          </div>
          <div className="car-track">
            {/* Easter egg: the little car that drives across the footer is
                also the door to the garage arcade — catch it to find out. */}
            <Link
              className="classic-car"
              href="/arcade"
              title="Where's this car headed?"
            >
              <span className="sr-only">
                Follow the little car to the garage arcade
              </span>
              <span aria-hidden="true" className="classic-car-shell">
                <span className="car-roof" />
                <span className="car-body">
                  <i className="headlight" />
                  <i className="bumper" />
                </span>
                <span className="car-wheel car-wheel-back"><span /></span>
                <span className="car-wheel car-wheel-front"><span /></span>
              </span>
            </Link>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="footer-checker" aria-hidden="true" />
        <div className="shell footer-grid">
          <div>
            <BrandMark />
            <p>
              Family-owned auto repair with classic care, modern technology, and
              honest service for every kind of vehicle.
            </p>
          </div>
          <div>
            <strong>Visit</strong>
            <DirectionsTrigger className="footer-address-trigger">
              {shop.address.street}
              <br />
              {shop.address.cityLine}
            </DirectionsTrigger>
          </div>
          <div>
            <strong>Call</strong>
            <a href={phoneHref}>{phoneDisplay}</a>
            <span>{shop.hours.display}</span>
          </div>
          <div>
            <strong>Connect</strong>
            <a href="/links">Quick links</a>
            <a href="/contact-card.vcf" download>Add us to contacts</a>
            {socialLinks.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer">
                {label} <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>© {new Date().getFullYear()} {shop.name}</span>
          <span>All makes &amp; models · Gas · Diesel · Hybrid · Electric</span>
        </div>
        <MakerRibbon />
      </footer>
    </>
  );
}

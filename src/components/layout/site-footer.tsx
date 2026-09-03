import Link from "next/link";
import { profileLinks } from "@/lib/shop/business";
import { shop } from "@/lib/shop/shop";
import { MakerRibbon } from "../arcade/maker-ribbon";
import { ShopHoursStatus } from "../shop/shop-hours-status";
import { DirectionsTrigger } from "../ui/directions-dialog";
import { DockVisibility } from "../ui/dock-visibility";
import { BrandMark, phoneDisplay, phoneHref } from "./site-header";

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
            <Link className="classic-car" href="/arcade" title="Where's this car headed?">
              <span className="sr-only">Follow the little car to the garage arcade</span>
              <span aria-hidden="true" className="classic-car-shell">
                <span className="car-roof" />
                <span className="car-body">
                  <i className="headlight" />
                  <i className="bumper" />
                </span>
                <span className="car-wheel car-wheel-back">
                  <span />
                </span>
                <span className="car-wheel car-wheel-front">
                  <span />
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="footer-checker" aria-hidden="true" />
        <div className="shell footer-grid">
          {/* The masthead block: who we are, in the shop's own words. Every
              value here comes from lib/shop.mjs so the footer can never
              disagree with the header, the contact page or the vCard. */}
          <div className="footer-brand">
            <BrandMark />
            <p className="footer-tagline">{shop.tagline}</p>
            <p>
              Family-owned auto repair in {shop.address.city} ({shop.nickname}), serving{" "}
              {shop.county} and {shop.region}. Gas, diesel, hybrid, electric and classic vehicles
              all welcome.
            </p>
          </div>

          <div className="footer-col">
            <strong>Visit</strong>
            <DirectionsTrigger className="footer-address-trigger">
              {shop.address.street}
              <br />
              {shop.address.cityLine}
            </DirectionsTrigger>
            <Link href="/vehicle-drop-off">After-hours drop-off</Link>
            <Link href="/our-shop">About the shop</Link>
            <Link href="/services">Service catalog</Link>
          </div>

          <div className="footer-col footer-call">
            <strong>Call</strong>
            <a className="footer-phone" href={phoneHref}>
              {phoneDisplay}
            </a>
            <span>{shop.hours.display}</span>
            <span className="footer-closed-note">{shop.hours.closedNote}</span>
            <ShopHoursStatus onDark />
          </div>

          <div className="footer-col">
            <strong>Connect</strong>
            <Link href="/links">Quick links</Link>
            <a href="/contact-card.vcf" download>
              Add us to contacts
            </a>
            <Link href="/reviews">Customer reviews</Link>
            <div className="footer-socials">
              {socialLinks.map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noreferrer">
                  {label}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="shell footer-bottom">
          <span>
            © {new Date().getFullYear()} {shop.name}
          </span>
          <span className="footer-makes">
            All makes &amp; models · Gas · Diesel · Hybrid · Electric
          </span>
          {/* Sitewide footer link because a privacy notice has to be
              "reasonably accessible" from anywhere on the site to count. */}
          <Link href="/privacy">Privacy</Link>
        </div>
        {/* Watched by DockVisibility so the floating call dock steps aside
            once the bottom of the footer is on screen. */}
        <div id="footer-end" aria-hidden="true" />
        <MakerRibbon />
        <DockVisibility />
      </footer>
    </>
  );
}

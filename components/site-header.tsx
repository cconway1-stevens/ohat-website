"use client";

import Image from "next/image";
import Link from "next/link";
import {
  addressDisplay,
  DirectionsTrigger,
} from "./directions-dialog";
import { ShopAlmanac } from "./shop-almanac";
import { shop } from "@/lib/shop";

// Re-exported from the shared config so the many components already importing
// these names keep working, while the values live in exactly one place.
export const phoneDisplay = shop.phone.display;
export const phoneHref = shop.phone.href;

const primaryLinks = [
  { number: "01", label: "Service catalog", href: "/services", note: "Repairs, tires & diagnostics" },
  { number: "02", label: "Meet the garage", href: "/our-shop", note: "Our family, shop & story" },
  { number: "03", label: "Night drop", href: "/vehicle-drop-off", note: "After-hours key drop" },
  { number: "04", label: "Shore reviews", href: "/reviews", note: "What local drivers say" },
  { number: "05", label: "Deals", href: "/offers", note: "Current shop offers" },
  // Contact earns the last nav slot over the link tree: it is what people
  // come looking for. The link tree stays reachable from the footer and its
  // QR page, which is where a bio link points anyway.
  { number: "06", label: "Contact us", href: "/contact", note: "Call, email, map & hours" },
];

export function BrandMark({ homeHref = "/" }: { homeHref?: string }) {
  return (
    <Link className="brand" href={homeHref} aria-label="Ocean Heights Auto and Tire home">
      <Image
        src="/media/logo-transparent.png"
        width={315}
        height={231}
        alt="Ocean Heights Auto and Tire"
        priority
        unoptimized
      />
    </Link>
  );
}

// One masthead for every page. The nav band spans the full viewport while its
// contents ride the shell grid — painting the background directly on the
// shell element left the page background bleeding down both sides.
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="garage-strip">
        <DirectionsTrigger className="directions-menu-trigger">
          {addressDisplay} <span aria-hidden="true">▾</span>
        </DirectionsTrigger>
        <ShopAlmanac />
        <a className="garage-strip-phone" href={phoneHref}>
          <span aria-hidden="true">☎︎</span> {phoneDisplay}
        </a>
      </div>
      <div className="nav-band">
        <div className="shell nav-wrap">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {primaryLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <small>{item.number}</small> {item.label}
              </Link>
            ))}
          </nav>
          <a className="button button-small retro-call-button" href={phoneHref}>
            <span className="retro-phone-mark" aria-hidden="true">☎︎</span>
            <span>
              <small>Mechanic on the line</small>
              <strong>Call the garage</strong>
            </span>
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">Menu</summary>
            <nav aria-label="Mobile navigation">
              {primaryLinks.map((item) => (
                <Link href={item.href} key={item.href}>
                  <span><small>{item.number}</small>{item.label}</span>
                  <em>{item.note}</em>
                </Link>
              ))}
              <a className="mobile-menu-contact" href="/contact-card.vcf" download>
                <span><small>07</small>Save our contact</span>
                <em>Add the garage to your phone</em>
              </a>
              <a className="mobile-menu-call" href={phoneHref}>
                <span className="retro-phone-mark" aria-hidden="true">☎︎</span>
                <span><small>Mechanic on the line</small><strong>{phoneDisplay}</strong></span>
              </a>
            </nav>
          </details>
        </div>
      </div>
      <aside className="booking-dock" aria-label="Quick shop actions">
        <a className="booking-phone" href={phoneHref} aria-label={`Call Ocean Heights Auto and Tire at ${phoneDisplay}`}>
          <span className="retro-phone-mark" aria-hidden="true">☎︎</span>
          <span><small>Mechanic on the line</small><strong>{phoneDisplay}</strong></span>
        </a>
        <Link className="booking-links" href="/links">
          <small>Everything in one place</small>
          <strong>Link tree</strong>
        </Link>
      </aside>
    </header>
  );
}

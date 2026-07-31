"use client";

import Image from "next/image";
import Link from "next/link";
import {
  addressDisplay,
  DirectionsTrigger,
} from "./directions-dialog";

export const phoneDisplay = "(609) 241-1546";
export const phoneHref = "tel:+16092411546";

const primaryLinks = [
  { number: "01", label: "Service catalog", href: "/services", note: "Repairs, tires & diagnostics" },
  { number: "02", label: "Meet the garage", href: "/our-shop", note: "Our family, shop & story" },
  { number: "03", label: "Night drop", href: "/vehicle-drop-off", note: "After-hours key drop" },
  { number: "04", label: "Shore reviews", href: "/reviews", note: "What local drivers say" },
  { number: "05", label: "Deals", href: "/offers", note: "Current shop offers" },
  { number: "06", label: "Link tree", href: "/links", note: "Every useful shop link" },
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

export function SiteHeader({ inner = false }: { inner?: boolean }) {
  return (
    <header className={`site-header${inner ? " inner-header" : ""}`}>
      <div className="garage-strip">
        <DirectionsTrigger className="directions-menu-trigger">
          {addressDisplay} <span aria-hidden="true">▾</span>
        </DirectionsTrigger>
        <span>Egg Harbor Township, New Jersey</span>
        <a className="garage-strip-phone" href={phoneHref}>
          <span aria-hidden="true">☎</span> {phoneDisplay}
        </a>
      </div>
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
          <span className="retro-phone-mark" aria-hidden="true">☎</span>
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
              <span className="retro-phone-mark" aria-hidden="true">☎</span>
              <span><small>Mechanic on the line</small><strong>{phoneDisplay}</strong></span>
            </a>
          </nav>
        </details>
      </div>
      <aside className="booking-dock" aria-label="Quick shop actions">
        <a className="booking-phone" href={phoneHref} aria-label={`Call Ocean Heights Auto and Tire at ${phoneDisplay}`}>
          <span className="retro-phone-mark" aria-hidden="true">☎</span>
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

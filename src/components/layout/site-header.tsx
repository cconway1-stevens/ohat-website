"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteImage } from "../ui/site-image";
import { useEffect, useRef, useState } from "react";
import { addressDisplay, DirectionsTrigger } from "../ui/directions-dialog";
import { ShopAlmanac } from "../shop/shop-almanac";
import { shop } from "@/lib/shop/shop";

// Re-exported from the shared config so the many components already importing
// these names keep working, while the values live in exactly one place.
export const phoneDisplay = shop.phone.display;
export const phoneHref = shop.phone.href;

const logoHoldMs = 650;

const primaryLinks = [
  {
    number: "01",
    label: "Service catalog",
    href: "/services",
    note: "Repairs, tires & diagnostics",
  },
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
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldLogo = useRef(false);

  function clearLogoHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function startLogoHold() {
    heldLogo.current = false;
    clearLogoHold();
    holdTimer.current = setTimeout(() => {
      heldLogo.current = true;
      window.location.assign("/links");
    }, logoHoldMs);
  }

  return (
    <Link
      className="brand"
      href={homeHref}
      aria-label="Ocean Heights Auto and Tire home"
      onClick={(event) => {
        if (!heldLogo.current) return;
        event.preventDefault();
        heldLogo.current = false;
      }}
      onContextMenu={(event) => {
        if (!heldLogo.current) return;
        event.preventDefault();
      }}
      onPointerCancel={clearLogoHold}
      onPointerDown={startLogoHold}
      onPointerLeave={clearLogoHold}
      onPointerUp={clearLogoHold}
    >
      <SiteImage
        src="/media/logo-transparent.avif"
        width={315}
        height={231}
        alt="Ocean Heights Auto and Tire"
        priority
      />
    </Link>
  );
}

// One masthead for every page. The nav band spans the full viewport while its
// contents ride the shell grid — painting the background directly on the
// shell element left the page background bleeding down both sides.
export function SiteHeader() {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Current-page marker for both navs. Prefix matching keeps "Service
  // catalog" lit on every /services/* ticket page as well as the index.
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const menu = mobileMenuRef.current;
      if (!menu || menu.contains(event.target as Node)) return;
      setMobileMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

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
              <Link
                href={item.href}
                key={item.href}
                className={isCurrent(item.href) ? "is-current" : undefined}
                aria-current={isCurrent(item.href) ? "page" : undefined}
              >
                <small>{item.number}</small> {item.label}
              </Link>
            ))}
          </nav>
          <a className="button button-small retro-call-button" href={phoneHref}>
            <span className="retro-phone-mark" aria-hidden="true">
              ☎︎
            </span>
            <span>
              <small>Mechanic on the line</small>
              <strong>{phoneDisplay}</strong>
            </span>
          </a>
          <details
            className="mobile-menu"
            onToggle={(event) => setMobileMenuOpen(event.currentTarget.open)}
            open={mobileMenuOpen}
            ref={mobileMenuRef}
          >
            <summary aria-label="Open navigation">
              <span className="menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Menu
            </summary>
            <nav aria-label="Mobile navigation">
              {primaryLinks.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  className={isCurrent(item.href) ? "is-current" : undefined}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>
                    <small>{item.number}</small>
                    {item.label}
                  </span>
                  <em>{item.note}</em>
                </Link>
              ))}
              <a
                className="mobile-menu-call"
                href={phoneHref}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="retro-phone-mark" aria-hidden="true">
                  ☎︎
                </span>
                <span>
                  <small>Mechanic on the line</small>
                  <strong>{phoneDisplay}</strong>
                </span>
              </a>
            </nav>
          </details>
        </div>
      </div>
      <aside
        className={`booking-dock${pathname === "/contact" ? " booking-dock-contact" : ""}`}
        aria-label="Quick shop actions"
      >
        <a
          className="booking-phone"
          href={phoneHref}
          aria-label={`Call Ocean Heights Auto and Tire at ${phoneDisplay}`}
        >
          <span className="retro-phone-mark" aria-hidden="true">
            ☎︎
          </span>
          <span className="booking-dock-copy">
            <small>Mechanic on the line</small>
            <strong>{phoneDisplay}</strong>
          </span>
        </a>
        {pathname === "/contact" ? (
          <DirectionsTrigger className="booking-links booking-directions" label="Get directions">
            <span className="booking-dock-copy">
              <small>Route to the garage</small>
              <strong>Directions</strong>
            </span>
            <span className="booking-dock-arrow" aria-hidden="true">
              &#8594;
            </span>
          </DirectionsTrigger>
        ) : (
          <Link className="booking-links" href="/links">
            <span className="booking-dock-copy">
              <small>Everything in one place</small>
              <strong>Link tree</strong>
            </span>
            <span className="booking-dock-arrow" aria-hidden="true">
              →
            </span>
          </Link>
        )}
      </aside>
    </header>
  );
}

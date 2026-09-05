"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getActiveNotice } from "@/lib/shop/announcements.mjs";
import { shop } from "@/lib/shop/shop";

/**
 * The shop notice banner: the fixed strip at the very top of every page.
 *
 * Mirrors the ShopHoursStatus contract: the server (and the first client
 * paint) render nothing, and the client decides — so a static export never
 * bakes a build-day decision into the HTML and no host can mismatch.
 *
 * Every notice carries two standing actions beside the message: the call
 * button and a quieter "Full hours" link to /hours — a customer reading a
 * closure notice is one tap from the complete schedule and why it looks the
 * way it does.
 *
 * When a notice is active it publishes its measured height as the CSS
 * variable `--notice-h`; the masthead and every hero that reserves masthead
 * space add that variable to their paddings, so the whole page slides down
 * beneath the strip instead of anything being covered. On ordinary days the
 * variable stays 0px and the layout is byte-identical to a banner-less site.
 */

type ActiveNotice = NonNullable<ReturnType<typeof getActiveNotice>>;

const DISMISS_PREFIX = "notice-dismissed:";

function sessionDismissed(id: string) {
  try {
    return window.sessionStorage.getItem(DISMISS_PREFIX + id) === "1";
  } catch {
    // Private-mode Safari denies sessionStorage; treat as not dismissed.
    return false;
  }
}

export function NoticeBanner() {
  const [notice, setNotice] = useState<ActiveNotice | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = getActiveNotice();
    if (!active || sessionDismissed(active.id)) return;
    setNotice(active);
  }, []);

  // Keep the reservation variable in step with the banner's real height —
  // the copy wraps on narrow screens, so a fixed height would drift.
  useEffect(() => {
    const root = document.documentElement;
    const banner = bannerRef.current;
    if (!notice || !banner) {
      root.style.removeProperty("--notice-h");
      return;
    }
    const apply = () => root.style.setProperty("--notice-h", `${banner.offsetHeight}px`);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(banner);
    return () => observer.disconnect();
  }, [notice]);

  function dismiss() {
    if (!notice) return;
    try {
      window.sessionStorage.setItem(DISMISS_PREFIX + notice.id, "1");
    } catch {
      // Storage unavailable — the banner still closes for this page view.
    }
    setNotice(null);
  }

  if (!notice) return null;

  return (
    <div className="notice-banner" role="region" aria-label="Shop notice" ref={bannerRef}>
      <div className="notice-banner-inner">
        <div className="notice-banner-message">
          <p className="notice-banner-copy">
            <span className="notice-banner-flag">Notice</span>
            {notice.message}
          </p>
          <a className="notice-banner-call" href={shop.phone.href}>
            <span aria-hidden="true">☎︎</span> Call {shop.phone.display}
          </a>
          <Link className="notice-banner-hours" href="/hours">
            Full hours <span aria-hidden="true">&#8594;</span>
          </Link>
        </div>
        <button
          className="notice-banner-close"
          type="button"
          aria-label="Dismiss notice"
          onClick={dismiss}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

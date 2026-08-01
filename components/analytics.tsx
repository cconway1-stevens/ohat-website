"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * The shop's only conversion is a phone call, so page views alone say nothing
 * about which pages actually earn business. This reports a `call_click` event
 * with the page it came from.
 *
 * Delegated from the document because call links appear in the header, the
 * sticky dock, the footer, and inline on most pages. It reports through
 * whatever analytics is present — Vercel's `window.va` and Google Analytics'
 * `window.gtag` — and is inert when neither is loaded, so it never blocks a
 * call from going through.
 */
export function CallTracking() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (!link) return;

      const path = window.location.pathname;

      window.va?.("event", {
        name: "call_click",
        data: { path },
      });

      // GA4 counts page views on its own; this is the event worth marking as
      // a conversion in the GA console, since a phone call is the only thing
      // this site is really trying to produce.
      window.gtag?.("event", "call_click", {
        page_path: path,
        link_url: link.getAttribute("href"),
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

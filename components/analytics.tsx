"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    va?: (event: string, properties?: Record<string, unknown>) => void;
  }
}

/**
 * The shop's only conversion is a phone call, so page views alone say nothing
 * about which pages actually earn business. This reports a `call_click` event
 * with the page it came from.
 *
 * Delegated from the document because call links appear in the header, the
 * sticky dock, the footer, and inline on most pages. It reports through
 * whatever analytics is present (Vercel's `window.va`) and is inert when none
 * is loaded, so it never blocks a call from going through.
 */
export function CallTracking() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (!link) return;

      window.va?.("event", {
        name: "call_click",
        data: { path: window.location.pathname },
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll-triggered reveals.
 *
 * The entrance animations in globals.css are gated on `.is-revealed`; this
 * observer adds that class the first time each target scrolls into view, so
 * below-the-fold sections play their motion when the visitor actually sees
 * them instead of all at once on page load.
 *
 * Progressive enhancement: targets are tagged with `data-reveal` from here,
 * never in the markup — so with JS off (or before hydration) nothing is ever
 * hidden, and the CSS hidden state only exists once observation is armed.
 * Re-runs on every route change because the App Router keeps this layout
 * alive while swapping the page's DOM underneath it.
 */
const REVEAL_SELECTOR = [
  ".garage-proof-ticket",
  ".service-preview article",
  ".ride-track li",
  ".award-badge",
  ".review-grid blockquote",
  ".service-directory article",
  ".dropoff-grid article",
  ".gallery-grid figure",
  ".arcade-cabinet",
].join(", ");

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const targets = Array.from(document.querySelectorAll(REVEAL_SELECTOR));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      // Fire a little before the element fully enters, so the motion reads
      // as leading the scroll rather than chasing it.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    for (const target of targets) {
      target.setAttribute("data-reveal", "");
      observer.observe(target);
    }
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}

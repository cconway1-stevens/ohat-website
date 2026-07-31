"use client";

import { useEffect } from "react";

/**
 * Retires the fixed call dock once the bottom of the footer is on screen.
 *
 * The dock exists to keep "call us" reachable while someone is reading the
 * page — but at the very bottom it just sits on top of the footer's own
 * phone number and the maker credit, covering them. Watching a sentinel at
 * the end of the footer is cheaper and steadier than a scroll listener.
 */
export function DockVisibility() {
  useEffect(() => {
    const sentinel = document.getElementById("footer-end");
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.classList.toggle(
          "at-footer",
          entry.isIntersecting,
        );
      },
      { rootMargin: "0px 0px -8px 0px" },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("at-footer");
    };
  }, []);

  return null;
}

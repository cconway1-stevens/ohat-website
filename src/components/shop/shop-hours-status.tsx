"use client";

import { useEffect, useRef, useState } from "react";
import { getShopHoursStatus, getShopStatusLabel } from "@/lib/shop/shop-hours.mjs";
import { shop } from "@/lib/shop/shop";

/**
 * The shop's open/closed placard.
 *
 * One component, one look, every placement — header, footer, contact page,
 * link hub and the directions dialog all render the same sign. `onDark` is
 * the only variation, and it exists because the footer sits on ink rather
 * than paper; it swaps the plate's fill, not its design.
 *
 * The wording all comes from `shop.hours.status.labels`, so the sign can be
 * reworded without touching this file or the scheduling logic.
 */
export function ShopHoursStatus({ onDark = false }: { onDark?: boolean } = {}) {
  const [status, setStatus] = useState(() => getShopHoursStatus());
  const [previewState, setPreviewState] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const cycleTimer = useRef<number | null>(null);
  const preview = shop.hours.status.signPreview;

  useEffect(() => {
    const timer = window.setInterval(
      () => setStatus(getShopHoursStatus()),
      shop.hours.status.refreshMs,
    );
    return () => {
      window.clearInterval(timer);
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current);
      if (cycleTimer.current !== null) window.clearInterval(cycleTimer.current);
    };
  }, []);

  function startPreview() {
    let step = 0;
    setPreviewState(preview.states[step]);
    cycleTimer.current = window.setInterval(() => {
      step += 1;
      if (step >= preview.states.length * preview.cycles) {
        if (cycleTimer.current !== null) window.clearInterval(cycleTimer.current);
        cycleTimer.current = null;
        setPreviewState(null);
        return;
      }
      setPreviewState(preview.states[step % preview.states.length]);
    }, preview.stepMs);
  }

  function beginHold() {
    if (previewState !== null || holdTimer.current !== null) return;
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      startPreview();
    }, preview.holdMs);
  }

  function cancelHold() {
    if (holdTimer.current === null) return;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  const shownStatus = previewState ?? status.status;
  const shownLabel = previewState ? getShopStatusLabel(previewState) : status.label;
  const statusLines: string[] = shownLabel.split(". ").filter(Boolean);

  return (
    <span className={`shop-hours-status-wrap${onDark ? " on-dark" : ""}`}>
      <span
        aria-label={`Shop status: ${shownLabel}. ${preview.hint}.`}
        aria-live="polite"
        className={`shop-hours-status is-${shownStatus}${previewState ? " is-sign-preview" : ""}`}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if ((event.key === " " || event.key === "Enter") && !event.repeat) {
            event.preventDefault();
            beginHold();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") cancelHold();
        }}
        onPointerCancel={cancelHold}
        onPointerDown={beginHold}
        onPointerLeave={cancelHold}
        onPointerUp={cancelHold}
        role="status"
        tabIndex={0}
        title={preview.hint}
      >
        <span className="shop-status-dot" aria-hidden="true" />
        <span className="shop-status-copy">
          {statusLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </span>
      </span>
      {status.holiday ? <span className="shop-hours-holiday">{status.holidayNotice}</span> : null}
    </span>
  );
}

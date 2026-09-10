"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { shop } from "@/lib/shop/shop";
import { getShopHoursStatus, getShopStatusLabel } from "@/lib/shop/shop-hours.mjs";

/**
 * The shop's open/closed placard.
 *
 * One component, one look, every placement — header, footer, contact page,
 * link hub and the directions dialog all render the same sign. `onDark` is
 * the only variation, and it exists because the footer sits on ink rather
 * than paper; it swaps the plate's fill, not its design.
 *
 * The wording all comes from `shop.hours.status.labels`, so the sign can be
 * reworded without touching this file or the scheduling logic. A closed sign
 * carries its reason (holiday, owner-posted closure, the weekend) in the
 * same label, so a customer never has to guess why the doors are shut — and
 * a standing "Full hours" link under the sign leads to the complete
 * schedule.
 *
 * The optional `now` prop pins the sign to an instant instead of the live
 * clock; the hours dash uses it to render exactly what a customer would see
 * at a chosen moment.
 */

// Status is read by useSyncExternalStore: the server renders `null` and the
// client snapshot computes the open/closed state once on first read, then
// ticks forward on the same refresh cadence used by the masthead almanac.
// That removes the old useState-in-effect pattern without losing the
// background refresh.
let snapshot: ReturnType<typeof getShopHoursStatus> | null = null;
const listeners = new Set<() => void>();
let refreshTimer: number | null = null;

function clientSnapshot(): ReturnType<typeof getShopHoursStatus> | null {
  if (snapshot === null) snapshot = getShopHoursStatus();
  return snapshot;
}

const serverSnapshot = () => null;

function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  if (refreshTimer === null && typeof window !== "undefined") {
    refreshTimer = window.setInterval(() => {
      snapshot = getShopHoursStatus();
      for (const listener of listeners) listener();
    }, shop.hours.status.refreshMs);
  }
  return () => {
    listeners.delete(notify);
    if (listeners.size === 0 && refreshTimer !== null && typeof window !== "undefined") {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };
}

export function ShopHoursStatus({
  onDark = false,
  now,
  hideMore = false,
}: {
  onDark?: boolean;
  now?: Date;
  /** Drop the standing "Full hours" link — for the /hours page itself,
   *  where a link to the page you're already on has nowhere useful to go. */
  hideMore?: boolean;
} = {}) {
  const live = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [hydrated, setHydrated] = useState(false);
  // Keep the first client render byte-for-byte aligned with the static HTML.
  // A second external store was not strict enough here: vinext could read its
  // client snapshot before hydration committed. An effect cannot run until
  // after that commit, and the animation-frame boundary keeps the live clock
  // out of the hydration task entirely.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHydrated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  // A pinned instant is recomputed per render — the function is pure, so the
  // dash's time-travel scrubber can drive it straight from state.
  const status = now ? getShopHoursStatus(now) : hydrated ? live : null;
  const [previewState, setPreviewState] = useState<string | null>(null);
  const holdTimer = useRef<number | null>(null);
  const cycleTimer = useRef<number | null>(null);
  const preview = shop.hours.status.signPreview;

  useEffect(() => {
    return () => {
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

  const shownStatus = previewState ?? status?.status ?? "pending";
  const shownLabel = previewState
    ? getShopStatusLabel(previewState)
    : (status?.label ?? "Checking hours");
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
      {status?.holiday ? <span className="shop-hours-holiday">{status.holidayNotice}</span> : null}
      {hideMore ? null : (
        <Link className="shop-hours-more" href="/hours">
          Full hours <span aria-hidden="true">&#8594;</span>
        </Link>
      )}
    </span>
  );
}

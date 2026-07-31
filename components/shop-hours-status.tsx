"use client";

import { useEffect, useRef, useState } from "react";
import { getShopHoursStatus, getShopStatusLabel } from "@/lib/shop-hours";
import { shop } from "@/lib/shop";

export function ShopHoursStatus() {
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

  return (
    <span className="shop-hours-status-wrap">
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
        <span aria-hidden="true" />{shownLabel}
      </span>
      {status.holiday ? (
        <span className="shop-hours-holiday">
          {status.holidayNotice}
        </span>
      ) : null}
    </span>
  );
}

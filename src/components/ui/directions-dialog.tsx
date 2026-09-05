"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { shop } from "@/lib/shop/shop";
import { ShopHoursStatus } from "../shop/shop-hours-status";

export const addressDisplay = shop.address.street;
const addressFull = shop.address.full;

// Every routing URL is built from the one address, so a move only needs the
// config edited — no hand-encoded links to hunt down.
const destination = encodeURIComponent(addressFull);
const googleMapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
const appleMapsDirections = `https://maps.apple.com/?daddr=${destination}`;
const wazeDirections = `https://www.waze.com/ul?q=${destination}&navigate=yes`;

type DirectionsTriggerProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

// Intentionally not using React.useId here. The vinext RSC streaming pipeline
// bakes the server-rendered IDs into the static HTML, but the client renderer
// re-creates the same component tree with a different ID algorithm — the
// server uses "_R_<treeId>_H<n>_" while the client uses "_r_<counter>_". The
// two never match, and React throws hydration error #418 the moment the
// dialog's aria-labelledby is compared. The dialog's accessible name still
// comes through cleanly via implicit labelling from the <h2> below, so the
// only thing we lose by skipping the explicit aria-labelledby is the formal
// association. Browsers and AT compute the dialog's name from the heading
// text in that case.

export function DirectionsTrigger({ children, className, label }: DirectionsTriggerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copyLabel, setCopyLabel] = useState("Copy address");
  // Held so rapid copies restart the one reset timer instead of stacking
  // several, where an early timer would clear a later copy's confirmation.
  const copyResetTimer = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // An arrow const rather than a hoisted `function`, so the null check above
    // still narrows `dialog` inside the handler.
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };

    dialog.addEventListener("click", closeOnBackdrop);
    return () => dialog.removeEventListener("click", closeOnBackdrop);
  }, []);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(addressFull);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = addressFull;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopyLabel("Address copied!");
    if (copyResetTimer.current !== null) window.clearTimeout(copyResetTimer.current);
    copyResetTimer.current = window.setTimeout(() => {
      copyResetTimer.current = null;
      setCopyLabel("Copy address");
    }, 2200);
  }

  return (
    <>
      <button type="button" className={className} aria-label={label} onClick={openDialog}>
        {children}
      </button>
      <dialog ref={dialogRef} className="directions-dialog">
        <div className="directions-dialog-card">
          <button
            type="button"
            className="directions-dialog-close"
            onClick={closeDialog}
            aria-label="Close directions menu"
          >
            ×
          </button>
          <p className="directions-dialog-kicker">Route to the garage</p>
          <h2>Get directions</h2>
          <address>
            <strong>{addressDisplay}</strong>
            <span>{shop.address.cityLine}</span>
          </address>
          <div className="directions-dialog-options">
            <a href={appleMapsDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">A</span>
              <strong>Apple Maps</strong>
              <small>Open route ↗︎</small>
            </a>
            <a href={googleMapsDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">G</span>
              <strong>Google Maps</strong>
              <small>Open route ↗︎</small>
            </a>
            <a href={wazeDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">W</span>
              <strong>Waze</strong>
              <small>Open route ↗︎</small>
            </a>
            <button type="button" onClick={copyAddress}>
              <span aria-hidden="true">{copyLabel === "Address copied!" ? "✓" : "⧉"}</span>
              <strong aria-live="polite">{copyLabel}</strong>
              <small>Full street address</small>
            </button>
          </div>
          <p className="directions-dialog-hours">
            Open {shop.hours.compact} · Lost?{" "}
            <a href={shop.phone.href}>Call {shop.phone.display}</a>
          </p>
          <ShopHoursStatus />
        </div>
      </dialog>
    </>
  );
}

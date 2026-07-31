"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

export const addressDisplay = "1178 Ocean Heights Avenue";
export const addressFull =
  "1178 Ocean Heights Avenue, Egg Harbor Township, NJ 08234";

const googleMapsDirections =
  "https://www.google.com/maps/dir/?api=1&destination=1178+Ocean+Heights+Ave+Egg+Harbor+Township+NJ+08234";
const appleMapsDirections =
  "https://maps.apple.com/?daddr=1178+Ocean+Heights+Avenue,+Egg+Harbor+Township,+NJ+08234";
const wazeDirections =
  "https://www.waze.com/ul?q=1178%20Ocean%20Heights%20Avenue%2C%20Egg%20Harbor%20Township%2C%20NJ%2008234&navigate=yes";

type DirectionsTriggerProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function DirectionsTrigger({
  children,
  className,
  label = "Choose a directions app",
}: DirectionsTriggerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [copyLabel, setCopyLabel] = useState("Copy address");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function closeOnBackdrop(event: MouseEvent) {
      if (event.target === dialog) dialog.close();
    }

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
    window.setTimeout(() => setCopyLabel("Copy address"), 2200);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={openDialog}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="directions-dialog"
        aria-labelledby={titleId}
      >
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
          <h2 id={titleId}>Get directions</h2>
          <address>
            <strong>{addressDisplay}</strong>
            <span>Egg Harbor Township, NJ 08234</span>
          </address>
          <div className="directions-dialog-options">
            <a href={appleMapsDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">A</span>
              <strong>Apple Maps</strong>
              <small>Open route ↗</small>
            </a>
            <a href={googleMapsDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">G</span>
              <strong>Google Maps</strong>
              <small>Open route ↗</small>
            </a>
            <a href={wazeDirections} target="_blank" rel="noreferrer">
              <span aria-hidden="true">W</span>
              <strong>Waze</strong>
              <small>Open route ↗</small>
            </a>
            <button type="button" onClick={copyAddress}>
              <span aria-hidden="true">
                {copyLabel === "Address copied!" ? "✓" : "⧉"}
              </span>
              <strong aria-live="polite">{copyLabel}</strong>
              <small>Full street address</small>
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// The link hub's shareable address. Derived from wherever the site is
// actually being served — the prototype host today, the real domain after
// launch — so a printed QR never points at a dead environment. Resolved
// synchronously before first paint; the server render carries null.
let linksUrl: string | undefined;
const clientLinksUrl = () => (linksUrl ??= `${window.location.origin}/links`);
const serverLinksUrl = () => null;
const subscribeNever = () => () => {};

export function useLinksUrl() {
  return useSyncExternalStore(subscribeNever, clientLinksUrl, serverLinksUrl);
}

export function ShareLinksButtons({ url }: { url: string | null }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  async function share() {
    if (!url) return;
    const payload = {
      title: "Ocean Heights Auto & Tire",
      text: "Every Ocean Heights Auto & Tire link in one place.",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // Dismissed the share sheet — fall through to nothing.
      return;
    }
    await copy();
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        resetTimer.current = null;
        setCopied(false);
      }, 2200);
    } catch {
      // Clipboard can be blocked; the visible URL is still there to select.
    }
  }

  return (
    <div className="share-links-buttons">
      <button type="button" className="button button-primary" onClick={share}>
        Share this page
      </button>
      <button type="button" className="button button-ghost" onClick={copy} aria-live="polite">
        {copied ? "Link copied!" : "Copy the link"}
      </button>
    </div>
  );
}

export function LinksQr({ size = 240 }: { size?: number }) {
  const url = useLinksUrl();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!url || !canvas) return;
    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: { dark: "#171412", light: "#fffaf0" },
    }).catch(() => {
      // A failed render leaves the visible URL as the fallback.
    });
  }, [url, size]);

  return (
    <figure className="links-qr">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        role="img"
        aria-label={`QR code that opens ${url ?? "the Ocean Heights links page"}`}
      />
      <figcaption>{url ?? "…"}</figcaption>
    </figure>
  );
}

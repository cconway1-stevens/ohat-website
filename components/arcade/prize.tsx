"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";

/**
 * A short confetti burst, drawn on a canvas that sits over the game and
 * ignores pointer events. Self-contained — no confetti library — and it
 * simply doesn't run when the visitor prefers reduced motion.
 */
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const colors = ["#a8161c", "#f6bd38", "#1a7183", "#fffaf0", "#6f0d12"];
    const pieces = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.5,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2 + Math.random() * 3.4,
      spin: (Math.random() - 0.5) * 0.3,
      angle: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let raf = 0;
    let frames = 0;
    const tick = () => {
      frames += 1;
      ctx.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }
      // Roughly four seconds, then leave the canvas clear.
      if (frames < 240) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="prize-confetti" aria-hidden="true" />;
}

/**
 * Shown the moment a game's (deliberately easy) target is met: confetti, the
 * prize note, and a route to the offers page.
 */
export function PrizeBanner({ achievement }: { achievement: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    garageAudio.fanfare();
  }, []);

  if (dismissed) return null;

  return (
    <div className="prize-popup-backdrop" role="presentation">
      <div
        aria-label="Arcade prize"
        aria-modal="false"
        className="prize-banner"
        role="dialog"
      >
        <Confetti />
        <div className="prize-banner-body">
          <p className="prize-banner-kicker">You won a coupon</p>
          <h3>{achievement}</h3>
          <p className="prize-terms">
            Head to the deals page and we&apos;ll help match the current offer
            to your visit. Terms and conditions may apply, and the shop has the
            final say on what applies to your vehicle.
          </p>
          <div className="prize-actions">
            <Link className="button button-primary prize-redeem" href="/offers">
              Redeem prize
            </Link>
            <button
              className="prize-dismiss"
              onClick={() => setDismissed(true)}
              type="button"
            >
              Keep playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

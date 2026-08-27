"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Freeze screen" — a scroll lock for phone players.
 *
 * Swiping the tow truck or dragging across the word-search grid also drags the
 * page, so the board slides out from under your thumb mid-move. Freezing pins
 * the board in place: the page stops scrolling, and the pill stays put at the
 * bottom of the board so there is always an obvious way back out.
 *
 * The lock is a body class plus a scroll-position restore, nothing heavier —
 * no libraries, no scroll listeners running while you play.
 */
export function PlayLock() {
  const [locked, setLocked] = useState(false);
  const restoreTo = useRef(0);

  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    if (!locked) return;
    const { body } = document;
    // Freezing with `overflow: hidden` alone drops the scroll position and the
    // page jumps. Pinning the body at a negative offset instead holds the view
    // exactly where it was, and putting it back is a plain scrollTo.
    const y = window.scrollY;
    restoreTo.current = y;
    body.style.top = `-${y}px`;
    body.classList.add("is-play-locked");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") unlock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.classList.remove("is-play-locked");
      body.style.top = "";
      window.scrollTo({ top: restoreTo.current, behavior: "instant" });
    };
  }, [locked, unlock]);

  return (
    <div className={`arcade-lock-bar${locked ? " is-locked" : ""}`}>
      <button
        type="button"
        className="arcade-lock-button"
        onClick={() => setLocked((on) => !on)}
        aria-pressed={locked}
      >
        <span aria-hidden="true">{locked ? "🔓" : "🔒"}</span>
        {locked ? "Unfreeze page" : "Freeze screen"}
      </button>
      <small>
        {locked
          ? "Page scrolling is off so the board stays put. Esc also unfreezes."
          : "Stops the page scrolling while you swipe or tap the board."}
      </small>
    </div>
  );
}

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
    // Remember where we were so unfreezing doesn't jump the reader elsewhere.
    restoreTo.current = window.scrollY;
    body.classList.add("is-play-locked");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") unlock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      body.classList.remove("is-play-locked");
      window.scrollTo({ top: restoreTo.current, behavior: "instant" });
    };
  }, [locked, unlock]);

  function toggle() {
    if (locked) {
      unlock();
      return;
    }
    // Centre the board first, so freezing never strands the player looking at
    // the page header.
    document
      .querySelector(".paper-game, .match-game, .shore-run, .tow-chain")
      ?.scrollIntoView({ block: "center", behavior: "instant" });
    setLocked(true);
  }

  return (
    <div className={`arcade-lock-bar${locked ? " is-locked" : ""}`}>
      <button
        type="button"
        className="arcade-lock-button"
        onClick={toggle}
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * "Full screen" — a real fullscreen for the arcade, with a scroll-lock
 * fallback for browsers that cannot fullscreen an element (iPhone Safari).
 *
 * Swiping a game board also drags the page, so the board slides out from under
 * your thumb mid-move. Fullscreen pins the board in place: the page stops
 * scrolling and the game takes the whole screen, with the exit pill always in
 * reach. Where the Fullscreen API exists it is used on the `.arcade-stage`;
 * elsewhere the stage becomes a fixed overlay via the `is-play-locked` body
 * class (the same layout, no API needed).
 */
export function PlayLock() {
  const [active, setActive] = useState(false);
  const [native, setNative] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef(0);
  const pinnedRef = useRef(false);
  const nativeRef = useRef(false);
  // Set the moment the player leaves the lock themselves. The auto-arm below
  // checks it, so exiting stays possible — otherwise the next touch on the
  // board would immediately re-lock and there would be no way out.
  const dismissedRef = useRef(false);

  const stage = () => barRef.current?.closest<HTMLElement>(".arcade-stage") ?? null;

  const enterFallback = useCallback(() => {
    // Freezing with `overflow: hidden` alone drops the scroll position and the
    // page jumps. Pinning the body at a negative offset instead holds the view
    // exactly where it was, and putting it back is a plain scrollTo.
    const y = window.scrollY;
    restoreTo.current = y;
    document.body.style.top = `-${y}px`;
    // iOS Safari scrolls `html`, not `body` — locking body alone still lets
    // the page rubber-band underneath the fixed overlay there.
    document.documentElement.classList.add("is-play-locked");
    document.body.classList.add("is-play-locked");
    pinnedRef.current = true;
    nativeRef.current = false;
    setNative(false);
    setActive(true);
  }, []);

  const exitFallback = useCallback(() => {
    if (!pinnedRef.current) return;
    pinnedRef.current = false;
    document.documentElement.classList.remove("is-play-locked");
    document.body.classList.remove("is-play-locked");
    document.body.style.top = "";
    window.scrollTo({ top: restoreTo.current, behavior: "instant" });
    setActive(false);
  }, []);

  const activate = useCallback(() => {
    const el = stage();
    if (el && typeof el.requestFullscreen === "function") {
      el.requestFullscreen()
        .then(() => {
          nativeRef.current = true;
          setNative(true);
          setActive(true);
        })
        .catch(() => enterFallback());
    } else {
      enterFallback();
    }
  }, [enterFallback]);

  const deactivate = useCallback(() => {
    dismissedRef.current = true;
    if (nativeRef.current) {
      if (document.fullscreenElement) void document.exitFullscreen();
      // fullscreenchange updates the state when the browser actually exits.
    } else {
      exitFallback();
    }
  }, [exitFallback]);

  const toggle = useCallback(() => {
    if (active) deactivate();
    else activate();
  }, [active, activate, deactivate]);

  // Touching a board used to drag the page with it, so the game slid out from
  // under your thumb mid-move. The lock always fixed that, but only if you
  // noticed the button first — so on touch devices the first contact with the
  // board arms it for you.
  //
  // Two deliberate limits. It only applies to coarse pointers: a mouse cannot
  // drag the page by accident, and freezing a desktop page nobody asked to
  // freeze is rude. And it never re-arms after a manual exit — without that,
  // leaving would be impossible, because the next touch would lock it again.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: coarse)").matches) return;

    const surface = barRef.current?.closest(".arcade-stage")?.querySelector(".arcade-play-surface");
    if (!surface) return;

    const onFirstTouch = () => {
      if (pinnedRef.current || nativeRef.current || dismissedRef.current) return;
      enterFallback();
    };
    surface.addEventListener("pointerdown", onFirstTouch);
    return () => surface.removeEventListener("pointerdown", onFirstTouch);
  }, [enterFallback]);

  // Belt-and-suspenders for iOS Safari: `position: fixed` + `overflow: hidden`
  // on html/body is the standard scroll lock, but iOS still lets a touch that
  // starts outside any scrollable element bubble into a page scroll/bounce.
  // While the fallback lock is active, swallow touchmove everywhere except
  // inside the play surface itself, which keeps its own scroll.
  useEffect(() => {
    if (!active || native) return;
    const surface = barRef.current?.closest(".arcade-stage")?.querySelector(".arcade-play-surface");
    const onTouchMove = (event: TouchEvent) => {
      if (surface && event.target instanceof Node && surface.contains(event.target)) return;
      event.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => document.removeEventListener("touchmove", onTouchMove);
  }, [active, native]);

  // Track native fullscreen enter/exit (including the browser's own Esc).
  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement) {
        nativeRef.current = true;
        setNative(true);
        setActive(true);
      } else if (nativeRef.current) {
        nativeRef.current = false;
        setNative(false);
        setActive(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // While active: Esc exits; clean up the fallback pin on unmount.
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      dismissedRef.current = true;
      if (nativeRef.current) {
        if (document.fullscreenElement) void document.exitFullscreen();
      } else {
        exitFallback();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (pinnedRef.current) {
        pinnedRef.current = false;
        document.documentElement.classList.remove("is-play-locked");
        document.body.classList.remove("is-play-locked");
        document.body.style.top = "";
        window.scrollTo({ top: restoreTo.current, behavior: "instant" });
      }
    };
  }, [active, exitFallback]);

  return (
    <div ref={barRef} className={`arcade-lock-bar${active ? " is-locked" : ""}`}>
      <button type="button" className="arcade-lock-button" onClick={toggle} aria-pressed={active}>
        <span aria-hidden="true">{active ? "⤢" : "⤡"}</span>
        {active ? "Exit full screen" : "Full screen"}
      </button>
      <small>
        {active
          ? native
            ? "The game takes over the screen. Esc also exits."
            : "Page scrolling is off so the board stays put. Esc also exits."
          : "Takes over the screen and stops the page scrolling while you play."}
      </small>
    </div>
  );
}

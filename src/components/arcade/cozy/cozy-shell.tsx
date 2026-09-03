"use client";

import { useEffect, useRef } from "react";
import { type AmbienceLayer, ambience } from "@/lib/arcade/garage-audio";

/**
 * The frame every cozy scene sits in: the newspaper header the rest of the
 * arcade uses, an ambience switch, and a line reminding you there is nothing
 * to win here.
 */
export function CozyShell({
  title,
  edition,
  note,
  soundOn,
  onSoundChange,
  children,
}: {
  title: string;
  edition: string;
  note: string;
  soundOn: boolean;
  onSoundChange: (on: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="paper-game cozy-scene">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">{edition}</p>
          <h2>{title}</h2>
        </div>
        <div className="match-game-controls">
          <button type="button" aria-pressed={soundOn} onClick={() => onSoundChange(!soundOn)}>
            {soundOn ? "Ambience on" : "Ambience off"}
          </button>
        </div>
      </header>
      <p className="cozy-note">{note}</p>
      {children}
    </div>
  );
}

/**
 * Keeps a scene's sustained beds in step with its state, and — importantly —
 * shuts everything off when the player leaves. A cozy scene that keeps raining
 * after you have navigated away is not cozy.
 */
export function useAmbience(on: boolean, levels: Partial<Record<AmbienceLayer, number>>) {
  const serialised = JSON.stringify(levels);
  useEffect(() => {
    const next: Partial<Record<AmbienceLayer, number>> = JSON.parse(serialised);
    for (const [layer, level] of Object.entries(next)) {
      ambience.set(layer as AmbienceLayer, on ? (level as number) : 0);
    }
  }, [on, serialised]);

  useEffect(() => () => ambience.stopAll(), []);
}

/** A canvas that redraws through a render callback, paused when off-screen. */
export function useSceneCanvas(
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void,
  width: number,
  height: number,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  // Refreshed in an effect, not during render: the draw callback is rebuilt
  // every render as the scene's state changes, and the loop below always
  // needs the newest one.
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let frame = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      frame += 1;
      drawRef.current(ctx, frame);
      // Reduced motion still gets the scene, just without the loop.
      if (!reduce) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return ref;
}

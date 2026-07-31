"use client";

import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";
import { arcadePresets } from "@/lib/arcade";

const BEST_KEY = "ohat-dragstrip-best";
// A clean launch, not a professional one — most people clear this first try.
const WIN_MS = arcadePresets.dragStrip.prizeReactionMs;

type Phase = "ready" | "staging" | "green" | "jumped" | "done";

function readBest(): number | null {
  try {
    const stored = window.localStorage.getItem(BEST_KEY);
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

/**
 * A drag-race Christmas tree: three ambers light in sequence, then — after a
 * random hold so it cannot be memorised — the green. Tap when it drops.
 * Tapping early is a red-light foul, just like the real strip.
 */
export function DragStrip() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [lights, setLights] = useState(0);
  const [reaction, setReaction] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const [sound, setSound] = useState(true);
  const timers = useRef<number[]>([]);
  const greenAt = useRef(0);
  const soundOn = useRef(true);

  useEffect(() => {
    soundOn.current = sound;
  }, [sound]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  function schedule(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function stage() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setBest(readBest());
    setReaction(null);
    setLights(0);
    setPhase("staging");
    if (soundOn.current) garageAudio.ignition();
    [1, 2, 3].forEach((count) => {
      schedule(() => {
        setLights(count);
        if (soundOn.current) garageAudio.beep(330);
      }, 550 * count);
    });
    // The hold after the last amber varies 0.9–2.4s so anticipation, not
    // memory, is what gets tested.
    schedule(() => {
      greenAt.current = performance.now();
      setPhase("green");
      setLights(4);
      if (soundOn.current) garageAudio.beep(523);
    }, 550 * 3 + 900 + Math.random() * 1500);
  }

  function launch() {
    if (phase === "staging") {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      setPhase("jumped");
      if (soundOn.current) garageAudio.skid();
      return;
    }
    if (phase !== "green") return;
    const ms = Math.round(performance.now() - greenAt.current);
    setReaction(ms);
    setPhase("done");
    if (ms <= WIN_MS) setWon(true);
    if (soundOn.current) garageAudio.horn();
    const previous = readBest();
    if (previous === null || ms < previous) {
      try {
        window.localStorage.setItem(BEST_KEY, String(ms));
      } catch {
        // No stored best is fine.
      }
      setBest(ms);
    }
  }

  const verdict =
    reaction === null ? null
    : reaction < 200 ? "Pro-tree territory. Serious wheels."
    : reaction < 300 ? "Sharp launch — you'd take this lane."
    : reaction < 450 ? "Solid. The coffee is working."
    : "A gentle Sunday cruise off the line.";

  return (
    <div className="drag-strip">
      <div className="match-game-bar">
        <p className="match-game-status" role="status">
          {phase === "ready" && "Stage your car, watch the tree, launch on green."}
          {phase === "staging" && "Easy… wait for the green."}
          {phase === "green" && "GREEN — GO!"}
          {phase === "jumped" && "Red light! You left before the green."}
          {phase === "done" && reaction !== null && `${reaction} ms. ${verdict}`}
        </p>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`drag-strip-stage drag-strip-${phase}`}
        onClick={phase === "staging" || phase === "green" ? launch : stage}
      >
        <span className="drag-tree" aria-hidden="true">
          {[1, 2, 3].map((row) => (
            <i key={row} className={lights >= row && lights < 4 ? "is-amber" : ""} />
          ))}
          <i className={lights === 4 ? "is-green" : ""} />
        </span>
        <strong>
          {phase === "ready" && "Tap to stage"}
          {phase === "staging" && "Wait for it…"}
          {phase === "green" && "LAUNCH!"}
          {phase === "jumped" && "Foul — tap to restage"}
          {phase === "done" && "Tap to run again"}
        </strong>
        {best !== null ? <small>Personal best: {best} ms</small> : null}
        <span className="drag-lane" aria-hidden="true">
          <span className="drag-start-line" />
          <span className="drag-car"><i /><b /></span>
          <span className="drag-finish-line" />
        </span>
      </button>
      {won ? (
        <PrizeBanner achievement={`Clean launch — under ${WIN_MS} ms off the line.`} />
      ) : null}
    </div>
  );
}

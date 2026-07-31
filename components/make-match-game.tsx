"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { brandSrc, makes } from "@/lib/makes";

const PAIRS = 8;
const BEST_KEY = "ohat-match-best";

type Tile = { id: number; name: string; matched: boolean };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// A fresh subset of the brand list every round, then a shuffle of the
// positions, so no two games present the same board.
function buildDeck(): Tile[] {
  return shuffle(shuffle(makes).slice(0, PAIRS).flatMap((name) => [name, name]))
    .map((name, index) => ({ id: index, name, matched: false }));
}

function readBest(): number | null {
  try {
    const stored = window.localStorage.getItem(BEST_KEY);
    return stored ? Number(stored) : null;
  } catch {
    // Private browsing can refuse storage; no personal best is fine.
    return null;
  }
}

// Small synthesised horn and engine blips. Generating them with the Web Audio
// API keeps the page self-contained — no audio files to ship or fail to load.
function useGarageSounds(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => void ctxRef.current?.close();
  }, []);

  return useCallback(
    (freqs: number[], duration: number, type: OscillatorType = "square") => {
      if (!enabled) return;
      try {
        ctxRef.current ??= new AudioContext();
        const ctx = ctxRef.current;
        // Browsers hold the context suspended until a user gesture; every call
        // here follows a tap, so resuming is allowed.
        if (ctx.state === "suspended") void ctx.resume();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        gain.connect(ctx.destination);
        for (const freq of freqs) {
          const osc = ctx.createOscillator();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.connect(gain);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }
      } catch {
        // A blocked or unavailable AudioContext must never break the game.
      }
    },
    [enabled],
  );
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MakeMatchGame({ heading = "h2" }: { heading?: "h2" | "h1" }) {
  // The board starts empty and is dealt by an explicit action. That keeps the
  // shuffle off the server render — where it would hand the browser different
  // markup than it hydrates — and guarantees the user gesture that browsers
  // require before any audio can play.
  const [deck, setDeck] = useState<Tile[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const play = useGarageSounds(sound);
  const Heading = heading;

  const won = deck.length > 0 && deck.every((tile) => tile.matched);
  const matched = deck.filter((tile) => tile.matched).length / 2;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function deal() {
    setDeck(buildDeck());
    setPicked([]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setBest(readBest());
  }

  function choose(tile: Tile) {
    // Two tiles already face up means a mismatch is still being shown.
    if (picked.length === 2 || tile.matched || picked.includes(tile.id)) return;
    play([180], 0.09, "sawtooth");

    if (picked.length === 0) {
      setPicked([tile.id]);
      setRunning(true);
      return;
    }

    const first = deck.find((candidate) => candidate.id === picked[0]);
    const nextMoves = moves + 1;
    setMoves(nextMoves);

    if (first && first.name === tile.name) {
      const nextDeck = deck.map((candidate) =>
        candidate.id === first.id || candidate.id === tile.id
          ? { ...candidate, matched: true }
          : candidate,
      );
      setDeck(nextDeck);
      setPicked([]);

      if (nextDeck.every((candidate) => candidate.matched)) {
        setRunning(false);
        play([523, 659, 784], 0.55);
        const previous = readBest();
        if (previous === null || nextMoves < previous) {
          try {
            window.localStorage.setItem(BEST_KEY, String(nextMoves));
          } catch {
            // Storage failures should not interrupt the celebration.
          }
          setBest(nextMoves);
        }
      } else {
        play([440, 554], 0.28);
      }
      return;
    }

    setPicked([picked[0], tile.id]);
    play([120], 0.16, "sawtooth");
    window.setTimeout(() => setPicked([]), 800);
  }

  if (deck.length === 0) {
    return (
      <div className="match-game match-game-start">
        <Heading className="match-game-title">Logo match</Heading>
        <p>
          Flip the badges face down and find the matching pairs. Every round
          deals a different set from the makes we service.
        </p>
        <button type="button" className="button button-primary" onClick={deal}>
          Deal the deck
        </button>
      </div>
    );
  }

  return (
    <div className="match-game">
      <div className="match-game-bar">
        <Heading className="match-game-title">Logo match</Heading>
        <dl className="match-game-score">
          <div>
            <dt>Pairs</dt>
            <dd>{matched}/{PAIRS}</dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd>{moves}</dd>
          </div>
          {/* Counts up, never down — a curiosity, not a deadline. */}
          <div>
            <dt>Time</dt>
            <dd>{formatClock(seconds)}</dd>
          </div>
          {best !== null ? (
            <div>
              <dt>Best</dt>
              <dd>{best}</dd>
            </div>
          ) : null}
        </dl>
        <div className="match-game-controls">
          <button
            type="button"
            onClick={() => setSound((on) => !on)}
            aria-pressed={sound}
          >
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={deal}>New game</button>
        </div>
      </div>

      <p className="match-game-status" role="status">
        {won
          ? `Cleared in ${moves} moves and ${formatClock(seconds)}. Nice work.`
          : `Find a matching pair — ${PAIRS - matched} to go.`}
      </p>

      <ul className={`match-grid${won ? " match-grid-won" : ""}`}>
        {deck.map((tile) => {
          const showing = tile.matched || picked.includes(tile.id);
          return (
            <li key={tile.id}>
              <button
                type="button"
                className={`match-tile${showing ? " is-showing" : ""}${tile.matched ? " is-matched" : ""}`}
                onClick={() => choose(tile)}
                disabled={tile.matched}
                aria-label={showing ? tile.name : "Hidden tile — flip to reveal"}
              >
                <span className="match-tile-inner">
                  <span className="match-tile-back" aria-hidden="true">
                    <b>OHAT</b>
                  </span>
                  <span className="match-tile-face">
                    <Image
                      src={brandSrc(tile.name)}
                      width={44}
                      height={44}
                      alt=""
                      aria-hidden="true"
                    />
                    <small>{tile.name}</small>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

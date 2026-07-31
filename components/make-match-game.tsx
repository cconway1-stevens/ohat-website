"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./arcade/prize";
import { brandSrc, makes, shuffle } from "@/lib/makes";

const PAIRS = 10;
const BEST_KEY = "ohat-match-best";

type Tile = { id: number; name: string; matched: boolean };

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
  // The mismatch flip-back timer, held so dealing a new board can cancel it —
  // left running it would wipe the first pick of the next game.
  const flipBack = useRef<number | null>(null);
  const Heading = heading;

  useEffect(() => {
    return () => {
      if (flipBack.current !== null) window.clearTimeout(flipBack.current);
    };
  }, []);

  const won = deck.length > 0 && deck.every((tile) => tile.matched);
  const matched = deck.filter((tile) => tile.matched).length / 2;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function play(effect: keyof typeof garageAudio) {
    if (sound) garageAudio[effect]();
  }

  function deal() {
    if (flipBack.current !== null) window.clearTimeout(flipBack.current);
    flipBack.current = null;
    play("ignition");
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

    if (picked.length === 0) {
      play("rev");
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
        play("fanfare");
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
        play("horn");
      }
      return;
    }

    setPicked([picked[0], tile.id]);
    play("skid");
    flipBack.current = window.setTimeout(() => {
      flipBack.current = null;
      setPicked([]);
    }, 800);
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

      {won ? <PrizeBanner achievement="Every pair matched — the whole board cleared." /> : null}
    </div>
  );
}

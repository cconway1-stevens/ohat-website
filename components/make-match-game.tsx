"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./arcade/prize";
import { brandSrc, makes, shuffle } from "@/lib/makes";
import { arcadePresets } from "@/lib/arcade";

const MATCH_CONFIG = arcadePresets.logoMatch;
const BEST_KEY = "ohat-match-best";

type Tile = { id: number; name: string; matched: boolean; free?: boolean };

function pairCount(gridSize: number) {
  return Math.floor((gridSize * gridSize) / 2);
}

function maxGridForWidth(width: number) {
  const assetLimit = Math.floor(Math.sqrt(makes.length * 2));
  const screenLimit =
    width >= MATCH_CONFIG.breakpoints.desktop
      ? MATCH_CONFIG.responsiveMaxGrid.desktop
      : width >= MATCH_CONFIG.breakpoints.tablet
        ? MATCH_CONFIG.responsiveMaxGrid.tablet
        : MATCH_CONFIG.responsiveMaxGrid.mobile;
  return Math.min(assetLimit, screenLimit);
}

// Odd grids reserve their exact center for a permanently open Free Bay. This
// leaves an even number of logo tiles, so every badge still has one true pair.
function buildDeck(gridSize: number): Tile[] {
  const logos = shuffle(makes).slice(0, pairCount(gridSize));
  const tiles: Omit<Tile, "id">[] = shuffle(logos.flatMap((name) => [name, name])).map((name) => ({
    name,
    matched: false,
  }));

  if (gridSize % 2 === 1) {
    tiles.splice(Math.floor(tiles.length / 2), 0, {
      name: "Free Bay",
      matched: true,
      free: true,
    });
  }

  return tiles.map((tile, id) => ({ ...tile, id }));
}

function readBest(gridSize: number): number | null {
  try {
    const stored = window.localStorage.getItem(`${BEST_KEY}-${gridSize}`);
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MakeMatchGame({
  heading = "h2",
  // The arcade dresses the game as a newspaper page, matching Garage Guess.
  // The copy embedded in the shop pages keeps the plainer card.
  paper = false,
}: {
  heading?: "h2" | "h1";
  paper?: boolean;
}) {
  const [deck, setDeck] = useState<Tile[]>([]);
  const [gridSize, setGridSize] = useState<number>(MATCH_CONFIG.defaultGrid);
  const [maxGrid, setMaxGrid] = useState<number>(MATCH_CONFIG.responsiveMaxGrid.mobile);
  const [customSize, setCustomSize] = useState<number>(MATCH_CONFIG.defaultGrid);
  const [customOpen, setCustomOpen] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const flipBack = useRef<number | null>(null);
  const Heading = heading;

  useEffect(() => {
    const updateLimit = () => {
      const nextMax = maxGridForWidth(window.innerWidth);
      setMaxGrid(nextMax);
      setCustomSize((size) => Math.min(size, nextMax));
    };
    updateLimit();
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  useEffect(() => {
    if (!customOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCustomOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [customOpen]);

  useEffect(() => {
    return () => {
      if (flipBack.current !== null) window.clearTimeout(flipBack.current);
    };
  }, []);

  const totalPairs = pairCount(gridSize);
  const won = deck.length > 0 && deck.every((tile) => tile.matched);
  const matched = deck.filter((tile) => tile.matched && !tile.free).length / 2;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function play(effect: keyof typeof garageAudio) {
    if (sound) garageAudio[effect]();
  }

  function deal(nextGrid = gridSize) {
    if (flipBack.current !== null) window.clearTimeout(flipBack.current);
    flipBack.current = null;
    play("ignition");
    setGridSize(nextGrid);
    setDeck(buildDeck(nextGrid));
    setPicked([]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setBest(readBest(nextGrid));
  }

  function choose(tile: Tile) {
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
        const previous = readBest(gridSize);
        if (previous === null || nextMoves < previous) {
          try {
            window.localStorage.setItem(`${BEST_KEY}-${gridSize}`, String(nextMoves));
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

  const modeControls = (
    <div className="match-mode-picker" aria-label="Board size">
      {MATCH_CONFIG.modes.map((size) => (
        <button
          key={size}
          type="button"
          className={gridSize === size ? "is-active" : ""}
          aria-pressed={gridSize === size}
          onClick={() => deal(size)}
        >
          {size}x{size}
        </button>
      ))}
      <button type="button" onClick={() => setCustomOpen(true)}>
        Custom
      </button>
    </div>
  );

  const customDialog = customOpen ? (
    <div
      className="match-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setCustomOpen(false);
      }}
    >
      <section
        className="match-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-custom-title"
      >
        <button
          type="button"
          className="match-dialog-close"
          aria-label="Close custom board settings"
          onClick={() => setCustomOpen(false)}
          autoFocus
        >
          x
        </button>
        <p className="eyebrow">Build a board</p>
        <h3 id="match-custom-title">Custom garage</h3>
        <output htmlFor="match-grid-size" className="match-dialog-size">
          {customSize}x{customSize}
        </output>
        <input
          id="match-grid-size"
          type="range"
          min={MATCH_CONFIG.customMinGrid}
          max={maxGrid}
          step="1"
          value={customSize}
          onChange={(event) => setCustomSize(Number(event.target.value))}
          aria-label="Custom board size"
        />
        <p>
          {pairCount(customSize)} logo pairs from {makes.length} available makes.
          {customSize % 2 === 1 ? " The center is a Free Bay." : ""}
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            setCustomOpen(false);
            deal(customSize);
          }}
        >
          Open this garage
        </button>
        <small>
          This screen supports boards up to {maxGrid}x{maxGrid}.
        </small>
      </section>
    </div>
  ) : null;

  if (deck.length === 0) {
    return (
      <div className={paper ? "paper-game paper-game-start" : "match-game match-game-start"}>
        {paper ? <p className="paper-game-edition">The Ocean Heights Motoring Page</p> : null}
        <Heading className="match-game-title">Logo match</Heading>
        <p>
          Open the service bays and match the vehicle badges. Pick a quick shift or build a custom
          garage.
        </p>
        {modeControls}
        {customDialog}
      </div>
    );
  }

  return (
    <div className={paper ? "paper-game match-game" : "match-game"}>
      {paper ? (
        <header className="paper-game-header">
          <div>
            <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
            <Heading className="match-game-title">Logo match</Heading>
          </div>
          <div className="match-game-controls">
            <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
              {sound ? "Sound on" : "Sound off"}
            </button>
            <button type="button" onClick={() => deal()}>
              New game
            </button>
          </div>
        </header>
      ) : null}
      <div className="match-game-bar">
        {paper ? null : <Heading className="match-game-title">Logo match</Heading>}
        <dl className="match-game-score">
          <div>
            <dt>Bays cleared</dt>
            <dd>
              {matched}/{totalPairs}
            </dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd>{moves}</dd>
          </div>
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
        {paper ? null : (
          <div className="match-game-controls">
            <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
              {sound ? "Sound on" : "Sound off"}
            </button>
            <button type="button" onClick={() => deal()}>
              New game
            </button>
          </div>
        )}
      </div>

      {modeControls}
      <p className="match-game-status" role="status">
        {won
          ? `Every service bay cleared in ${moves} moves and ${formatClock(seconds)}.`
          : `Match the badges - ${totalPairs - matched} service bay${totalPairs - matched === 1 ? "" : "s"} left.`}
      </p>

      <ul
        className={`match-grid${won ? " match-grid-won" : ""}`}
        style={{ "--match-grid-size": gridSize } as CSSProperties}
      >
        {deck.map((tile) => {
          const showing = tile.matched || picked.includes(tile.id);
          return (
            <li key={tile.id}>
              <button
                type="button"
                className={`match-tile${showing ? " is-showing" : ""}${tile.matched ? " is-matched" : ""}${tile.free ? " is-free" : ""}`}
                onClick={() => choose(tile)}
                disabled={tile.matched}
                aria-label={
                  tile.free ? "Free Bay" : showing ? tile.name : "Hidden tile - flip to reveal"
                }
              >
                <span className="match-tile-inner">
                  <span className="match-tile-back" aria-hidden="true">
                    <b className="match-card-mark">OHAT</b>
                  </span>
                  <span className="match-tile-face">
                    {tile.free ? (
                      <>
                        <b className="match-free-mark">OHAT</b>
                        <small>Free bay</small>
                      </>
                    ) : (
                      <>
                        <Image
                          src={brandSrc(tile.name)}
                          width={44}
                          height={44}
                          alt=""
                          aria-hidden="true"
                          unoptimized
                        />
                        <small>{tile.name}</small>
                      </>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {won ? (
        <PrizeBanner
          sound={sound}
          achievement={`Every pair matched on the ${gridSize}x${gridSize} board.`}
        />
      ) : null}
      {customDialog}
    </div>
  );
}

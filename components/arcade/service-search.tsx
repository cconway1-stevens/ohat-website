"use client";

import { type CSSProperties, useState } from "react";
import { arcadePresets } from "@/lib/arcade";
import {
  createSearch,
  type Difficulty,
  keyFor,
  lineBetween,
  type Point,
  type SearchPuzzle,
} from "@/lib/word-search";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";

const CONFIG = arcadePresets.serviceSearch;

function SearchExample() {
  return (
    <div className="service-search-example" aria-label="Example: tap T first, then E, to select TIRE">
      <div className="service-search-example-word" aria-hidden="true">
        {Array.from("TIRE").map((letter, index) => (
          <span key={letter} className={index === 0 ? "is-start" : index === 3 ? "is-end" : ""}>
            {letter}
            {index === 0 ? <small>1 Start</small> : null}
            {index === 3 ? <small>2 End</small> : null}
          </span>
        ))}
      </div>
      <p><strong>Example:</strong> For TIRE, tap <b>T</b> first, then <b>E</b>. Skip I and R; the game selects the whole word.</p>
    </div>
  );
}

export function ServiceSearch() {
  const [puzzle, setPuzzle] = useState<SearchPuzzle | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(CONFIG.defaultDifficulty);
  const [start, setStart] = useState<Point | null>(null);
  const [found, setFound] = useState<string[]>([]);
  // Words the player gave up on and asked to be shown. Kept apart from `found`
  // so a revealed word still finishes the grid without quietly buying the
  // coupon — you can always start a fresh puzzle and go for the prize again.
  const [revealed, setRevealed] = useState<string[]>([]);
  const [message, setMessage] = useState("Tap the first letter, then the last letter. Skip the letters in between.");
  const [sound, setSound] = useState(true);

  const prizeWords = CONFIG.difficulties[difficulty].prizeWords;
  const solved = [...found, ...revealed];
  const won = found.length >= prizeWords;
  const complete = Boolean(puzzle && solved.length === puzzle.words.length);
  const remaining = puzzle ? puzzle.words.filter((entry) => !solved.includes(entry.word)) : [];
  const cellsOf = (words: string[]) =>
    new Set(puzzle?.words.filter((entry) => words.includes(entry.word)).flatMap((entry) => entry.cells) ?? []);
  const foundCells = cellsOf(found);
  const revealedCells = cellsOf(revealed);

  function startPuzzle(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setPuzzle(createSearch(nextDifficulty));
    setStart(null);
    setFound([]);
    setRevealed([]);
    setMessage("Tap the first letter, then the last letter. Skip the letters in between.");
    if (sound) garageAudio.ignition();
  }

  // Shows the one word the player is most likely stuck on — whichever is left,
  // taken in list order so it matches what they are staring at.
  function revealOne() {
    const next = remaining[0];
    if (!next) return;
    setRevealed((current) => [...current, next.word]);
    setStart(null);
    setMessage(
      `${next.word} is marked on the grid. Revealed words don't count toward the coupon.`,
    );
    if (sound) garageAudio.beep(300);
  }

  function revealAll() {
    if (remaining.length === 0) return;
    setRevealed((current) => [...current, ...remaining.map((entry) => entry.word)]);
    setStart(null);
    setMessage(
      `All ${remaining.length} remaining word${remaining.length === 1 ? "" : "s"} marked. Start a new puzzle to play for the coupon.`,
    );
    if (sound) garageAudio.skid();
  }

  const difficultyControls = (
    <div className="paper-game-difficulty" aria-label="Service search difficulty">
      {(Object.keys(CONFIG.difficulties) as Difficulty[]).map((level) => (
        <button
          key={level}
          type="button"
          className={difficulty === level ? "is-active" : ""}
          aria-pressed={difficulty === level}
          onClick={() => puzzle ? startPuzzle(level) : setDifficulty(level)}
        >
          {CONFIG.difficulties[level].label}
        </button>
      ))}
    </div>
  );

  function chooseCell(row: number, col: number) {
    if (!puzzle || complete) return;
    if (!start) {
      setStart({ row, col });
      setMessage("Now tap the last letter.");
      if (sound) garageAudio.beep(360);
      return;
    }

    const selected = lineBetween(start, { row, col });
    const match = puzzle.words.find((entry) =>
      !solved.includes(entry.word) &&
      (entry.cells.join("|") === selected.join("|") || entry.cells.join("|") === [...selected].reverse().join("|")),
    );
    setStart(null);
    if (!match) {
      setMessage("That line is clear. Try another route.");
      if (sound) garageAudio.skid();
      return;
    }

    const nextFound = [...found, match.word];
    const left = puzzle.words.length - nextFound.length - revealed.length;
    setFound(nextFound);
    setMessage(
      left === 0
        ? "Every service word found."
        : nextFound.length >= prizeWords
          ? `Prize earned. ${left} word${left === 1 ? "" : "s"} left in the grid.`
          : `${match.word} found. ${left} left in the grid.`,
    );
    if (sound) garageAudio.horn();
  }

  if (!puzzle) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
        <h2>Service search</h2>
        <p>Choose a difficulty, then find the shop words hidden in the paper.</p>
        {difficultyControls}
        <SearchExample />
        <button type="button" className="button button-primary" onClick={() => startPuzzle()}>
          Print a puzzle
        </button>
      </div>
    );
  }

  return (
    <div className="paper-game service-search-game">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2>Service search</h2>
          {difficultyControls}
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={() => startPuzzle()}>New puzzle</button>
        </div>
      </header>

      <p className="match-game-status" role="status">{message}</p>
      {/* Folded away once play starts: on a phone the worked example pushed
          the board itself below the fold. */}
      <details className="service-search-help">
        <summary>How do I select a word?</summary>
        <SearchExample />
      </details>
      <div className="service-search-layout">
        <div
          className="service-search-grid"
          style={{ "--search-size": puzzle.grid.length } as CSSProperties}
          aria-label="Automotive word search"
        >
          {puzzle.grid.flatMap((letters, row) => letters.map((letter, col) => {
            const key = keyFor(row, col);
            const selected = start?.row === row && start.col === col;
            return (
              <button
                key={key}
                type="button"
                className={`${foundCells.has(key) ? "is-found" : revealedCells.has(key) ? "is-revealed" : ""}${selected ? " is-selected" : ""}`}
                onClick={() => chooseCell(row, col)}
                aria-label={`Row ${row + 1}, column ${col + 1}, letter ${letter}`}
              >
                {letter}
              </button>
            );
          }))}
        </div>
        <aside className="service-search-list">
          <h3>Find these</h3>
          <ul>
            {puzzle.words.map((entry) => (
              <li
                key={entry.word}
                className={
                  found.includes(entry.word)
                    ? "is-found"
                    : revealed.includes(entry.word)
                      ? "is-revealed"
                      : ""
                }
              >
                {entry.word}
                {revealed.includes(entry.word) ? <small> shown</small> : null}
              </li>
            ))}
          </ul>
          <p>
            {found.length}/{puzzle.words.length} found
            {revealed.length > 0 ? ` · ${revealed.length} shown` : ""}
          </p>
        </aside>
      </div>

      {/* Stuck is not a dead end: mark one word, or give up and see them all. */}
      <div className="paper-game-actions">
        <button type="button" onClick={revealOne} disabled={remaining.length === 0}>
          Show me a word
        </button>
        <button type="button" onClick={revealAll} disabled={remaining.length === 0}>
          Reveal all {remaining.length > 0 ? `(${remaining.length})` : ""}
        </button>
      </div>

      {won && complete ? (
        <PrizeBanner sound={sound} achievement={`${prizeWords} service words found in the morning paper.`} />
      ) : null}
    </div>
  );
}

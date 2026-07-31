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
  const [message, setMessage] = useState("Tap the first letter, then the last letter. Skip the letters in between.");
  const [sound, setSound] = useState(true);

  const prizeWords = CONFIG.difficulties[difficulty].prizeWords;
  const won = found.length >= prizeWords;
  const complete = puzzle && found.length === puzzle.words.length;
  const foundCells = new Set(
    puzzle?.words.filter((entry) => found.includes(entry.word)).flatMap((entry) => entry.cells) ?? [],
  );

  function startPuzzle(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setPuzzle(createSearch(nextDifficulty));
    setStart(null);
    setFound([]);
    setMessage("Tap the first letter, then the last letter. Skip the letters in between.");
    if (sound) garageAudio.ignition();
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
      !found.includes(entry.word) &&
      (entry.cells.join("|") === selected.join("|") || entry.cells.join("|") === [...selected].reverse().join("|")),
    );
    setStart(null);
    if (!match) {
      setMessage("That line is clear. Try another route.");
      if (sound) garageAudio.skid();
      return;
    }

    const nextFound = [...found, match.word];
    setFound(nextFound);
    setMessage(
      nextFound.length === puzzle.words.length
        ? "Every service word found."
        : nextFound.length >= prizeWords
          ? `Prize earned. ${puzzle.words.length - nextFound.length} word${puzzle.words.length - nextFound.length === 1 ? "" : "s"} left in the grid.`
        : `${match.word} found. ${puzzle.words.length - nextFound.length} left in the grid.`,
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
                className={`${foundCells.has(key) ? "is-found" : ""}${selected ? " is-selected" : ""}`}
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
              <li key={entry.word} className={found.includes(entry.word) ? "is-found" : ""}>
                {entry.word}
              </li>
            ))}
          </ul>
          <p>{found.length}/{puzzle.words.length} found</p>
        </aside>
      </div>

      {won && complete ? (
        <PrizeBanner sound={sound} achievement={`${prizeWords} service words found in the morning paper.`} />
      ) : null}
    </div>
  );
}

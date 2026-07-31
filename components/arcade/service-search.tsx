"use client";

import { type CSSProperties, useState } from "react";
import { arcadePresets } from "@/lib/arcade";
import { garageAudio } from "@/lib/garage-audio";
import { PrizeBanner } from "./prize";

type Point = { row: number; col: number };
type HiddenWord = { word: string; cells: string[] };
type SearchPuzzle = { grid: string[][]; words: HiddenWord[] };

const CONFIG = arcadePresets.serviceSearch;
const SEARCH_WORDS = [
  "ALIGN", "AXLE", "BRAKE", "CLUTCH", "ENGINE", "FILTER", "FUEL",
  "GARAGE", "GEAR", "HOOD", "MIRROR", "OIL", "PISTON", "ROTOR",
  "SPARK", "TIRE", "TRUNK", "WHEEL", "WIPER", "AIRBAG", "BEARING",
  "BUMPER", "CALIPER", "CAMBER", "CASTER", "CHASSIS", "COOLANT",
  "DAMPER", "EXHAUST", "FENDER", "FUSE", "GASKET", "GRILLE", "HORN",
  "INJECTOR", "KEYFOB", "LUGNUT", "MILEAGE", "MOTOR", "OCTANE",
  "PICKUP", "PULLEY", "RELAY", "REVERSE", "SENSOR", "SHIFTER", "SHOCK",
  "SPARE", "STARTER", "STRUT", "SUNROOF", "TAILPIPE", "TOW", "TREAD",
  "TURBO", "VALVE", "VOLTAGE", "WAGON", "WINCH",
];
const DIRECTIONS: Point[] = [
  { row: 0, col: 1 }, { row: 0, col: -1 },
  { row: 1, col: 0 }, { row: -1, col: 0 },
  { row: 1, col: 1 }, { row: 1, col: -1 },
  { row: -1, col: 1 }, { row: -1, col: -1 },
];
const FILLERS = "AAAABCDEEEEFGHIIIIKLLMMNNNOOOOPRRRSSTTTTUWY";
const keyFor = (row: number, col: number) => `${row},${col}`;

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

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function createSearch(): SearchPuzzle {
  const size = CONFIG.gridSize;
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const words: HiddenWord[] = [];

  for (const word of shuffled(SEARCH_WORDS)) {
    if (words.length >= CONFIG.wordsPerPuzzle) break;
    const options: Point[][] = [];
    for (const direction of DIRECTIONS) {
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          const cells = Array.from({ length: word.length }, (_, index) => ({
            row: row + direction.row * index,
            col: col + direction.col * index,
          }));
          if (cells.some((cell) => cell.row < 0 || cell.col < 0 || cell.row >= size || cell.col >= size)) continue;
          if (cells.some((cell, index) => grid[cell.row][cell.col] && grid[cell.row][cell.col] !== word[index])) continue;
          options.push(cells);
        }
      }
    }
    if (options.length === 0) continue;
    const cells = options[Math.floor(Math.random() * options.length)];
    cells.forEach((cell, index) => { grid[cell.row][cell.col] = word[index]; });
    words.push({ word, cells: cells.map((cell) => keyFor(cell.row, cell.col)) });
  }

  grid.forEach((row) => row.forEach((letter, col) => {
    if (!letter) row[col] = FILLERS[Math.floor(Math.random() * FILLERS.length)];
  }));
  return { grid, words };
}

function lineBetween(start: Point, end: Point) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  if (rowDelta !== 0 && colDelta !== 0 && Math.abs(rowDelta) !== Math.abs(colDelta)) return [];
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta)) + 1;
  return Array.from({ length }, (_, index) => keyFor(
    start.row + rowStep * index,
    start.col + colStep * index,
  ));
}

export function ServiceSearch() {
  const [puzzle, setPuzzle] = useState<SearchPuzzle | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Tap the first letter, then the last letter. Skip the letters in between.");
  const [sound, setSound] = useState(true);

  const won = found.length >= CONFIG.prizeWords;
  const complete = puzzle && found.length === puzzle.words.length;
  const foundCells = new Set(
    puzzle?.words.filter((entry) => found.includes(entry.word)).flatMap((entry) => entry.cells) ?? [],
  );

  function startPuzzle() {
    setPuzzle(createSearch());
    setStart(null);
    setFound([]);
    setMessage("Tap the first letter, then the last letter. Skip the letters in between.");
    if (sound) garageAudio.ignition();
  }

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
        : nextFound.length >= CONFIG.prizeWords
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
        <p>Six shop words are hidden across, down, backward, and diagonally.</p>
        <SearchExample />
        <button type="button" className="button button-primary" onClick={startPuzzle}>
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
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={startPuzzle}>New puzzle</button>
        </div>
      </header>

      <p className="match-game-status" role="status">{message}</p>
      <SearchExample />
      <div className="service-search-layout">
        <div
          className="service-search-grid"
          style={{ "--search-size": CONFIG.gridSize } as CSSProperties}
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
        <PrizeBanner achievement={`${CONFIG.prizeWords} service words found in the morning paper.`} />
      ) : null}
    </div>
  );
}

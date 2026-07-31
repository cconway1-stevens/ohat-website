"use client";

import { type CSSProperties, useState } from "react";
import { garageAudio } from "@/lib/garage-audio";
import { arcadePresets } from "@/lib/arcade";
import { CLUE_BANK, type ClueWord, LEVELS_FOR } from "@/lib/arcade-words";
import { PrizeBanner } from "./prize";

type Direction = "across" | "down";
type WorkingEntry = ClueWord & { row: number; col: number; direction: Direction };
type PuzzleEntry = WorkingEntry & {
  id: string;
  number: number;
  cells: string[];
};
type PuzzleCell = { letter: string; number?: number; entries: string[] };
type CrosswordPuzzle = {
  rows: number;
  cols: number;
  cells: Record<string, PuzzleCell>;
  entries: PuzzleEntry[];
};

const CONFIG = arcadePresets.crossword;
type Difficulty = keyof typeof CONFIG.difficulties;

const keyFor = (row: number, col: number) => `${row},${col}`;

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function cellsFor(entry: WorkingEntry) {
  return Array.from({ length: entry.answer.length }, (_, index) => ({
    row: entry.row + (entry.direction === "down" ? index : 0),
    col: entry.col + (entry.direction === "across" ? index : 0),
  }));
}

function createCrossword(difficulty: Difficulty): CrosswordPuzzle {
  const settings = CONFIG.difficulties[difficulty];
  const levels: readonly string[] = LEVELS_FOR[settings.level];
  const availableWords = CLUE_BANK.filter(
    (word) =>
      levels.includes(word.level) &&
      word.answer.length >= settings.minLength &&
      word.answer.length <= settings.maxLength,
  );
  let best: WorkingEntry[] = [];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const words = shuffled(availableWords);
    const entries: WorkingEntry[] = [
      { ...words[0], row: 0, col: 0, direction: "across" },
    ];
    const letters = new Map<string, string>();
    const directions = new Map<string, Set<Direction>>();

    const addEntry = (entry: WorkingEntry) => {
      cellsFor(entry).forEach(({ row, col }, index) => {
        const key = keyFor(row, col);
        letters.set(key, entry.answer[index]);
        const used = directions.get(key) ?? new Set<Direction>();
        used.add(entry.direction);
        directions.set(key, used);
      });
    };
    addEntry(entries[0]);

    for (const word of words.slice(1)) {
      if (entries.length >= settings.wordsPerPuzzle) break;
      const options: WorkingEntry[] = [];

      for (const [cellKey, existingLetter] of letters) {
        const [crossRow, crossCol] = cellKey.split(",").map(Number);
        for (let letterIndex = 0; letterIndex < word.answer.length; letterIndex += 1) {
          if (word.answer[letterIndex] !== existingLetter) continue;
          for (const direction of shuffled<Direction>(["across", "down"])) {
            const row = crossRow - (direction === "down" ? letterIndex : 0);
            const col = crossCol - (direction === "across" ? letterIndex : 0);
            const candidate: WorkingEntry = { ...word, row, col, direction };
            const positions = cellsFor(candidate);
            const before = direction === "across"
              ? keyFor(row, col - 1)
              : keyFor(row - 1, col);
            const after = direction === "across"
              ? keyFor(row, col + word.answer.length)
              : keyFor(row + word.answer.length, col);
            if (letters.has(before) || letters.has(after)) continue;

            let crossings = 0;
            let valid = true;
            for (let index = 0; index < positions.length; index += 1) {
              const position = positions[index];
              const key = keyFor(position.row, position.col);
              const existing = letters.get(key);
              if (existing) {
                if (
                  existing !== word.answer[index] ||
                  directions.get(key)?.has(direction)
                ) {
                  valid = false;
                  break;
                }
                crossings += 1;
              } else {
                const neighbors = direction === "across"
                  ? [keyFor(position.row - 1, position.col), keyFor(position.row + 1, position.col)]
                  : [keyFor(position.row, position.col - 1), keyFor(position.row, position.col + 1)];
                if (neighbors.some((neighbor) => letters.has(neighbor))) {
                  valid = false;
                  break;
                }
              }
            }
            if (!valid || crossings === 0) continue;

            const allPositions = [
              ...[...letters.keys()].map((key) => {
                const [cellRow, cellCol] = key.split(",").map(Number);
                return { row: cellRow, col: cellCol };
              }),
              ...positions,
            ];
            const rows = allPositions.map((position) => position.row);
            const cols = allPositions.map((position) => position.col);
            if (
              Math.max(...rows) - Math.min(...rows) + 1 <= settings.maxGrid &&
              Math.max(...cols) - Math.min(...cols) + 1 <= settings.maxGrid
            ) {
              options.push(candidate);
            }
          }
        }
      }

      if (options.length > 0) {
        const choice = options[Math.floor(Math.random() * options.length)];
        entries.push(choice);
        addEntry(choice);
      }
    }

    if (entries.length > best.length) best = entries;
    if (entries.length >= settings.wordsPerPuzzle) break;
  }

  const occupied = best.flatMap(cellsFor);
  const minRow = Math.min(...occupied.map((cell) => cell.row));
  const minCol = Math.min(...occupied.map((cell) => cell.col));
  const normalized = best
    .map((entry) => ({ ...entry, row: entry.row - minRow, col: entry.col - minCol }))
    .sort((a, b) => a.row - b.row || a.col - b.col || a.direction.localeCompare(b.direction));
  const starts = new Map<string, number>();
  let clueNumber = 0;
  normalized.forEach((entry) => {
    const key = keyFor(entry.row, entry.col);
    if (!starts.has(key)) starts.set(key, ++clueNumber);
  });

  const cells: Record<string, PuzzleCell> = {};
  const entries = normalized.map((entry, index): PuzzleEntry => {
    const id = `${entry.direction}-${index}`;
    const entryCells = cellsFor(entry).map((cell) => keyFor(cell.row, cell.col));
    entryCells.forEach((key, letterIndex) => {
      cells[key] ??= {
        letter: entry.answer[letterIndex],
        number: starts.get(key),
        entries: [],
      };
      cells[key].entries.push(id);
    });
    return { ...entry, id, number: starts.get(keyFor(entry.row, entry.col))!, cells: entryCells };
  });
  const positions = Object.keys(cells).map((key) => key.split(",").map(Number));

  return {
    rows: Math.max(...positions.map(([row]) => row)) + 1,
    cols: Math.max(...positions.map(([, col]) => col)) + 1,
    cells,
    entries,
  };
}

export function GarageCrossword() {
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(CONFIG.defaultDifficulty);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("");
  const [checked, setChecked] = useState(false);
  const [sound, setSound] = useState(true);

  const activeEntry = puzzle?.entries.find((entry) => entry.id === activeId);
  const solved = Boolean(
    puzzle && Object.entries(puzzle.cells).every(([key, cell]) => answers[key] === cell.letter),
  );

  function startPuzzle(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    const next = createCrossword(nextDifficulty);
    setPuzzle(next);
    setAnswers({});
    setActiveId(next.entries[0]?.id ?? "");
    setChecked(false);
    if (sound) garageAudio.ignition();
  }

  const difficultyControls = (
    <div className="paper-game-difficulty" aria-label="Crossword difficulty">
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

  function focusCell(key: string) {
    document.querySelector<HTMLInputElement>(`[data-crossword-cell="${key}"]`)?.focus();
  }

  function moveInEntry(key: string, amount: number) {
    if (!activeEntry) return;
    const index = activeEntry.cells.indexOf(key);
    const next = activeEntry.cells[index + amount];
    if (next) focusCell(next);
  }

  function selectCell(key: string) {
    if (!puzzle) return;
    const entryIds = puzzle.cells[key].entries;
    if (!entryIds.includes(activeId)) setActiveId(entryIds[0]);
    else if (entryIds.length > 1) {
      setActiveId(entryIds[(entryIds.indexOf(activeId) + 1) % entryIds.length]);
    }
  }

  if (!puzzle) {
    return (
      <div className="paper-game paper-game-start">
        <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
        <h2>Garage crossword</h2>
        <p>Choose a difficulty, then open a fresh set of shop clues.</p>
        {difficultyControls}
        <button type="button" className="button button-primary" onClick={() => startPuzzle()}>
          Open the puzzle
        </button>
      </div>
    );
  }

  return (
    <div className="paper-game crossword-game">
      <header className="paper-game-header">
        <div>
          <p className="paper-game-edition">The Ocean Heights Motoring Page</p>
          <h2>Garage crossword</h2>
          {difficultyControls}
        </div>
        <div className="match-game-controls">
          <button type="button" onClick={() => setSound((on) => !on)} aria-pressed={sound}>
            {sound ? "Sound on" : "Sound off"}
          </button>
          <button type="button" onClick={() => startPuzzle()}>New puzzle</button>
        </div>
      </header>

      <p className="match-game-status" role="status">
        {solved
          ? "Puzzle complete. Every answer is road ready."
          : checked
            ? "Red letters need another look."
            : `${puzzle.entries.length} clues. Tap a square or clue to begin.`}
      </p>

      <div className="crossword-layout">
        <div
          className="crossword-grid"
          style={{
            "--crossword-cols": puzzle.cols,
            "--crossword-rows": puzzle.rows,
          } as CSSProperties}
          aria-label="Automotive crossword puzzle"
        >
          {Array.from({ length: puzzle.rows * puzzle.cols }, (_, index) => {
            const row = Math.floor(index / puzzle.cols);
            const col = index % puzzle.cols;
            const key = keyFor(row, col);
            const cell = puzzle.cells[key];
            if (!cell) return <span key={key} className="crossword-block" aria-hidden="true" />;
            const wrong = checked && answers[key] !== cell.letter;
            const active = activeEntry?.cells.includes(key);
            return (
              <label
                key={key}
                className={`crossword-cell${active ? " is-active" : ""}${wrong ? " is-wrong" : ""}`}
              >
                {cell.number ? <span>{cell.number}</span> : null}
                <input
                  data-crossword-cell={key}
                  value={answers[key] ?? ""}
                  maxLength={1}
                  inputMode="text"
                  autoCapitalize="characters"
                  aria-label={`Crossword square${cell.number ? ` ${cell.number}` : ""}`}
                  onClick={() => selectCell(key)}
                  onFocus={() => {
                    if (!cell.entries.includes(activeId)) setActiveId(cell.entries[0]);
                  }}
                  onChange={(event) => {
                    const letter = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
                    setAnswers((current) => ({ ...current, [key]: letter }));
                    setChecked(false);
                    if (letter) {
                      if (sound) garageAudio.beep(420);
                      window.setTimeout(() => moveInEntry(key, 1), 0);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !answers[key]) moveInEntry(key, -1);
                    if (event.key === "ArrowLeft") focusCell(keyFor(row, col - 1));
                    if (event.key === "ArrowRight") focusCell(keyFor(row, col + 1));
                    if (event.key === "ArrowUp") focusCell(keyFor(row - 1, col));
                    if (event.key === "ArrowDown") focusCell(keyFor(row + 1, col));
                  }}
                />
              </label>
            );
          })}
        </div>

        <div className="crossword-clues">
          {(["across", "down"] as const).map((direction) => (
            <section key={direction}>
              <h3>{direction}</h3>
              <ol>
                {puzzle.entries.filter((entry) => entry.direction === direction).map((entry) => (
                  <li key={entry.id} value={entry.number}>
                    <button
                      type="button"
                      className={entry.id === activeId ? "is-active" : ""}
                      onClick={() => {
                        setActiveId(entry.id);
                        focusCell(entry.cells.find((key) => !answers[key]) ?? entry.cells[0]);
                      }}
                    >
                      <b>{entry.number}.</b> {entry.clue}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <div className="paper-game-actions">
        <button
          type="button"
          onClick={() => {
            if (!activeEntry) return;
            const hintKey = activeEntry.cells.find((key) => !answers[key] || answers[key] !== puzzle.cells[key].letter);
            if (!hintKey) return;
            setAnswers((current) => ({ ...current, [hintKey]: puzzle.cells[hintKey].letter }));
            setChecked(false);
            if (sound) garageAudio.horn();
          }}
        >
          Reveal one letter
        </button>
        <button type="button" onClick={() => setChecked(true)}>Check answers</button>
      </div>

      {solved ? <PrizeBanner sound={sound} achievement="Garage crossword solved from bumper to bumper." /> : null}
    </div>
  );
}

// Crossword construction, kept out of the component so it can be tested
// directly. Pure and deterministic apart from Math.random.

import { arcadePresets } from "./arcade.ts";
import { type ClueWord, wordsForLevel } from "./arcade-words.ts";

const CONFIG = arcadePresets.crossword;
export type Difficulty = keyof typeof CONFIG.difficulties;

type Direction = "across" | "down";
type WorkingEntry = ClueWord & { row: number; col: number; direction: Direction };
type PuzzleEntry = WorkingEntry & {
  id: string;
  number: number;
  cells: string[];
};
type PuzzleCell = { letter: string; number?: number; entries: string[] };
export type CrosswordPuzzle = {
  rows: number;
  cols: number;
  cells: Record<string, PuzzleCell>;
  entries: PuzzleEntry[];
};

export const keyFor = (row: number, col: number) => `${row},${col}`;

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

export function createCrossword(difficulty: Difficulty): CrosswordPuzzle {
  const settings = CONFIG.difficulties[difficulty];
  const availableWords = wordsForLevel(settings.level, {
    minLength: settings.minLength,
    maxLength: settings.maxLength,
  });
  let best: WorkingEntry[] = [];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const words = shuffled(availableWords);
    const entries: WorkingEntry[] = [{ ...words[0], row: 0, col: 0, direction: "across" }];
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
            const before = direction === "across" ? keyFor(row, col - 1) : keyFor(row - 1, col);
            const after =
              direction === "across"
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
                if (existing !== word.answer[index] || directions.get(key)?.has(direction)) {
                  valid = false;
                  break;
                }
                crossings += 1;
              } else {
                const neighbors =
                  direction === "across"
                    ? [
                        keyFor(position.row - 1, position.col),
                        keyFor(position.row + 1, position.col),
                      ]
                    : [
                        keyFor(position.row, position.col - 1),
                        keyFor(position.row, position.col + 1),
                      ];
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

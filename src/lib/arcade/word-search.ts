// Word-search construction, kept out of the component so the modes can be
// tested directly.
import { arcadePresets } from "./arcade.ts";
import { wordsForLevel } from "./arcade-words.ts";

const CONFIG = arcadePresets.serviceSearch;
export type Difficulty = keyof typeof CONFIG.difficulties;

export type Point = { row: number; col: number };
export type HiddenWord = { word: string; cells: string[] };
export type SearchPuzzle = { grid: string[][]; words: HiddenWord[] };

// Ordered easiest-first and sliced by the difficulty's `directions` count:
// left-to-right and top-to-bottom first, then the two reversals, then the
// diagonals. Kids therefore never get a word spelled backwards.
export const DIRECTIONS: Point[] = [
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: -1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: -1 },
  { row: -1, col: 1 },
  { row: -1, col: -1 },
];
const FILLERS = "AAAABCDEEEEFGHIIIIKLLMMNNNOOOOPRRRSSTTTTUWY";
export const keyFor = (row: number, col: number) => `${row},${col}`;

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function createSearch(difficulty: Difficulty): SearchPuzzle {
  const settings = CONFIG.difficulties[difficulty];
  const size = settings.gridSize;
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const words: HiddenWord[] = [];
  // Same bank the crossword draws from — the search just ignores the clue.
  // A word has to fit the grid even on the diagonal, hence maxLength: size.
  const pool = wordsForLevel(settings.level, { minLength: 3, maxLength: size }).map(
    (entry) => entry.answer,
  );

  for (const word of shuffled(pool)) {
    if (words.length >= settings.wordsPerPuzzle) break;
    const options: Point[][] = [];
    for (const direction of DIRECTIONS.slice(0, settings.directions)) {
      for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
          const cells = Array.from({ length: word.length }, (_, index) => ({
            row: row + direction.row * index,
            col: col + direction.col * index,
          }));
          if (
            cells.some(
              (cell) => cell.row < 0 || cell.col < 0 || cell.row >= size || cell.col >= size,
            )
          )
            continue;
          if (
            cells.some(
              (cell, index) => grid[cell.row][cell.col] && grid[cell.row][cell.col] !== word[index],
            )
          )
            continue;
          options.push(cells);
        }
      }
    }
    if (options.length === 0) continue;
    const cells = options[Math.floor(Math.random() * options.length)];
    cells.forEach((cell, index) => {
      grid[cell.row][cell.col] = word[index];
    });
    words.push({ word, cells: cells.map((cell) => keyFor(cell.row, cell.col)) });
  }

  grid.forEach((row) =>
    row.forEach((letter, col) => {
      if (!letter) row[col] = FILLERS[Math.floor(Math.random() * FILLERS.length)];
    }),
  );
  return { grid, words };
}

export function lineBetween(start: Point, end: Point) {
  const rowDelta = end.row - start.row;
  const colDelta = end.col - start.col;
  if (rowDelta !== 0 && colDelta !== 0 && Math.abs(rowDelta) !== Math.abs(colDelta)) return [];
  const rowStep = Math.sign(rowDelta);
  const colStep = Math.sign(colDelta);
  const length = Math.max(Math.abs(rowDelta), Math.abs(colDelta)) + 1;
  return Array.from({ length }, (_, index) =>
    keyFor(start.row + rowStep * index, start.col + colStep * index),
  );
}

// The arcade's word games are generated fresh every round, so the thing worth
// testing is not one fixed puzzle but the generator: every difficulty must
// always produce a puzzle that is actually solvable, out of words that suit
// the level. Run with `node --test tests/arcade.test.mjs`.

import test from "node:test";
import assert from "node:assert/strict";

import { arcadePresets, badGarageGuessWords, garageGuessWords } from "../lib/arcade.ts";
import { CLUE_BANK, wordsForLevel } from "../lib/arcade-words.ts";
import { createCrossword } from "../lib/crossword.ts";
import { createSearch, DIRECTIONS } from "../lib/word-search.ts";

const ROUNDS = 120;
const LEVELS = ["kids", "easy", "advanced"];

/* ------------------------------- word bank ------------------------------ */

test("every clue answer is plain A-Z letters", () => {
  for (const entry of CLUE_BANK) {
    assert.match(entry.answer, /^[A-Z]+$/, `bad answer: ${entry.answer}`);
  }
});

test("no answer appears twice with different clues", () => {
  const seen = new Map();
  for (const entry of CLUE_BANK) {
    assert.equal(seen.has(entry.answer), false, `duplicate answer: ${entry.answer}`);
    seen.set(entry.answer, entry.clue);
  }
});

test("every entry carries a hardness level and a non-empty clue", () => {
  for (const entry of CLUE_BANK) {
    assert.ok(LEVELS.includes(entry.level), `${entry.answer} has level ${entry.level}`);
    assert.ok(entry.clue.trim().length > 0, `${entry.answer} has no clue`);
  }
});

test("answers that are two words say so in the clue", () => {
  for (const entry of CLUE_BANK) {
    if (entry.words && entry.words > 1) {
      assert.match(entry.clue, /\(\d wds\)$/, `${entry.answer} is missing its (2 wds) tag`);
    }
  }
});

test("a clue never gives away its own answer", () => {
  for (const entry of CLUE_BANK) {
    const clue = entry.clue.toUpperCase().replace(/\(\d WDS\)$/, "");
    assert.equal(
      clue.includes(entry.answer),
      false,
      `clue for ${entry.answer} contains the answer`,
    );
  }
});

/* ----------------------------- Garage Guess ----------------------------- */

test("every Garage Guess word is exactly the puzzle's word length", () => {
  // A short word here silently makes a round unwinnable: the player can never
  // type a guess equal to the answer.
  assert.deepEqual(badGarageGuessWords(), []);
  assert.equal(
    new Set(garageGuessWords).size,
    garageGuessWords.length,
    "duplicate word in the Garage Guess bank",
  );
});

test("Garage Guess has enough words to keep rounds varied", () => {
  assert.ok(garageGuessWords.length >= 20, `only ${garageGuessWords.length} words`);
});

/* ------------------------------- crossword ------------------------------ */

for (const level of LEVELS) {
  const settings = arcadePresets.crossword.difficulties[level];

  test(`crossword ${level}: the pool suits the level and the size`, () => {
    const pool = wordsForLevel(level, {
      minLength: settings.minLength,
      maxLength: settings.maxLength,
    });
    assert.ok(
      pool.length >= settings.wordsPerPuzzle * 3,
      `${level} pool is only ${pool.length} for ${settings.wordsPerPuzzle} words a puzzle`,
    );
    // Kids must never be handed shop jargon just because it happens to be short.
    if (level === "kids") {
      for (const entry of pool) assert.equal(entry.level, "kids", `${entry.answer} is not a kids word`);
    }
  });

  test(`crossword ${level}: every puzzle is complete and correctly spelled`, () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const puzzle = createCrossword(level);

      assert.equal(
        puzzle.entries.length,
        settings.wordsPerPuzzle,
        `${level} round ${round} produced ${puzzle.entries.length} clues`,
      );
      assert.ok(puzzle.rows <= settings.maxGrid && puzzle.cols <= settings.maxGrid,
        `${level} round ${round} grid is ${puzzle.rows}x${puzzle.cols}`);

      for (const entry of puzzle.entries) {
        // The letters actually sitting in the grid must spell the answer the
        // clue is asking for — this is the "words don't match the clue" check.
        const spelled = entry.cells.map((key) => puzzle.cells[key].letter).join("");
        assert.equal(spelled, entry.answer, `${entry.clue} -> grid spells ${spelled}`);
        assert.ok(entry.answer.length <= settings.maxLength);
        assert.ok(entry.answer.length >= settings.minLength);
      }

      // Numbering has to be unambiguous within a direction, or two clues in
      // the same list share a number and point at each other's squares.
      for (const direction of ["across", "down"]) {
        const numbers = puzzle.entries
          .filter((entry) => entry.direction === direction)
          .map((entry) => entry.number);
        assert.equal(new Set(numbers).size, numbers.length, `duplicate ${direction} number`);
      }

      // Every entry must cross at least one other, or it is a loose word
      // floating in the grid rather than part of a crossword.
      for (const entry of puzzle.entries) {
        const crosses = entry.cells.some((key) => puzzle.cells[key].entries.length > 1);
        assert.ok(crosses, `${entry.answer} does not cross anything`);
      }
    }
  });
}

/* ----------------------------- word search ------------------------------ */

for (const level of LEVELS) {
  const settings = arcadePresets.serviceSearch.difficulties[level];

  test(`word search ${level}: every puzzle hides its full word list`, () => {
    for (let round = 0; round < ROUNDS; round += 1) {
      const puzzle = createSearch(level);

      assert.equal(puzzle.grid.length, settings.gridSize);
      for (const row of puzzle.grid) {
        assert.equal(row.length, settings.gridSize);
        for (const letter of row) assert.match(letter, /^[A-Z]$/);
      }
      assert.equal(
        puzzle.words.length,
        settings.wordsPerPuzzle,
        `${level} round ${round} hid ${puzzle.words.length} words`,
      );
      assert.ok(
        settings.prizeWords <= puzzle.words.length,
        "the prize needs more words than the puzzle contains",
      );

      for (const hidden of puzzle.words) {
        // The letters under the word's cells must actually be the word,
        // otherwise it can be listed but never found.
        const spelled = hidden.cells
          .map((key) => {
            const [row, col] = key.split(",").map(Number);
            return puzzle.grid[row][col];
          })
          .join("");
        assert.equal(spelled, hidden.word, `${hidden.word} is not in the grid`);
      }
    }
  });

  test(`word search ${level}: only uses directions allowed at this level`, () => {
    const allowed = DIRECTIONS.slice(0, settings.directions);
    for (let round = 0; round < 40; round += 1) {
      for (const hidden of createSearch(level).words) {
        const [firstRow, firstCol] = hidden.cells[0].split(",").map(Number);
        const [nextRow, nextCol] = hidden.cells[1].split(",").map(Number);
        const step = { row: nextRow - firstRow, col: nextCol - firstCol };
        assert.ok(
          allowed.some((option) => option.row === step.row && option.col === step.col),
          `${hidden.word} runs ${JSON.stringify(step)}, not allowed at ${level}`,
        );
      }
    }
  });
}

test("kids word search never hides a word backwards or diagonally", () => {
  // The youngest players got right-to-left words before, because the
  // direction list happened to start with the two horizontal directions.
  const forwardOnly = DIRECTIONS.slice(0, arcadePresets.serviceSearch.difficulties.kids.directions);
  for (const option of forwardOnly) {
    assert.ok(option.row >= 0 && option.col >= 0, `kids direction ${JSON.stringify(option)} reverses`);
    assert.ok(option.row === 0 || option.col === 0, `kids direction ${JSON.stringify(option)} is diagonal`);
  }
});

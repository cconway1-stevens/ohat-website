// The arcade's word games are generated fresh every round, so the thing worth
// testing is not one fixed puzzle but the generator: every difficulty must
// always produce a puzzle that is actually solvable, out of words that suit
// the level. Run with `node --test tests/arcade.test.mjs`.

import assert from "node:assert/strict";
import test from "node:test";

import {
  arcadePresets,
  badGarageGuessWords,
  garageGuessClues,
  garageGuessWords,
} from "../../../src/lib/arcade/arcade.ts";
import { CLUE_BANK, wordsForLevel } from "../../../src/lib/arcade/arcade-words.ts";
import { createCrossword } from "../../../src/lib/arcade/crossword.ts";
import { createSearch, DIRECTIONS } from "../../../src/lib/arcade/word-search.ts";

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

test("every Garage Guess word has a clue that doesn't give it away", () => {
  // The clue is the hint for a stuck player, so it must exist for every word
  // the game can pick, and must not simply contain the answer.
  for (const word of garageGuessWords) {
    const clue = garageGuessClues[word];
    assert.ok(clue && clue.trim().length > 0, `${word} has no clue`);
    assert.equal(clue.toUpperCase().includes(word), false, `clue for ${word} contains the answer`);
  }
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
      for (const entry of pool)
        assert.equal(entry.level, "kids", `${entry.answer} is not a kids word`);
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
      assert.ok(
        puzzle.rows <= settings.maxGrid && puzzle.cols <= settings.maxGrid,
        `${level} round ${round} grid is ${puzzle.rows}x${puzzle.cols}`,
      );

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
    assert.ok(
      option.row >= 0 && option.col >= 0,
      `kids direction ${JSON.stringify(option)} reverses`,
    );
    assert.ok(
      option.row === 0 || option.col === 0,
      `kids direction ${JSON.stringify(option)} is diagonal`,
    );
  }
});

/* ------------------------- Tow Chain service calls ---------------------- */

import { freshState, tick } from "../../../src/lib/arcade/tow-chain.ts";

test("Tow Chain: a pickup grows the chain and counts a car", () => {
  const state = freshState();
  state.chain = [{ x: 2, y: 2 }];
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  state.pickup = { x: 3, y: 2 };
  const outcome = tick(state);
  assert.equal(outcome.ate, true);
  assert.equal(state.towed, 1);
  assert.equal(state.chain.length, 2, "the chain should be one car longer");
});

test("Tow Chain: a service call is dispatched every few cars", () => {
  const config = arcadePresets.towChain;
  const state = freshState();
  for (let car = 1; car <= config.bonusEvery; car += 1) {
    // Reset the truck to a known spot each time so the test exercises the
    // dispatch rule, not my ability to drive a snake.
    state.chain = [{ x: 2, y: 2 }];
    state.dir = { x: 1, y: 0 };
    state.nextDir = { x: 1, y: 0 };
    state.pickup = { x: 3, y: 2 };
    assert.equal(tick(state).ate, true, `car ${car} was not picked up`);
  }
  assert.equal(state.towed, config.bonusEvery);
  assert.ok(state.bonus, "no service call after the third car");
  assert.ok(["ghost", "slow", "trim"].includes(state.bonus.kind));
});

test("Tow Chain: a ghost run passes through the chain, and normally you crash", () => {
  // (6,7) has to be a middle segment: the tail vacates its cell on the same
  // tick, so driving into the last car is legitimately not a crash.
  const layout = [
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 7 },
    { x: 5, y: 7 },
    { x: 6, y: 7 },
    { x: 7, y: 7 },
  ];
  const rig = (ghost) => {
    const state = freshState();
    state.chain = layout.map((cell) => ({ ...cell }));
    state.pickup = { x: 0, y: 0 };
    state.dir = { x: 0, y: 1 };
    state.nextDir = { x: 0, y: 1 };
    state.ghost = ghost;
    return state;
  };
  assert.equal(tick(rig(0)).dead, true, "driving into the chain should end the shift");
  assert.equal(tick(rig(20)).dead, false, "a ghost run should pass straight through");
});

test("Tow Chain: a drop-off shortens the chain but never the score", () => {
  const config = arcadePresets.towChain;
  const state = freshState();
  state.chain = Array.from({ length: 8 }, (_, i) => ({ x: 8 - i, y: 6 }));
  state.towed = 7;
  state.pickup = { x: 0, y: 11 };
  state.bonus = { x: 9, y: 6, kind: "trim", ticksLeft: 30 };
  state.dir = { x: 1, y: 0 };
  state.nextDir = { x: 1, y: 0 };
  const outcome = tick(state);
  assert.equal(outcome.took, "trim");
  // Moved without eating, so the chain is still 8 before the drop-off.
  assert.equal(state.chain.length, 8 - config.trimBy, "chain should be shorter");
  assert.equal(state.towed, 7, "cars towed must survive a drop-off");
});

test("Tow Chain: easy-does-it halves the pace by idling alternate ticks", () => {
  const state = freshState();
  state.slow = 10;
  state.pickup = { x: 0, y: 12 };
  const first = tick(state);
  const second = tick(state);
  assert.notEqual(first.skipped, second.skipped, "exactly one of two ticks should move");
});

test("Tow Chain: an unanswered service call expires", () => {
  const config = arcadePresets.towChain;
  const state = freshState();
  state.pickup = { x: 0, y: 12 };
  state.bonus = { x: 11, y: 11, kind: "ghost", ticksLeft: 3 };
  state.chain = [{ x: 1, y: 1 }];
  state.dir = { x: 0, y: 1 };
  state.nextDir = { x: 0, y: 1 };
  for (let i = 0; i < 4; i += 1) tick(state);
  assert.equal(state.bonus, null, "the caller should give up eventually");
  assert.ok(config.bonusLifeTicks > 0);
});

/* ------------------------- Parts Counter 3D orders ---------------------- */

import {
  buyUpgrade,
  CUSTOMERS_PER_DAY,
  canAfford,
  coinsForOrder,
  isDayComplete,
  nextCounterOrder,
  orderPart,
  orderTotal,
  partsStock,
  stockEntry,
  streakAdvance,
  upgradeById,
  upgrades,
} from "../../../src/lib/arcade/parts-orders.ts";

test("Parts Counter 3D: every counter order is one part, 1–3 of it", () => {
  const stockIds = new Set(partsStock.map((entry) => entry.id));
  for (let round = 0; round < ROUNDS; round += 1) {
    const order = nextCounterOrder();
    assert.equal(order.items.length, 1, "a counter order is a single part");
    const item = orderPart(order);
    assert.ok(stockIds.has(item.id), `unknown part ${item.id}`);
    assert.ok(item.quantity >= 1 && item.quantity <= 3, `bad quantity ${item.quantity}`);
    assert.ok(order.slip >= 1000 && order.slip <= 9999);
    assert.ok(order.customer.trim().length > 0);
    assert.ok(orderTotal(order) > 0, "a ticket should always total something");
  }
});

test("Parts Counter 3D: coins are the order total rounded to whole dollars", () => {
  const order = { items: [{ id: "bulb", quantity: 2 }], customer: "Tester", slip: 1 };
  assert.equal(coinsForOrder(order), Math.round(2 * stockEntry("bulb").price));
});

test("Parts Counter 3D: a perfect round grows the streak, a mistake breaks it", () => {
  assert.equal(streakAdvance(0, 0), 1);
  assert.equal(streakAdvance(4, 0), 5);
  assert.equal(streakAdvance(4, 1), 0, "a wrong grab breaks the streak");
});

test("Parts Counter 3D: upgrades cost coins and cannot be bought twice", () => {
  assert.ok(upgrades.length >= 6, "the prop shop should have a few props");
  for (const upgrade of upgrades) {
    assert.ok(upgrade.cost > 0, `${upgrade.id} should cost something`);
    assert.ok(upgrade.label.trim().length > 0);
  }
  const rug = upgradeById("rug");
  assert.equal(canAfford(rug.cost - 1, "rug", []), false, "short on coins");
  assert.equal(canAfford(rug.cost, "rug", []), true);
  assert.equal(canAfford(rug.cost, "rug", ["rug"]), false, "already owned");
  const bought = buyUpgrade(100, [], "rug");
  assert.deepEqual(bought, { coins: 100 - rug.cost, owned: ["rug"] });
  assert.equal(buyUpgrade(0, [], "rug"), null, "cannot buy with no coins");
  assert.equal(buyUpgrade(100, ["rug"], "rug"), null, "cannot double-buy");
});

test("Parts Counter 3D: a day ends after the customer quota", () => {
  assert.equal(isDayComplete(0), false);
  assert.equal(isDayComplete(CUSTOMERS_PER_DAY - 1), false);
  assert.equal(isDayComplete(CUSTOMERS_PER_DAY), true);
  assert.ok(CUSTOMERS_PER_DAY > 0);
});

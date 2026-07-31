// The arcade's game roster — one entry per cabinet, one route per game.
export type ArcadeGame = {
  slug: string;
  name: string;
  tagline: string;
  classic: string;
  glyph: string;
};

// One place to tune round length, prize difficulty, and game speed.
export const arcadePresets = {
  logoMatch: {
    defaultGrid: 4,
    modes: [3, 4, 5],
    customMinGrid: 2,
    responsiveMaxGrid: {
      mobile: 5,
      tablet: 6,
      desktop: 8,
    },
    breakpoints: {
      tablet: 700,
      desktop: 1100,
    },
  },
  // `level` picks the vocabulary tier (see lib/arcade-words.ts); the length
  // bounds only keep a word physically fittable in the grid. Difficulty used
  // to be length alone, which is how "Kids" ended up asking for TPMS.
  crossword: {
    defaultDifficulty: "easy",
    difficulties: {
      kids: { label: "Kids", level: "kids", wordsPerPuzzle: 5, maxGrid: 9, minLength: 3, maxLength: 6 },
      easy: { label: "Easy", level: "easy", wordsPerPuzzle: 7, maxGrid: 12, minLength: 3, maxLength: 8 },
      advanced: { label: "Advanced", level: "advanced", wordsPerPuzzle: 10, maxGrid: 15, minLength: 4, maxLength: 13 },
    },
  },
  // `directions` counts into the DIRECTIONS list in service-search.tsx, which
  // is ordered easiest-first: forward and downward before any reversals or
  // diagonals, so Kids never gets a word spelled backwards.
  serviceSearch: {
    defaultDifficulty: "easy",
    difficulties: {
      kids: { label: "Kids", level: "kids", gridSize: 8, wordsPerPuzzle: 4, prizeWords: 3, directions: 2 },
      easy: { label: "Easy", level: "easy", gridSize: 10, wordsPerPuzzle: 6, prizeWords: 4, directions: 4 },
      advanced: { label: "Advanced", level: "advanced", gridSize: 12, wordsPerPuzzle: 9, prizeWords: 6, directions: 8 },
    },
  },
  garageGuess: { wordLength: 5, maxGuesses: 6 },
  shoreRun: { coinsToWin: 4 },
  towChain: { carsToWin: 4, tickMs: 175 },
} as const;

export const arcadeGames: ArcadeGame[] = [
  {
    slug: "logo-match",
    name: "Logo Match",
    tagline: "Flip the badges, find the pairs.",
    classic: "Concentration",
    glyph: "☰",
  },
  {
    slug: "crossword",
    name: "Garage Crossword",
    tagline: "Fresh clues from under the hood.",
    classic: "Crossword",
    glyph: "#",
  },
  {
    slug: "service-search",
    name: "Service Search",
    tagline: "Find the shop words in the morning paper.",
    classic: "Word search",
    glyph: "A",
  },
  {
    slug: "shore-run",
    name: "Shore Run",
    tagline: "Hop the tires, duck the signals, don't stop.",
    classic: "endless runner",
    glyph: "⇢",
  },
  {
    slug: "tow-chain",
    name: "Tow Chain",
    tagline: "Every pickup makes the chain longer.",
    classic: "Snake",
    glyph: "⌁",
  },
  {
    slug: "garage-guess",
    name: "Garage Guess",
    tagline: "Find the five-letter shop word in six tries.",
    classic: "word puzzle",
    glyph: "G",
  },
];

// Five-letter automotive words used by Garage Guess for both answers and
// accepted guesses. Keeping the word bank beside the game presets makes the
// vocabulary straightforward to tune without touching the game logic.
//
// Every entry must be exactly `garageGuess.wordLength` letters — a short one
// slipping in makes the round unwinnable, since the player can never type a
// guess that equals the answer. `assertGarageGuessWords` guards that.
export const garageGuessWords = [
  "ALIGN", "AXLES", "BELTS", "BRAKE", "CABIN", "CLAMP", "COUPE",
  "FLUID", "FRAME", "FUELS", "FUSES", "GAUGE", "GEARS", "GRILL",
  "HATCH", "HITCH", "HOODS", "LIGHT", "MOTOR", "PEDAL", "RELAY",
  "ROTOR", "SEDAN", "SHAFT", "SHOCK", "SPARK", "SPARE", "STRUT",
  "TIRES", "TOWED", "TREAD", "TRUCK", "TRUNK", "VALVE", "WAGON",
  "WHEEL", "WINCH", "WIPER",
] as const;

// Exported so a test can assert it, rather than trusting the list by eye.
export function badGarageGuessWords() {
  return garageGuessWords.filter(
    (word) => word.length !== arcadePresets.garageGuess.wordLength,
  );
}

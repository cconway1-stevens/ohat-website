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
  crossword: {
    defaultDifficulty: "easy",
    difficulties: {
      kids: { label: "Kids", wordsPerPuzzle: 5, maxGrid: 9, minLength: 3, maxLength: 6 },
      easy: { label: "Easy", wordsPerPuzzle: 8, maxGrid: 13, minLength: 3, maxLength: 9 },
      advanced: { label: "Advanced", wordsPerPuzzle: 10, maxGrid: 15, minLength: 5, maxLength: 20 },
    },
  },
  serviceSearch: {
    defaultDifficulty: "easy",
    difficulties: {
      kids: { label: "Kids", gridSize: 8, wordsPerPuzzle: 4, prizeWords: 3, directionCount: 2 },
      easy: { label: "Easy", gridSize: 10, wordsPerPuzzle: 6, prizeWords: 4, directionCount: 4 },
      advanced: { label: "Advanced", gridSize: 12, wordsPerPuzzle: 9, prizeWords: 6, directionCount: 8 },
    },
  },
  garageGuess: { wordLength: 5, maxGuesses: 6 },
  treadStack: { rows: 18, columns: 10, linesToWin: 3 },
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
  {
    slug: "tread-stack",
    name: "Tread Stack",
    tagline: "Stack the tire loads and clear the rack.",
    classic: "falling-block puzzle",
    glyph: "●",
  },
];

// Five-letter automotive words used by Garage Guess for both answers and
// accepted guesses. Keeping the word bank beside the game presets makes the
// vocabulary straightforward to tune without touching the game logic.
export const garageGuessWords = [
  "ALIGN", "AXLES", "BELTS", "BRAKE", "CABIN", "CLAMP", "COUPE",
  "FRAME", "FUEL", "FUSES", "GAUGE", "GEARS", "GRILL", "HATCH",
  "HITCH", "HOODS", "MOTOR", "RELAY", "ROTOR", "SEDAN", "SHAFT",
  "SHOCK", "SPARK", "STRUT", "TIRES", "TOWED", "TREAD", "TRUCK",
  "TRUNK", "VALVE", "WAGON", "WHEEL", "WINCH", "WIPER",
] as const;

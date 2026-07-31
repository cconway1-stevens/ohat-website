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
    wordsPerPuzzle: 8,
    maxGrid: 13,
  },
  serviceSearch: {
    gridSize: 10,
    wordsPerPuzzle: 6,
    prizeWords: 4,
  },
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
];

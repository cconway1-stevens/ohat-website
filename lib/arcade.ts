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
  logoMatch: { pairs: 8 },
  dragStrip: { prizeReactionMs: 650 },
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
    slug: "drag-strip",
    name: "Drag Strip",
    tagline: "Watch the tree, launch on green.",
    classic: "Reaction timer",
    glyph: "⚡",
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

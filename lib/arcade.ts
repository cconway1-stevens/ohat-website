// The arcade's game roster — one entry per cabinet, one route per game.
export type ArcadeGame = {
  slug: string;
  name: string;
  tagline: string;
  classic: string;
  glyph: string;
};

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
    tagline: "Three lanes, one sedan, endless traffic.",
    classic: "Lane dodger",
    glyph: "⇡",
  },
  {
    slug: "tow-chain",
    name: "Tow Chain",
    tagline: "Every pickup makes the chain longer.",
    classic: "Snake",
    glyph: "⌁",
  },
];

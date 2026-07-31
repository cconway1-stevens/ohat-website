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
//
// Every entry must be exactly `garageGuess.wordLength` letters — a short one
// slipping in makes the round unwinnable, since the player can never type a
// guess that equals the answer. `assertGarageGuessWords` guards that.
// Each word carries a clue, so a stuck player can ask for a nudge instead of
// burning guesses. A clue never contains its own answer — the test checks.
const GARAGE_GUESS: [word: string, clue: string][] = [
  ["ALIGN", "What the wheels need when the car pulls to one side"],
  ["AXLES", "Shafts the wheels ride on"],
  ["BELTS", "Rubber loops the engine drives"],
  ["BRAKE", "The pedal that stops you"],
  ["CABIN", "Where the driver and passengers sit"],
  ["CLAMP", "Tool that grips a hose tight"],
  ["COUPE", "Two-door body style"],
  ["FLUID", "Brake ___ or transmission ___"],
  ["FRAME", "Steel skeleton under the body"],
  ["FUELS", "Gasoline and diesel, for two"],
  ["FUSES", "Little blade protectors in the box under the dash"],
  ["GAUGE", "Dial that reads fuel or temperature"],
  ["GEARS", "The transmission shifts through them"],
  ["GRILL", "Front opening that lets cooling air in"],
  ["HATCH", "Rear door that lifts up"],
  ["HITCH", "You bolt a trailer to it"],
  ["HOODS", "Panels you lift to reach the engine"],
  ["LIGHT", "Head___ or tail___"],
  ["MOTOR", "Another word for the engine"],
  ["PEDAL", "Gas, brake, or clutch"],
  ["RELAY", "Clicking switch worked by a coil"],
  ["ROTOR", "Disc a caliper squeezes"],
  ["SEDAN", "Four-door body style"],
  ["SHAFT", "Drive___ sends power to the wheels"],
  ["SHOCK", "___ absorber, which smooths the bumps"],
  ["SPARE", "The tire hiding in the trunk"],
  ["SPARK", "The plug makes one to light the fuel"],
  ["STRUT", "Suspension damper built into the corner assembly"],
  ["TIRES", "Four of them meet the road"],
  ["TOWED", "What happened to the car on the flatbed"],
  ["TREAD", "The grooved pattern on a tire"],
  ["TRUCK", "Pickup, for one"],
  ["TRUNK", "Cargo space behind the back seat"],
  ["VALVE", "It opens and closes to let gases in or out"],
  ["WAGON", "Long-roof car with cargo room in back"],
  ["WHEEL", "The tire mounts onto it"],
  ["WINCH", "Cable drum that drags a car onto a flatbed"],
  ["WIPER", "Blade that clears the windshield"],
];

export const garageGuessWords: string[] = GARAGE_GUESS.map(([word]) => word);

export const garageGuessClues: Record<string, string> =
  Object.fromEntries(GARAGE_GUESS);

// Exported so a test can assert it, rather than trusting the list by eye.
export function badGarageGuessWords() {
  return garageGuessWords.filter(
    (word) => word.length !== arcadePresets.garageGuess.wordLength,
  );
}

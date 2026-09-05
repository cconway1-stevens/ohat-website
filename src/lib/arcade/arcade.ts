// The arcade's game roster — one entry per cabinet, one route per game.
export type ArcadeCategory = "word" | "puzzle" | "action" | "cozy";

export type ArcadeGame = {
  slug: string;
  name: string;
  tagline: string;
  classic: string;
  glyph: string;
  category: ArcadeCategory;
};

// The lobby groups by category rather than listing every cabinet in one row:
// with this many games a flat grid gives a visitor no idea what they are
// choosing between. Order runs quiet to loud, quickest first inside each group.
export const arcadeCategories: {
  id: ArcadeCategory;
  label: string;
  blurb: string;
}[] = [
  {
    id: "word",
    label: "Word & clue",
    blurb: "Paper puzzles for a slow wait. Pick a difficulty and take your time.",
  },
  {
    id: "puzzle",
    label: "Puzzle & memory",
    blurb: "Shapes and badges. Easy to start, harder to put down.",
  },
  {
    id: "action",
    label: "Arcade action",
    blurb: "Thumbs and reflexes. Short rounds, scores stay on your own device.",
  },
  // Last on purpose: the games people came to play lead, and the cozy corner
  // waits at the end for whoever wants to sit in it.
  {
    id: "cozy",
    label: "Cozy garage",
    blurb: "No score, no clock, nothing to lose. Put the shop on and stay as long as you like.",
  },
];

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
      kids: {
        label: "Kids",
        level: "kids",
        wordsPerPuzzle: 5,
        maxGrid: 9,
        minLength: 3,
        maxLength: 6,
      },
      easy: {
        label: "Easy",
        level: "easy",
        wordsPerPuzzle: 7,
        maxGrid: 12,
        minLength: 3,
        maxLength: 8,
      },
      advanced: {
        label: "Advanced",
        level: "advanced",
        wordsPerPuzzle: 10,
        maxGrid: 15,
        minLength: 4,
        maxLength: 13,
      },
    },
  },
  // `directions` counts into the DIRECTIONS list in service-search.tsx, which
  // is ordered easiest-first: forward and downward before any reversals or
  // diagonals, so Kids never gets a word spelled backwards.
  serviceSearch: {
    defaultDifficulty: "easy",
    difficulties: {
      kids: {
        label: "Kids",
        level: "kids",
        gridSize: 8,
        wordsPerPuzzle: 4,
        prizeWords: 3,
        directions: 2,
      },
      easy: {
        label: "Easy",
        level: "easy",
        gridSize: 10,
        wordsPerPuzzle: 6,
        prizeWords: 4,
        directions: 4,
      },
      advanced: {
        label: "Advanced",
        level: "advanced",
        gridSize: 12,
        wordsPerPuzzle: 9,
        prizeWords: 6,
        directions: 8,
      },
    },
  },
  garageGuess: { wordLength: 5, maxGuesses: 6 },
  // Lot Defender's three intensities differ in how much is coming at you and
  // how fast, not in how forgiving the controls are. Kids is a swarm that
  // never fires back; Advanced marches quicker, drops harder and runs three
  // waves. Frame counts assume 60fps.
  lotDefender: {
    defaultLevel: "easy",
    levels: {
      // `powers` is the shop-crate pool a cleared hazard can leave behind.
      // Kids gets only the two obviously-good ones so the screen never turns
      // into a puzzle about which badge does what.
      kids: {
        label: "Kids",
        brief: "A slow drift, nothing falls back at you, and five sweeps in hand.",
        rows: 2,
        cols: 5,
        marchFrames: 46,
        dropStep: 6,
        dropSpeed: 1.1,
        fireFrames: 9999,
        shotCooldown: 10,
        truckSpeed: 3,
        lives: 5,
        wavesToWin: 1,
        powerChance: 0.24,
        powers: ["spare", "rapid"],
      },
      easy: {
        label: "Easy",
        brief: "A steady drift with the odd bolt shaking loose. Two waves to clear.",
        rows: 3,
        cols: 6,
        marchFrames: 34,
        dropStep: 8,
        dropSpeed: 1.6,
        fireFrames: 110,
        shotCooldown: 12,
        truckSpeed: 3,
        lives: 3,
        wavesToWin: 2,
        powerChance: 0.16,
        powers: ["spare", "rapid", "twin", "slow"],
      },
      advanced: {
        label: "Advanced",
        brief: "A full lot, hardware raining down, three waves. Keep moving.",
        rows: 4,
        cols: 8,
        marchFrames: 24,
        dropStep: 10,
        dropSpeed: 2.2,
        fireFrames: 62,
        shotCooldown: 14,
        truckSpeed: 3.4,
        lives: 3,
        wavesToWin: 3,
        powerChance: 0.12,
        powers: ["spare", "rapid", "twin", "slow"],
      },
    },
  },
  treadStack: { rows: 18, columns: 10, linesToWin: 3 },
  shoreRun: { coinsToWin: 4 },
  // A service call shows up every few pickups and waits a while before the
  // driver gives up on it. `ghost` lets the chain pass through itself, `slow`
  // eases the pace, `trim` drops cars off back at the shop.
  towChain: {
    carsToWin: 4,
    tickMs: 175,
    bonusEvery: 3,
    bonusLifeTicks: 46,
    bonusTicks: 40,
    slowTickMs: 260,
    trimBy: 3,
  },
} as const;

export const arcadeGames: ArcadeGame[] = [
  {
    slug: "closing-time",
    name: "Closing Time Garage",
    tagline: "Dim the bays, roll the cart in, and listen to the rain.",
    classic: "ambient garage",
    glyph: "◐",
    category: "cozy",
  },
  {
    slug: "sunday-wash",
    name: "Sunday Car Wash",
    tagline: "Foam, rinse, dry, and make a Sunday shine.",
    classic: "wash bay",
    glyph: "≈",
    category: "cozy",
  },
  {
    slug: "night-drive",
    name: "Night Drive Home",
    tagline: "Pick a station and drift through the evening roads.",
    classic: "night drive",
    glyph: "☾",
    category: "cozy",
  },
  {
    slug: "parts-counter",
    name: "The Parts Counter",
    tagline: "Ring a little sale, pack a part, hear the door bell.",
    classic: "shop counter",
    glyph: "□",
    category: "cozy",
  },
  {
    slug: "parts-counter-3d",
    name: "Parts Counter 3D",
    tagline: "Orbit the counter, grab the part, ring it up.",
    classic: "3D shop sim",
    glyph: "▣",
    category: "cozy",
  },
  {
    slug: "radio-3d",
    name: "Chrome De Luxe 3D",
    tagline: "Turn the knobs, ride the needle through the static.",
    classic: "3D dash radio",
    glyph: "◉",
    category: "cozy",
  },
  {
    slug: "garage-radio",
    name: "Garage Radio",
    tagline: "Settle in, turn the dial, and watch the shop go by.",
    classic: "waiting room",
    glyph: "♫",
    category: "cozy",
  },
  {
    slug: "garage-guess",
    name: "Garage Guess",
    tagline: "Find the five-letter shop word in six tries.",
    classic: "word puzzle",
    glyph: "G",
    category: "word",
  },
  {
    slug: "service-search",
    name: "Service Search",
    tagline: "Find the shop words in the morning paper.",
    classic: "Word search",
    glyph: "A",
    category: "word",
  },
  {
    slug: "crossword",
    name: "Garage Crossword",
    tagline: "Fresh clues from under the hood.",
    classic: "Crossword",
    glyph: "#",
    category: "word",
  },
  {
    slug: "logo-match",
    name: "Logo Match",
    tagline: "Flip the badges, find the pairs.",
    classic: "Concentration",
    glyph: "☰",
    category: "puzzle",
  },
  {
    slug: "tread-stack",
    name: "Tread Stack",
    tagline: "Stack the tire loads and clear the rack.",
    classic: "falling-block puzzle",
    glyph: "●",
    category: "puzzle",
  },
  {
    slug: "garage-blackjack",
    name: "Garage Blackjack",
    tagline: "Hit 21 at the service-bay card table.",
    classic: "blackjack",
    glyph: "21",
    category: "puzzle",
  },
  {
    slug: "lot-defender",
    name: "Lot Defender",
    tagline: "Sweep the nails before they reach the tires.",
    classic: "Space Invaders",
    glyph: "▲",
    category: "action",
  },
  {
    slug: "tow-chain",
    name: "Tow Chain",
    tagline: "Every pickup makes the chain longer.",
    classic: "Snake",
    glyph: "⌁",
    category: "action",
  },
  {
    slug: "shore-run",
    name: "Shore Run",
    tagline: "Hop the tires, duck the signals, don’t stop.",
    classic: "endless runner",
    glyph: "⇢",
    category: "action",
  },
];

// Five-letter automotive answers used by Garage Guess. Keeping the word bank
// beside the game presets makes the vocabulary straightforward to tune without
// touching the game logic.
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

export const garageGuessClues: Record<string, string> = Object.fromEntries(GARAGE_GUESS);

// Exported so a test can assert it, rather than trusting the list by eye.
export function badGarageGuessWords() {
  return garageGuessWords.filter((word) => word.length !== arcadePresets.garageGuess.wordLength);
}

// Tow Chain's rules, kept out of the component so they can be tested without
// driving a canvas around with a robot. Everything here is a plain state
// object in, an outcome out — the component owns the canvas, the sound and
// the React state.
import { arcadePresets } from "./arcade.ts";

export const GRID = 13;
const CONFIG = arcadePresets.towChain;

export type Point = { x: number; y: number };

export type BonusKind = "ghost" | "slow" | "trim";
type Bonus = Point & { kind: BonusKind; ticksLeft: number };

export type ChainState = {
  chain: Point[];
  dir: Point;
  nextDir: Point;
  pickup: Point;
  // Counted, not read off the chain length: a service call that shortens the
  // chain must never cost you the cars you already brought in.
  towed: number;
  bonus: Bonus | null;
  ghost: number;
  slow: number;
  ticks: number;
};

export type TickOutcome = {
  skipped: boolean;
  dead: boolean;
  ate: boolean;
  took: BonusKind | null;
};

function freeCells(taken: Point[]): Point[] {
  const used = new Set(taken.map((point) => `${point.x},${point.y}`));
  const free: Point[] = [];
  for (let x = 0; x < GRID; x += 1) {
    for (let y = 0; y < GRID; y += 1) {
      if (!used.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free;
}

// Picks from the cells the chain isn't sitting on. Guessing at random in a
// `while (true)` slows to a crawl — and never returns — as the lot fills up.
function randomCell(exclude: Point[], pick = Math.random): Point {
  const free = freeCells(exclude);
  return free[Math.floor(pick() * free.length)] ?? { x: 0, y: 0 };
}

export function freshState(
  initialDirection: Point = { x: 1, y: 0 },
  pick = Math.random,
): ChainState {
  const start = { x: 6, y: 6 };
  return {
    chain: [start],
    dir: initialDirection,
    nextDir: initialDirection,
    pickup: randomCell([start], pick),
    towed: 0,
    bonus: null,
    ghost: 0,
    slow: 0,
    ticks: 0,
  };
}

export function turn(state: ChainState, direction: Point) {
  // No U-turns — the chain is right behind the truck.
  if (direction.x === -state.dir.x && direction.y === -state.dir.y) return;
  state.nextDir = direction;
}

/** Advances one tick, mutating `state`, and reports what happened. */
export function tick(state: ChainState, pick = Math.random): TickOutcome {
  const idle: TickOutcome = { skipped: true, dead: false, ate: false, took: null };
  state.ticks += 1;
  // "Easy does it" halves the pace by sitting out every other tick.
  if (state.slow > 0 && state.ticks % 2 === 1) return idle;

  if (state.ghost > 0) state.ghost -= 1;
  if (state.slow > 0) state.slow -= 1;
  if (state.bonus) {
    state.bonus.ticksLeft -= 1;
    if (state.bonus.ticksLeft <= 0) state.bonus = null;
  }

  state.dir = state.nextDir;
  const head = { x: state.chain[0].x + state.dir.x, y: state.chain[0].y + state.dir.y };
  const hitFence = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
  const ate = head.x === state.pickup.x && head.y === state.pickup.y;
  // The last car moves out of its cell on this same tick unless we're growing,
  // so driving into it isn't a crash. A ghost run passes through the lot.
  const body = ate ? state.chain : state.chain.slice(0, -1);
  const hitChain = state.ghost === 0 && body.some((cell) => cell.x === head.x && cell.y === head.y);

  if (hitFence || hitChain) return { skipped: false, dead: true, ate: false, took: null };

  state.chain.unshift(head);
  if (ate) {
    state.towed += 1;
    state.pickup = randomCell(state.chain, pick);
    // Every few pickups the dispatcher calls one in.
    if (state.towed % CONFIG.bonusEvery === 0 && !state.bonus) {
      const kinds: BonusKind[] = ["ghost", "slow", "trim"];
      const spot = randomCell([...state.chain, state.pickup], pick);
      state.bonus = {
        ...spot,
        kind: kinds[Math.floor(pick() * kinds.length)],
        ticksLeft: CONFIG.bonusLifeTicks,
      };
    }
  } else {
    state.chain.pop();
  }

  let took: BonusKind | null = null;
  if (state.bonus && head.x === state.bonus.x && head.y === state.bonus.y) {
    took = state.bonus.kind;
    state.bonus = null;
    if (took === "ghost") state.ghost = CONFIG.bonusTicks;
    if (took === "slow") state.slow = CONFIG.bonusTicks;
    if (took === "trim") {
      state.chain = state.chain.slice(0, Math.max(1, state.chain.length - CONFIG.trimBy));
    }
  }

  return { skipped: false, dead: false, ate, took };
}

/**
 * Parts Counter 3D — the pure rules behind the 3D cabinet, kept free of any
 * rendering imports so the whole thing runs under plain `node --test`.
 *
 * The game is deliberately gentle: a customer wants one kind of part in a
 * small quantity, nothing is timed, and a wrong grab is never punished — the
 * clerk just gets a polite correction. Coins buy cosmetic props between days.
 */

export type StockEntry = {
  id: string;
  label: string;
  /** The way a customer would actually ask for it. */
  ask: string;
  price: number;
};

export type OrderItem = { id: string; quantity: number };

export type PartsOrder = {
  items: OrderItem[];
  customer: string;
  slip: number;
};

// The same shelf the 2D counter stocks, so both cabinets agree on what the
// shop sells and what it costs. The 3D scene maps these ids to geometry.
export const partsStock: StockEntry[] = [
  { id: "wipers", label: "Wiper blades", ask: "a pair of wiper blades", price: 24.99 },
  { id: "oilfilter", label: "Oil filter", ask: "an oil filter", price: 8.49 },
  { id: "battery", label: "Battery", ask: "a battery", price: 149.95 },
  { id: "bulb", label: "Headlight bulb", ask: "a headlight bulb", price: 14.25 },
  { id: "airfilter", label: "Air filter", ask: "an air filter", price: 19.5 },
  { id: "coolant", label: "Coolant", ask: "a jug of coolant", price: 16.75 },
  { id: "plugs", label: "Spark plugs", ask: "a set of spark plugs", price: 32.0 },
  { id: "wax", label: "Wax", ask: "a tin of wax", price: 11.4 },
];

const partsCustomers = [
  "A regular in a work jacket",
  "Somebody's dad",
  "The landscaper from up the road",
  "A kid buying his first car part",
  "A nurse coming off nights",
  "A guy still in his fishing waders",
  "An off-duty shore patrol officer",
  "The mail carrier between loops",
];

export const money = (value: number) => `$${value.toFixed(2)}`;

export function stockEntry(id: string): StockEntry {
  const entry = partsStock.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`unknown part: ${id}`);
  return entry;
}

/**
 * One counter order: a single kind of part, 1–3 of it. The 3D cabinet carries
 * one unit at a time, so a multi-part ticket would be a slog; one part keeps
 * the walk-to-the-back-shelf loop the whole game. A `random` parameter keeps
 * the generator testable and lets the component seed its first order
 * deterministically — randomising during render is a hydration error.
 */
export function nextCounterOrder(random: () => number = Math.random): PartsOrder {
  const entry = partsStock[Math.floor(random() * partsStock.length)];
  return {
    items: [{ id: entry.id, quantity: 1 + Math.floor(random() * 3) }],
    customer: partsCustomers[Math.floor(random() * partsCustomers.length)],
    slip: 1000 + Math.floor(random() * 8999),
  };
}

/** The single part a counter order asks for. */
export function orderPart(order: PartsOrder): OrderItem {
  return order.items[0];
}

export function orderTotal(order: PartsOrder): number {
  return order.items.reduce((sum, item) => sum + stockEntry(item.id).price * item.quantity, 0);
}

/** A perfect round is one filled with no wrong grabs along the way. */
export function streakAdvance(streak: number, mistakes: number): number {
  return mistakes === 0 ? streak + 1 : 0;
}

/* ------------------------------ the meta ------------------------------ */

/** How many customers make a "day" before the prop shop opens. */
export const CUSTOMERS_PER_DAY = 4;

export type Upgrade = { id: string; label: string; cost: number; blurb: string };

// Cosmetic props, cheapest first. Each maps to a slot in the 3D room.
export const upgrades: Upgrade[] = [
  { id: "rug", label: "Braided rug", cost: 20, blurb: "Softens the whole room." },
  { id: "plant", label: "Potted plant", cost: 35, blurb: "Something green by the door." },
  { id: "clock", label: "Wall clock", cost: 40, blurb: "Always ten past ten, like the ads." },
  { id: "snacks", label: "Snack bowl", cost: 50, blurb: "Mints and lollipops for the wait." },
  { id: "art", label: "Wall art", cost: 75, blurb: "A framed '57 Chevy print." },
  {
    id: "register",
    label: "Fancy register",
    cost: 150,
    blurb: "Brass. It dings like a hotel desk.",
  },
];

export function upgradeById(id: string): Upgrade {
  const entry = upgrades.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`unknown upgrade: ${id}`);
  return entry;
}

/** Coins earned for a sale: the total rounded to whole dollars. */
export function coinsForOrder(order: PartsOrder): number {
  return Math.round(orderTotal(order));
}

export function canAfford(coins: number, id: string, owned: string[]): boolean {
  if (owned.includes(id)) return false;
  return coins >= upgradeById(id).cost;
}

/** Returns the new coins/owned state, or null when the purchase is invalid. */
export function buyUpgrade(
  coins: number,
  owned: string[],
  id: string,
): { coins: number; owned: string[] } | null {
  if (!canAfford(coins, id, owned)) return null;
  return { coins: coins - upgradeById(id).cost, owned: [...owned, id] };
}

export function isDayComplete(servedThisDay: number): boolean {
  return servedThisDay >= CUSTOMERS_PER_DAY;
}

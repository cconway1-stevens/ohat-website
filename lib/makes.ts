// Single source of truth for the brand marks. The homepage grid and the logo
// match game both read from here so the two cannot drift apart, and every
// entry must have a matching `public/brands/<slug>.svg`.
export const makes = [
  "Toyota",
  "Ford",
  "Honda",
  "Chevrolet",
  "Jeep",
  "Nissan",
  "Subaru",
  "Volkswagen",
  "BMW",
  "Audi",
  "Kia",
  "Hyundai",
  "Mazda",
  "Volvo",
  "Tesla",
  "Acura",
  "Cadillac",
  "Chrysler",
  "Mitsubishi",
  "Porsche",
  "Ram",
  "Mini",
  "Infiniti",
  "Fiat",
  "Lucid",
  "Polestar",
  "Suzuki",
  "Smart",
  "Saturn",
  "Dacia",
  "Renault",
  "Opel",
  "Citroen",
  "SEAT",
];

// A shorter run for the marquee, where every logo scrolls past twice.
export const heroMakes = [
  "Toyota",
  "Ford",
  "Honda",
  "Chevrolet",
  "Jeep",
  "Subaru",
  "Volkswagen",
  "BMW",
  "Audi",
  "Tesla",
  "Volvo",
  "Porsche",
];

export const brandSrc = (name: string) => `/brands/${name.toLowerCase()}.svg`;

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The wall renders in complete rows only. 28 fills both layouts exactly —
// four rows of 7 on desktop and seven rows of 4 on phones. The expanded brand
// pool lets each load show a different complete wall without leaving a gap.
export const WALL_SIZE = 28;

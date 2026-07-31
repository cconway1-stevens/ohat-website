// Single source of truth for the brand marks. The homepage grid and the logo
// match game both read from here so the two cannot drift apart, and every
// entry must have a matching `public/brands/<slug>.svg`.
export const makes = [
  "Toyota", "Ford", "Honda", "Chevrolet", "Jeep", "Nissan", "Subaru",
  "Volkswagen", "BMW", "Audi", "Kia", "Hyundai", "Mazda", "Volvo",
  "Tesla", "Acura", "Cadillac", "Chrysler", "Mitsubishi", "Porsche", "Ram",
  "Mini", "Infiniti", "Fiat", "Lucid", "Polestar", "Suzuki", "Smart", "Saturn",
];

// A shorter run for the marquee, where every logo scrolls past twice.
export const heroMakes = [
  "Toyota", "Ford", "Honda", "Chevrolet", "Jeep", "Subaru",
  "Volkswagen", "BMW", "Audi", "Tesla", "Volvo", "Porsche",
];

export const brandSrc = (name: string) => `/brands/${name.toLowerCase()}.svg`;

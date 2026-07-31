export type Service = {
  slug: string;
  name: string;
  short: string;
  intro: string;
  signs: string[];
  includes: string[];
};

export const services: Service[] = [
  {
    slug: "advanced-diagnostics",
    name: "Advanced Diagnostics",
    short: "Check-engine lights, electrical faults, and the hard-to-find issues.",
    intro:
      "Modern vehicles are rolling computer networks. Our diagnostic process combines professional scan tools, live data, electrical testing, and hands-on experience to find the cause—not just clear the code.",
    signs: ["Warning lights", "Intermittent stalling", "Electrical glitches", "A repair that did not solve the issue"],
    includes: ["Full-system scan", "Live-data testing", "Electrical circuit diagnosis", "Clear repair recommendations"],
  },
  {
    slug: "brake-repair",
    name: "Brake Repair",
    short: "Confident stops, honest inspections, and complete brake service.",
    intro:
      "From worn pads to hydraulic concerns, we inspect the full braking system and explain what needs attention now, what can wait, and why.",
    signs: ["Squealing or grinding", "Soft brake pedal", "Vehicle pulls while braking", "Brake warning light"],
    includes: ["Pads and rotors", "Calipers and hoses", "Brake fluid service", "ABS diagnosis"],
  },
  {
    slug: "tires-alignments",
    name: "Tires & Alignments",
    short: "Tire sales, repairs, balancing, rotation, TPMS, and precise alignment.",
    intro:
      "The right tires and alignment improve safety, ride quality, fuel economy, and tread life. We service the complete wheel and tire system.",
    signs: ["Uneven tire wear", "Pulling left or right", "Steering wheel vibration", "Low tire pressure light"],
    includes: ["New tire installation", "Flat repair", "Computerized alignment", "Rotation, balance, and TPMS"],
  },
  {
    slug: "oil-maintenance",
    name: "Oil & Scheduled Maintenance",
    short: "Factory-aware maintenance that protects reliability and value.",
    intro:
      "We tailor maintenance to your vehicle, mileage, driving habits, and manufacturer schedule instead of applying a one-size-fits-all checklist.",
    signs: ["Maintenance reminder", "Overdue service", "Fluid leaks", "Planning for a road trip"],
    includes: ["Oil and filter", "Fluids and filters", "Belts and hoses", "Mileage-based inspections"],
  },
  {
    slug: "hybrid-ev-service",
    name: "Hybrid & EV Service",
    short: "Modern maintenance and diagnostics for electrified vehicles.",
    intro:
      "Hybrid and electric vehicles still need expert care for brakes, suspension, climate systems, tires, low-voltage electronics, cooling, and diagnostics.",
    signs: ["EV or hybrid warning", "Reduced range", "Charging concern", "Unusual brake feel"],
    includes: ["System diagnostics", "Cooling system service", "12-volt electrical", "Chassis, brakes, tires, and A/C"],
  },
  {
    slug: "air-conditioning",
    name: "A/C & Climate Control",
    short: "Cool air, reliable heat, and complete climate-system diagnosis.",
    intro:
      "We find leaks, test controls, evaluate compressor operation, and restore comfort without guessing at expensive parts.",
    signs: ["Warm air from vents", "Weak airflow", "Unusual compressor noise", "Windows will not defog"],
    includes: ["Performance testing", "Leak diagnosis", "Electrical controls", "Heating and cooling repair"],
  },
  {
    slug: "engine-cooling",
    name: "Engine & Cooling",
    short: "Cooling, fuel, ignition, drivability, and engine repair.",
    intro:
      "Overheating, rough running, and power loss can have many causes. We test methodically and build a repair plan around evidence.",
    signs: ["Overheating", "Rough idle", "Loss of power", "Smoke or unusual odor"],
    includes: ["Cooling systems", "Fuel and ignition", "Belts and hoses", "Engine performance"],
  },
  {
    slug: "suspension-steering",
    name: "Suspension & Steering",
    short: "Restore ride control, tire contact, and predictable handling.",
    intro:
      "A stable vehicle is a safer vehicle. We inspect steering and suspension components as a connected system before recommending repairs.",
    signs: ["Clunks over bumps", "Loose steering", "Bouncy ride", "Uneven tire wear"],
    includes: ["Shocks and struts", "Ball joints and tie rods", "Wheel bearings", "Steering diagnosis"],
  },
  {
    slug: "transmission-driveline",
    name: "Transmission & Driveline",
    short: "Fluid service and diagnosis for power delivery concerns.",
    intro:
      "Shifting concerns are not always a failed transmission. We evaluate controls, fluids, mounts, axles, and related systems before drawing conclusions.",
    signs: ["Harsh or delayed shifts", "Vibration on acceleration", "Fluid leak", "Clicking while turning"],
    includes: ["Transmission service", "CV axles", "Differentials", "Driveline diagnosis"],
  },
  {
    slug: "battery-electrical",
    name: "Battery & Electrical",
    short: "Starting, charging, lighting, modules, and electrical repair.",
    intro:
      "Electrical faults require a measured approach. We test the battery, charging system, circuits, and modules to identify the real failure.",
    signs: ["Slow crank", "Battery light", "Flickering lights", "Repeated dead battery"],
    includes: ["Battery testing", "Alternator and starter", "Parasitic draw testing", "Wiring and circuit repair"],
  },
  {
    slug: "diesel-service",
    name: "Diesel Service",
    short: "Maintenance and engine service for diesel cars and light trucks.",
    intro:
      "Diesel systems demand the right testing and service practices. We handle common maintenance and drivability needs with care.",
    signs: ["Hard starting", "Loss of power", "Excessive smoke", "Diesel warning light"],
    includes: ["Filters and fluids", "Engine diagnostics", "Cooling and intake", "Light-duty diesel maintenance"],
  },
  {
    slug: "exhaust-emissions",
    name: "Exhaust & Emissions",
    short: "Quiet operation, clean performance, and exhaust-system repair.",
    intro:
      "We inspect exhaust leaks, mounts, sensors, catalytic performance, and related engine controls to make a complete recommendation.",
    signs: ["Loud exhaust", "Rattling underneath", "Exhaust odor", "Emissions-related warning light"],
    includes: ["Exhaust inspection", "Mufflers and pipes", "Oxygen sensors", "Emissions diagnostics"],
  },
];

export const serviceBySlug = (slug: string) =>
  services.find((service) => service.slug === slug);

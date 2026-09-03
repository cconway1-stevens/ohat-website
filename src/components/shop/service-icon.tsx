/**
 * One line-drawn icon per service, for the bay cards on /services.
 *
 * These exist to do a job beyond decoration: each card had roughly 130px of
 * empty space between the bay number and the title (a consequence of the
 * heading's `margin-top: auto` pushing it to the foot of the card), and the
 * icon now occupies that gap. So the same change both gives every bay a face
 * and removes the hole — rather than closing the gap up and leaving the cards
 * plainer than before.
 *
 * Deliberately monoline and geometric: circles, arcs and straight strokes, all
 * on a 24×24 grid, drawn in `currentColor` so each one inherits its card's
 * text colour. That keeps them legible on the paper, yellow and blue cards
 * alike without a per-card variant, and keeps them consistent with the site's
 * hard-edged catalog drawing style instead of importing an icon set whose
 * house style is somebody else's.
 */

type IconProps = { slug: string; className?: string };

// Every path is stroked, never filled, so weight stays even at any size.
const PATHS: Record<string, React.ReactNode> = {
  // Screen with a diagnostic trace across it.
  "advanced-diagnostics": (
    <>
      <rect x="2.5" y="4.5" width="19" height="13" rx="1.5" />
      <path d="M6 11h2.5l1.5-3 2 6 1.5-3H18" />
      <path d="M9 21h6" />
    </>
  ),
  // Drilled brake disc with a caliper clamped over its edge. The caliper is
  // what keeps this readable next to the tyre icon below — two plain
  // concentric circles would have made the pair indistinguishable at 46px.
  "brake-repair": (
    <>
      <circle cx="10.5" cy="12" r="7.5" />
      <circle cx="10.5" cy="12" r="2.5" />
      <circle cx="10.5" cy="6.8" r=".9" />
      <circle cx="10.5" cy="17.2" r=".9" />
      <circle cx="5.3" cy="12" r=".9" />
      <path d="M17.5 8.5h2a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-2z" />
    </>
  ),
  // Tyre seen face on: sidewall, wheel, and tread blocks cut into the
  // circumference — the tread is what tells it apart from the brake disc.
  tires: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21" />
      <path d="M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </>
  ),
  // Wheel between two alignment guides.
  "wheel-alignment": (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12h.01" />
      <path d="M4 5v14M20 5v14" />
      <path d="M2 12h2M20 12h2" />
    </>
  ),
  // Oil drop above a dipstick.
  "oil-maintenance": (
    <>
      <path d="M12 3s5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 5-9 5-9Z" />
      <path d="M5 20h14" />
    </>
  ),
  // Bolt through a battery-shaped outline.
  "hybrid-ev-service": (
    <>
      <rect x="4.5" y="6.5" width="15" height="11" rx="1.5" />
      <path d="M13 9l-3 4h4l-3 4" />
      <path d="M8 4.5v2M16 4.5v2" />
    </>
  ),
  // Snowflake.
  "air-conditioning": (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <path d="M12 6.5 9.8 4.7M12 6.5l2.2-1.8M12 17.5l-2.2 1.8M12 17.5l2.2 1.8" />
    </>
  ),
  // Radiator core with a fan blade centred on it.
  "engine-cooling": (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M8 4.5v15M12 4.5v15M16 4.5v15" />
      <path d="M3.5 9.5h17M3.5 14.5h17" />
    </>
  ),
  // Coil spring between two mounts.
  "suspension-steering": (
    <>
      <path d="M7 3.5h10M7 20.5h10" />
      <path d="M8 6.5h8l-8 3h8l-8 3h8l-8 3h8" />
    </>
  ),
  // Two meshing gears.
  "transmission-driveline": (
    <>
      <circle cx="9.5" cy="9.5" r="4.5" />
      <circle cx="9.5" cy="9.5" r="1.5" />
      <path d="M9.5 3v2M9.5 14v2M3 9.5h2M14 9.5h2" />
      <circle cx="17" cy="17" r="3.5" />
      <path d="M17 12.5v1.5M17 20v1.5M12.5 17H14M20 17h1.5" />
    </>
  ),
  // Battery with its terminals and posts.
  "battery-electrical": (
    <>
      <rect x="2.5" y="7.5" width="19" height="10" rx="1.5" />
      <path d="M7 5.5v2M17 5.5v2" />
      <path d="M6.5 12.5h3M8 11v3M15 12.5h3" />
    </>
  ),
  // Fuel nozzle and hose.
  "diesel-service": (
    <>
      <path d="M4.5 20.5V5a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 13.5 5v15.5" />
      <path d="M3 20.5h12" />
      <path d="M6.5 7.5h5" />
      <path d="M13.5 9h4a2 2 0 0 1 2 2v5a1.5 1.5 0 0 1-3 0v-4" />
    </>
  ),
  // Notice with a check mark.
  "recall-work": (
    <>
      <path d="M6 3.5h9l4 4v13H6z" />
      <path d="M15 3.5v4h4" />
      <path d="M9 13.5l2 2 4-4" />
    </>
  ),
  // Muffler and tailpipe, with exhaust leaving the end.
  "exhaust-emissions": (
    <>
      <rect x="2.5" y="11" width="9" height="6" rx="3" />
      <path d="M11.5 14h4a2 2 0 0 0 2-2V9.5" />
      <path d="M19.5 8.5a1.6 1.6 0 1 1-2.6-1.2" />
      <path d="M21.5 5.2a1.4 1.4 0 1 1-2.3-1" />
    </>
  ),
};

// A wrench, for any service added later that has no icon of its own yet — so a
// new entry in lib/services.ts renders something sensible rather than a hole.
const FALLBACK = (
  <>
    <path d="M15.5 4a5 5 0 0 0-6.2 6.4l-5.6 5.6a2 2 0 0 0 2.8 2.8l5.6-5.6A5 5 0 0 0 19 6.5l-2.6 2.6-2.5-2.5Z" />
  </>
);

export function ServiceIcon({ slug, className }: IconProps) {
  return (
    <svg
      className={className ?? "service-icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="presentation"
      focusable="false"
      aria-hidden="true"
    >
      {PATHS[slug] ?? FALLBACK}
    </svg>
  );
}

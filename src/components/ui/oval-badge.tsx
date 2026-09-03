import { shop } from "@/lib/shop/shop";

/**
 * The shop's oval badge, redrawn as inline SVG so the hero can fly the real
 * logo at centerpiece size without the 315px raster going soft. Layout mirrors
 * the decal: yellow oval, name arched over a black band whose squared ends
 * bleed past the oval, phone number in red underneath. The phone comes from
 * `shop.phone.display` — the badge is a rendering of the single source of
 * truth, never a second copy of it.
 *
 * The def ids are module-constant, so render this once per page (the hero is
 * the only placement today); two instances would collide on `url(#…)`.
 */
export function OvalBadge({ className }: { className?: string } = {}) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 240"
      role="img"
      aria-label="Ocean Heights Auto and Tire"
    >
      <defs>
        <path id="oval-badge-arc-top" d="M 58 86 Q 160 60 262 86" fill="none" />
        <path id="oval-badge-arc-bottom" d="M 66 170 Q 160 206 254 170" fill="none" />
      </defs>
      <ellipse cx={160} cy={120} rx={141} ry={101} fill="var(--yellow)" />
      {/* The band's squared ends run past the oval like the real decal; the
          ink border drawn last knits them back into the oval. */}
      <rect x={-6} y={92} width={332} height={64} fill="var(--ink)" />
      <text
        fontFamily="var(--font-serif)"
        fontSize={34}
        fontWeight={900}
        fill="var(--ink)"
        letterSpacing={0.5}
      >
        <textPath href="#oval-badge-arc-top" startOffset="50%" textAnchor="middle">
          Ocean Heights
        </textPath>
      </text>
      <text
        x={160}
        y={127}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize={38}
        fontWeight={950}
        fill="#fff"
        letterSpacing={0.5}
      >
        AUTO <tspan fill="var(--yellow)">&amp;</tspan> TIRE
      </text>
      <text
        fontFamily="var(--font-geist-sans), Arial, sans-serif"
        fontSize={26}
        fontWeight={950}
        fill="var(--red)"
        letterSpacing={1}
      >
        <textPath href="#oval-badge-arc-bottom" startOffset="50%" textAnchor="middle">
          {shop.phone.display}
        </textPath>
      </text>
      <ellipse
        cx={160}
        cy={120}
        rx={146}
        ry={106}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={9}
      />
    </svg>
  );
}

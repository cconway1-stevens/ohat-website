/**
 * A US route marker — the scalloped two-tone shield you'd see bolted to a post
 * on an old road-trip highway.
 *
 * Drawn as inline SVG rather than CSS. The silhouette has concave shoulders
 * and a pinched waist, which `clip-path: polygon()` can't describe (it only
 * takes straight edges between points), and even with `path()` a clipped box
 * can't carry a matching outline, since the border box underneath stays
 * rectangular. An SVG path can be both filled and stroked along the real
 * curve, so the outline follows the scallops properly.
 *
 * Built from one path used three times: filled as the white sign blank with a
 * dark stroke, then a scaled-down copy used as a clip so the red header band
 * and the body colour stop exactly at the sign's edge instead of needing their
 * own hand-matched shapes.
 */

// Concave shoulders, a shallow waist, and a rounded point. Symmetric about
// x=50. The crown dip is deliberately shallow — taken much lower and the
// silhouette stops reading as a road sign and starts reading as a heart.
// The tangents leaving the crown are near-horizontal on purpose. Steeper ones
// turn the centre into a sharp V and the sign reads as a heart, however
// shallow the dip itself is.
const SHIELD =
  "M50 5 C46 4 40 0 30 1 C18 2 8 8 3 15 C9 24 12 33 11 41 " +
  "C10 50 6 57 2 63 C12 71 22 79 30 87 C38 94 45 100 50 103 " +
  "C55 100 62 94 70 87 C78 79 88 71 98 63 C94 57 90 50 89 41 " +
  "C88 33 91 24 97 15 C92 8 82 2 70 1 C60 0 54 4 50 5 Z";

export function RouteShield({ number }: { number: string }) {
  // Clip ids are document-global, so they're namespaced per sign — three of
  // these render on the contact page and a shared id would make all of them
  // clip to whichever defined it last.
  const clipId = `route-shield-${number}`;

  return (
    <svg
      className="route-shield"
      viewBox="0 0 100 104"
      role="presentation"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          {/* The same outline, inset, so the white blank reads as the sign's
              painted border rather than a stroke sitting on top of it. */}
          <path
            d={SHIELD}
            transform="translate(50 55) scale(.86) translate(-50 -55)"
          />
        </clipPath>
      </defs>

      <path d={SHIELD} className="route-shield-blank" />

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="36" className="route-shield-band" />
        <rect x="0" y="41" width="100" height="63" className="route-shield-body" />
      </g>

      <text x="50" y="27" className="route-shield-label">
        ROUTE
      </text>
      <text x="50" y="82" className="route-shield-number">
        {number}
      </text>
    </svg>
  );
}

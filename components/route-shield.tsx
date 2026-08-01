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
// An Interstate shield: a broad, nearly flat crown that flares up at the two
// top corners, the widest point high on the sign, then a long taper to a
// rounded point.
//
// The crown is the whole trick. Earlier versions dipped it in the middle and
// met it with steep tangents, which reads unmistakably as a heart — the top
// has to stay almost level, with the corners doing the lifting.
const SHIELD =
  "M50 2 C61 2 70 3 78 5 C86 7 93 11 97 16 " +
  "C93 26 91 34 91 42 C91 52 88 61 82 69 C74 80 63 91 50 102 " +
  "C37 91 26 80 18 69 C12 61 9 52 9 42 " +
  "C9 34 7 26 3 16 C7 11 14 7 22 5 C30 3 39 2 50 2 Z";

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
          <path d={SHIELD} transform="translate(50 55) scale(.86) translate(-50 -55)" />
        </clipPath>
      </defs>

      <path d={SHIELD} className="route-shield-blank" />

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="36" className="route-shield-band" />
        <rect x="0" y="41" width="100" height="63" className="route-shield-body" />
      </g>

      <text x="50" y="26" className="route-shield-label">
        ROUTE
      </text>
      {/* Sits high in the body rather than centred in it: the shield tapers
          to a point, so optical centre is well above geometric centre. */}
      <text x="50" y="75" className="route-shield-number">
        {number}
      </text>
    </svg>
  );
}

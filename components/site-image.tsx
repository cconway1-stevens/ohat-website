"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Every photograph on the site goes through here.
 *
 * It exists because `unoptimized` is mandatory on this project and forgetting
 * it is silent: `next/image` recomputes its URL on the client, and without the
 * prop it points at vinext's optimiser endpoint — a path that does not exist
 * in a static export. Correct-looking markup 404s the instant React hydrates.
 * `images: { unoptimized: true }` in next.config does not help, because vinext
 * ignores it. Nine of twelve call sites had missed the prop; centralising it
 * means the next one cannot.
 *
 * It also carries the loading placeholder, so a lazy image that has not
 * arrived shows the shop's own hatch and an inflating tyre rather than bare
 * alt text on blank paper — which reads as broken, and happens most on slow
 * connections.
 *
 * IMPORTANT — this renders the <img> and nothing else, on purpose.
 *
 * A previous version wrapped it in a <span> to hold the placeholder. That
 * quietly broke layouts across the whole site: the wrapper became the flex or
 * grid item instead of the image, so centred cards pinned their picture to the
 * top, and its stacking context both hid the drop-off badge and disabled the
 * ASE logo's multiply blend. A wrapper cannot be made reliably invisible to
 * layout, so the placeholder lives in the image's own `background` instead —
 * which paints behind a loading image, is covered the moment pixels arrive,
 * and costs the surrounding CSS nothing.
 */
export function SiteImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      className={`site-image${loaded ? " is-loaded" : ""}${className ? ` ${className}` : ""}`}
      unoptimized
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
    />
  );
}

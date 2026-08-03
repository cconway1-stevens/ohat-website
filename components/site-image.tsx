"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Every photograph on the site goes through here.
 *
 * It exists for two reasons, both of which were real bugs rather than tidiness:
 *
 * 1. `unoptimized` is not optional on this project, and forgetting it is
 *    silent. `next/image` recomputes its URL on the client, and without this
 *    prop it points at vinext's optimiser endpoint — a path that does not
 *    exist in a static export. The markup looks perfect in the HTML and the
 *    image still 404s the moment React hydrates. `images: { unoptimized: true }`
 *    in next.config does not help, because vinext ignores it. Nine of twelve
 *    call sites had missed the prop; centralising it means the next one cannot.
 *
 * 2. A lazy image that has not arrived yet used to render as bare alt text on
 *    a blank rectangle, which looks broken — particularly on a slow
 *    connection, which is exactly when it happens. The wrapper holds a
 *    placeholder in the image's own space until it loads.
 *
 * The placeholder is drawn from the site's palette rather than a grey box, so
 * a slow load reads as part of the design instead of a gap in it. It also
 * reserves the layout, so nothing jumps when the image lands.
 */
export function SiteImage({
  className,
  wrapperClassName,
  onLoad,
  ...props
}: ImageProps & { wrapperClassName?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`site-image${loaded ? " is-loaded" : ""} ${wrapperClassName ?? ""}`.trim()}>
      {/* A tyre being pumped up while the file is on its way.

          Driven by the real load event, not a timer: it runs from mount until
          the browser reports the image decoded, so it always reflects the true
          state rather than guessing at one. It is deliberately indeterminate
          rather than a percentage — a real byte count would mean fetching each
          image through `fetch()` and a stream reader, which gives up srcset,
          native lazy-loading and `priority`, and so would slow images down on
          exactly the weak connections this is meant to help. */}
      {!loaded ? (
        <span className="site-image-pump" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            {/* tyre */}
            <circle className="pump-tyre" cx="24" cy="24" r="15" strokeWidth="6" />
            {/* wheel */}
            <circle className="pump-hub" cx="24" cy="24" r="5.5" strokeWidth="3" />
            {/* the air going in, sweeping round the tread */}
            <circle
              className="pump-fill"
              cx="24"
              cy="24"
              r="15"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </span>
      ) : null}
      <Image
        {...props}
        className={className}
        unoptimized
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
    </span>
  );
}

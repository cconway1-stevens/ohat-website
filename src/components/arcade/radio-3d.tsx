"use client";

import dynamic from "next/dynamic";

/**
 * The 3D cabinet rides in its own chunk: Three.js is roughly ten times the
 * size of every other game in the arcade, so it is only ever downloaded by
 * the one page that runs it. The loading card keeps the cabinet's frame
 * while the chunk arrives.
 */
const Radio3DGame = dynamic(() => import("./radio-3d-game"), {
  ssr: false,
  loading: () => (
    <div className="paper-game cozy-scene">
      <div className="cozy-stage radio-3d-stage radio-3d-loading" aria-busy="true">
        <p>Rolling the radio out of the parts room…</p>
      </div>
    </div>
  ),
});

export function Radio3D() {
  return <Radio3DGame />;
}

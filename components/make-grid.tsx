"use client";

import Image from "next/image";
import { useState } from "react";
import { brandSrc, makes } from "@/lib/makes";
import { MakeMatchGame } from "./make-match-game";

function MakeLogo({ name }: { name: string }) {
  return (
    <li title={name}>
      <Image src={brandSrc(name)} width={36} height={36} alt="" aria-hidden="true" />
      <span>{name}</span>
    </li>
  );
}

export function MakeGrid() {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {/* Kept as a caption-weight link so the logo wall, not the game, stays
          the point of this section. */}
      <div className="make-grid-tools">
        <button
          type="button"
          className="make-game-toggle"
          onClick={() => setPlaying((current) => !current)}
          aria-pressed={playing}
        >
          {playing ? "← Back to the logo wall" : "Flip them over & play →"}
        </button>
      </div>

      {playing ? (
        <MakeMatchGame />
      ) : (
        <ul className="make-grid">
          {makes.map((name) => <MakeLogo key={name} name={name} />)}
        </ul>
      )}
    </>
  );
}

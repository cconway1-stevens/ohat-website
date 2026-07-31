"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { brandSrc, makes, shuffle, WALL_SIZE } from "@/lib/makes";
import { MakeMatchGame } from "./make-match-game";

type Order = "shuffled" | "alphabetical";

export function MakeGrid() {
  const [playing, setPlaying] = useState(false);
  const [order, setOrder] = useState<Order>("shuffled");
  // Which 28 of the brands are on the wall this visit. Dealt after mount so
  // the server-rendered markup matches what the browser hydrates; until then
  // the first WALL_SIZE brands stand in.
  const [wall, setWall] = useState<string[]>(() => makes.slice(0, WALL_SIZE));
  // Bumped on every reorder to restart the tile entrance animation.
  const [dealt, setDealt] = useState(0);

  useEffect(() => {
    // Deferred a frame so the shuffle is asynchronous to hydration — the
    // server-rendered wall stands until the browser deals its own.
    const id = requestAnimationFrame(() => {
      setWall(shuffle(makes).slice(0, WALL_SIZE));
      setDealt(1);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function setOrdering(next: Order) {
    if (next === order) return;
    setOrder(next);
    setWall((current) =>
      next === "alphabetical"
        ? [...current].sort((a, b) => a.localeCompare(b))
        : shuffle(current),
    );
    setDealt((count) => count + 1);
  }

  const shown = order === "alphabetical" ? "A to Z" : "shop-floor shuffle";

  return (
    <>
      {/* Caption-weight controls so the logo wall, not its chrome, stays the
          point of this section. The ordering pair applies only to the wall,
          so game mode hides it rather than showing dead controls. */}
      <div className="make-grid-tools">
        {!playing ? (
          <div className="make-order" role="group" aria-label="Order the logo wall">
            <button
              type="button"
              className="make-game-toggle"
              aria-pressed={order === "shuffled"}
              onClick={() => setOrdering("shuffled")}
            >
              Shuffle
            </button>
            <button
              type="button"
              className="make-game-toggle"
              aria-pressed={order === "alphabetical"}
              onClick={() => setOrdering("alphabetical")}
            >
              A–Z
            </button>
          </div>
        ) : null}
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
        <>
          <ul className="make-grid" key={`${order}-${dealt}`}>
            {wall.map((name, index) => (
              <li
                key={name}
                title={name}
                style={{ "--tile-delay": `${(index % 14) * 28}ms` } as React.CSSProperties}
              >
                <Image src={brandSrc(name)} width={36} height={36} alt="" aria-hidden="true" />
                <span>{name}</span>
              </li>
            ))}
          </ul>
          <p className="sr-only" aria-live="polite">Logo wall ordered {shown}.</p>
          {/* Rendered with the wall rather than after this component, so game
              mode never has the caption colliding with the play area. */}
          <p className="make-note">
            Representative makes shown. We service virtually all makes and
            models. Brand marks belong to their respective owners.
          </p>
        </>
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { arcadeGames } from "@/lib/arcade";

export const metadata: Metadata = {
  title: "The Garage Arcade",
  description:
    "You found the Ocean Heights garage arcade — four little car games for the waiting room.",
  alternates: { canonical: "/arcade" },
};

export default function ArcadePage() {
  return (
    <>
      <section className="inner-hero game-hero">
        <div className="shell">
          <p className="eyebrow">You found the back room</p>
          <h1>The garage arcade.</h1>
          <p>
            Four little games for the waiting room — all car, all free, no
            countdowns breathing down your neck. High scores stay on your own
            device.
          </p>
        </div>
      </section>
      <section className="section game-board">
        <div className="shell">
          <div className="arcade-cabinets">
            {arcadeGames.map((game, index) => (
              <Link
                key={game.slug}
                className="arcade-cabinet"
                href={`/arcade/${game.slug}`}
              >
                <span className="arcade-cabinet-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="arcade-cabinet-glyph" aria-hidden="true">{game.glyph}</span>
                <strong>{game.name}</strong>
                <p>{game.tagline}</p>
                <small>A garage take on {game.classic}</small>
                <b aria-hidden="true">Insert no coins →</b>
              </Link>
            ))}
          </div>
          <p className="make-note game-board-note">
            Found by poking around — nicely done. It&rsquo;s our little secret.{" "}
            <Link href="/">← Back to the shop</Link>
          </p>
        </div>
      </section>
    </>
  );
}

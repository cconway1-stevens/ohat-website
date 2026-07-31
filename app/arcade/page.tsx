import type { Metadata } from "next";
import Link from "next/link";
import { arcadeCategories, arcadeGames } from "@/lib/arcade";

// Derived, not typed out: the copy said "five" long after a sixth cabinet
// was added.
const COUNT = ["zero","one","two","three","four","five","six","seven","eight"][arcadeGames.length] ?? String(arcadeGames.length);

export const metadata: Metadata = {
  title: "The Garage Arcade",
  description:
    `You found the Ocean Heights garage arcade — ${COUNT} little car games for the waiting room.`,
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
            {COUNT[0].toUpperCase() + COUNT.slice(1)} little games for the waiting room — all car, all free, no
            countdowns breathing down your neck. High scores stay on your own
            device.
          </p>
        </div>
      </section>
      <section className="section game-board">
        <div className="shell">
          <div className="arcade-lobby-heading">
            <div>
              <p className="eyebrow">Choose a cabinet</p>
              <h2>Pick a game. Park for a minute.</h2>
            </div>
            <p>{COUNT[0].toUpperCase() + COUNT.slice(1)} quick car games, built for a short wait and a little friendly competition.</p>
          </div>
          {arcadeCategories.map((group) => {
            const games = arcadeGames.filter((game) => game.category === group.id);
            if (games.length === 0) return null;
            return (
              <section className="arcade-aisle" key={group.id}>
                <div className="arcade-aisle-heading">
                  <h3>{group.label}</h3>
                  <p>{group.blurb}</p>
                  <span aria-hidden="true">
                    {games.length} game{games.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="arcade-cabinets">
                  {games.map((game) => (
                    <Link
                      key={game.slug}
                      className="arcade-cabinet"
                      href={`/arcade/${game.slug}`}
                    >
                      <span className="arcade-cabinet-number" aria-hidden="true">
                        {String(arcadeGames.indexOf(game) + 1).padStart(2, "0")}
                      </span>
                      <span className="arcade-cabinet-glyph" aria-hidden="true">
                        {game.glyph}
                      </span>
                      <div className="arcade-cabinet-copy">
                        <strong>{game.name}</strong>
                        <p>{game.tagline}</p>
                      </div>
                      <div className="arcade-cabinet-footer">
                        <small>Garage {game.classic}</small>
                        <b aria-hidden="true">Play now <span>→</span></b>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
          <p className="make-note game-board-note">
            Found by poking around — nicely done. It&rsquo;s our little secret.{" "}
            <Link href="/">← Back to the shop</Link>
          </p>
        </div>
      </section>
    </>
  );
}

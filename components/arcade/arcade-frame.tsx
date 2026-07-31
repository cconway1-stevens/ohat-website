import Link from "next/link";
import { arcadeGames } from "@/lib/arcade";
import { PlayLock } from "./play-lock";

// The shared shell for one arcade cabinet: hero with the game's name, the
// game itself, and a footer rail to the other cabinets. Gives every game the
// same flow — arrive, read one line, play, hop to the next.
export function ArcadeFrame({
  slug,
  lede,
  children,
}: {
  slug: string;
  lede: string;
  children: React.ReactNode;
}) {
  const game = arcadeGames.find((candidate) => candidate.slug === slug);
  const others = arcadeGames.filter((candidate) => candidate.slug !== slug);

  return (
    <>
      <section className="inner-hero game-hero">
        <div className="shell">
          <Link className="back-link" href="/arcade">← All cabinets</Link>
          <p className="eyebrow">Garage arcade · a take on {game?.classic.toLowerCase()}</p>
          <h1>{game?.name}.</h1>
          <p>{lede}</p>
        </div>
      </section>
      <section className="section game-board">
        <div className="shell">
          {children}
          <PlayLock />
          <nav className="arcade-rail" aria-label="More arcade games">
            <span>Next cabinet:</span>
            {others.map((other) => (
              <Link key={other.slug} href={`/arcade/${other.slug}`}>
                {other.glyph} {other.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}

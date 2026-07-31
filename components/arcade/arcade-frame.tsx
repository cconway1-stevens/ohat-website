import Link from "next/link";
import { arcadeCategories, arcadeGames } from "@/lib/arcade";
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
  // Six "next cabinet" links is a wall. Lead with the games of the same kind —
  // someone who just played a word game usually wants another one.
  const others = arcadeGames.filter((candidate) => candidate.slug !== slug);
  const sameKind = others.filter((candidate) => candidate.category === game?.category);
  const rest = others.filter((candidate) => candidate.category !== game?.category);
  const kindLabel = arcadeCategories.find((entry) => entry.id === game?.category)?.label;

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
          {/* The stage is what "Freeze screen" promotes to the full viewport,
              so the board is always completely reachable while the page
              behind it stays put. */}
          <div className="arcade-stage">
            <div className="arcade-play-surface">{children}</div>
            <PlayLock />
          </div>
          <nav className="arcade-rail" aria-label="More arcade games">
            <span>More {kindLabel?.toLowerCase() ?? "games"}:</span>
            {sameKind.map((other) => (
              <Link key={other.slug} href={`/arcade/${other.slug}`}>
                {other.glyph} {other.name}
              </Link>
            ))}
            <span>Or something different:</span>
            {rest.map((other) => (
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

/**
 * A thin, full-width gold credit band for the site's maker — the last strip
 * at the very bottom of every page. Subtle but elegant: brushed antique gold,
 * a small medal, one quiet line of text.
 *
 * Deliberately self-contained — markup and styles in this one file, no
 * external CSS, fonts, or images — so it can be dropped into any site by
 * copying the file and rendering <MakerRibbon href="…" /> after the footer.
 * The inline <style> uses a scoped class prefix to avoid host collisions.
 */

const css = `
.mkr-band {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6em;
  width: 100%;
  padding: .62em 1em;
  box-sizing: border-box;
  text-decoration: none;
  font-size: .68rem;
  letter-spacing: .1em;
  text-transform: uppercase;
  /* Engraved, not printed: the glyphs sit a shade darker than the metal and
     catch a highlight along their lower edge, the way a cut groove does. */
  color: #6a4f16;
  text-shadow:
    0 1px 0 rgba(255, 250, 224, .62),
    0 -1px 0 rgba(58, 41, 6, .32);
  background:
    /* brushed grain */
    repeating-linear-gradient(90deg, rgba(255,255,255,.10) 0 1px, rgba(120,88,26,.07) 1px 3px),
    /* the sheen travelling across the bar */
    linear-gradient(96deg,
      #8f6a26 0%, #b98f37 12%, #e8cf82 30%, #fbf1c8 44%,
      #e8cf82 56%, #b98f37 74%, #9a7429 88%, #7d5c1f 100%);
  /* Bevelled edges top and bottom so it reads as a solid bar, not a stripe. */
  box-shadow:
    inset 0 1px 0 rgba(255, 252, 232, .75),
    inset 0 2px 3px rgba(255, 250, 224, .35),
    inset 0 -1px 0 rgba(58, 41, 6, .55),
    inset 0 -3px 5px rgba(88, 63, 12, .30);
  border-top: 1px solid rgba(58, 41, 6, .5);
}
.mkr-band:hover .mkr-band-cta, .mkr-band:focus-visible .mkr-band-cta { text-decoration-color: #6a4f16; }
.mkr-medal {
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 1.7em;
  height: 1.7em;
  flex: none;
}
.mkr-medal::before, .mkr-medal::after {
  content: "";
  position: absolute;
  top: 52%;
  width: .56em;
  height: 1.05em;
  background: linear-gradient(180deg, #8c6829, #6f5220);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}
.mkr-medal::before { left: .12em; transform: rotate(16deg); }
.mkr-medal::after { right: .12em; transform: rotate(-16deg); }
.mkr-medal-disc {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.4em;
  height: 1.4em;
  border-radius: 50%;
  color: #5d4310;
  font-size: .68em;
  line-height: 1;
  background:
    radial-gradient(circle at 32% 28%, #fdf3cf 0 18%, transparent 45%),
    conic-gradient(#e8c96a, #b98f37 22%, #f3dd93 38%, #ad8330 55%, #eecf74 72%, #a97f2d 88%, #e8c96a);
  box-shadow:
    inset 0 0 0 1px rgba(93, 67, 16, .55),
    inset 0 0 .3em rgba(255, 248, 220, .55),
    0 1px 2px rgba(0, 0, 0, .3);
}
/* Text and medal ride above the glint sweep. */
.mkr-band-text, .mkr-medal { position: relative; z-index: 1; }
.mkr-band small { font-size: 1em; font-weight: 700; }
.mkr-band-cta {
  text-decoration: underline;
  text-decoration-color: rgba(106, 79, 22, .5);
  text-decoration-thickness: 1px;
  text-underline-offset: .3em;
  transition: text-decoration-color .18s ease;
}
@media (max-width: 560px) {
  .mkr-band { font-size: .58rem; letter-spacing: .07em; }
}
@media (prefers-reduced-motion: no-preference) {
  /* A slow glint travelling the length of the bar, like light moving over
     polished metal. Sits above the fill and below the text. */
  .mkr-band::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg,
      transparent 42%, rgba(255, 253, 240, .34) 50%, transparent 58%);
    background-size: 260% 100%;
    animation: mkr-glint 7s ease-in-out infinite;
  }
  @keyframes mkr-glint {
    0%, 62% { background-position: 130% 0; }
    100% { background-position: -30% 0; }
  }
}
`;

export function MakerRibbon({
  href = "https://verdant-toffee-de3197.netlify.app",
  note = "Made with love by the owner's son",
}: {
  href?: string;
  note?: string;
}) {
  return (
    <a className="mkr-band" href={href} target="_blank" rel="noreferrer author">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="mkr-medal" aria-hidden="true">
        <span className="mkr-medal-disc">★</span>
      </span>
      <small className="mkr-band-text">
        {note} · <span className="mkr-band-cta">see his work</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </small>
    </a>
  );
}

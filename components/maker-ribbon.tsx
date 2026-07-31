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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .6em;
  width: 100%;
  padding: .52em 1em;
  box-sizing: border-box;
  text-decoration: none;
  font-size: .68rem;
  letter-spacing: .09em;
  text-transform: uppercase;
  color: #43310c;
  background:
    linear-gradient(180deg, rgba(255,248,220,.5), rgba(255,248,220,0) 42%),
    linear-gradient(90deg, #a57f30 0%, #c9a24b 18%, #e3c470 50%, #c9a24b 82%, #a57f30 100%);
  border-top: 1px solid rgba(61, 44, 8, .45);
}
.mkr-band:hover .mkr-band-cta, .mkr-band:focus-visible .mkr-band-cta { text-decoration-color: #43310c; }
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
.mkr-band small { font-size: 1em; font-weight: 650; }
.mkr-band-cta {
  text-decoration: underline;
  text-decoration-color: rgba(67, 49, 12, .45);
  text-decoration-thickness: 1px;
  text-underline-offset: .3em;
  transition: text-decoration-color .18s ease;
}
@media (max-width: 560px) {
  .mkr-band { font-size: .58rem; letter-spacing: .06em; }
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
      <small>
        {note} · <span className="mkr-band-cta">see his work</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </small>
    </a>
  );
}

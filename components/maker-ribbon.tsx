/**
 * A small gold award-ribbon credit for the site's maker.
 *
 * Deliberately self-contained — markup and styles in this one file, no
 * external CSS, fonts, or images — so it can be dropped into any site by
 * copying the file and rendering <MakerRibbon href="…" />. The inline
 * <style> uses a scoped class prefix to avoid colliding with host styles.
 */

const css = `
.mkr-ribbon {
  display: inline-flex;
  align-items: center;
  gap: .55em;
  text-decoration: none;
  font-size: .72rem;
  color: inherit;
  opacity: .82;
  transition: opacity .18s ease;
}
.mkr-ribbon:hover, .mkr-ribbon:focus-visible { opacity: 1; }
.mkr-medal {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.9em;
  height: 1.9em;
  flex: none;
}
/* Ribbon tails, tucked behind the medal. */
.mkr-medal::before, .mkr-medal::after {
  content: "";
  position: absolute;
  top: 55%;
  width: .62em;
  height: 1.15em;
  background: linear-gradient(180deg, #b3873a, #8c6829);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%);
}
.mkr-medal::before { left: .12em; transform: rotate(16deg); }
.mkr-medal::after { right: .12em; transform: rotate(-16deg); }
.mkr-medal-disc {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.55em;
  height: 1.55em;
  border-radius: 50%;
  color: #5d4310;
  font-size: .72em;
  line-height: 1;
  background:
    radial-gradient(circle at 32% 28%, #fdf3cf 0 18%, transparent 45%),
    conic-gradient(#e8c96a, #b98f37 22%, #f3dd93 38%, #ad8330 55%, #eecf74 72%, #a97f2d 88%, #e8c96a);
  box-shadow:
    inset 0 0 0 1px rgba(93, 67, 16, .55),
    inset 0 0 .35em rgba(255, 248, 220, .55),
    0 1px 2px rgba(0, 0, 0, .35);
}
.mkr-ribbon small {
  font-size: 1em;
  letter-spacing: .04em;
}
.mkr-ribbon u {
  text-decoration: underline;
  text-decoration-color: #d8b458;
  text-decoration-thickness: 1.5px;
  text-underline-offset: .25em;
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
    <a
      className="mkr-ribbon"
      href={href}
      target="_blank"
      rel="noreferrer author"
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <span className="mkr-medal" aria-hidden="true">
        <span className="mkr-medal-disc">★</span>
      </span>
      <small>
        {note} · <u>see more of their work</u>
        <span className="sr-only"> (opens in a new tab)</span>
      </small>
    </a>
  );
}

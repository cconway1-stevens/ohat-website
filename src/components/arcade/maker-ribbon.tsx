/**
 * The maker's credit at the very bottom of every page.
 *
 * Modelled on a real engraved nameplate — the small brass rectangle screwed
 * onto a machine or a shop door, not a banner. The previous version was a
 * full-bleed bar with a rainbow sheen, a star medal and a glint that swept
 * across it every seven seconds, which drew far more attention than a credit
 * line should and read as ornament rather than hardware.
 *
 * What makes it read as metal now is restraint: a narrow tonal range, a fine
 * horizontal grain, one hairline bevel catching light from above, and type
 * cut *into* the surface — a dark glyph with a pale highlight beneath it,
 * which is what an engraved groove actually looks like. No animation, no
 * gradient sweep, no medal. Two screws hold it on.
 *
 * Deliberately self-contained — markup and styles in this one file, no
 * external CSS, fonts, or images — so it can be dropped into any site by
 * copying the file and rendering <MakerRibbon href="…" /> after the footer.
 * The inline <style> uses a scoped class prefix to avoid host collisions.
 */

const css = `
.mkr-mount {
  display: flex;
  justify-content: center;
  padding: 1.15rem 1rem 1.5rem;
}
.mkr-plate {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .85em;
  max-width: 100%;
  padding: .5em 2.4em;
  box-sizing: border-box;
  text-decoration: none;
  border-radius: 2px;
  font-size: .62rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  /* Engraved, not printed: the glyphs sit darker than the plate and carry a
     pale highlight along their lower edge, the way a cut groove does. */
  color: #5c4a22;
  text-shadow: 0 1px 0 rgba(255, 250, 226, .5);
  /* A narrow tonal range is what separates believable metal from costume
     jewellery: fine grain over a shallow top-to-bottom fall of light. */
  background:
    repeating-linear-gradient(0deg,
      rgba(255, 255, 255, .045) 0 1px,
      rgba(92, 68, 24, .045) 1px 2px),
    linear-gradient(180deg, #cbb277 0%, #b99f63 42%, #a68d55 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 250, 226, .55),
    inset 0 -1px 0 rgba(70, 50, 14, .45),
    0 1px 2px rgba(0, 0, 0, .35);
  transition: filter .18s ease;
}
.mkr-plate:hover { filter: brightness(1.05); }
/* Countersunk screws, one at each end, with the slot catching the same light
   as the bevel above. */
.mkr-plate::before,
.mkr-plate::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent 42%, rgba(70, 50, 14, .75) 42% 58%, transparent 58%),
    radial-gradient(circle at 35% 30%, #e0cb94, #8f7840 70%);
  box-shadow: inset 0 0 0 1px rgba(70, 50, 14, .4), 0 1px 0 rgba(255, 250, 226, .3);
}
.mkr-plate::before { left: .85em; }
.mkr-plate::after { right: .85em; transform: rotate(58deg); }
.mkr-plate small { font-size: 1em; font-weight: 700; }
.mkr-plate-cta {
  text-decoration: underline;
  text-decoration-color: rgba(92, 74, 34, .45);
  text-decoration-thickness: 1px;
  text-underline-offset: .3em;
  transition: text-decoration-color .18s ease;
}
.mkr-plate:hover .mkr-plate-cta,
.mkr-plate:focus-visible .mkr-plate-cta { text-decoration-color: #5c4a22; }
.mkr-plate:focus-visible { outline: 2px solid #cbb277; outline-offset: 3px; }
@media (max-width: 560px) {
  .mkr-mount { padding: .9rem .75rem 1.15rem; }
  .mkr-plate {
    gap: .5em;
    padding: .5em 1.9em;
    font-size: .54rem;
    letter-spacing: .09em;
    text-align: center;
  }
  .mkr-plate::before { left: .6em; }
  .mkr-plate::after { right: .6em; }
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
    <div className="mkr-mount">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <a className="mkr-plate" href={href} target="_blank" rel="noreferrer author">
        <small>
          {note} · <span className="mkr-plate-cta">see his work</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </small>
      </a>
    </div>
  );
}

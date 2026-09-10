import { AccessibilityStatementSections } from "@/components/accessibility/accessibility-statement-sections";
import { AccessibilitySupportSections } from "@/components/accessibility/accessibility-support-sections";
import { SiteFooter } from "@/components/layout/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/layout/site-header";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Accessibility Statement",
  description:
    "How Ocean Heights Auto & Tire builds and tests this website for accessibility, the WCAG 2.1 AA conformance target it works to, known limitations, and how to report a barrier.",
  path: "/accessibility",
  ogTitle: "Accessibility Statement",
});

/**
 * The date this statement was last reviewed against the site. Update it when
 * the statement's claims change — `check-accessibility-statement.mjs` keeps
 * the claims themselves honest, but only a person can say when the page was
 * last read end to end.
 */
export const lastReviewed = "September 9, 2026";

const statementLinks = [
  ["commitment", "Commitment"],
  ["conformance", "Conformance"],
  ["testing", "How we test"],
  ["limitations", "Known limitations"],
  ["feedback", "Report a barrier"],
  ["technical", "Technical details"],
  ["assessment", "How this was assessed"],
] as const;

export default function AccessibilityPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="inner-hero privacy-hero">
          <div className="shell privacy-hero-grid">
            <div className="privacy-hero-copy">
              <p className="eyebrow">Accessibility</p>
              <h1>Everyone gets through the door.</h1>
              <p>
                A garage should be easy to reach whether you use a mouse, a keyboard, a screen
                reader, voice control, or a magnifier. Here is the standard this site is built to,
                how it is tested, what still falls short, and how to tell us when something blocks
                you.
              </p>
              <div className="privacy-hero-actions">
                <a className="button button-primary" href="#feedback">
                  Report a barrier
                </a>
                <a className="button button-ghost" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
              </div>
            </div>

            <aside className="privacy-inspection" aria-label="Accessibility at a glance">
              <p className="privacy-inspection-label">Website accessibility inspection</p>
              <dl>
                <div>
                  <dt>Target standard</dt>
                  <dd>WCAG 2.1 AA</dd>
                </div>
                <div>
                  <dt>Evaluation status</dt>
                  <dd>Not fully evaluated</dd>
                </div>
                <div>
                  <dt>Testing runs</dt>
                  <dd>Changes to main</dd>
                </div>
                <div>
                  <dt>Accessibility overlay</dt>
                  <dd>None used</dd>
                </div>
              </dl>
              <p className="privacy-updated">Statement reviewed · {lastReviewed}</p>
            </aside>
          </div>
        </section>

        <section className="section privacy-section" id="statement-details">
          <div className="shell">
            <div className="privacy-promises" aria-label="Accessibility commitments">
              <article>
                <span aria-hidden="true">01</span>
                <h2>Built to a standard</h2>
                <p>WCAG 2.1 Level AA is the target, applied to the site itself — not bolted on.</p>
              </article>
              <article>
                <span aria-hidden="true">02</span>
                <h2>Ongoing checks</h2>
                <p>Automated checks help find problems; human evaluation is also needed.</p>
              </article>
              <article>
                <span aria-hidden="true">03</span>
                <h2>A real person answers</h2>
                <p>Hit a barrier and you get a phone number and an inbox, not a support maze.</p>
              </article>
            </div>

            <div className="privacy-layout">
              <aside className="privacy-sidebar">
                <nav aria-label="Accessibility statement sections">
                  <p>On this page</p>
                  <ol>
                    {statementLinks.map(([id, label]) => (
                      <li key={id}>
                        <a href={"#" + id}>{label}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="privacy-sidebar-choice">
                  <strong>Blocked by something on this site?</strong>
                  <p>Tell us what happened and we will help you get it done another way.</p>
                  <a className="button button-primary" href="#feedback">
                    Report a barrier
                  </a>
                </div>
              </aside>

              <article className="privacy-policy">
                <AccessibilityStatementSections />
                <AccessibilitySupportSections />
              </article>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

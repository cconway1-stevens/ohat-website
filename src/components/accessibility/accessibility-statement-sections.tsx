import Link from "next/link";
import { shop } from "@/lib/shop/shop";

export function AccessibilityStatementSections() {
  return (
    <>
      <header className="privacy-policy-heading">
        <p className="eyebrow">The full statement</p>
        <h2>Ocean Heights Auto &amp; Tire accessibility statement</h2>
        <p>
          This statement describes the accessibility of{" "}
          <a href={shop.siteUrl}>{shop.siteUrl.replace("https://", "")}</a>, how {shop.name} tests
          it, and what to do when something on it gets in your way.
        </p>
      </header>

      <section id="commitment">
        <p className="privacy-section-number">01 · Commitment</p>
        <h2>What we are aiming for</h2>
        <p>
          We want every person who needs a mechanic to be able to find our hours, our address, our
          phone number, and what we do — regardless of how they use a computer. That includes people
          using screen readers, keyboard-only navigation, voice control, screen magnification,
          high-contrast modes, and people who need motion reduced or text enlarged.
        </p>
        <p>
          Accessibility here is a property of the site itself. We have not installed an
          accessibility overlay, toolbar, or plugin that claims to fix a site from the outside. We
          work on markup, contrast, focus behavior, and semantics in the site&rsquo;s own code.
        </p>
      </section>

      <section id="conformance">
        <p className="privacy-section-number">02 · Conformance</p>
        <h2>The standard this site works to</h2>
        <p>
          The Web Content Accessibility Guidelines (WCAG) define requirements for making web content
          more accessible. Our current testing baseline is <strong>WCAG 2.1 Level AA</strong>.
          <a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a> adds newer requirements that also
          inform improvements; this is not a claim that the site meets every requirement.
        </p>

        <div className="privacy-callout">
          <strong>Conformance status: not fully evaluated.</strong>
          <p>
            Automated checks and focused browser reviews do not establish full WCAG conformance. A
            complete evaluation across all pages, interactions, and assistive technologies has not
            been completed. The limitations below describe areas that may be difficult to use.
          </p>
        </div>

        <p>
          We use ongoing checks to find problems and improve the site. A passing automated result
          does not mean that every visitor can use every feature.
        </p>
      </section>

      <section id="testing">
        <p className="privacy-section-number">03 · How we test</p>
        <h2>Automated checks and their limits</h2>
        <p>
          Our repository is configured to run accessibility checks on changes submitted to the main
          branch. These checks inspect selected page states; they do not exercise every dialog,
          game, or possible interaction.
        </p>

        <div
          className="privacy-table-wrap"
          role="region"
          aria-label="Accessibility testing methods"
          tabIndex={0}
        >
          <table>
            <caption>How this site is tested for accessibility</caption>
            <thead>
              <tr>
                <th scope="col">Method</th>
                <th scope="col">What it covers</th>
                <th scope="col">How often</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">axe-core automated audit</th>
                <td>
                  Public pages discovered in the static build, excluding redirect stubs and the 404
                  page, checked with available WCAG 2.1 A and AA rules
                </td>
                <td>Pushes and pull requests to main</td>
              </tr>
              <tr>
                <th scope="row">Automated check result</th>
                <td>
                  A detected violation fails the accessibility check. This is not a guarantee that
                  every hosting service blocks publication
                </td>
                <td>Pushes and pull requests to main</td>
              </tr>
              <tr>
                <th scope="row">Lighthouse accessibility score</th>
                <td>Page-level accessibility scoring alongside performance and best practices</td>
                <td>Pushes and pull requests to main</td>
              </tr>
              <tr>
                <th scope="row">Focused browser review</th>
                <td>
                  Keyboard access, visible focus, dialog behavior, and narrow-screen layout on the
                  pages being reviewed. A full screen-reader audit remains outstanding
                </td>
                <td>During focused reviews; coverage varies</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Accessibility features built into the site</h3>
        <ul>
          <li>a &ldquo;Skip to content&rdquo; link on the main informational pages;</li>
          <li>visible focus styles for keyboard navigation;</li>
          <li>
            semantic headings, landmarks, and lists, so a screen reader can navigate by structure;
          </li>
          <li>
            text alternatives for meaningful images, and decorative graphics hidden from assistive
            technology;
          </li>
          <li>
            reduced-motion styles for decorative animation; real-time games may still contain
            motion;
          </li>
          <li>
            wide-content tables that scroll within their own region and stay keyboard-reachable;
          </li>
          <li>
            responsive layouts and scrollable tables to support smaller screens and browser zoom.
          </li>
        </ul>
      </section>

      <section id="limitations">
        <p className="privacy-section-number">04 · Known limitations</p>
        <h2>Where this site still falls short</h2>
        <p>
          Please contact us if these features cause a barrier or if you find a problem not listed
          here.
        </p>

        <h3>Automated testing has limits</h3>
        <p>
          Automated tools detect only some accessibility problems. Things like whether alternative
          text is <em>meaningful</em>, whether a focus order is <em>logical</em>, or whether a link
          makes sense out of context still require human judgment and assistive-technology testing.
        </p>

        <h3>The garage arcade</h3>
        <p>
          The <Link href="/arcade">garage arcade</Link> is a real-time game. It is optional
          entertainment, it is not part of arranging vehicle service, and it may not be fully
          operable with a screen reader or by keyboard alone. No information you need to reach the
          shop, book work, or contact us is available only inside it.
        </p>

        <h3>Third-party content</h3>
        <p>
          Some content comes from services we do not control and cannot fix directly: the optional
          Google Maps embed on the contact page and radio streams played inside the arcade. Live
          radio does not include transcripts. The shop address and hours are available as text, and
          directions links are available without loading the map. These alternatives help with shop
          information; they do not make third-party content fully accessible.
        </p>

        <h3>Reporting anything else</h3>
        <p>
          If you hit another barrier, please use the contact options below. Describe the page and
          what you were trying to do so we can investigate.
        </p>
      </section>
    </>
  );
}

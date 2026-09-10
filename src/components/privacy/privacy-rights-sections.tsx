import Link from "next/link";
import { PrivacySettingsButton } from "@/components/analytics/privacy-settings-button";
import { phoneDisplay, phoneHref } from "@/components/layout/site-header";
import { contactEmail } from "@/lib/shop/business";
import { shop } from "@/lib/shop/shop";

const termlyRequestUrl = "https://app.termly.io/dsar/617a8df7-a202-450c-9649-fa53f77cd003";

export function PrivacyRightsSections() {
  return (
    <>
      <section id="choices">
        <p className="privacy-section-number">04 · Your choices</p>
        <h2>Control optional services</h2>
        <div className="privacy-choice-panel">
          <div>
            <h3>Change your mind anytime</h3>
            <p>
              The first-visit prompt offers <strong>Allow all optional services</strong>,{" "}
              <strong>Use essential services only</strong>, and <strong>Choose my services</strong>.
              The detailed panel separately controls Google Analytics, Vercel Web Analytics, Vercel
              Speed Insights, shop weather, Google Maps, and arcade internet radio. Save your
              choices to apply them to this browser.
            </p>
          </div>
          <PrivacySettingsButton placement="page" />
        </div>
        <ul>
          <li>
            <strong>Global Privacy Control (GPC):</strong> if your browser exposes an enabled GPC signal to this site,
            Google Analytics, Vercel Web Analytics, and Vercel Speed Insights stay off, even if you
            allow them in the panel. Weather, the map, and radio remain separate opt-in choices. Learn more at{" "}
            <a href="https://globalprivacycontrol.org/" target="_blank" rel="noreferrer">
              globalprivacycontrol.org
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </li>
          <li>
            <strong>Browser controls:</strong> you can block or delete cookies and site storage in
            your browser. Core pages, phone links, and directions links continue to work without
            optional services.
          </li>
          <li>
            <strong>Google&rsquo;s opt-out:</strong> Google offers a browser add-on that disables
            Google Analytics across participating sites at{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noreferrer">
              tools.google.com/dlpage/gaoptout
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </li>
          <li>
            <strong>Do Not Track:</strong> browsers have not adopted one uniform DNT standard. We do
            not interpret legacy DNT signals, but we do honor the recognized GPC signal as described
            above.
          </li>
        </ul>
      </section>

      <section id="rights">
        <p className="privacy-section-number">05 · Your rights</p>
        <h2>Ask, correct, delete, or appeal</h2>
        <p>
          Depending on where you live and which law applies, you may have the right to know whether
          personal data is processed, access it, correct it, delete it, receive a portable copy,
          withdraw consent, and opt out of sale, targeted advertising, or certain profiling. You
          will not be discriminated against for making a privacy request.
        </p>
        <p>
          New Jersey law grants these rights when its coverage rules are met. Whether or not a
          particular statute requires it, we will consider a clear request about website or shop
          records and respond in line with applicable law.
        </p>

        <div className="privacy-request-card">
          <div>
            <p className="privacy-section-number">Privacy request</p>
            <h3>Use the method that is easiest for you.</h3>
            <p>
              The Termly request form opens on Termly&rsquo;s site, which receives ordinary connection
              information when it opens and the details you choose to submit. You can email or
              call the shop instead; no Termly account is needed to contact us directly.
            </p>
          </div>
          <div className="privacy-request-actions">
            <a
              className="button button-primary"
              href={termlyRequestUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Submit a privacy request
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              className="privacy-text-link"
              href={"mailto:" + contactEmail + "?subject=Privacy request"}
            >
              Email a privacy request
            </a>
          </div>
        </div>

        <h3>Verification, authorized agents, and appeals</h3>
        <p>
          We may ask for enough information to reasonably verify your identity or an authorized
          agent&rsquo;s permission. Information supplied for verification is used for that purpose
          and fraud prevention. If applicable law gives you a right to appeal a denied request,
          email us with the subject &ldquo;Privacy appeal.&rdquo; We will explain the decision and
          the available next step in writing. You do not need to create an account to request help.
        </p>
        <p>
          Where the New Jersey Data Privacy Act applies, its response period is 45 days, with an
          additional 45 days when permitted and explained within the initial period. An appeal
          receives a written response within 45 days. If an appeal is denied, you may submit a
          complaint to the <a href="https://njconsumeraffairs.nj.gov/file-a-complaint/">New Jersey
          Division of Consumer Affairs</a>. These statutory periods are separate from accessibility
          support requests.
        </p>
      </section>

      <section id="retention">
        <p className="privacy-section-number">06 · Retention &amp; security</p>
        <h2>Keep less, protect what remains</h2>
        <p>
          Browser-only choices, scores, preferences, chat history, and cached data remain on your
          device until the feature clears them or you clear browser storage. Analytics and hosting
          providers retain information under their account settings, contracts, and operational
          schedules. We aim to keep identifiable information only as long as it is reasonably needed
          for the purposes above or required by law.
        </p>
        <p>
          We use reasonable technical and organizational safeguards appropriate to the information
          involved. No internet transmission or storage system can be guaranteed completely secure,
          so we cannot promise that unauthorized access will never occur.
        </p>

        <h3>Children</h3>
        <p>
          This site is for people arranging vehicle service and is not directed to children under
          13. It knowingly collects no names or contact details from children. The arcade asks for
          no account and keeps scores on the device. Contact us if you believe a child supplied
          personal information to the business so it can be reviewed. Optional analytics, maps,
          and radio involve provider requests even without an account; a lack of names does not
          mean those services process no personal data.
        </p>

        <h3>Where information is processed</h3>
        <p>
          The shop provides vehicle services locally in New Jersey. Website providers may process
          information in the United States or other countries where they operate. Turning off a
          service stops its future use by this site; it does not automatically delete information
          a provider has already received. Contact us about information held by the shop.
        </p>

        <h3>Policy updates</h3>
        <p>
          We may update this notice as the site, our providers, or applicable requirements change.
          The date at the top records the most recent substantive change. Material changes will be
          described here or presented prominently on the site.
        </p>
      </section>

      <section id="contact-privacy">
        <p className="privacy-section-number">07 · Contact</p>
        <h2>Talk to a person</h2>
        <p>Questions, privacy requests, or comments about this notice can go directly to:</p>
        <address className="privacy-contact-card">
          <strong>{shop.name}</strong>
          <span>{shop.address.street}</span>
          <span>{shop.address.cityLine}</span>
          <span>United States</span>
          <a href={phoneHref}>{phoneDisplay}</a>
          <a href={"mailto:" + contactEmail}>{contactEmail}</a>
        </address>
        <p>
          <Link href="/contact">See all contact and direction options →</Link>
        </p>
      </section>

      <footer className="privacy-attribution">
        Portions of this notice were prepared using{" "}
        <a
          href="https://termly.io/products/privacy-policy-generator/"
          target="_blank"
          rel="noopener noreferrer external"
        >
          Termly&rsquo;s Privacy Policy Generator
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        , then reviewed and rewritten to match this website&rsquo;s actual data practices.
      </footer>
    </>
  );
}

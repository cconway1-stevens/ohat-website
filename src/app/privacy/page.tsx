import { PrivacySettingsButton } from "@/components/analytics/privacy-settings-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PrivacyDataSections } from "@/components/privacy/privacy-data-sections";
import { PrivacyRightsSections } from "@/components/privacy/privacy-rights-sections";
import { PrivacyServicesSection } from "@/components/privacy/privacy-services-section";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "A clear account of the website data Ocean Heights Auto & Tire processes, the services involved, and the privacy choices available to every visitor.",
  path: "/privacy",
  ogTitle: "Privacy Policy",
});

const lastUpdated = "September 10, 2026";
const policyLinks = [
  ["scope", "Scope"],
  ["information", "Information"],
  ["services", "Services & cookies"],
  ["choices", "Your choices"],
  ["rights", "Your rights"],
  ["retention", "Retention & security"],
  ["contact-privacy", "Contact"],
] as const;

export default function PrivacyPage() {
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
              <p className="eyebrow">Privacy center</p>
              <h1>Privacy, without the fine print.</h1>
              <p>
                Here is what this website processes, why it is used, and how to change your choices.
                Optional services stay off until you say yes.
              </p>
              <div className="privacy-hero-actions">
                <PrivacySettingsButton placement="page" />
                <a className="button button-ghost" href="#policy-details">
                  Read the full policy
                </a>
              </div>
            </div>

            <aside className="privacy-inspection" aria-label="Privacy at a glance">
              <p className="privacy-inspection-label">Website privacy inspection</p>
              <dl>
                <div>
                  <dt>Data sold</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Targeted ads</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Forms &amp; accounts</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Optional tools</dt>
                  <dd>Off by default</dd>
                </div>
              </dl>
              <p className="privacy-updated">Policy checked · {lastUpdated}</p>
            </aside>
          </div>
        </section>

        <section className="section privacy-section" id="policy-details">
          <div className="shell">
            <div className="privacy-promises" aria-label="Privacy commitments">
              <article>
                <span aria-hidden="true">01</span>
                <h2>No data sales</h2>
                <p>We do not sell or license personal information or use it for targeted ads.</p>
              </article>
              <article>
                <span aria-hidden="true">02</span>
                <h2>Choice comes first</h2>
                <p>Analytics and shop weather are blocked until you choose to allow them.</p>
              </article>
              <article>
                <span aria-hidden="true">03</span>
                <h2>Easy to change</h2>
                <p>The Privacy settings control on every page lets you withdraw consent anytime.</p>
              </article>
            </div>

            <div className="privacy-layout">
              <aside className="privacy-sidebar">
                <nav aria-label="Privacy policy sections">
                  <p>On this page</p>
                  <ol>
                    {policyLinks.map(([id, label]) => (
                      <li key={id}>
                        <a href={"#" + id}>{label}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
                <div className="privacy-sidebar-choice">
                  <strong>Your settings travel with this browser.</strong>
                  <p>Review or change optional services whenever you like.</p>
                  <PrivacySettingsButton placement="page" />
                </div>
              </aside>

              <article className="privacy-policy">
                <PrivacyDataSections />
                <PrivacyServicesSection />
                <PrivacyRightsSections />
              </article>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

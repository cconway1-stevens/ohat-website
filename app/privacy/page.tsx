import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";
import { contactEmail } from "@/lib/business";
import { pageMetadata } from "@/lib/seo";
import { shop } from "@/lib/shop";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    `How Ocean Heights Auto & Tire handles information on this website: what the site measures, the cookies it sets, and the choices you have. We do not sell personal data.`,
  path: "/privacy",
  ogTitle: "Privacy Policy",
});

/**
 * Update this whenever the substance of the policy changes — not on every
 * deploy. A "last updated" date that moves because a stylesheet changed tells
 * a reader nothing, and the notice is supposed to record when the *practices*
 * last changed.
 */
const lastUpdated = "August 1, 2026";

export default function PrivacyPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="inner-hero">
          <div className="shell">
            <p className="eyebrow">Straight answers</p>
            <h1>Privacy policy</h1>
            <p>
              We run a repair shop, not a data business. This page explains
              exactly what this website collects, who else your browser talks
              to when you visit, and how to turn the measurement off. Last
              updated {lastUpdated}.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="shell legal-doc">
            <h2>The short version</h2>
            <p>
              We do not sell your personal information. We do not share it for
              targeted advertising. There is no contact form on this site, so
              unless you call us, email us, or drop off a vehicle, we never
              receive your name at all. The website measures which pages people
              read and which pages lead to a phone call, and that is the whole
              purpose.
            </p>

            <h2>Information you give us directly</h2>
            <p>
              If you call {phoneDisplay}, email us, or leave a vehicle for
              service, we collect what you tell us: your name, phone number,
              email address, vehicle details, and the service history we need
              to work on your car. We use it to do the work, to reach you about
              it, and to keep the records a repair shop is expected to keep. We
              do not sell it, rent it, or hand it to advertisers.
            </p>
            <p>
              This website itself has no forms and no accounts. Every &ldquo;get
              in touch&rdquo; link here opens your own phone app or email
              program, so that message goes straight to us and passes through
              nothing on this site along the way.
            </p>

            <h2>What the website measures automatically</h2>
            <p>
              Like most websites, this one records some technical information
              about visits so we can tell what is useful and what is not.
              Google Analytics is the only such tool on the site:
            </p>
            <ul>
              <li>
                <strong>Google Analytics 4</strong> — pages viewed, roughly how
                long the visit lasted, general location (city or region level,
                not your street), the type of device and browser, and the site
                or search that sent you here. It also records when a visitor
                taps one of our phone-number links, because a phone call is the
                only thing this site is really trying to produce. Google
                Analytics sets cookies to recognise a repeat visit.
              </li>
            </ul>
            <p>
              We have deliberately turned off the advertising side of Google
              Analytics. Google Signals, ad personalisation and advertising
              cookies are all disabled, and IP addresses are anonymised. Nothing
              this site measures is used to target ads to you, here or anywhere
              else.
            </p>

            <h2>Other services your browser contacts</h2>
            <p>
              A few parts of the site load from elsewhere, and any time your
              browser fetches something it necessarily reveals your IP address
              to whoever is serving it. In the interest of a complete answer:
            </p>
            <ul>
              <li>
                <strong>Google</strong> hosts the analytics script and the
                site&rsquo;s typeface, and supplies the embedded map on our{" "}
                <Link href="/contact">contact page</Link>. That map is a Google
                Maps frame, so opening the contact page loads content from
                Google and Google may set its own cookies for it. Every other
                &ldquo;get directions&rdquo; control on this site is a plain
                link that does nothing until you click it.
              </li>
              <li>
                <strong>Open-Meteo</strong> supplies the current weather shown
                in the header. We ask it for the weather at{" "}
                <em>the shop&rsquo;s</em> coordinates, never yours — your
                location is not sent, looked up, or requested.
              </li>
              <li>
                <strong>Radio-Browser</strong> supplies station listings, and
                only on the arcade&rsquo;s radio game. It is not contacted
                anywhere else on the site.
              </li>
            </ul>

            <h2>Things stored on your own device</h2>
            <p>
              The arcade games and the shop almanac save high scores, settings
              and a cached weather reading in your browser&rsquo;s local
              storage. That data stays on your device, is never transmitted to
              us, and disappears when you clear your browser data.
            </p>

            <h2>Your choices</h2>
            <ul>
              <li>
                <strong>Global Privacy Control.</strong> If your browser or an
                extension sends a GPC signal, this site sees it and turns off
                analytics storage automatically. There is nothing for you to
                click, and we do not ask you to reconsider.
              </li>
              <li>
                <strong>Browser settings.</strong> You can block or delete
                cookies for this site at any time. Nothing here breaks without
                them — there is no login or cart to lose.
              </li>
              <li>
                <strong>Google&rsquo;s own opt-out.</strong> Google publishes a
                browser add-on that switches Google Analytics off across every
                site that uses it, at{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noreferrer"
                >
                  tools.google.com/dlpage/gaoptout
                </a>
                .
              </li>
              <li>
                <strong>Just ask.</strong> Call or email and ask what we have
                about you, ask for a correction, or ask us to delete it. We will
                do it. You do not need to cite a statute or fill in a form, and
                we will not treat you any differently for asking.
              </li>
            </ul>

            <h2>New Jersey residents</h2>
            <p>
              New Jersey&rsquo;s Data Privacy Act gives residents rights over
              their personal data — to see it, correct it, delete it, get a
              copy, and opt out of targeted advertising or the sale of their
              data. That law applies to companies handling the data of at least
              100,000 residents, or 25,000 if they make money selling it. A
              neighbourhood repair shop is nowhere near either threshold, so
              those obligations do not fall on us.
            </p>
            <p>
              We would rather not lean on that. We honour the requests above
              from anyone who asks, whether or not the law requires it, we
              honour Global Privacy Control, and we do not sell personal data or
              use it for targeted advertising — which is what most of those
              rights exist to protect you from in the first place.
            </p>

            <h2>Children</h2>
            <p>
              This site is meant for people arranging vehicle service and is not
              directed at children. We do not knowingly collect personal
              information from anyone under 13. The arcade is a bit of fun for
              whoever finds it; it asks for nothing and keeps its scores on your
              own device.
            </p>

            <h2>Security and retention</h2>
            <p>
              Customer and vehicle records are kept as long as we need them to
              service your vehicle, stand behind our work, and meet tax and
              recordkeeping obligations. We limit access to the people who need
              it to do their jobs.
            </p>

            <h2>Changes</h2>
            <p>
              If we change how any of this works, we will update this page and
              move the date at the top. Material changes will be described here
              rather than slipped in quietly.
            </p>

            <h2>Contact us</h2>
            <p>
              Questions about any of this, or about information we hold, go to a
              person, not a ticket queue:
            </p>
            <ul>
              <li>
                Call <a href={phoneHref}>{phoneDisplay}</a>, {shop.hours.display}
              </li>
              <li>
                Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </li>
              <li>
                Write or visit: {shop.name}, {shop.address.full}
              </li>
            </ul>
            <p>
              <Link href="/contact">More ways to reach the shop →</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

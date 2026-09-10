import { phoneDisplay } from "@/components/layout/site-header";
import { shop } from "@/lib/shop/shop";

export function PrivacyDataSections() {
  return (
    <>
      <header className="privacy-policy-heading">
        <p className="eyebrow">The complete notice</p>
        <h2>Ocean Heights Auto &amp; Tire privacy policy</h2>
        <p>
          This notice describes how {shop.name} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) handles information connected with{" "}
          <a href={shop.siteUrl}>{shop.siteUrl.replace("https://", "")}</a>. It is written for
          people, not lawyers, while preserving the details that matter.
        </p>
      </header>

      <section id="scope">
        <p className="privacy-section-number">01 · Scope</p>
        <h2>What this policy covers</h2>
        <p>
          This policy covers this website, its optional analytics, the services your browser may
          contact while using it, and the choices stored on your device. It does not turn a phone
          call, email, or in-person conversation into a website submission.
        </p>
        <p>
          Calling {phoneDisplay} or choosing an email link hands the conversation to your own phone
          or email app. The website does not receive the message. The shop may then keep customer,
          vehicle, estimate, repair, payment, or warranty records needed to provide service and meet
          its legal obligations. Questions or requests about those business records can use the same
          contact options at the end of this notice.
        </p>
      </section>

      <section id="information">
        <p className="privacy-section-number">02 · Information</p>
        <h2>What the website processes</h2>
        <p>
          There is no contact form, booking form, account, checkout, or online payment on this
          website. The contact-page chat does accept text and stores a limited history in this
          browser. Its answer matching runs on your device; typed messages are not sent to the
          shop or an AI provider. Please do not enter sensitive information into chat.
        </p>

        <div
          className="privacy-table-wrap"
          role="region"
          aria-label="Website data and processing purposes"
          tabIndex={0}
        >
          <table>
            <caption>Website data and the reason it is processed</caption>
            <thead>
              <tr>
                <th scope="col">Activity</th>
                <th scope="col">Information involved</th>
                <th scope="col">Why</th>
                <th scope="col">When</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Site delivery &amp; security</th>
                <td>IP address, browser details, requested page, and timestamp</td>
                <td>Deliver pages, prevent abuse, and troubleshoot errors</td>
                <td>Essential</td>
              </tr>
              <tr>
                <th scope="row">Google Analytics 4</th>
                <td>
                  Page views, referral source, device/browser type, approximate city or region,
                  call-link clicks, and <code>_ga</code> cookies
                </td>
                <td>Learn which pages help visitors reach the shop</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Vercel Web Analytics</th>
                <td>
                  Page, referrer, filtered query details, approximate city or region, browser,
                  operating system, and device type
                </td>
                <td>Cookieless, aggregated site-usage counts</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Vercel Speed Insights</th>
                <td>
                  Page URL, performance measurements, network speed, browser, device, operating
                  system, country, and event time. The request also exposes an IP address to Vercel
                </td>
                <td>Find and fix slow pages</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Google Maps embed</th>
                <td>IP address and browser details sent to Google when the map loads</td>
                <td>Show the shop&rsquo;s location on a map</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Radio-Browser &amp; station streams</th>
                <td>
                  IP address and browser details sent to the station directory and to whichever
                  station you play
                </td>
                <td>Look up and play internet radio in the arcade</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Open-Meteo shop weather</th>
                <td>Shop coordinates, IP address, and request details received by Open-Meteo</td>
                <td>Show weather at the shop, not your location</td>
                <td>Only after consent</td>
              </tr>
              <tr>
                <th scope="row">Chat voice features</th>
                <td>Microphone audio for dictation or message text for read-aloud</td>
                <td>Your browser or operating system provides speech services, which may use remote servers</td>
                <td>Only when you use a voice control; microphone access is subject to browser permission</td>
              </tr>
              <tr>
                <th scope="row">Local browser storage</th>
                <td>
                  Privacy choices, arcade scores and settings, chat history, display preferences,
                  and a short weather cache
                </td>
                <td>Remember your choices on this device</td>
                <td>Stays on your device</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="privacy-callout">
          <strong>We do not ask you for sensitive personal information.</strong>
          <p>
            We do not request precise location, financial details, government IDs, biometrics,
            health data, or information about race, religion, or sexual orientation. Approximate
            city or region information may be inferred by an analytics or hosting provider from an
            IP address; the site never asks for GPS or browser location access.
          </p>
        </div>

        <h3>Chat, voice, and your device</h3>
        <p>
          Chat is an automated information tool, not a message to a staff member. Its local log
          holds up to 200 entries; reopening the panel restores up to 20 recent entries from the
          last day. Older entries are not deleted just because they are no longer shown. Use
          Clear chat or clear this site&rsquo;s browser storage to remove the saved conversation.
          Downloading a transcript creates a file on your device.
        </p>
        <p>
          Dictation and read-aloud use browser speech features. Depending on your browser and
          selected voice, audio or text may be sent to a browser or operating-system provider for
          processing. These features are activated by their own controls, not by Klaro. You can
          type instead, stop read-aloud, or revoke microphone permission in browser settings.
        </p>

        <h3>How we use information</h3>
        <p>Website information is used only to:</p>
        <ul>
          <li>deliver, secure, maintain, and troubleshoot the site;</li>
          <li>measure page views and phone-link clicks after consent;</li>
          <li>provide an optional map, shop weather, or live-radio feature when chosen;</li>
          <li>comply with law, enforce our rights, or respond to a valid legal request; and</li>
          <li>evaluate and improve the usefulness of the website.</li>
        </ul>
        <p>
          We do not use this website information for targeted advertising, automated decisions with
          legal effects, or cross-site profiling. We do not buy personal data about visitors from
          third parties.
        </p>
      </section>
    </>
  );
}

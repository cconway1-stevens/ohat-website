import Link from "next/link";

export function PrivacyServicesSection() {
  return (
    <section id="services">
      <p className="privacy-section-number">03 · Services &amp; cookies</p>
      <h2>Who your browser may contact</h2>
      <p>
        A third-party request necessarily reveals an IP address and basic browser information to the
        service receiving it. These are the services this site can contact and the condition that
        activates each one.
      </p>

      <div className="privacy-service-list">
        <article>
          <div>
            <h3>Google Analytics 4</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            Google hosts the analytics script. It is blocked until you choose to allow it.
            Advertising storage, ad-user data, ad personalization, Google Signals, and
            ad-personalization signals are disabled. Turning it off stops future collection and
            removes accessible <code>_ga</code> cookies from this site.
          </p>
        </article>
        <article>
          <div>
            <h3>Vercel Web Analytics</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            Vercel provides cookieless, aggregated page-use statistics. It is also blocked until you
            choose it. Vercel says it does not store an IP address with a data point or reconstruct
            visits across sites, and that its visitor hash is discarded after 24 hours.
          </p>
        </article>
        <article>
          <div>
            <h3>Vercel Speed Insights</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            Vercel measures how quickly pages load so slow pages can be found and fixed. It sets no
            cookie and carries no tracking identifier, but Vercel still receives your IP address
            when it loads, so it is blocked until you choose to allow it.
          </p>
        </article>
        <article>
          <div>
            <h3>Open-Meteo shop weather</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            Open-Meteo receives a request for weather at the shop&rsquo;s fixed coordinates, never
            your location. The request stays off until you{" "}
            {"enable shop weather in Privacy settings."}
          </p>
        </article>
        <article>
          <div>
            <h3>Google Maps</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            The map on our <Link href="/contact">contact page</Link> stays off until you{" "}
            {"turn on Google Maps in Privacy settings."} Once you do, it loads automatically —
            there is no separate button to press. Google then receives the network request and may
            use its own cookies. Ordinary directions links do nothing until you choose them.
          </p>
        </article>
        <article>
          <div>
            <h3>Radio-Browser &amp; station streams</h3>
            <span className="privacy-service-state">Consent required</span>
          </div>
          <p>
            These are contacted only inside the garage arcade, and only after you allow arcade
            internet radio in Privacy settings and then{" "}
            {"actively choose a station category or stream."} The selected station&rsquo;s server
            receives the request needed to play it, and because stations are listed by a public
            directory that server is not one we vetted. Station artwork is never loaded, so no
            station host sees you before you press play. Turning the choice back off stops any
            stream already playing.
          </p>
        </article>
        <article>
          <div>
            <h3>Hosting providers</h3>
            <span className="privacy-service-state">Essential</span>
          </div>
          <p>
            The production site is served through Vercel. A Cloudflare Worker build may also be
            used. Hosts process ordinary request and security logs needed to deliver and protect the
            site. These operational logs cannot be switched off with the website preference center.
          </p>
        </article>
      </div>

      <h3>Cookies and device storage</h3>
      <p>
        This site uses no advertising cookies. Google Analytics may set <code>_ga</code> and{" "}
        <code>_ga_*</code> cookies after consent. Klaro stores your choices under the local-storage
        key <code>ohat-klaro-consent-v1</code>; Klaro is self-hosted and receives none of that
        information. Arcade, chat, display, notice, and weather preferences also stay in browser
        storage until you clear them or the relevant feature removes them.
      </p>

      <h3>When information may be disclosed</h3>
      <p>
        Information may be processed by the providers above to perform their stated services,
        disclosed when reasonably necessary to comply with law or protect people and the business,
        or transferred with the relevant business records if ownership of the business or website
        changes. We have not sold or shared personal information for targeted advertising in the
        preceding 12 months.
      </p>
    </section>
  );
}

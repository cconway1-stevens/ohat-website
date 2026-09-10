/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element --
   This route uses native static navigation and imagery so its only intentional
   client boundary is the shared directions chooser. */
import { DirectionsTrigger } from "@/components/ui/directions-dialog";
import { pageMetadata } from "@/lib/seo";
import { carfaxUrl, facebookUrl, googleUrl, yelpUrl } from "@/lib/shop/business";
import { shop } from "@/lib/shop/shop";

// Deliberately not chasing "auto repair Egg Harbor Township" here — /contact
// and the service pages own those queries, and a second page competing for
// them would just split the signal. This title describes the hub for what it
// is: the destination behind the shop's social-profile bio links.
export const metadata = pageMetadata({
  title: "All Our Links",
  description:
    "Every Ocean Heights Auto & Tire link in one place: call the shop, get directions, save our contact card, browse services, and read verified customer reviews.",
  path: "/links",
  ogTitle: "Ocean Heights Auto & Tire — all our links",
});

const socials = [
  { name: "Google", label: "Google reviews", href: googleUrl, glyph: "G" },
  { name: "CARFAX", label: "CARFAX reviews", href: carfaxUrl, glyph: "★" },
  { name: "Facebook", label: "Facebook page", href: facebookUrl, glyph: "f" },
  { name: "Yelp", label: "Yelp profile", href: yelpUrl, glyph: "Y" },
];

export default function LinksPage() {
  return (
    <main className="link-hub">
      <div className="link-hub-checker" aria-hidden="true" />
      <section className="link-hub-card" aria-labelledby="link-hub-title">
        <a className="link-hub-logo" href="/" aria-label="Back to Ocean Heights Auto and Tire">
          <img
            src="/media/logo-transparent.avif"
            width={176}
            height={129}
            alt="Ocean Heights Auto and Tire"
            className="site-image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </a>
        <p className="link-hub-kicker">The modern family garage</p>
        <h1 id="link-hub-title">Your pit stop for every link.</h1>
        <p className="link-hub-intro">Everything you need to reach the garage, in one place.</p>

        <nav className="link-hub-group" aria-labelledby="link-group-book">
          <h2 className="link-hub-group-label" id="link-group-book">
            Book a visit
          </h2>
          <div className="link-hub-list">
            <a className="link-hub-primary" href={shop.phone.href}>
              <span aria-hidden="true">☎︎</span>
              <span>
                <strong>Call to book a bay</strong>
                <small>{shop.phone.display}</small>
              </span>
            </a>
            <DirectionsTrigger className="link-hub-directions">
              <span aria-hidden="true">↗︎</span>
              <span>
                <strong>Get directions</strong>
                <small>{shop.address.street}</small>
              </span>
            </DirectionsTrigger>
            <a href="/contact-card.vcf" download>
              <span aria-hidden="true">＋</span>
              <span>
                <strong>Add us to contacts</strong>
                <small>Save our shop card</small>
              </span>
            </a>
          </div>
        </nav>

        <nav className="link-hub-group" aria-labelledby="link-group-plan">
          <h2 className="link-hub-group-label" id="link-group-plan">
            Before you come in
          </h2>
          <div className="link-hub-list">
            <a href="/services">
              <span aria-hidden="true">⚙</span>
              <span>
                <strong>Browse services</strong>
                <small>Repairs, tires, maintenance &amp; diagnostics</small>
              </span>
            </a>
            <a href="/vehicle-drop-off">
              <span aria-hidden="true">⌁</span>
              <span>
                <strong>Vehicle drop-off</strong>
                <small>Early-bird &amp; night-owl key drop</small>
              </span>
            </a>
          </div>
        </nav>

        {/* Four profiles that were four full-width tiles — the same links in a
            quarter of the height, so the actions above stay the focus. */}
        <nav className="link-hub-group" aria-labelledby="link-group-social">
          <h2 className="link-hub-group-label" id="link-group-social">
            Find us online
          </h2>
          <div className="link-hub-socials">
            {socials.map((profile) => (
              <a key={profile.name} href={profile.href} target="_blank" rel="noreferrer">
                <span aria-hidden="true">{profile.glyph}</span>
                <small>
                  {profile.name}
                  <span className="sr-only">{` — ${profile.label} (opens in a new tab)`}</span>
                </small>
              </a>
            ))}
          </div>
        </nav>

        <p className="link-hub-hours">{shop.hours.compact}</p>
        <p className="link-hub-share">
          <a href="/hours">Hours &amp; closures — the full schedule →</a>
        </p>
        <p className="link-hub-share">
          <a href="/links/qr">Share this page — QR code &amp; link →</a>
        </p>
        <a className="link-hub-home" href="/">
          ← Back to the full garage
        </a>
      </section>
    </main>
  );
}

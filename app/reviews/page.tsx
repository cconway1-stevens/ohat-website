import { SiteFooter } from "@/components/site-footer";
import { phoneHref, SiteHeader } from "@/components/site-header";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/shop";

export const metadata = pageMetadata({
  title: "Customer Reviews",
  description:
    "Read what drivers say about Ocean Heights Auto & Tire in Egg Harbor Township, NJ, and visit our verified CARFAX, Yelp, and Facebook profiles.",
  path: "/reviews",
});

import { carfaxUrl, profileLinks } from "@/lib/business";

const reviewExcerpts = [
  {
    quote: "It's been a long time since I really trusted a place with my car.",
    name: "Jim K.",
    context: "Verified CARFAX review",
  },
  {
    quote:
      "You won't find a more honest and affordable mechanic in the area. They make sure our cars are fixed right.",
    name: "Kimberly J.",
    context: "Verified CARFAX review",
  },
  {
    quote:
      "They handled even my exacting custom camber and toe request perfectly—and took time to explain the tradeoffs.",
    name: "Kevin B.",
    context: "Verified CARFAX review · wheel alignment",
  },
];

const reviewThemes = [
  ["Honest answers", "Drivers repeatedly mention trust, fair recommendations, and no unnecessary repairs."],
  ["Clear explanations", "Customers value knowing what was found, what it costs, and what can wait."],
  ["Broad capability", "Reviews describe service across family fleets, older vehicles, imports, trucks, and hybrids."],
  ["A comfortable visit", "Friendly staff, timely communication, and a clean waiting area make service easier."],
];

export default function ReviewsPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        {/* Breadcrumbs only. The quotes below are real CARFAX reviews, but
            self-serving Review/AggregateRating markup — a business rating
            itself on its own site — is explicitly ineligible for review rich
            results, so marking them up would add risk and no benefit. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema([["Reviews", "/reviews"]])),
          }}
        />
        <section className="inner-hero reviews-hero">
          <div className="shell reviews-hero-grid">
            <div className="reviews-hero-copy">
              <p className="eyebrow">The local recommendation</p>
              <h1>Good service makes waves down the Shore.</h1>
              <p>
                Around here, a trusted shop gets passed from neighbor to
                neighbor, family to family, and key ring to key ring.
              </p>
            </div>
            <div className="shore-sticker-board" aria-label="What local drivers say about Ocean Heights">
              <div className="shore-sticker shore-sticker-red">
                <span>Shore drivers</span>
                <strong>Know where to steer their friends.</strong>
              </div>
              <div className="shore-sticker shore-sticker-yellow">
                <span>Fueled by</span>
                <strong>Happy drivers &amp; good word.</strong>
              </div>
              <div className="shore-sticker shore-sticker-blue">
                <span>Passed around town</span>
                <strong>Key ring to key ring.</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section review-themes">
          <div className="shell">
            <p className="eyebrow dark">What customers notice</p>
            <h2>Trust is built one repair at a time.</h2>
            <div className="theme-grid">
              {reviewThemes.map(([title, copy], index) => (
                <article key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section reviews-section">
          <div className="shell">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow dark">In their own words</p>
                <h2>Straight from verified reviews.</h2>
              </div>
              <a className="text-link" href={carfaxUrl}>
                Read the originals on CARFAX →
              </a>
            </div>
            <div className="review-grid">
              {reviewExcerpts.map((excerpt) => (
                <blockquote key={excerpt.name}>
                  <div aria-label="5 out of 5 stars">★★★★★</div>
                  <p>&ldquo;{excerpt.quote}&rdquo;</p>
                  <cite>
                    {excerpt.name} · <a href={carfaxUrl}>{excerpt.context}</a>
                  </cite>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="profile-section" id="review-profiles">
          <div className="shell profile-grid">
            {profileLinks.map((profile, index) => (
              <a key={profile.name} href={profile.href} target="_blank" rel="noreferrer" className="review-source-card">
                <span className="review-source-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="review-source-label">Review source</span>
                <strong>{profile.name}</strong>
                <p>{profile.detail}</p>
                <b>Open {profile.name} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></b>
              </a>
            ))}
          </div>
        </section>

        <section className="inner-cta">
          <div className="shell">
            <div>
              <p className="eyebrow">Ready for a better shop experience?</p>
              <h2>From warning light to green light.</h2>
            </div>
            <a className="button button-primary" href={phoneHref}>Call to book</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

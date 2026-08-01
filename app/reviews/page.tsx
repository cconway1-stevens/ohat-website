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

/**
 * Customer quotes, and the date each one was last checked against the live
 * CARFAX profile.
 *
 * `verifiedOn` is the gate, and it is deliberately strict: a quote only
 * renders as an attributed testimonial when someone has confirmed it against
 * the source and dated that check. Attributing words to a named customer is
 * the highest-risk claim on this whole site — a testimonial nobody can trace
 * back to a real review is deceptive under N.J.A.C. 13:45A-26C.2 and under
 * the FTC's rule on consumer reviews, and unlike a stale statistic it cannot
 * be explained away as an oversight.
 *
 * All three are currently unverified, so the page shows an invitation to read
 * the reviews at the source instead. Nothing is lost: the quotes stay right
 * here, and restoring one is a one-line edit.
 *
 * TO RESTORE: open the CARFAX profile linked below, find the review, confirm
 * the wording and the reviewer's name match, then set `verifiedOn` to the
 * date you checked. Do not date one you have not actually read.
 */
const reviewExcerpts: {
  quote: string;
  name: string;
  context: string;
  verifiedOn: string | null;
}[] = [
  {
    quote: "It's been a long time since I really trusted a place with my car.",
    name: "Jim K.",
    context: "Verified CARFAX review",
    verifiedOn: null,
  },
  {
    quote:
      "You won't find a more honest and affordable mechanic in the area. They make sure our cars are fixed right.",
    name: "Kimberly J.",
    context: "Verified CARFAX review",
    verifiedOn: null,
  },
  {
    quote:
      "They handled even my exacting custom camber and toe request perfectly—and took time to explain the tradeoffs.",
    name: "Kevin B.",
    context: "Verified CARFAX review · wheel alignment",
    verifiedOn: null,
  },
];

const verifiedExcerpts = reviewExcerpts.filter((e) => e.verifiedOn !== null);

const reviewThemes = [
  [
    "Honest answers",
    "Drivers repeatedly mention trust, fair recommendations, and no unnecessary repairs.",
  ],
  [
    "Clear explanations",
    "Customers value knowing what was found, what it costs, and what can wait.",
  ],
  [
    "Broad capability",
    "Reviews describe service across family fleets, older vehicles, imports, trucks, and hybrids.",
  ],
  [
    "A comfortable visit",
    "Friendly staff, timely communication, and a clean waiting area make service easier.",
  ],
];

export default function ReviewsPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        {/* Breadcrumbs only. No Review/AggregateRating markup: a business
            rating itself on its own site is explicitly ineligible for review
            rich results, so it would add manual-action risk and no benefit.
            That holds regardless of what `reviewExcerpts` above is showing. */}
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
                Around here, a trusted shop gets passed from neighbor to neighbor, family to family,
                and key ring to key ring.
              </p>
            </div>
            <div
              className="shore-sticker-board"
              aria-label="What local drivers say about Ocean Heights"
            >
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
                <h2>
                  {verifiedExcerpts.length > 0
                    ? "Straight from verified reviews."
                    : "Hundreds of reviews, none of them ours to edit."}
                </h2>
              </div>
              <a className="text-link" href={carfaxUrl}>
                Read the originals on CARFAX →
              </a>
            </div>
            {verifiedExcerpts.length > 0 ? (
              <div className="review-grid">
                {verifiedExcerpts.map((excerpt) => (
                  <blockquote key={excerpt.name}>
                    <div aria-label="5 out of 5 stars">★★★★★</div>
                    <p>&ldquo;{excerpt.quote}&rdquo;</p>
                    <cite>
                      {excerpt.name} · <a href={carfaxUrl}>{excerpt.context}</a>
                      {" · confirmed "}
                      {excerpt.verifiedOn}
                    </cite>
                  </blockquote>
                ))}
              </div>
            ) : (
              <div className="review-source-invite">
                <p className="eyebrow dark">Straight from the source</p>
                <h3>Read them where they were written.</h3>
                <p>
                  Rather than reprint reviews here, we send you to the profiles themselves — every
                  review dated, attributed, and outside our control. That is worth more than a quote
                  on our own website.
                </p>
                <a className="button button-primary" href={carfaxUrl}>
                  Read the reviews on CARFAX <span aria-hidden="true">↗︎</span>
                </a>
              </div>
            )}
          </div>
        </section>

        <section className="profile-section" id="review-profiles">
          <div className="shell profile-grid">
            {profileLinks.map((profile, index) => (
              <a
                key={profile.name}
                href={profile.href}
                target="_blank"
                rel="noreferrer"
                className="review-source-card"
              >
                <span className="review-source-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="review-source-label">Review source</span>
                <strong>{profile.name}</strong>
                <p>{profile.detail}</p>
                <b>
                  Open {profile.name} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </b>
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
            <a className="button button-primary" href={phoneHref}>
              Call to book
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

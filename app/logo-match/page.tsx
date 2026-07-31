import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MakeMatchGame } from "@/components/make-match-game";

// A diversion, not a landing page. Indexing it would put a page with no
// service intent into results for a shop that wants calls and appointments,
// so it stays out of search while remaining perfectly usable by anyone linked
// to it. It is left out of the sitemap for the same reason.
export const metadata: Metadata = {
  title: "Logo Match Game",
  description:
    "A quick brand-logo matching game from Ocean Heights Auto & Tire in Egg Harbor Township.",
  alternates: { canonical: "/logo-match" },
  robots: { index: false, follow: true },
};

export default function LogoMatchPage() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">
        <section className="inner-hero game-hero">
          <div className="shell">
            <p className="eyebrow">While you wait</p>
            <h1>Match the marques.</h1>
            <p>
              Every round deals a fresh set of badges from the makes we service.
              No countdown, no pressure — just find the pairs.
            </p>
          </div>
        </section>
        <section className="section game-board">
          <div className="shell">
            <MakeMatchGame />
            <p className="make-note game-board-note">
              Brand marks belong to their respective owners and are shown here
              only to identify the makes we service.{" "}
              <Link href="/services">See what we work on →</Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

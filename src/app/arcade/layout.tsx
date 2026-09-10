import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "@/app/styles/arcade.css";
import "@/app/styles/games.css";
import "@/app/styles/radio.css";

// The arcade is an easter egg — a reward for the curious, not a landing page.
// Indexing it would put pages with no service intent into results for a shop
// that wants calls and appointments, so the whole section is noindex and is
// excluded from the sitemaps in scripts/build-static.mjs.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function ArcadeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // `is-arcade` retires the fixed call dock for these pages: it sits over
    // the right edge of the play area, which is exactly where the runner's
    // obstacles arrive from. The header's call button stays put.
    <div className="is-arcade">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}

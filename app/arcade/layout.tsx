import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// The arcade is an easter egg — a reward for the curious, not a landing page.
// Indexing it would put pages with no service intent into results for a shop
// that wants calls and appointments, so the whole section is noindex and is
// excluded from the sitemaps in scripts/build-static.mjs.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function ArcadeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { phoneDisplay, phoneHref, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <section className="repair-ticket repair-ticket-1">
          <div className="shell repair-ticket-grid">
            <div className="ticket-number" aria-hidden="true">
              <span>Bay</span>
              <strong>404</strong>
            </div>
            <div className="ticket-copy">
              <p className="ticket-status">Wrong turn — no bay by that name</p>
              <h1>This page rolled off the lot.</h1>
              <p>
                The address you followed doesn&rsquo;t match anything in our service catalog. Head
                back to the front page, browse the service board, or give the shop a call and
                we&rsquo;ll point you the right way.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/">
                  Back to the garage
                </Link>
                <Link className="button button-ghost" href="/services">
                  Browse services
                </Link>
                <a className="button button-ghost" href={phoneHref}>
                  Call {phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

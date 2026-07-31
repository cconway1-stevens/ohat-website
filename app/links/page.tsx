import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DirectionsTrigger } from "@/components/directions-dialog";
import {
  phoneDisplay,
  phoneHref,
} from "@/components/site-header";

export const metadata: Metadata = {
  title: "Quick Links",
  description:
    "Call, get directions, save Ocean Heights Auto & Tire to your contacts, and find our trusted profiles.",
  alternates: { canonical: "/links" },
};

const carfax =
  "https://www.carfax.com/Reviews-Ocean-Heights-Auto-And-Tire-Egg-Harbor-Township-NJ_BLQLOZM001";

export default function LinksPage() {
  return (
    <main className="link-hub">
      <div className="link-hub-checker" aria-hidden="true" />
      <section className="link-hub-card" aria-labelledby="link-hub-title">
        <Link className="link-hub-logo" href="/" aria-label="Back to Ocean Heights Auto and Tire">
          <Image
            src="/media/logo-transparent.png"
            width={315}
            height={231}
            alt="Ocean Heights Auto and Tire"
            priority
            unoptimized
          />
        </Link>
        <p className="link-hub-kicker">The modern family garage</p>
        <h1 id="link-hub-title">Your pit stop for every link.</h1>
        <p className="link-hub-intro">
          Book a bay, find the shop, save our number, or see what local drivers say.
        </p>

        <nav className="link-hub-list" aria-label="Ocean Heights quick links">
          <a className="link-hub-primary" href={phoneHref}>
            <span aria-hidden="true">☎</span>
            <span><strong>Call to book a bay</strong><small>{phoneDisplay}</small></span>
          </a>
          <DirectionsTrigger className="link-hub-directions">
            <span aria-hidden="true">↗</span>
            <span><strong>Get directions</strong><small>1178 Ocean Heights Avenue</small></span>
          </DirectionsTrigger>
          <a href="/contact-card.vcf" download>
            <span aria-hidden="true">＋</span>
            <span><strong>Add us to contacts</strong><small>Save our shop card</small></span>
          </a>
          <Link href="/vehicle-drop-off">
            <span aria-hidden="true">⌁</span>
            <span><strong>Vehicle drop-off</strong><small>Early-bird &amp; night-owl instructions</small></span>
          </Link>
          <Link href="/services">
            <span aria-hidden="true">⚙</span>
            <span><strong>Browse services</strong><small>Repairs, maintenance, tires &amp; diagnostics</small></span>
          </Link>
          <a href={carfax} target="_blank" rel="noreferrer">
            <span aria-hidden="true">★</span>
            <span><strong>CARFAX reviews<span className="sr-only"> (opens in a new tab)</span></strong><small>Verified customer feedback</small></span>
          </a>
          <a href="https://www.facebook.com/OceanHeightsAuto/" target="_blank" rel="noreferrer">
            <span aria-hidden="true">f</span>
            <span><strong>Facebook<span className="sr-only"> (opens in a new tab)</span></strong><small>Follow the garage</small></span>
          </a>
          <a href="https://www.yelp.com/biz/ocean-heights-auto-and-tire-egg-harbor-township-2" target="_blank" rel="noreferrer">
            <span aria-hidden="true">Y</span>
            <span><strong>Yelp<span className="sr-only"> (opens in a new tab)</span></strong><small>Find our business profile</small></span>
          </a>
        </nav>

        <p className="link-hub-hours">Monday–Friday · 8:00 AM–5:00 PM</p>
        <Link className="link-hub-home" href="/">← Back to the full garage</Link>
      </section>
    </main>
  );
}

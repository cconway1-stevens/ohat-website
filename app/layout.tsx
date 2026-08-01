import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CallTracking } from "@/components/analytics";
import { gaMeasurementId } from "@/lib/analytics";
import { shop } from "@/lib/shop";
import "tetris-kit/layout.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(shop.siteUrl),
  title: {
    default: "Auto Repair & Tire Shop in Egg Harbor Township, NJ | Ocean Heights",
    template: "%s | Ocean Heights Auto & Tire",
  },
  // Google ignores the keywords meta tag, so none is emitted here — keywords
  // belong in titles, headings, and body copy instead.
  description:
    "Family-owned auto repair and tire service in Egg Harbor Township (EHT), Atlantic County NJ. ASE-certified technicians for diagnostics, brakes, tires, maintenance, diesel, hybrid, EV and classic vehicles. Call Ocean Heights Auto & Tire.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Ocean Heights Auto & Tire",
    description:
      "Classic care, modern capability, and honest family service in Egg Harbor Township.",
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Ocean Heights Auto & Tire",
    images: [
      {
        url: "/media/ocean-heights-cover.jpg",
        width: 2004,
        height: 785,
        alt: "Ocean Heights Auto and Tire in Egg Harbor Township with a classic car, electric car, and work truck out front",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ocean Heights Auto & Tire",
    description:
      "Family-owned auto repair in Egg Harbor Township, NJ — classics to EVs.",
    images: ["/media/ocean-heights-cover.jpg"],
  },
  formatDetection: { telephone: true },
  other: {
    "codex-preview": "development",
  },
  // No `icons` here on purpose. Next resolves icon hrefs against
  // `metadataBase`, which emits an absolute production URL — so any other
  // host (the prototype, a preview deploy) fetches the favicon cross-origin
  // from a domain still serving the old site, and the tab icon breaks. The
  // <link> tags in the layout below stay host-relative instead.
};

export const viewport: Viewport = {
  themeColor: "#6f0d12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js). Google's install instructions ask for this
            immediately after <head>, so it stays first: gtag.js records the
            page view as soon as it loads, and anything queued before it
            arrives is replayed from `dataLayer`.

            The consent defaults below are deliberate, and they are what keeps
            this a measurement tool rather than an advertising one:
            - Advertising storage and personalisation are denied outright, and
              Google Signals is off. Nothing here feeds ad targeting, which is
              what stops routine analytics from looking like a "sale" or
              "targeted advertising" under state privacy law.
            - `analytics_storage` follows the browser's Global Privacy Control
              signal, so a visitor who has set GPC is measured without cookies
              and without a banner to click. New Jersey has required covered
              controllers to honour a universal opt-out mechanism since July
              2025; this shop is well under the thresholds that make it a
              covered controller, so this is us honouring the signal because
              it is the right default, not because we are compelled to.
            See docs/privacy-compliance.md for the full analysis. */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: navigator.globalPrivacyControl === true ? 'denied' : 'granted'
});
gtag('config', '${gaMeasurementId}', {
  anonymize_ip: true,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`,
          }}
        />
        {/* Host-relative so the icon resolves on whatever domain serves the
            site — see the note on `icons` in the metadata above. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <CallTracking />
        {/* Vercel Web Analytics: cookieless, and a 404 on any other host
            rather than an error. (The "no consent banner needed" note that
            used to sit here was true of Vercel alone; the Google tag above
            does set cookies, so see docs/privacy-compliance.md for where the
            banner question actually lands.) */}
        <script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}

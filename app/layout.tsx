import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CallTracking } from "@/components/analytics";
import { VercelAnalytics } from "@/components/vercel-analytics";
import { VercelSpeedInsights } from "@/components/vercel-speed-insights";
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
    description: "Family-owned auto repair in Egg Harbor Township, NJ — classics to EVs.",
    images: ["/media/ocean-heights-cover.jpg"],
  },
  formatDetection: { telephone: true },
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
        {/* Nothing on the page discovers these origins until something needs
            them — the weather reading is fetched from a client component in
            the masthead, so the browser only learns about Open-Meteo after
            hydration, and pays for the DNS, TCP and TLS round trips then.
            Warming both connections here is worth an estimated 580 ms of LCP.

            These are links, not scripts: they start no execution and so do not
            disturb the ordering gtag.js asks for below. Keep this list to four
            origins at most — past that, preconnects compete with the requests
            they are meant to accelerate. */}
        <link rel="preconnect" href="https://api.open-meteo.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
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
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
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
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <CallTracking />
        {/* Cookieless page-view counts, injected at runtime and only on a
            Vercel host — the script lives on Vercel's edge and this same
            export is also served from GitHub Pages. See the component. */}
        <VercelAnalytics />
        <VercelSpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { CallTracking } from "@/components/analytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanheightsautorepair.com"),
  title: {
    default: "Auto Repair & Tire Shop in Egg Harbor Township, NJ | Ocean Heights",
    template: "%s | Ocean Heights Auto & Tire",
  },
  // Google ignores the keywords meta tag, so none is emitted here — keywords
  // belong in titles, headings, and body copy instead.
  description:
    "Family-owned auto repair and tire service in Egg Harbor Township. ASE-certified technicians for diagnostics, brakes, tires, maintenance, diesel, hybrid, EV and classic vehicles. Call Ocean Heights Auto & Tire.",
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
        {/* Host-relative so the icon resolves on whatever domain serves the
            site — see the note on `icons` in the metadata above. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        {children}
        <CallTracking />
        {/* Vercel Web Analytics: cookieless, no consent banner needed, and a
            404 on any other host rather than an error. */}
        <script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanheightsautorepair.com"),
  title: {
    default: "Ocean Heights Auto & Tire | Auto Repair in Egg Harbor Township",
    template: "%s | Ocean Heights Auto & Tire",
  },
  description:
    "Family-owned auto repair in Egg Harbor Township, NJ. ASE-certified technicians, advanced diagnostics, tires, brakes, maintenance and service for gas, hybrid, diesel and electric vehicles.",
  keywords: [
    "auto repair Egg Harbor Township NJ",
    "mechanic Egg Harbor Township",
    "tire shop Egg Harbor Township",
    "hybrid repair Egg Harbor Township",
    "electric vehicle repair NJ",
    "Ocean Heights Auto and Tire",
  ],
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
        url: "/ohat-logo.jpg",
        width: 315,
        height: 231,
        alt: "Ocean Heights Auto and Tire",
      },
    ],
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { shop } from "./shop";

/**
 * Builds a page's `Metadata` so the canonical URL, the Open Graph block and
 * the Twitter card can never drift apart.
 *
 * Why this exists: the root layout sets `openGraph.title`/`description` for
 * the whole site, and Next merges parent metadata into every child. A page
 * that only overrides `title` therefore keeps shipping the *site-wide* Open
 * Graph title, so every link shared to Facebook, LinkedIn, iMessage or Slack
 * previews as the homepage no matter which page was shared. Passing the page
 * title through to `openGraph` here fixes that in one place.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogTitle,
}: {
  title: string;
  description: string;
  /** Canonical path, leading slash included, e.g. "/services". */
  path: string;
  /** Optional shorter title for share cards, which truncate sooner. */
  ogTitle?: string;
}): Metadata {
  const social = ogTitle ?? `${title} | ${shop.name}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: social,
      description,
      url: path,
      type: "website",
    },
    twitter: {
      title: social,
      description,
    },
  };
}

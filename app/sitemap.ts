import type { MetadataRoute } from "next";
import { services } from "@/lib/services";
import { shop } from "@/lib/shop";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = shop.siteUrl;
  // `lastmod` is the one sitemap hint Google still acts on, so every entry
  // carries the build date: the date the page was last published is exactly
  // what the field is meant to report.
  const lastModified = new Date();
  const servicePages = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vehicle-drop-off`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/our-shop`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/offers`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      // A utility hub for social-profile bios, not a page meant to rank —
      // /contact and the service pages carry those queries.
      url: `${baseUrl}/links`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...servicePages,
  ];
}

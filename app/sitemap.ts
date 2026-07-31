import type { MetadataRoute } from "next";
import { services } from "@/lib/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://oceanheightsautorepair.com";
  const servicePages = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vehicle-drop-off`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/our-shop`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reviews`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/offers`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/links`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...servicePages,
  ];
}

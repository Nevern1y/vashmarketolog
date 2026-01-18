import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date().toISOString();

  // All product pages
  const productPages = [
    "/rko",
    "/ved",
    "/factoring-dlya-biznesa",
    "/lising-dlya-yrlic",
    "/bankovskie-garantii",
    "/kredity-dlya-biznesa",
    "/deposity",
    "/strahovanie",
    "/tendernoe-soprovojdenie",
    "/proverka-contragentov",
  ];

  // Info pages
  const infoPages = [
    "/agents",
    "/partneram",
    "/o-proekte",
    "/contact",
    "/privacy-policy",
  ];

  const allPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...productPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...infoPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return allPages;
}

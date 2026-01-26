import type { MetadataRoute } from "next";

interface SeoPageSlug {
  slug: string;
  updated_at?: string;
}

async function fetchSeoPages(): Promise<SeoPageSlug[]> {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  
  try {
    const response = await fetch(`${apiUrl}/seo/pages/`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.warn("[Sitemap] Failed to fetch SEO pages:", response.status);
      return [];
    }
    
    const pages = await response.json();
    return Array.isArray(pages) ? pages : [];
  } catch (error) {
    console.warn("[Sitemap] Error fetching SEO pages:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date().toISOString();

  // Static product pages
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

  // Static info pages
  const infoPages = [
    "/agents",
    "/partneram",
    "/o-proekte",
    "/contact",
    "/privacy-policy",
  ];

  // Fetch dynamic SEO pages from backend
  const seoPages = await fetchSeoPages();
  
  // Create a Set of static paths for deduplication
  const staticPaths = new Set(["/", ...productPages, ...infoPages]);
  
  // Filter out SEO pages that duplicate static pages
  const dynamicSeoPages = seoPages.filter(
    (page) => page.slug && !staticPaths.has(`/${page.slug}`)
  );

  const allPages: MetadataRoute.Sitemap = [
    // Homepage
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Product pages (high priority)
    ...productPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    // Info pages (medium priority)
    ...infoPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Dynamic SEO pages from backend
    ...dynamicSeoPages.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: page.updated_at || now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  return allPages;
}

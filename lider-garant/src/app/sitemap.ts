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
      return [];
    }
    
    const pages = await response.json();
    return Array.isArray(pages) ? pages : [];
  } catch (error) {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date().toISOString();

  const routes = [
    { url: "/", priority: 1, changeFrequency: "weekly" as const },
    {
      url: "/bankovskie-garantii",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      url: "/kredity-dlya-biznesa",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      url: "/lising-dlya-urlic",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      url: "/factoring-dlya-biznesa",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    { url: "/rko", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/deposity", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/strahovanie", priority: 0.9, changeFrequency: "weekly" as const },
    { url: "/ved", priority: 0.9, changeFrequency: "weekly" as const },
    {
      url: "/tendernoe-soprovozhdenie",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    {
      url: "/proverka-contragentov",
      priority: 0.8,
      changeFrequency: "monthly" as const,
    },
    { url: "/o-proekte", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/novosti", priority: 0.8, changeFrequency: "daily" as const },
    { url: "/vacansii", priority: 0.6, changeFrequency: "weekly" as const },
    { url: "/agents", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/partneram", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { url: "/documenty", priority: 0.5, changeFrequency: "yearly" as const },
    {
      url: "/privacy-policy",
      priority: 0.5,
      changeFrequency: "yearly" as const,
    },
    { url: "/karta-saita", priority: 0.6, changeFrequency: "monthly" as const },
  ];

  // Fetch dynamic SEO pages from backend
  const seoPages = await fetchSeoPages();
  
  // Create a Set of static paths for deduplication
  const staticPaths = new Set(routes.map((route) => route.url));
  
  // Filter out SEO pages that duplicate static pages
  const dynamicSeoPages = seoPages.filter(
    (page) => page.slug && !staticPaths.has(`/${page.slug}`)
  );

  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route.url}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...dynamicSeoPages.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: page.updated_at || now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

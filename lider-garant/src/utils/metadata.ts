import { Metadata } from "next";

const getSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Генерирует метаданные для страницы на основе H1 заголовка
 * @param h1Text - Заголовок H1 страницы
 * @param slug - URL slug страницы (опционально, для canonical и og:url)
 */
export function generatePageMetadata(h1Text: string, slug?: string): Metadata {
  const cleanTitle = h1Text.trim();
  const siteUrl = getSiteUrl();

  // Генерируем ключевые слова (поддержка русского)
  const keywords = cleanTitle
    .toLowerCase()
    .replace(/[^\w\sа-яё-]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .join(", ");

  const description = `${cleanTitle} — лучшие условия от ЛИДЕР-ГАРАНТ. Быстрое одобрение и выгодные предложения.`;
  const fullUrl = slug ? `${siteUrl}${slug}` : undefined;

  return {
    title: cleanTitle,
    description,
    keywords,
    openGraph: {
      title: cleanTitle,
      description,
      type: "website",
      url: fullUrl,
    },
    alternates: fullUrl ? { canonical: fullUrl } : undefined,
  };
}

/**
 * Генерирует метаданные из данных SEO API
 */
export function generateMetadataFromSeoPage(
  page: {
    meta_title: string;
    meta_description: string;
    meta_keywords?: string;
    h1_title: string;
  },
  slug: string
): Metadata {
  const siteUrl = getSiteUrl();
  const fullUrl = `${siteUrl}/${slug}`;

  return {
    title: page.meta_title || page.h1_title,
    description: page.meta_description,
    keywords: page.meta_keywords,
    openGraph: {
      title: page.meta_title || page.h1_title,
      description: page.meta_description,
      type: "website",
      url: fullUrl,
    },
    alternates: { canonical: fullUrl },
  };
}

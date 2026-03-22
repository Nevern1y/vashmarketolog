import type { SeoPageData } from "@/lib/seo-api";

export interface SeoTemplatePopularSearch {
  text: string;
  href: string;
}

const normalizeHref = (value?: string) => {
  const href = String(value || "").trim();

  if (!href) return "#application";
  if (href.startsWith("#") || href.startsWith("/") || /^https?:\/\//i.test(href)) {
    return href;
  }

  return `/${href.replace(/^\/+/, "")}`;
};

export const isCreatePageLayout = (page?: SeoPageData | null) => {
  if (!page) return false;
  return String(page.template_name || "").trim() === "create-page";
};

export const getSeoTemplateDescription = (page: SeoPageData) => {
  const description = String(page.main_description || "").trim();

  return description || "Описание услуги";
};

export const getSeoTemplatePopularSearches = (
  value?: SeoPageData["popular_searches"],
): SeoTemplatePopularSearch[] => {
  return (value || [])
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text, href: "#application" } : null;
      }

      const text = String(item?.text || "").trim();
      if (!text) return null;

      return {
        text,
        href: normalizeHref(String(item?.href || "#application")),
      };
    })
    .filter((item): item is SeoTemplatePopularSearch => item !== null);
};

export const getSeoTemplateProps = (page: SeoPageData) => {
  return {
    title: page.h1_title || "Заголовок страницы",
    description: getSeoTemplateDescription(page),
    h2Title: page.h2_title,
    h3Title: page.h3_title,
    buttonText: page.hero_button_text,
    buttonHref: normalizeHref(page.hero_button_href || "#application"),
    bestOffersTitle: page.best_offers_title,
    applicationFormTitle: page.application_form_title,
    applicationButtonText: page.application_button_text,
    offers: page.bank_offers,
    popularSearches: getSeoTemplatePopularSearches(page.popular_searches),
  };
};

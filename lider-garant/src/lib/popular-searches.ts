export interface PopularSearchLink {
  text: string;
  href: string;
}

type PopularSearchInput =
  | Array<{ text?: string; href?: string } | string>
  | undefined;

const looksLikeHref = (value: string) => /^(#|\/|https?:\/\/)/i.test(value);

const linkToDefaultText = (value: string) => {
  const clean = value
    .trim()
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/+/, "")
    .replace(/^#/, "")
    .replace(/[\-_]+/g, " ")
    .trim();

  if (!clean) return "По ссылке";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const dedupe = (items: PopularSearchLink[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.text}|||${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizePopularSearches = (
  value: PopularSearchInput,
  fallbackTerms: string[],
  fallbackHref = "/v-razrabotke",
): PopularSearchLink[] => {
  const normalized = (Array.isArray(value) ? value : [])
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        if (!text) return null;

        if (looksLikeHref(text)) {
          return { text: linkToDefaultText(text), href: text };
        }

        return { text, href: fallbackHref };
      }

      const text = String(item?.text || "").trim();
      const href = String(item?.href || fallbackHref).trim() || fallbackHref;

      if (!text && !href) return null;

      if (text && looksLikeHref(text) && (!item?.href || item?.href === text)) {
        return { text: linkToDefaultText(text), href: text };
      }

      if (!text) {
        return { text: linkToDefaultText(href), href };
      }

      return { text, href };
    })
    .filter((item): item is PopularSearchLink => item !== null);

  if (normalized.length > 0) {
    return dedupe(normalized);
  }

  return fallbackTerms.map((text) => ({ text, href: fallbackHref }));
};

import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import {
  generatePageMetadata,
  generateMetadataFromSeoPage,
} from "@/utils/metadata";

const SLUG = "factoring-dlya-biznesa";
const FALLBACK_TITLE = "Факторинг для бизнеса";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export { default } from "./factoring-client";

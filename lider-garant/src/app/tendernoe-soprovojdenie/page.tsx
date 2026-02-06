import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import {
  generatePageMetadata,
  generateMetadataFromSeoPage,
} from "@/utils/metadata";

const SLUG = "tendernoe-soprovojdenie";
const FALLBACK_TITLE = "Тендерное сопровождение";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export { default } from "./tender-support-client";

import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import {
  generatePageMetadata,
  generateMetadataFromSeoPage,
} from "@/utils/metadata";
import TenderSupportClient from "./tender-support-client";

const SLUG = "tendernoe-soprovozhdenie";
const LEGACY_SLUG = "tendernoe-soprovojdenie";
const FALLBACK_TITLE = "Тендерное сопровождение";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = (await getSeoPage(SLUG)) || (await getSeoPage(LEGACY_SLUG));
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, seoData.slug || SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function TenderSupportPage() {
  const seoData = (await getSeoPage(SLUG)) || (await getSeoPage(LEGACY_SLUG));
  return <TenderSupportClient seoPage={seoData} />;
}

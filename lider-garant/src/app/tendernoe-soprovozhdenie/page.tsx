import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import {
  generatePageMetadata,
  generateMetadataFromSeoPage,
} from "@/utils/metadata";
import TenderSupportClient from "./tender-support-client";

const SLUG = "tendernoe-soprovozhdenie";
const FALLBACK_TITLE = "Тендерное сопровождение";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function TenderSupportPage() {
  const seoData = await getSeoPage(SLUG);
  return <TenderSupportClient seoPage={seoData} />;
}

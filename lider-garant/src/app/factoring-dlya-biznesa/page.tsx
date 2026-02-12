import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import SeoTemplatePage from "@/components/seo/seo-template-page";
import { getSeoTemplateProps, isCreatePageLayout } from "@/lib/seo-template-utils";
import {
  generatePageMetadata,
  generateMetadataFromSeoPage,
} from "@/utils/metadata";
import FactoringPageClient from "./factoring-client";

const SLUG = "factoring-dlya-biznesa";
const FALLBACK_TITLE = "Факторинг для бизнеса";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function FactoringPage() {
  const seoData = await getSeoPage(SLUG);

  if (seoData && isCreatePageLayout(seoData)) {
    return <SeoTemplatePage {...getSeoTemplateProps(seoData)} />;
  }

  return <FactoringPageClient seoPage={seoData} />;
}

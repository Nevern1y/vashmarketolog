import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import SeoTemplatePage from "@/components/seo/seo-template-page";
import { getSeoTemplateProps, isCreatePageLayout } from "@/lib/seo-template-utils";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import LeasingPageClient from "./leasing-client";

const SLUG = "lising-dlya-urlic";
const FALLBACK_TITLE = "Лизинг для юридических лиц";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function LeasingPage() {
  const seoData = await getSeoPage(SLUG);

  if (seoData && isCreatePageLayout(seoData)) {
    return <SeoTemplatePage {...getSeoTemplateProps(seoData)} />;
  }

  return <LeasingPageClient seoPage={seoData} />;
}

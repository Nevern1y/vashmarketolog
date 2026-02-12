import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import SeoTemplatePage from "@/components/seo/seo-template-page";
import { getSeoTemplateProps, isCreatePageLayout } from "@/lib/seo-template-utils";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import ManagerCTASection from "@/components/ManagerCTASection";

const SLUG = "proverka-contragentov";
const FALLBACK_TITLE = "Проверка контрагентов";

export async function generateMetadata(): Promise<Metadata> {
  const seoData = await getSeoPage(SLUG);
  if (seoData) {
    return generateMetadataFromSeoPage(seoData, SLUG);
  }
  return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function Page() {
  const seoData = await getSeoPage(SLUG);

  if (seoData && isCreatePageLayout(seoData)) {
    return <SeoTemplatePage {...getSeoTemplateProps(seoData)} />;
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <h1 className="text-4xl font-semibold text-primary text-center">
        Проверка контрагента
      </h1>
      <ManagerCTASection />
    </main>
  );
}

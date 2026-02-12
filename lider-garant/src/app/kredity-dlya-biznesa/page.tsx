import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import SeoTemplatePage from "@/components/seo/seo-template-page";
import { getSeoTemplateProps, isCreatePageLayout } from "@/lib/seo-template-utils";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import CreditsPageClient from "./credits-client";

const SLUG = "kredity-dlya-biznesa";
const FALLBACK_TITLE = "Кредиты для бизнеса";

export async function generateMetadata(): Promise<Metadata> {
    const seoData = await getSeoPage(SLUG);
    if (seoData) {
        return generateMetadataFromSeoPage(seoData, SLUG);
    }
    return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function CreditsPage() {
    const seoData = await getSeoPage(SLUG);

    if (seoData && isCreatePageLayout(seoData)) {
        return <SeoTemplatePage {...getSeoTemplateProps(seoData)} />;
    }

    return <CreditsPageClient seoPage={seoData} />;
}

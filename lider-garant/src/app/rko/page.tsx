import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import SeoTemplatePage from "@/components/seo/seo-template-page";
import { getSeoTemplateProps, isCreatePageLayout } from "@/lib/seo-template-utils";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import RkoPageClient from "./rko-client";

const SLUG = "rko";
const FALLBACK_TITLE = "РКО и спецсчета";

export async function generateMetadata(): Promise<Metadata> {
    const seoData = await getSeoPage(SLUG);
    if (seoData) {
        return generateMetadataFromSeoPage(seoData, SLUG);
    }
    return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function RkoPage() {
    const seoData = await getSeoPage(SLUG);

    if (seoData && isCreatePageLayout(seoData)) {
        return <SeoTemplatePage {...getSeoTemplateProps(seoData)} />;
    }

    return <RkoPageClient seoPage={seoData} />;
}

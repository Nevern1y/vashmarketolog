import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import DepositPageClient from "./deposit-client";

const SLUG = "deposity";
const FALLBACK_TITLE = "Депозиты для бизнеса";

export async function generateMetadata(): Promise<Metadata> {
    const seoData = await getSeoPage(SLUG);
    if (seoData) {
        return generateMetadataFromSeoPage(seoData, SLUG);
    }
    return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function DepositsPage() {
    const seoData = await getSeoPage(SLUG);
    return <DepositPageClient seoPage={seoData} />;
}

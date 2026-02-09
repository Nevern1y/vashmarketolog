import { Metadata } from "next";
import { getSeoPage } from "@/lib/seo-api";
import { generatePageMetadata, generateMetadataFromSeoPage } from "@/utils/metadata";
import BankGuaranteePageClient from "./bank-guarantee-client";

const SLUG = "bankovskie-garantii";
const FALLBACK_TITLE = "Банковские гарантии";

export async function generateMetadata(): Promise<Metadata> {
    const seoData = await getSeoPage(SLUG);
    if (seoData) {
        return generateMetadataFromSeoPage(seoData, SLUG);
    }
    return generatePageMetadata(FALLBACK_TITLE, `/${SLUG}`);
}

export default async function BankGuaranteePage() {
    const seoData = await getSeoPage(SLUG);
    return <BankGuaranteePageClient seoPage={seoData} />;
}

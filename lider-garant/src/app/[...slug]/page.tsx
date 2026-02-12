
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSeoPage } from "@/lib/seo-api";
import { generateMetadataFromSeoPage } from "@/utils/metadata";
import SeoTemplatePage from "@/components/seo/seo-template-page";

interface Props {
    params: Promise<{
        slug: string[];
    }>;
}

// Helper to construct slug string from array
const getSlugString = (slugArray: string[]) => {
    return slugArray.join("/");
};

const normalizeUiHref = (value?: string) => {
    const href = String(value || "").trim();
    if (!href) return "#application";
    if (href.startsWith("#") || href.startsWith("/") || /^https?:\/\//i.test(href)) {
        return href;
    }
    return `/${href.replace(/^\/+/, "")}`;
};

const isExternalHref = (value: string) => /^https?:\/\//i.test(value);

const getRequestApiBaseUrl = async () => {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");

    if (!host) {
        return null;
    }

    const proto =
        requestHeaders.get("x-forwarded-proto") ||
        (host.includes("localhost") ? "http" : "https");

    return `${proto}://${host}/api`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug: slugArray } = await params;
    const slug = getSlugString(slugArray);
    const preferredBaseUrl = await getRequestApiBaseUrl();
    const page = await getSeoPage(slug, { preferredBaseUrl });

    if (!page) {
        return {
            title: "Страница не найдена",
        };
    }

    return generateMetadataFromSeoPage(page, slug);
}

export default async function DynamicSeoPage({ params }: Props) {
    const { slug: slugArray } = await params;
    const slug = getSlugString(slugArray);
    const preferredBaseUrl = await getRequestApiBaseUrl();
    const page = await getSeoPage(slug, { preferredBaseUrl });

    if (!page) {
        notFound();
    }

    const popularSearches = (page.popular_searches || [])
        .map((item) => {
            if (typeof item === "string") {
                const text = item.trim()
                return text ? { text, href: "#application" } : null
            }

            const text = String(item?.text || "").trim()
            if (!text) return null

            return {
                text,
                href: normalizeUiHref(String(item?.href || "#application")),
            }
        })
        .filter((item): item is { text: string; href: string } => item !== null)

    const hasTemplateSignals =
        Boolean(page.hero_button_text?.trim()) ||
        Boolean(page.best_offers_title?.trim()) ||
        Boolean(page.application_form_title?.trim()) ||
        Boolean(page.application_button_text?.trim()) ||
        Array.isArray(page.bank_offers) && page.bank_offers.length > 0

    const hasAutofillTemplate = Boolean(page.autofill_template?.trim())

    const shouldRenderTemplatePage =
        page.template_name === "create-page" ||
        (!page.template_name && (hasTemplateSignals || hasAutofillTemplate))

    const templateDescription =
        [page.main_description, page.h2_title, page.h3_title]
            .map((part) => String(part || "").trim())
            .filter((part) => part.length > 0)
            .join("\n\n") ||
        "Описание услуги"

    if (shouldRenderTemplatePage) {
        return (
            <SeoTemplatePage
                title={page.h1_title || "Заголовок страницы"}
                description={templateDescription}
                buttonText={page.hero_button_text}
                buttonHref={page.hero_button_href || "#application"}
                bestOffersTitle={page.best_offers_title}
                applicationFormTitle={page.application_form_title}
                applicationButtonText={page.application_button_text}
                offers={page.bank_offers}
                popularSearches={popularSearches}
            />
        );
    }

    const bankOffers = page.bank_offers || [];
    const faqItems = page.faq || [];

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Hero Image */}
                {page.hero_image && (
                    <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden">
                        <img
                            src={page.hero_image}
                            alt={page.h1_title || "Hero image"}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                )}

                {/* H1 Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {page.h1_title}
                </h1>

                {/* H2 Title */}
                {page.h2_title && (
                    <h2 className="text-2xl md:text-3xl font-semibold text-[#3ce8d1]">
                        {page.h2_title}
                    </h2>
                )}

                {/* Main Description */}
                {page.main_description && (
                    <div className="prose prose-invert max-w-none whitespace-pre-line prose-headings:text-white prose-p:text-slate-300 prose-a:text-[#3ce8d1]">
                        {page.main_description}
                    </div>
                )}

                {/* H3 Title */}
                {page.h3_title && (
                    <h3 className="text-xl md:text-2xl font-medium text-slate-200">
                        {page.h3_title}
                    </h3>
                )}

                {/* Bank Offers Section */}
                {bankOffers.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <span className="text-[#3ce8d1]">🏦</span> Предложения банков
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {bankOffers.map((offer: { bank_name?: string; bank_id?: number; custom_rate?: string; rate?: string; custom_text?: string }, idx: number) => (
                                <div
                                    key={idx}
                                    className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#3ce8d1]/50 transition-colors"
                                >
                                    <h3 className="text-lg font-semibold text-[#3ce8d1] mb-2">
                                        {offer.bank_name || `Банк ${offer.bank_id || idx + 1}`}
                                    </h3>
                                    {(offer.custom_rate || offer.rate) && (
                                        <p className="text-white text-sm mb-1">{offer.custom_rate || offer.rate}</p>
                                    )}
                                    {offer.custom_text && (
                                        <p className="text-slate-400 text-sm">{offer.custom_text}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* FAQ Section */}
                {faqItems.length > 0 && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <span className="text-[#3ce8d1]">❓</span> Часто задаваемые вопросы
                        </h2>
                        <div className="space-y-3">
                            {faqItems.map((item: { question: string; answer: string }, idx: number) => (
                                <details
                                    key={idx}
                                    className="group rounded-xl bg-white/5 border border-white/10 overflow-hidden"
                                >
                                    <summary className="px-5 py-4 cursor-pointer text-white font-medium hover:bg-white/5 transition-colors list-none flex justify-between items-center">
                                        {item.question}
                                        <span className="text-[#3ce8d1] transform group-open:rotate-180 transition-transform">
                                            ▼
                                        </span>
                                    </summary>
                                    <div className="px-5 pb-4 text-slate-300 text-sm leading-relaxed">
                                        {item.answer}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {/* Popular Searches Section */}
                {popularSearches.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <span className="text-[#3ce8d1]">🔍</span> Часто ищут
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {popularSearches.map((item: { text: string; href?: string }, idx: number) => (
                                isExternalHref(normalizeUiHref(item.href)) ? (
                                    <a
                                        key={idx}
                                        href={normalizeUiHref(item.href)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-full bg-[#3ce8d1]/10 text-[#3ce8d1] text-sm border border-[#3ce8d1]/30 hover:bg-[#3ce8d1]/20 transition-colors"
                                    >
                                        {item.text}
                                    </a>
                                ) : (
                                    <Link
                                        key={idx}
                                        href={normalizeUiHref(item.href)}
                                        className="px-4 py-2 rounded-full bg-[#3ce8d1]/10 text-[#3ce8d1] text-sm border border-[#3ce8d1]/30 hover:bg-[#3ce8d1]/20 transition-colors"
                                    >
                                        {item.text}
                                    </Link>
                                )
                            ))}
                        </div>
                    </section>
                )}

                {/* Fallback if no content */}
                {!page.main_description && bankOffers.length === 0 && faqItems.length === 0 && (
                    <p className="text-slate-400">Нет описания.</p>
                )}
            </div>
        </div>
    );
}


import { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "../../lib/api";
import { SeoPage } from "../../components/seo/seo-page-editor";

interface Props {
    params: Promise<{
        slug: string[];
    }>;
}

// Helper to construct slug string from array
const getSlugString = (slugArray: string[]) => {
    return slugArray.join("/");
};

async function getSeoPage(slug: string): Promise<SeoPage | null> {
    try {
        // Attempt to fetch the page by slug.
        // We assume the backend accepts the slug path exactly as provided.
        // URL encoding is important for slugs with special characters.
        const response = await api.get<SeoPage>(`/seo/pages/${encodeURIComponent(slug)}/`);
        return response;
    } catch (error) {
        // If 404, return null to trigger notFound()
        if ((error as any).status === 404) {
            return null;
        }
        console.error(`Failed to fetch SEO page for slug: ${slug}`, error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug: slugArray } = await params;
    const slug = getSlugString(slugArray);
    const page = await getSeoPage(slug);

    if (!page) {
        return {
            title: "Страница не найдена",
        };
    }

    return {
        title: page.meta_title || page.h1_title,
        description: page.meta_description,
        keywords: page.meta_keywords,
        openGraph: {
            title: page.meta_title || page.h1_title,
            description: page.meta_description,
        },
    };
}

export default async function DynamicSeoPage({ params }: Props) {
    const { slug: slugArray } = await params;
    const slug = getSlugString(slugArray);
    const page = await getSeoPage(slug);

    if (!page) {
        notFound();
    }

    const bankOffers = page.bank_offers || [];
    const faqItems = page.faq || [];
    const popularSearches = page.popular_searches || [];

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
                    <div
                        className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-[#3ce8d1]"
                        dangerouslySetInnerHTML={{ __html: page.main_description }}
                    />
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
                            {bankOffers.map((offer: { bank_name: string; rate?: string; custom_text?: string }, idx: number) => (
                                <div
                                    key={idx}
                                    className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-[#3ce8d1]/50 transition-colors"
                                >
                                    <h3 className="text-lg font-semibold text-[#3ce8d1] mb-2">
                                        {offer.bank_name}
                                    </h3>
                                    {offer.rate && (
                                        <p className="text-white text-sm mb-1">{offer.rate}</p>
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
                            {popularSearches.map((term: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-4 py-2 rounded-full bg-[#3ce8d1]/10 text-[#3ce8d1] text-sm border border-[#3ce8d1]/30 hover:bg-[#3ce8d1]/20 transition-colors cursor-default"
                                >
                                    {term}
                                </span>
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

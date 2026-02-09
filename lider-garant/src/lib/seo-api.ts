/**
 * SEO API Client for Server-Side Data Fetching
 * 
 * Used in generateMetadata() for server-rendered pages.
 * Fetches SEO data from Django backend.
 */

export interface SeoPageData {
    id: number;
    slug: string;
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    h1_title: string;
    h2_title?: string;
    h3_title?: string;
    hero_image?: string | null;
    main_description: string;
    hero_button_text?: string;
    hero_button_href?: string;
    best_offers_title?: string;
    application_form_title?: string;
    application_button_text?: string;
    page_type: 'landing' | 'product' | 'custom';
    template_name: string;
    autofill_template?: string;
    is_published: boolean;
    priority: number;
    faq?: Array<{ question: string; answer: string }>;
    popular_searches?: Array<{ text: string; href?: string } | string>;
    bank_offers?: Array<{
        bank_id?: number;
        bank_name?: string;
        custom_rate?: string;
        custom_text?: string;
        rate?: string;
    }>;
    banks?: Array<{
        id: number;
        name: string;
        short_name?: string;
        logo_url?: string;
        is_active: boolean;
    }>;
    created_at?: string;
    updated_at?: string;
}

const shouldSkipSeoFetch = () =>
    process.env.SKIP_SEO_FETCH === '1' || process.env.SKIP_SEO_FETCH === 'true';

// API Base URL for server-side fetching
const getApiBaseUrl = () => {
    // Server-side: use internal URL if available
    if (typeof window === 'undefined') {
        return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    }
    // Client-side: use public URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

/**
 * Fetch SEO page data from backend API
 * @param slug - Page slug (e.g., "rko", "ved")
 * @returns SeoPageData or null if not found
 */
export async function getSeoPage(slug: string): Promise<SeoPageData | null> {
    if (shouldSkipSeoFetch()) {
        return null;
    }
    try {
        const response = await fetch(`${getApiBaseUrl()}/seo/pages/${encodeURIComponent(slug)}/`, {
            next: { revalidate: 10 }, // Short cache to reflect SEO admin updates quickly
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            console.error(`[SEO API] Error fetching page: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`[SEO API] Failed to fetch page ${slug}:`, error);
        return null;
    }
}

/**
 * Fetch all published SEO pages
 * @returns Array of SeoPageData
 */
export async function getAllSeoPages(): Promise<SeoPageData[]> {
    if (shouldSkipSeoFetch()) {
        return [];
    }
    try {
        const response = await fetch(`${getApiBaseUrl()}/seo/pages/`, {
            next: { revalidate: 300 }, // Cache for 5 minutes
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`[SEO API] Error fetching all pages: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : (data.results || []);
    } catch (error) {
        console.error('[SEO API] Failed to fetch all pages:', error);
        return [];
    }
}

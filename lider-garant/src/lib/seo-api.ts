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

interface SeoApiRequestOptions {
    preferredBaseUrl?: string | null;
}

const SKIP_SEO_FETCH_KEY = 'SKIP_SEO_FETCH';

const normalizeBaseUrl = (value?: string) => {
    if (!value) return null;
    const normalized = value.trim().replace(/\/+$/, '');
    return normalized.length > 0 ? normalized : null;
};

const shouldSkipSeoFetch = () => {
    if (typeof process === 'undefined') {
        return false;
    }

    // Use bracket access so value is taken from runtime env.
    const rawValue = (process.env[SKIP_SEO_FETCH_KEY] || '').toLowerCase();
    return rawValue === '1' || rawValue === 'true';
};

const getApiBaseUrls = (options: SeoApiRequestOptions = {}) => {
    const urls = new Set<string>();

    const add = (value?: string) => {
        const normalized = normalizeBaseUrl(value);
        if (normalized) {
            urls.add(normalized);
        }
    };

    add(options.preferredBaseUrl || undefined);

    if (typeof window === 'undefined') {
        add(process.env.NEXT_PUBLIC_API_URL);
        add(process.env.INTERNAL_API_URL);
        add('http://backend:8000/api');
        add('http://localhost:8000/api');
    } else {
        add(process.env.NEXT_PUBLIC_API_URL);
        add('http://localhost:8000/api');
    }

    return Array.from(urls);
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * Fetch SEO page data from backend API
 * @param slug - Page slug (e.g., "rko", "ved")
 * @returns SeoPageData or null if not found
 */
export async function getSeoPage(slug: string, options: SeoApiRequestOptions = {}): Promise<SeoPageData | null> {
    if (shouldSkipSeoFetch()) {
        return null;
    }

    const baseUrls = getApiBaseUrls(options);
    const encodedSlug = encodeURIComponent(slug);

    for (const baseUrl of baseUrls) {
        try {
            const response = await fetchWithTimeout(`${baseUrl}/seo/pages/${encodedSlug}/`, {
                next: { revalidate: 10 },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                return await response.json();
            }

            if (response.status !== 404) {
                console.error(`[SEO API] Error fetching ${slug} from ${baseUrl}: ${response.status}`);
            }
        } catch (error) {
            console.error(`[SEO API] Failed to fetch ${slug} from ${baseUrl}:`, error);
        }
    }

    return null;
}

/**
 * Fetch all published SEO pages
 * @returns Array of SeoPageData
 */
export async function getAllSeoPages(): Promise<SeoPageData[]> {
    if (shouldSkipSeoFetch()) {
        return [];
    }

    const baseUrls = getApiBaseUrls();

    for (const baseUrl of baseUrls) {
        try {
            const response = await fetchWithTimeout(`${baseUrl}/seo/pages/`, {
                next: { revalidate: 300 },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error(`[SEO API] Error fetching all pages from ${baseUrl}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            return Array.isArray(data) ? data : (data.results || []);
        } catch (error) {
            console.error(`[SEO API] Failed to fetch all pages from ${baseUrl}:`, error);
        }
    }

    return [];
}

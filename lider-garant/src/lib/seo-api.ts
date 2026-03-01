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

const isLikelyNextSelfApi = (value: string) => {
    try {
        const parsed = new URL(value);
        const host = parsed.hostname.toLowerCase();
        const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
        const port = parsed.port || (parsed.protocol === 'http:' ? '80' : '443');
        return isLoopback && port === '3000';
    } catch {
        return false;
    }
};

const normalizeSlug = (value: string) => {
    const clean = String(value || '')
        .trim()
        .replace(/^\/+/, '')
        .replace(/\/+$/, '');

    if (!clean) {
        return '';
    }

    try {
        return decodeURIComponent(clean).toLowerCase();
    } catch {
        return clean.toLowerCase();
    }
};

const encodeSlugPath = (value: string) => {
    return String(value || '')
        .split('/')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => encodeURIComponent(part))
        .join('/');
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
            if (typeof window === 'undefined' && isLikelyNextSelfApi(normalized)) {
                return;
            }
            urls.add(normalized);
        }
    };

    if (typeof window === 'undefined') {
        // In SSR inside Docker, prefer internal backend URL first.
        add(process.env.INTERNAL_API_URL);
        add(options.preferredBaseUrl || undefined);
        add(process.env.NEXT_PUBLIC_API_URL);
        add('http://backend:8000/api');
        add('http://localhost:8000/api');
    } else {
        add(options.preferredBaseUrl || undefined);
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
    const normalizedSlug = normalizeSlug(slug);
    const encodedSlug = encodeSlugPath(slug);

    if (!encodedSlug) {
        return null;
    }

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
                // Non-404 error — try next base URL
            }
        } catch (error) {
            // Fetch failed — try next base URL
        }
    }

    // Fallback for deployments where detail endpoint routing differs,
    // but list endpoint is available and contains the page.
    const fallbackPages = await getAllSeoPages(options);
    return (
        fallbackPages.find((page) => normalizeSlug(page.slug) === normalizedSlug) || null
    );
}

/**
 * Fetch all published SEO pages
 * @returns Array of SeoPageData
 */
export async function getAllSeoPages(options: SeoApiRequestOptions = {}): Promise<SeoPageData[]> {
    if (shouldSkipSeoFetch()) {
        return [];
    }

    const baseUrls = getApiBaseUrls(options);

    for (const baseUrl of baseUrls) {
        try {
            const response = await fetchWithTimeout(`${baseUrl}/seo/pages/`, {
                next: { revalidate: 30 },
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                continue;
            }

            const data = await response.json();
            return Array.isArray(data) ? data : (data.results || []);
        } catch (error) {
            // Fetch failed — try next base URL
        }
    }

    return [];
}

/**
 * News API hooks
 * CRUD operations for news and categories
 */
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// =================================================================================
// TYPES
// =================================================================================

export interface NewsCategory {
    id: number
    name: string
    slug: string
    order: number
    is_active: boolean
    news_count: number
    created_at: string
}

export interface NewsItem {
    id: number
    title: string
    slug: string
    summary: string
    content?: string
    category: NewsCategory | null
    image: string | null
    is_featured: boolean
    is_published: boolean
    author_name: string | null
    views_count: number
    published_at: string | null
    created_at: string
    updated_at?: string
}

export interface NewsFeaturedResponse {
    featured: NewsItem[]
    recent: NewsItem[]
}

export interface NewsByCategoryResponse {
    category: NewsCategory
    news: NewsItem[]
}

// =================================================================================
// NEWS HOOKS
// =================================================================================

/**
 * Hook for fetching news list
 */
export function useNews(categoryId?: number) {
    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchNews = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const params: Record<string, string> = {}
            if (categoryId) {
                params.category = categoryId.toString()
            }

            const response = await api.get<{ results: NewsItem[] }>('/news/', params)
            setNews(response.results || [])
        } catch (err: any) {
            console.error('Error fetching news:', err)
            setError(err.message || 'Ошибка загрузки новостей')
        } finally {
            setIsLoading(false)
        }
    }, [categoryId])

    useEffect(() => {
        fetchNews()
    }, [fetchNews])

    return { news, isLoading, error, refetch: fetchNews }
}

/**
 * Hook for fetching featured/recent news
 */
export function useFeaturedNews() {
    const [data, setData] = useState<NewsFeaturedResponse>({ featured: [], recent: [] })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchFeatured = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await api.get<NewsFeaturedResponse>('/news/featured/')
            setData(response)
        } catch (err: any) {
            console.error('Error fetching featured news:', err)
            setError(err.message || 'Ошибка загрузки новостей')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFeatured()
    }, [fetchFeatured])

    return { ...data, isLoading, error, refetch: fetchFeatured }
}

/**
 * Hook for fetching single news item
 */
export function useNewsDetail(slug: string | null) {
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchNewsItem = useCallback(async () => {
        if (!slug) {
            setNewsItem(null)
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await api.get<NewsItem>(`/news/${slug}/`)
            setNewsItem(response)
        } catch (err: any) {
            console.error('Error fetching news item:', err)
            setError(err.message || 'Ошибка загрузки новости')
        } finally {
            setIsLoading(false)
        }
    }, [slug])

    useEffect(() => {
        fetchNewsItem()
    }, [fetchNewsItem])

    return { newsItem, isLoading, error, refetch: fetchNewsItem }
}

// =================================================================================
// CATEGORIES HOOKS
// =================================================================================

/**
 * Hook for fetching news categories
 */
export function useNewsCategories() {
    const [categories, setCategories] = useState<NewsCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await api.get<{ results: NewsCategory[] }>('/news/categories/')
            setCategories(response.results || [])
        } catch (err: any) {
            console.error('Error fetching categories:', err)
            setError(err.message || 'Ошибка загрузки категорий')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    return { categories, isLoading, error, refetch: fetchCategories }
}

// =================================================================================
// MUTATIONS HOOKS (ADMIN ONLY)
// =================================================================================

/**
 * Hook for news CRUD mutations (admin only)
 */
export function useNewsMutations() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createNews = async (data: {
        title: string
        summary?: string
        content: string
        category_id?: number | null
        image?: File | null
        is_featured?: boolean
        is_published?: boolean
        published_at?: string | null
    }): Promise<NewsItem | null> => {
        try {
            setIsLoading(true)
            setError(null)

            // Use FormData if there's an image file
            let response: NewsItem
            if (data.image instanceof File) {
                const formData = new FormData()
                formData.append('title', data.title)
                if (data.summary) formData.append('summary', data.summary)
                formData.append('content', data.content)
                if (data.category_id) formData.append('category_id', data.category_id.toString())
                formData.append('image', data.image)
                formData.append('is_featured', String(data.is_featured ?? false))
                formData.append('is_published', String(data.is_published ?? true))
                if (data.published_at) formData.append('published_at', data.published_at)

                response = await api.post<NewsItem>('/news/', formData)
            } else {
                const { image, ...rest } = data
                response = await api.post<NewsItem>('/news/', rest)
            }

            toast.success('Новость создана')
            return response
        } catch (err: any) {
            console.error('Error creating news:', err)
            // Extract detailed error message from API response
            let errorMsg = 'Ошибка создания новости'
            if (err.errors) {
                const fieldErrors: string[] = []
                for (const [field, errors] of Object.entries(err.errors)) {
                    if (Array.isArray(errors) && errors.length > 0) {
                        fieldErrors.push(`${field}: ${errors[0]}`)
                    }
                }
                if (fieldErrors.length > 0) {
                    errorMsg = fieldErrors.join('; ')
                }
            } else if (err.message) {
                errorMsg = err.message
            }
            setError(errorMsg)
            toast.error('Ошибка создания новости', { description: errorMsg })
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const updateNews = async (slug: string, data: Partial<{
        title: string
        summary: string
        content: string
        category_id: number | null
        image: File | null
        is_featured: boolean
        is_published: boolean
        published_at: string | null
    }>): Promise<NewsItem | null> => {
        try {
            setIsLoading(true)
            setError(null)

            // Use FormData if there's an image file
            let response: NewsItem
            if (data.image instanceof File) {
                const formData = new FormData()
                if (data.title) formData.append('title', data.title)
                if (data.summary !== undefined) formData.append('summary', data.summary)
                if (data.content) formData.append('content', data.content)
                if (data.category_id !== undefined) {
                    formData.append('category_id', data.category_id?.toString() ?? '')
                }
                formData.append('image', data.image)
                if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured))
                if (data.is_published !== undefined) formData.append('is_published', String(data.is_published))
                if (data.published_at) formData.append('published_at', data.published_at)

                response = await api.patch<NewsItem>(`/news/${slug}/`, formData)
            } else {
                const { image, ...rest } = data
                response = await api.patch<NewsItem>(`/news/${slug}/`, rest)
            }

            toast.success('Новость обновлена')
            return response
        } catch (err: any) {
            console.error('Error updating news:', err)
            setError(err.message || 'Ошибка обновления новости')
            toast.error('Ошибка обновления новости')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const deleteNews = async (slug: string): Promise<boolean> => {
        try {
            setIsLoading(true)
            setError(null)

            await api.delete(`/news/${slug}/`)
            toast.success('Новость удалена')
            return true
        } catch (err: any) {
            console.error('Error deleting news:', err)
            setError(err.message || 'Ошибка удаления новости')
            toast.error('Ошибка удаления новости')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { createNews, updateNews, deleteNews, isLoading, error }
}

/**
 * Hook for category CRUD mutations (admin only)
 */
export function useCategoryMutations() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createCategory = async (data: {
        name: string
        slug: string
        order?: number
        is_active?: boolean
    }): Promise<NewsCategory | null> => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await api.post<NewsCategory>('/news/categories/', data)
            toast.success('Категория создана')
            return response
        } catch (err: any) {
            console.error('Error creating category:', err)
            // Extract detailed error message from API response
            let errorMsg = 'Ошибка создания категории'
            if (err.errors) {
                const fieldErrors: string[] = []
                for (const [field, errors] of Object.entries(err.errors)) {
                    if (Array.isArray(errors) && errors.length > 0) {
                        fieldErrors.push(`${field}: ${errors[0]}`)
                    }
                }
                if (fieldErrors.length > 0) {
                    errorMsg = fieldErrors.join('; ')
                }
            } else if (err.message) {
                errorMsg = err.message
            }
            setError(errorMsg)
            toast.error('Ошибка создания категории', { description: errorMsg })
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const updateCategory = async (id: number, data: Partial<{
        name: string
        slug: string
        order: number
        is_active: boolean
    }>): Promise<NewsCategory | null> => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await api.patch<NewsCategory>(`/news/categories/${id}/`, data)
            toast.success('Категория обновлена')
            return response
        } catch (err: any) {
            console.error('Error updating category:', err)
            setError(err.message || 'Ошибка обновления категории')
            toast.error('Ошибка обновления категории')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const deleteCategory = async (id: number): Promise<boolean> => {
        try {
            setIsLoading(true)
            setError(null)

            await api.delete(`/news/categories/${id}/`)
            toast.success('Категория удалена')
            return true
        } catch (err: any) {
            console.error('Error deleting category:', err)
            setError(err.message || 'Ошибка удаления категории')
            toast.error('Ошибка удаления категории')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return { createCategory, updateCategory, deleteCategory, isLoading, error }
}

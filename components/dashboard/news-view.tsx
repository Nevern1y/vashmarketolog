"use client"

import { useState } from "react"
import DOMPurify from "dompurify"
import {
    Newspaper,
    Calendar,
    Eye,
    ChevronRight,
    Tag,
    Clock,
    Loader2,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useNews, useNewsCategories, useFeaturedNews, useNewsDetail, type NewsItem } from "@/hooks/use-news"
import { cn } from "@/lib/utils"

// =================================================================================
// NEWS VIEW FOR CLIENTS/AGENTS
// Displays news list with category filtering
// =================================================================================

// API Base URL for media files (Django serves media from port 8000)
const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'

// Helper to get full media URL
const getMediaUrl = (path: string | null): string | null => {
    if (!path) return null
    // If already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path
    }
    // Prepend media base URL to relative paths
    return `${MEDIA_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

// Format date for display
const formatDate = (dateString: string | null): string => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

// News Card Component
function NewsCard({ news, onClick }: { news: NewsItem; onClick: () => void }) {
    const imageUrl = getMediaUrl(news.image)

    return (
        <div
            onClick={onClick}
            className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-[#3CE8D1]/50 transition-all hover:shadow-lg"
        >
            {/* Image placeholder */}
            {imageUrl ? (
                <div className="h-48 bg-slate-800 overflow-hidden">
                    <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                </div>
            ) : (
                <div className="h-48 bg-gradient-to-br from-[#0a1628] to-[#1a2942] flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-slate-600" />
                </div>
            )}

            <div className="p-4">
                {/* Category Badge */}
                {news.category && (
                    <Badge
                        variant="outline"
                        className="mb-2 border-[#3CE8D1]/50 text-[#3CE8D1] text-xs"
                    >
                        {news.category.name}
                    </Badge>
                )}

                {/* Title */}
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-[#3CE8D1] transition-colors">
                    {news.title}
                </h3>

                {/* Summary */}
                {news.summary && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {news.summary}
                    </p>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(news.published_at || news.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {news.views_count}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Featured News Card (larger)
function FeaturedNewsCard({ news, onClick }: { news: NewsItem; onClick: () => void }) {
    const imageUrl = getMediaUrl(news.image)

    return (
        <div
            onClick={onClick}
            className="group relative h-80 rounded-xl overflow-hidden cursor-pointer"
        >
            {/* Background */}
            {imageUrl ? (
                <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={news.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#1a2942]" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                {news.category && (
                    <Badge className="mb-2 bg-[#3CE8D1] text-[#0a1628]">
                        {news.category.name}
                    </Badge>
                )}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#3CE8D1] transition-colors">
                    {news.title}
                </h3>
                {news.summary && (
                    <p className="text-sm text-slate-300 line-clamp-2 mb-2">
                        {news.summary}
                    </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(news.published_at || news.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {news.views_count} просмотров
                    </span>
                </div>
            </div>
        </div>
    )
}

// News Detail Modal
function NewsDetailModal({
    news,
    open,
    onClose,
}: {
    news: NewsItem | null
    open: boolean
    onClose: () => void
}) {
    // Fetch full news detail (list endpoint doesn't include content)
    const { newsItem: fullNews, isLoading } = useNewsDetail(open && news ? news.slug : null)

    // Use full news data if available, fallback to passed news
    const displayNews = fullNews || news
    const imageUrl = getMediaUrl(displayNews?.image || null)

    if (!displayNews) return null

    // Process content to handle line breaks properly (but not inside HTML tags)
    const processContent = (content: string) => {
        // Don't replace \n inside HTML table tags
        if (content.includes('<table')) {
            return content
        }
        return content.replace(/\n/g, '<br/>')
    }

    const sanitizedContent = displayNews.content
        ? DOMPurify.sanitize(processContent(displayNews.content))
        : ""

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{displayNews.title}</DialogTitle>
                </DialogHeader>

                {/* Image */}
                {imageUrl && (
                    <div className="rounded-lg overflow-hidden mb-4">
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={displayNews.title}
                            className="w-full h-64 object-cover"
                        />
                    </div>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {displayNews.category && (
                        <Badge variant="outline" className="border-[#3CE8D1]/50 text-[#3CE8D1]">
                            {displayNews.category.name}
                        </Badge>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(displayNews.published_at || displayNews.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {displayNews.views_count} просмотров
                    </span>
                </div>

                {/* Content with styled tables */}
                <div className="news-content prose prose-sm dark:prose-invert max-w-none">
                    <style jsx global>{`
                        .news-content .news-table-wrapper {
                            overflow-x: auto;
                            margin: 1rem 0;
                        }
                        .news-content .news-table-title {
                            font-size: 0.95rem;
                            font-weight: 600;
                            margin-bottom: 0.5rem;
                            color: #3CE8D1;
                        }
                        .news-content .news-table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 0.875rem;
                        }
                        .news-content .news-table th,
                        .news-content .news-table td {
                            border: 1px solid #374151;
                            padding: 0.5rem 0.75rem;
                            text-align: left;
                        }
                        .news-content .news-table th {
                            background: rgba(60, 232, 209, 0.1);
                            color: #3CE8D1;
                            font-weight: 600;
                        }
                        .news-content .news-table tr:nth-child(even) {
                            background: rgba(255, 255, 255, 0.02);
                        }
                        .news-content .news-table tr:hover {
                            background: rgba(60, 232, 209, 0.05);
                        }
                        /* Also style regular HTML tables */
                        .news-content table {
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 0.875rem;
                            margin: 1rem 0;
                        }
                        .news-content table th,
                        .news-content table td {
                            border: 1px solid #374151;
                            padding: 0.5rem 0.75rem;
                            text-align: left;
                        }
                        .news-content table th {
                            background: rgba(60, 232, 209, 0.1);
                            color: #3CE8D1;
                            font-weight: 600;
                        }
                        .news-content table tr:nth-child(even) {
                            background: rgba(255, 255, 255, 0.02);
                        }
                        .news-content table tr:hover {
                            background: rgba(60, 232, 209, 0.05);
                        }
                    `}</style>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : displayNews.content ? (
                        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                    ) : (
                        <p>{displayNews.summary}</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function NewsView() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)

    // Fetch data
    const { categories, isLoading: categoriesLoading } = useNewsCategories()
    const { featured, recent, isLoading: featuredLoading } = useFeaturedNews()
    const { news, isLoading: newsLoading } = useNews(selectedCategory || undefined)

    const handleNewsClick = (newsItem: NewsItem) => {
        setSelectedNews(newsItem)
        setDetailOpen(true)
    }

    const isLoading = categoriesLoading || featuredLoading || newsLoading

    return (
        <div className="min-h-screen [@media(max-height:820px)]:min-h-0">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                        <Newspaper className="h-5 w-5 text-[#3CE8D1]" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Новости</h1>
                </div>
                <p className="text-muted-foreground">
                    Актуальные новости и обновления финансовых продуктов
                </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
                <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        selectedCategory === null
                            ? "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                            : "border-border"
                    )}
                >
                    Все новости
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                            selectedCategory === category.id
                                ? "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                : "border-border"
                        )}
                    >
                        <Tag className="h-3 w-3 mr-1" />
                        {category.name}
                        <span className="ml-1 text-xs opacity-70">({category.news_count})</span>
                    </Button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                </div>
            ) : (
                <>
                    {/* Featured News (only when showing all) */}
                    {selectedCategory === null && featured.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-[#3CE8D1]" />
                                Главные новости
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {featured.slice(0, 2).map((newsItem) => (
                                    <FeaturedNewsCard
                                        key={newsItem.id}
                                        news={newsItem}
                                        onClick={() => handleNewsClick(newsItem)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* News Grid */}
                    <div>
                        {selectedCategory === null && (
                            <h2 className="text-lg font-semibold mb-4">Последние новости</h2>
                        )}
                        {news.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(selectedCategory === null ? recent : news).map((newsItem) => (
                                    <NewsCard
                                        key={newsItem.id}
                                        news={newsItem}
                                        onClick={() => handleNewsClick(newsItem)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-card rounded-xl border border-border">
                                <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">
                                    {selectedCategory
                                        ? "В этой категории пока нет новостей"
                                        : "Новости пока не добавлены"}
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* News Detail Modal */}
            <NewsDetailModal
                news={selectedNews}
                open={detailOpen}
                onClose={() => {
                    setDetailOpen(false)
                    setSelectedNews(null)
                }}
            />
        </div>
    )
}

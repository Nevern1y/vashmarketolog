"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldX } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "../../lib/auth-context"
import { api, tokenStorage, type ApiError } from "../../lib/api"
import { Button } from "../ui/button"
import { SeoPageEditor, type SeoPage } from "./seo-page-editor"

interface SeoEditorPageViewProps {
    mode: "create" | "edit"
    slugSegments?: string[]
}

const normalizeRouteSlug = (segments: string[] = []) => {
    return segments
        .map((segment) => {
            try {
                return decodeURIComponent(segment)
            } catch {
                return segment
            }
        })
        .join("/")
        .trim()
        .replace(/^\/+/, "")
        .replace(/\/+$/, "")
}

const encodeSlugPath = (slug: string) => {
    return slug
        .split("/")
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) => encodeURIComponent(part))
        .join("/")
}

const loadAdminPages = async () => {
    const adminEndpoints = [
        "/seo/pages-admin-list/",
        "/seo/pages/admin-list/",
        "/seo/pages/admin_list/",
    ]

    let last404: ApiError | null = null

    for (const endpoint of adminEndpoints) {
        try {
            return await api.get<SeoPage[]>(endpoint)
        } catch (error) {
            const apiError = error as ApiError

            if (apiError?.status === 404) {
                last404 = apiError
                continue
            }

            throw error
        }
    }

    throw (last404 || { message: "Admin list endpoint not found", status: 404 }) as ApiError
}

export function SeoEditorPageView({ mode, slugSegments = [] }: SeoEditorPageViewProps) {
    const { user, isLoading: isAuthLoading } = useAuth()
    const router = useRouter()
    const [page, setPage] = useState<SeoPage | null>(null)
    const [availablePages, setAvailablePages] = useState<SeoPage[]>([])
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const targetSlug = useMemo(() => normalizeRouteSlug(slugSegments), [slugSegments])

    const fetchEditorData = useCallback(async () => {
        setIsPageLoading(true)

        try {
            if (!tokenStorage.isAuthenticated()) {
                toast.error("Сессия истекла", {
                    description: "Войдите заново, чтобы управлять SEO страницами.",
                })
                router.push("/seo-manager/login")
                return
            }

            const pages = await loadAdminPages()
            setAvailablePages(pages)

            if (mode === "edit") {
                if (!targetSlug) {
                    toast.error("Не указан slug страницы")
                    setPage(null)
                    return
                }

                const encodedSlug = encodeSlugPath(targetSlug)
                const seoPage = await api.get<SeoPage>(`/seo/pages/${encodedSlug}/`)
                setPage(seoPage)
            } else {
                setPage(null)
            }
        } catch (error) {
            const apiError = error as ApiError

            if (apiError?.status === 401 || apiError?.status === 403) {
                toast.error("Нет доступа к SEO админке", {
                    description: "Проверьте вход с ролью seo/admin.",
                })
                router.push("/seo-manager/login")
                return
            }

            if (apiError?.status === 404 && mode === "edit") {
                setPage(null)
                toast.error("SEO страница не найдена")
            } else {
                toast.error(apiError?.message || "Не удалось загрузить редактор SEO страницы")
            }
        } finally {
            setIsPageLoading(false)
        }
    }, [mode, router, targetSlug])

    useEffect(() => {
        if (isAuthLoading) {
            return
        }

        if (!user) {
            router.push("/seo-manager/login")
            return
        }

        if (user.role !== "admin" && user.role !== "seo") {
            toast.error("Доступ запрещён", {
                description: "Требуется роль администратора.",
            })
            router.push("/")
            return
        }

        void fetchEditorData()
    }, [fetchEditorData, isAuthLoading, router, user])

    const handleClose = useCallback(() => {
        router.push("/seo-manager/dashboard")
    }, [router])

    const handleSave = useCallback(async (data: Partial<SeoPage>) => {
        setIsSaving(true)

        try {
            if (mode === "edit" && page) {
                const encodedSlug = encodeSlugPath(page.slug)
                await api.patch<SeoPage>(`/seo/pages/${encodedSlug}/`, data)
                toast.success("SEO страница обновлена")
            } else {
                await api.post<SeoPage>("/seo/pages/", data)
                toast.success("SEO страница создана")
            }

            return true
        } catch (error) {
            const apiError = error as ApiError

            if (apiError?.status === 401 || apiError?.status === 403) {
                toast.error("Сессия истекла", {
                    description: "Войдите заново и повторите сохранение.",
                })
                router.push("/seo-manager/login")
            } else {
                toast.error(apiError?.message || "Ошибка при сохранении")
            }

            return false
        } finally {
            setIsSaving(false)
        }
    }, [mode, page, router])

    if (isAuthLoading || isPageLoading) {
        return (
            <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#1d194c] text-white">
                <div className="flex items-center gap-3 rounded-2xl border border-[#3ce8d1]/20 bg-[#0b0b12]/70 px-5 py-4 shadow-xl">
                    <Loader2 className="h-5 w-5 animate-spin text-[#3ce8d1]" />
                    Загрузка SEO редактора...
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (user.role !== "admin" && user.role !== "seo") {
        return (
            <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#1d194c] px-4 text-white">
                <ShieldX className="h-16 w-16 text-red-400" />
                <h1 className="text-2xl font-bold">Доступ запрещён</h1>
                <p className="text-center text-slate-400">Требуется роль администратора</p>
            </div>
        )
    }

    if (mode === "edit" && !page) {
        return (
            <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-[#1d194c] px-4 text-white">
                <ShieldX className="h-16 w-16 text-amber-400" />
                <h1 className="text-2xl font-bold">SEO страница не найдена</h1>
                <p className="max-w-xl text-center text-slate-400">
                    Не удалось загрузить страницу для редактирования. Возможно, slug был изменён или запись уже удалена.
                </p>
                <Button
                    type="button"
                    onClick={handleClose}
                    className="bg-[#3ce8d1] font-bold text-[#1d194c] hover:bg-[#3ce8d1]/90"
                >
                    Вернуться к списку страниц
                </Button>
            </div>
        )
    }

    return (
        <SeoPageEditor
            page={page}
            onClose={handleClose}
            onSave={handleSave}
            isLoading={isSaving}
            availablePages={availablePages.map((item) => ({ slug: item.slug, h1_title: item.h1_title }))}
        />
    )
}

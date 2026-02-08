"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../lib/auth-context"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
    Search,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    ExternalLink,
    Loader2,
    Settings,
    LogOut,
    Globe
} from "lucide-react"
import { SeoPageEditor, type SeoPage } from "./seo-page-editor"
import { api } from "../../lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"

export function SeoDashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [pages, setPages] = useState<SeoPage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Edit/Create State
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingPage, setEditingPage] = useState<SeoPage | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [pageToDelete, setPageToDelete] = useState<SeoPage | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchPages = async () => {
        setIsLoading(true)
        try {
            // In a real scenario, we might need a specific endpoint for the admin list
            // For now, using the public one which returns all published pages.
            // Ideally, we need an endpoint that returns ALL pages (including drafts) for admin.
            // Assuming existing /api/seo/pages/ handles this via permissions or query params if needed.
            const data = await api.get<SeoPage[]>("/seo/pages/")
            setPages(data)
        } catch (error) {
            console.error("Failed to fetch SEO pages:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPages()
    }, [])

    const filteredPages = pages.filter(page =>
        page.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.h1_title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreate = () => {
        setEditingPage(null)
        setIsEditorOpen(true)
    }

    const handleEdit = (page: SeoPage) => {
        setEditingPage(page)
        setIsEditorOpen(true)
    }

    const handleDeleteRequest = (page: SeoPage) => {
        setPageToDelete(page)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!pageToDelete) return
        setIsDeleting(true)
        try {
            await api.delete(`/seo/pages/${pageToDelete.slug}/`)
            setPages(pages.filter(p => p.slug !== pageToDelete.slug))
            toast.success("Страница удалена")
        } catch (error) {
            console.error("Failed to delete page:", error)
            toast.error("Ошибка при удалении страницы")
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
            setPageToDelete(null)
        }
    }

    const handleSave = async (data: Partial<SeoPage>): Promise<boolean> => {
        setIsSaving(true)
        try {
            let result: SeoPage;
            if (editingPage) {
                // Update
                result = await api.patch<SeoPage>(`/seo/pages/${editingPage.slug}/`, data)
                setPages(pages.map(p => p.id === result.id ? result : p))
            } else {
                // Create
                result = await api.post<SeoPage>("/seo/pages/", data)
                setPages([result, ...pages])
            }
            return true
        } catch (error) {
            console.error("Failed to save page:", error)
            toast.error("Ошибка при сохранении")
            return false
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1d194c] text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[#3ce8d1]/20 bg-[#0b0b12]/80 px-6 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 font-bold text-xl mr-auto text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3ce8d1]/10 border border-[#3ce8d1]/20">
                        <Globe className="h-5 w-5 text-[#3ce8d1]" />
                    </div>
                    Админка сайта
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400">
                        {user?.email}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => logout()} className="text-slate-400 hover:text-[#3ce8d1] hover:bg-[#3ce8d1]/10">
                        <LogOut className="h-4 w-4 mr-2" />
                        Выйти
                    </Button>
                </div>
            </header>

            <main className="container mx-auto py-8 px-4">
                <div className="mb-6 flex flex-wrap items-start gap-4 sm:mb-8 sm:items-center">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Страницы</h1>
                        <p className="mt-1 text-slate-400">
                            Управление страницами и контентом
                        </p>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="w-full justify-center bg-[#3ce8d1] font-bold text-[#1d194c] shadow-[0_0_15px_rgba(60,232,209,0.3)] hover:bg-[#3ce8d1]/90 border-none sm:ml-auto sm:w-auto"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Создать страницу
                    </Button>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="relative w-full min-w-0 flex-1 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Поиск по URL или заголовку..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-[#0b0b12]/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#3ce8d1] focus-visible:ring-[#3ce8d1]/20"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-[#3ce8d1]/20 bg-[#0b0b12]/50 shadow-xl overflow-hidden backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-[#1d194c]/50">
                            <TableRow className="border-b-slate-700 hover:bg-transparent">
                                <TableHead className="w-[30%] text-slate-300">URL Path (Slug)</TableHead>
                                <TableHead className="text-slate-300">H1 Заголовок</TableHead>
                                <TableHead className="text-slate-300">Тип</TableHead>
                                <TableHead className="text-slate-300">Статус</TableHead>
                                <TableHead className="text-right text-slate-300">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow className="border-b-slate-800 hover:bg-slate-800/50">
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2 text-slate-400">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#3ce8d1]" />
                                            Загрузка...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPages.length === 0 ? (
                                <TableRow className="border-b-slate-800 hover:bg-slate-800/50">
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-400">
                                        Страницы не найдены. Создайте первую страницу!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPages.map((page) => (
                                    <TableRow key={page.id} className="border-b-slate-800 hover:bg-slate-800/50 transition-colors">
                                        <TableCell className="font-mono text-sm font-medium text-[#3ce8d1]">
                                            {page.slug}
                                        </TableCell>
                                        <TableCell className="text-slate-200">
                                            {page.h1_title || <span className="text-slate-500 italic">Без заголовка</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize border-slate-600 text-slate-300">
                                                {page.page_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {page.is_published ? (
                                                <Badge className="bg-[#3ce8d1]/10 text-[#3ce8d1] border border-[#3ce8d1]/30 hover:bg-[#3ce8d1]/20">
                                                    Опубликовано
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-700 text-slate-300 hover:bg-slate-600">
                                                    Черновик
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-[#0b0b12] border-slate-700 text-slate-200">
                                                    <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, '_blank')} className="focus:bg-slate-800 focus:text-white">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        Открыть на сайте
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(page)} className="focus:bg-slate-800 focus:text-white">
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Редактировать
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteRequest(page)}
                                                        className="text-red-400 focus:text-red-300 focus:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Удалить
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </main>

            <SeoPageEditor
                open={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                page={editingPage}
                onSave={handleSave}
                isLoading={isSaving}
                availablePages={pages.map((item) => ({ slug: item.slug, h1_title: item.h1_title }))}
            />

            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open)
                    if (!open) {
                        setPageToDelete(null)
                    }
                }}
            >
                <DialogContent className="bg-[#0b0b12] border-slate-700 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Удалить страницу?</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {pageToDelete
                                ? `Страница ${pageToDelete.slug} будет удалена без возможности восстановления.`
                                : "Страница будет удалена без возможности восстановления."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border-slate-700 text-slate-200 hover:bg-slate-800"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Отмена
                        </Button>
                        <Button
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
    Newspaper,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Star,
    Tag,
    Loader2,
    Search,
    X,
    Calendar,
    FolderPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    useNews,
    useNewsCategories,
    useNewsMutations,
    useCategoryMutations,
    type NewsItem,
    type NewsCategory,
} from "@/hooks/use-news"

// =================================================================================
// ADMIN NEWS VIEW
// Full CRUD for news and categories
// =================================================================================

// Format date
const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("ru-RU")
}

// Cyrillic to Latin transliteration map
const cyrillicToLatin: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}

// Slugify helper with Cyrillic support
const slugify = (text: string): string => {
    // First transliterate Cyrillic characters
    const transliterated = text
        .toLowerCase()
        .split('')
        .map(char => cyrillicToLatin[char] ?? char)
        .join('')

    return transliterated
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim()
}

// =================================================================================
// CATEGORY MANAGEMENT SHEET
// =================================================================================
function CategoryManagementSheet({
    categories,
    isLoading,
    onRefresh,
}: {
    categories: NewsCategory[]
    isLoading: boolean
    onRefresh: () => void
}) {
    const { createCategory, updateCategory, deleteCategory, isLoading: mutating } = useCategoryMutations()
    const [newCategoryName, setNewCategoryName] = useState("")
    const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return
        const slug = slugify(newCategoryName)
        const result = await createCategory({
            name: newCategoryName,
            slug,
            order: categories.length,
        })
        if (result) {
            setNewCategoryName("")
            onRefresh()
        }
    }

    const handleUpdateCategory = async () => {
        if (!editingCategory) return
        await updateCategory(editingCategory.id, {
            name: editingCategory.name,
            slug: editingCategory.slug,
            order: editingCategory.order,
            is_active: editingCategory.is_active,
        })
        setEditingCategory(null)
        onRefresh()
    }

    const handleDeleteCategory = async () => {
        if (!deleteConfirmId) return
        await deleteCategory(deleteConfirmId)
        setDeleteConfirmId(null)
        onRefresh()
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Категории
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Управление категориями</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Create new category */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Название категории"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                        />
                        <Button
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim() || mutating}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Categories list */}
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                                >
                                    {editingCategory?.id === category.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <Input
                                                value={editingCategory.name}
                                                onChange={(e) =>
                                                    setEditingCategory({ ...editingCategory, name: e.target.value })
                                                }
                                                className="h-8"
                                            />
                                            <Button size="sm" onClick={handleUpdateCategory} disabled={mutating}>
                                                Сохранить
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditingCategory(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">{category.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {category.news_count} новостей
                                                </Badge>
                                                {!category.is_active && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Скрыта
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setEditingCategory(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleteConfirmId(category.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete confirmation */}
                <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Новости этой категории останутся, но будут без категории.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteCategory}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Удалить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SheetContent>
        </Sheet>
    )
}

// =================================================================================
// NEWS EDIT DIALOG
// =================================================================================
function NewsEditDialog({
    newsItem,
    categories,
    open,
    onClose,
    onSave,
    isLoading,
}: {
    newsItem: NewsItem | null
    categories: NewsCategory[]
    open: boolean
    onClose: () => void
    onSave: (data: any) => Promise<boolean>
    isLoading: boolean
}) {
    const [formData, setFormData] = useState({
        title: "",
        summary: "",
        content: "",
        category_id: null as number | null,
        is_featured: false,
        is_published: true,
    })

    useEffect(() => {
        if (newsItem) {
            setFormData({
                title: newsItem.title,
                summary: newsItem.summary || "",
                content: newsItem.content || "",
                category_id: newsItem.category?.id || null,
                is_featured: newsItem.is_featured,
                is_published: newsItem.is_published,
            })
        } else {
            setFormData({
                title: "",
                summary: "",
                content: "",
                category_id: null,
                is_featured: false,
                is_published: true,
            })
        }
    }, [newsItem, open])

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.content.trim()) return
        const success = await onSave({
            ...formData,
            published_at: formData.is_published ? new Date().toISOString() : null,
        })
        if (success) {
            onClose()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {newsItem ? "Редактировать новость" : "Создать новость"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Заголовок *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите заголовок"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Категория</Label>
                        <Select
                            value={formData.category_id?.toString() || "none"}
                            onValueChange={(value) =>
                                setFormData({
                                    ...formData,
                                    category_id: value === "none" ? null : parseInt(value),
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Без категории</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Краткое описание</Label>
                        <Textarea
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            placeholder="Краткое описание для превью"
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Содержание *</Label>
                        <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Полное содержание новости"
                            rows={8}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_featured}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_featured: checked })
                                }
                            />
                            <Label className="text-sm">Главная новость</Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.is_published}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_published: checked })
                                }
                            />
                            <Label className="text-sm">Опубликовать</Label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!formData.title.trim() || !formData.content.trim() || isLoading}
                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Сохранение...
                            </>
                        ) : (
                            "Сохранить"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// =================================================================================
// MAIN ADMIN NEWS VIEW
// =================================================================================
export function AdminNewsView() {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState<string>("all")
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingNews, setEditingNews] = useState<NewsItem | null>(null)
    const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string | null>(null)

    const { news, isLoading: newsLoading, refetch: refetchNews } = useNews()
    const { categories, isLoading: categoriesLoading, refetch: refetchCategories } = useNewsCategories()
    const { createNews, updateNews, deleteNews, isLoading: mutating } = useNewsMutations()

    // Filter news
    const filteredNews = news.filter((item) => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory =
            filterCategory === "all" ||
            (filterCategory === "none" && !item.category) ||
            item.category?.id.toString() === filterCategory
        return matchesSearch && matchesCategory
    })

    const handleCreate = () => {
        setEditingNews(null)
        setEditDialogOpen(true)
    }

    const handleEdit = (item: NewsItem) => {
        setEditingNews(item)
        setEditDialogOpen(true)
    }

    const handleSave = async (data: any): Promise<boolean> => {
        if (editingNews) {
            const result = await updateNews(editingNews.slug, data)
            if (result) {
                refetchNews()
                return true
            }
        } else {
            const result = await createNews(data)
            if (result) {
                refetchNews()
                return true
            }
        }
        return false
    }

    const handleDelete = async () => {
        if (!deleteConfirmSlug) return
        const success = await deleteNews(deleteConfirmSlug)
        if (success) {
            refetchNews()
        }
        setDeleteConfirmSlug(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Управление новостями</h1>
                    <p className="text-muted-foreground">
                        Создание, редактирование и удаление новостей
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CategoryManagementSheet
                        categories={categories}
                        isLoading={categoriesLoading}
                        onRefresh={refetchCategories}
                    />
                    <Button
                        onClick={handleCreate}
                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Создать новость
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по заголовку..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Все категории</SelectItem>
                        <SelectItem value="none">Без категории</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* News Table */}
            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Заголовок</TableHead>
                            <TableHead>Категория</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Просмотры</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {newsLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredNews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Новости не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredNews.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.is_featured && (
                                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                            )}
                                            <span className="font-medium line-clamp-1">{item.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {item.category ? (
                                            <Badge variant="outline" className="text-xs">
                                                <Tag className="h-3 w-3 mr-1" />
                                                {item.category.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {item.is_published ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                                <Eye className="h-3 w-3 mr-1" />
                                                Опубликовано
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <EyeOff className="h-3 w-3 mr-1" />
                                                Черновик
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-muted-foreground">{item.views_count}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDate(item.published_at || item.created_at)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteConfirmSlug(item.slug)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <NewsEditDialog
                newsItem={editingNews}
                categories={categories}
                open={editDialogOpen}
                onClose={() => {
                    setEditDialogOpen(false)
                    setEditingNews(null)
                }}
                onSave={handleSave}
                isLoading={mutating}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirmSlug} onOpenChange={() => setDeleteConfirmSlug(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Новость будет удалена навсегда.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

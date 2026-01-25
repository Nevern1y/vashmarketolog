"use client"

import { useState, useEffect, useRef } from "react"
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
    Image,
    Upload,
    FileText,
    TableIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { NewsTableEditor, tableToHtml, type TableData } from "./news-table-editor"

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
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState({
        title: "",
        summary: "",
        content: "",
        category_id: null as number | null,
        is_featured: false,
        is_published: true,
    })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [tables, setTables] = useState<TableData[]>([])
    const [activeTab, setActiveTab] = useState("content")

    // Extract tables from existing content (for editing)
    const extractTablesFromContent = (content: string): { textContent: string, tables: TableData[] } => {
        // For now, just return content as-is since we're adding new tables
        // In a full implementation, we'd parse existing HTML tables
        return { textContent: content, tables: [] }
    }

    useEffect(() => {
        if (newsItem) {
            const { textContent } = extractTablesFromContent(newsItem.content || "")
            setFormData({
                title: newsItem.title,
                summary: newsItem.summary || "",
                content: textContent,
                category_id: newsItem.category?.id || null,
                is_featured: newsItem.is_featured,
                is_published: newsItem.is_published,
            })
            // Set preview URL from existing news image
            setImagePreview(newsItem.image || "")
            setImageFile(null)
            setTables([])
        } else {
            setFormData({
                title: "",
                summary: "",
                content: "",
                category_id: null,
                is_featured: false,
                is_published: true,
            })
            setImageFile(null)
            setImagePreview("")
            setTables([])
        }
        setActiveTab("content")
    }, [newsItem, open])

    // Handle image file selection
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Store the file for upload
        setImageFile(file)

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setImagePreview(previewUrl)

        if (imageInputRef.current) {
            imageInputRef.current.value = ""
        }
    }

    // Clear image
    const clearImage = () => {
        setImageFile(null)
        setImagePreview("")
    }

    const handleSubmit = async () => {
        if (!formData.title.trim()) return

        // Combine text content with HTML tables
        let finalContent = formData.content

        // Add tables as HTML at the end of content
        if (tables.length > 0) {
            const tablesHtml = tables.map(t => tableToHtml(t)).join("\n\n")
            finalContent = finalContent + (finalContent ? "\n\n" : "") + tablesHtml
        }

        const success = await onSave({
            title: formData.title,
            summary: formData.summary,
            content: finalContent || formData.title, // Ensure content is not empty
            image: imageFile, // Pass File object for upload
            category_id: formData.category_id,
            is_featured: formData.is_featured,
            is_published: formData.is_published,
            published_at: formData.is_published ? new Date().toISOString() : null,
        })
        if (success) {
            onClose()
        }
    }

    const hasContent = formData.title.trim() && (formData.content.trim() || tables.length > 0)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {newsItem ? "Редактировать новость" : "Создать новость"}
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Контент
                        </TabsTrigger>
                        <TabsTrigger value="image" className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Изображение
                        </TabsTrigger>
                        <TabsTrigger value="tables" className="flex items-center gap-2">
                            <TableIcon className="h-4 w-4" />
                            Таблицы {tables.length > 0 && `(${tables.length})`}
                        </TabsTrigger>
                    </TabsList>

                    {/* Content Tab */}
                    <TabsContent value="content" className="space-y-4 py-4">
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
                            <Label>Содержание</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Полное содержание новости (поддерживается HTML)"
                                rows={10}
                            />
                            <p className="text-xs text-muted-foreground">
                                Поддерживается HTML-разметка. Таблицы будут добавлены автоматически из вкладки "Таблицы".
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
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
                    </TabsContent>

                    {/* Image Tab */}
                    <TabsContent value="image" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Загрузить изображение обложки</Label>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {imageFile ? "Изменить файл" : "Выбрать файл"}
                                </Button>
                                {imageFile && (
                                    <p className="text-xs text-green-500">
                                        ✓ Выбран файл: {imageFile.name}
                                    </p>
                                )}
                            </div>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Превью</Label>
                                        {imageFile && (
                                            <Badge variant="outline" className="text-green-500 border-green-500/50">
                                                Будет загружено
                                            </Badge>
                                        )}
                                        {!imageFile && imagePreview && (
                                            <Badge variant="outline" className="text-blue-500 border-blue-500/50">
                                                Существующее
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-video">
                                        <img
                                            src={imagePreview}
                                            alt="Превью"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none"
                                            }}
                                        />
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-2 right-2 h-8 w-8"
                                            onClick={clearImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!imagePreview && (
                                <div className="flex items-center justify-center py-12 border border-dashed border-border rounded-lg">
                                    <div className="text-center text-muted-foreground">
                                        <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Нет изображения</p>
                                        <p className="text-xs">Нажмите кнопку выше чтобы загрузить</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tables Tab */}
                    <TabsContent value="tables" className="py-4">
                        <NewsTableEditor tables={tables} onChange={setTables} />
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!hasContent || isLoading}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Управление новостями</h1>
                    <p className="text-muted-foreground">
                        Создание, редактирование и удаление новостей
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Поиск по заголовку..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40%]">Заголовок</TableHead>
                            <TableHead className="hidden lg:table-cell">Категория</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="hidden xl:table-cell">Просмотры</TableHead>
                            <TableHead className="hidden xl:table-cell">Дата</TableHead>
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
                                    <TableCell className="hidden lg:table-cell">
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
                                    <TableCell className="hidden xl:table-cell">
                                        <span className="text-muted-foreground">{item.views_count}</span>
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell">
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

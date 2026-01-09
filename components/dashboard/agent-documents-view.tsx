"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Folder,
    FileText,
    Download,
    Upload,
    ExternalLink,
    Loader2,
    RefreshCw,
    Search,
    AlertTriangle,
    Building2,
    Filter,
    ArrowUpDown,
    Info,
    CreditCard,
    Trash2,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useBankConditions, type BankCondition, type IndividualReviewCondition } from "@/hooks/use-bank-conditions"
import { useDocuments, useDocumentMutations, type DocumentListItem, formatDocumentType, getDocumentStatusColor } from "@/hooks/use-documents"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

// =============================================================================
// COMPONENT
// =============================================================================


export function AgentDocumentsView() {
    const [activeTab, setActiveTab] = useState("bank_conditions")
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"bank" | "rate" | "sum" | "term">("bank")
    const [selectedBank, setSelectedBank] = useState<string>("all")

    // Document upload state
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [documentName, setDocumentName] = useState("")
    const [isDeleting, setIsDeleting] = useState<number | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Bank conditions hook
    const {
        banks,
        conditions,
        individualReviews,
        rkoConditions,
        stopFactors,
        isLoading: isLoadingConditions,
        error: conditionsError,
        refetch: refetchConditions
    } = useBankConditions()

    // Documents hook
    const { documents, isLoading: isLoadingDocs, error: docsError, refetch: refetchDocs } = useDocuments()
    const { uploadDocument, deleteDocument, isLoading: isUploading, uploadProgress } = useDocumentMutations()

    // Format currency
    const formatSum = (sum: string | null) => {
        if (!sum) return "—"
        const num = parseFloat(sum)
        if (num >= 1000000) return `${(num / 1000000).toLocaleString("ru-RU")} млн`
        if (num >= 1000) return `${(num / 1000).toLocaleString("ru-RU")} тыс`
        return num.toLocaleString("ru-RU")
    }

    // Format rate
    const formatRate = (rate: string | null, type: string) => {
        if (!rate && type === "individual") return "Инд."
        if (!rate) return "—"
        return `от ${rate}%`
    }

    // Format term
    const formatTerm = (months: number | null, days: number | null) => {
        if (days) return `до ${days} дн.`
        if (months) return `до ${months} мес.`
        return "—"
    }

    // Format commission
    const formatCommission = (min: string | null, max: string | null) => {
        if (!min) return "—"
        if (max) return `${min}–${max}%`
        return `${min}%`
    }

    // Filter and sort conditions
    const filteredConditions = useMemo(() => {
        let result = [...conditions]

        // Filter by bank
        if (selectedBank !== "all") {
            result = result.filter(c => c.bank.toString() === selectedBank)
        }

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(c =>
                c.bank_name.toLowerCase().includes(q) ||
                c.product.toLowerCase().includes(q)
            )
        }

        // Sort
        switch (sortBy) {
            case "rate":
                result.sort((a, b) => (parseFloat(a.rate_min || "999") - parseFloat(b.rate_min || "999")))
                break
            case "sum":
                result.sort((a, b) => (parseFloat(b.sum_max || "0") - parseFloat(a.sum_max || "0")))
                break
            case "term":
                result.sort((a, b) => ((b.term_months || 0) - (a.term_months || 0)))
                break
            default:
                // Sort by bank order (already sorted from API)
                break
        }

        return result
    }, [conditions, selectedBank, searchQuery, sortBy])

    // Calculate active tab loading state
    const isLoading = activeTab === "bank_conditions" ? isLoadingConditions : isLoadingDocs
    const error = activeTab === "bank_conditions" ? conditionsError : docsError

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setDocumentName(file.name.replace(/\.[^/.]+$/, ""))
        }
    }

    // Handle upload
    const handleUpload = async () => {
        if (!selectedFile || !documentName.trim()) {
            toast.error("Выберите файл и введите название")
            return
        }

        const result = await uploadDocument({
            file: selectedFile,
            name: documentName.trim(),
            document_type_id: 0, // General document
        })

        if (result) {
            toast.success("Документ успешно загружен")
            setIsUploadDialogOpen(false)
            setSelectedFile(null)
            setDocumentName("")
            refetchDocs()
        } else {
            toast.error("Ошибка загрузки документа")
        }
    }

    // Handle delete
    const handleDelete = async (docId: number, docName: string) => {
        setIsDeleting(docId)
        const success = await deleteDocument(docId)
        setIsDeleting(null)

        if (success) {
            toast.success(`Документ "${docName}" удален`)
            refetchDocs()
        } else {
            toast.error("Ошибка удаления документа")
        }
    }

    // Get file URL
    const getFileUrl = (doc: DocumentListItem): string => {
        if (doc.file_url) return doc.file_url
        if (doc.file) {
            if (doc.file.startsWith('http')) return doc.file
            return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${doc.file}`
        }
        return '#'
    }

    // Format date
    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            })
        } catch {
            return dateStr
        }
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-500 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Подтвержден
                    </Badge>
                )
            case "rejected":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Отклонен
                    </Badge>
                )
            case "pending":
            default:
                return (
                    <Badge className="bg-amber-500/10 text-amber-500 gap-1">
                        <Clock className="h-3 w-3" />
                        На проверке
                    </Badge>
                )
        }
    }

    // Loading state for bank conditions tab
    if (activeTab === "bank_conditions" && isLoadingConditions) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    // Error state for bank conditions tab
    if (activeTab === "bank_conditions" && conditionsError) {
        return (
            <div className="flex flex-col h-[400px] items-center justify-center gap-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <p className="text-muted-foreground">{conditionsError}</p>
                <Button onClick={refetchConditions} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Повторить
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мои документы</h1>
                    <p className="text-muted-foreground">Условия банков и ваши документы</p>
                </div>
                <Button onClick={activeTab === "bank_conditions" ? refetchConditions : refetchDocs} variant="outline" size="sm">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Обновить
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
                    <TabsTrigger value="bank_conditions" className="flex items-center gap-2 py-2">
                        <Building2 className="h-4 w-4" />
                        Условия банков
                    </TabsTrigger>
                    <TabsTrigger value="my_documents" className="flex items-center gap-2 py-2">
                        <FileText className="h-4 w-4" />
                        Мои документы
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Bank Conditions */}
                <TabsContent value="bank_conditions" className="mt-6 space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Filter className="h-5 w-5 text-[#3CE8D1]" />
                                Фильтры и сортировка
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Поиск по банку или продукту..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <Select value={selectedBank} onValueChange={setSelectedBank}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Выберите банк" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Все банки</SelectItem>
                                        {banks.map(bank => (
                                            <SelectItem key={bank.id} value={bank.id.toString()}>
                                                {bank.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                                    <SelectTrigger className="w-[160px]">
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bank">По банку</SelectItem>
                                        <SelectItem value="rate">По ставке</SelectItem>
                                        <SelectItem value="sum">По сумме</SelectItem>
                                        <SelectItem value="term">По сроку</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main conditions table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Условия банков-партнёров</CardTitle>
                            <CardDescription>
                                Актуальные тарифы и условия ({filteredConditions.length} записей)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[160px]">Банк</TableHead>
                                            <TableHead>Продукт</TableHead>
                                            <TableHead className="text-right">Сумма мин.</TableHead>
                                            <TableHead className="text-right">Сумма макс.</TableHead>
                                            <TableHead className="text-center">Срок</TableHead>
                                            <TableHead className="text-center">Ставка</TableHead>
                                            <TableHead className="text-center">Комиссия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredConditions.map((cond) => (
                                            <TableRow key={cond.id}>
                                                <TableCell className="font-medium">
                                                    {cond.bank_name}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <span>{cond.product}</span>
                                                        {cond.additional_conditions && (
                                                            <p className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">
                                                                {cond.additional_conditions}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {formatSum(cond.sum_min)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {formatSum(cond.sum_max)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">
                                                        {formatTerm(cond.term_months, cond.term_days)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={cond.rate_type === "individual" ? "bg-amber-500/10 text-amber-500" : "bg-[#3CE8D1]/10 text-[#3CE8D1]"}>
                                                        {formatRate(cond.rate_min, cond.rate_type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-muted-foreground">
                                                        {formatCommission(cond.service_commission, cond.service_commission_max)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredConditions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Нет данных по выбранным критериям
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Individual Review Conditions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-[#4F7DF3]" />
                                Индивидуальное рассмотрение
                            </CardTitle>
                            <CardDescription>
                                Условия для заявок, выходящих за рамки экспресс-продуктов
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Банк</TableHead>
                                            <TableHead>ФЗ</TableHead>
                                            <TableHead>Вид БГ</TableHead>
                                            <TableHead className="text-right">Лимит клиента</TableHead>
                                            <TableHead className="text-right">Лимит ФЗ</TableHead>
                                            <TableHead className="text-right">Коммерц.</TableHead>
                                            <TableHead className="text-center">Срок</TableHead>
                                            <TableHead className="text-center">Ставка</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {individualReviews.map((ir) => (
                                            <TableRow key={ir.id}>
                                                <TableCell className="font-medium">{ir.bank_name}</TableCell>
                                                <TableCell>{ir.fz_type}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{
                                                        ir.guarantee_type === "all" ? "Все виды" :
                                                            ir.guarantee_type === "execution" ? "Исполнение" :
                                                                ir.guarantee_type === "application" ? "Заявка" :
                                                                    "Исп., Заявка"
                                                    }</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">{ir.client_limit} млн</TableCell>
                                                <TableCell className="text-right">{ir.fz_application_limit} млн</TableCell>
                                                <TableCell className="text-right">{ir.commercial_application_limit} млн</TableCell>
                                                <TableCell className="text-center">{ir.term}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1]">{ir.bank_rate}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* RKO Conditions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-[#4F7DF3]" />
                                РКО и Спецсчета
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {rkoConditions.map((rko) => (
                                    <div key={rko.id} className="p-4 rounded-lg border bg-card">
                                        <h4 className="font-semibold text-[#3CE8D1] mb-2">{rko.bank_name}</h4>
                                        <p className="text-sm text-muted-foreground">{rko.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stop Factors */}
                    <Card className="border-amber-500/30 bg-amber-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-500">
                                <AlertTriangle className="h-5 w-5" />
                                Стоп-факторы (общие для всех банков)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {stopFactors.map((sf) => (
                                    <li key={sf.id} className="flex items-start gap-2 text-sm">
                                        <span className="text-amber-500 mt-1">•</span>
                                        <span>{sf.description}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: My Documents (Full Implementation) */}
                <TabsContent value="my_documents" className="mt-6 space-y-4">
                    {/* Upload Dialog */}
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Загрузить документ</DialogTitle>
                                <DialogDescription>
                                    Загрузите документ для вашего профиля агента
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="file">Файл</Label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.zip,.rar,.sig"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        {selectedFile ? selectedFile.name : 'Выберите файл'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Макс. 10 МБ. Форматы: PDF, DOC, DOCX, JPG, PNG, XLS, XLSX, ZIP, RAR, SIG
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="docName">Название документа</Label>
                                    <Input
                                        id="docName"
                                        value={documentName}
                                        onChange={(e) => setDocumentName(e.target.value)}
                                        placeholder="Введите название документа"
                                    />
                                </div>
                                {isUploading && (
                                    <div className="space-y-2">
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">
                                            Загрузка: {uploadProgress}%
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsUploadDialogOpen(false)
                                        setSelectedFile(null)
                                        setDocumentName("")
                                    }}
                                    disabled={isUploading}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading || !selectedFile || !documentName.trim()}
                                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Загрузить
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Мои документы</CardTitle>
                                <CardDescription>
                                    {documents.length > 0
                                        ? `Загружено документов: ${documents.length}`
                                        : 'Загрузите документы для вашего профиля агента'
                                    }
                                </CardDescription>
                            </div>
                            <Button
                                onClick={() => setIsUploadDialogOpen(true)}
                                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Загрузить
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingDocs ? (
                                <div className="flex h-[200px] items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                                </div>
                            ) : docsError ? (
                                <div className="flex flex-col h-[200px] items-center justify-center gap-4">
                                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                                    <p className="text-muted-foreground">{docsError}</p>
                                    <Button onClick={refetchDocs} variant="outline" size="sm">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Повторить
                                    </Button>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                                    <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        У вас пока нет загруженных документов
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Нажмите кнопку "Загрузить" чтобы добавить документы
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Название</TableHead>
                                                <TableHead>Тип</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead>Дата загрузки</TableHead>
                                                <TableHead className="text-right">Действия</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {documents.map((doc) => (
                                                <TableRow key={doc.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{doc.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDocumentType(doc)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(doc.status)}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDate(doc.uploaded_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                asChild
                                                                className="h-8 w-8"
                                                            >
                                                                <a
                                                                    href={getFileUrl(doc)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Просмотр"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(doc.id, doc.name)}
                                                                disabled={isDeleting === doc.id}
                                                                title="Удалить"
                                                            >
                                                                {isDeleting === doc.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

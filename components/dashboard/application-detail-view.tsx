"use client"

import { useState, useCallback, useRef } from "react"
import {
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    FileText,
    Upload,
    Send,
    CheckCircle,
    Clock,
    XCircle,
    Building2,
    Calendar,
    Banknote,
    ExternalLink,
    Download,
    Eye,
    Trash2,
    Loader2,
    MapPin,
    Phone,
    Mail,
    User,
    CreditCard,
    Hash,
    Landmark
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApplication, useApplicationMutations, type Application } from "@/hooks/use-applications"
import { useDocumentMutations } from "@/hooks/use-documents"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ApplicationDetailViewProps {
    applicationId: string | number
    onBack?: () => void
}

/**
 * ApplicationDetailView - Agent's Application Detail with Step-by-Step Workflow
 * 
 * Design based on Bankon24 (techzadanie2) with Tiffany color scheme:
 * - Step 1: Заполните формы (Form completion)
 * - Step 2: Загрузите документы (Document upload)  
 * - Step 3: Отправка в банк (Bank submission)
 * - Step 4: Согласование и оплата (Approval & Payment)
 */
export function ApplicationDetailView({ applicationId, onBack }: ApplicationDetailViewProps) {
    const { application, isLoading, error, refetch } = useApplication(applicationId)
    const { submitApplication, isLoading: isSubmitting } = useApplicationMutations()
    const { uploadDocument, deleteDocument } = useDocumentMutations()

    // Step expansion state
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
        1: true,
        2: true,
        3: true,
        4: true,
    })

    // File upload state
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const toggleStep = (step: number) => {
        setExpandedSteps(prev => ({ ...prev, [step]: !prev[step] }))
    }

    // Calculate step progress
    const calculateFormProgress = (app: Application): number => {
        const requiredFields = ['company_name', 'amount', 'product_type']
        const filledCount = requiredFields.filter(field => {
            const value = app[field as keyof Application]
            return value !== null && value !== undefined && value !== ''
        }).length
        return Math.round((filledCount / requiredFields.length) * 100)
    }

    const calculateDocumentProgress = (app: Application): number => {
        if (!app.documents || app.documents.length === 0) return 0
        const approvedCount = app.documents.filter(d => d.status === 'approved').length
        return Math.round((approvedCount / app.documents.length) * 100)
    }

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        try {
            for (const file of Array.from(files)) {
                await uploadDocument({
                    file,
                    document_type_id: 0,
                    name: file.name,
                })
            }
            toast.success('Документы загружены')
            refetch()
        } catch {
            toast.error('Ошибка загрузки документов')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }, [uploadDocument, refetch])

    // Handle submit to bank
    const handleSubmitToBank = useCallback(async () => {
        if (!application) return

        const result = await submitApplication(application.id)
        if (result) {
            toast.success('Заявка отправлена в банк')
            refetch()
        } else {
            toast.error('Ошибка отправки заявки')
        }
    }, [application, submitApplication, refetch])

    // Handle document delete
    const handleDeleteDocument = useCallback(async (docId: number) => {
        try {
            await deleteDocument(docId)
            toast.success('Документ удален')
            refetch()
        } catch {
            toast.error('Ошибка удаления документа')
        }
    }, [deleteDocument, refetch])

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            in_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            info_requested: "bg-orange-500/20 text-orange-400 border-orange-500/30",
            approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            rejected: "bg-red-500/20 text-red-400 border-red-500/30",
            won: "bg-[#3CE8D1]/20 text-[#3CE8D1] border-[#3CE8D1]/30",
        }
        const labels: Record<string, string> = {
            draft: "Черновик",
            pending: "Ожидает",
            in_review: "На рассмотрении",
            info_requested: "Запрос информации",
            approved: "Одобрено",
            rejected: "Отклонено",
            won: "Выигран",
        }
        return (
            <Badge className={cn("border", styles[status] || styles.draft)}>
                {labels[status] || status}
            </Badge>
        )
    }

    // Document status badge
    const getDocStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
            pending: {
                bg: "bg-yellow-500/20",
                text: "text-yellow-400",
                icon: <Clock className="h-3 w-3" />
            },
            approved: {
                bg: "bg-emerald-500/20",
                text: "text-emerald-400",
                icon: <CheckCircle className="h-3 w-3" />
            },
            rejected: {
                bg: "bg-red-500/20",
                text: "text-red-400",
                icon: <XCircle className="h-3 w-3" />
            },
        }
        const style = styles[status] || styles.pending
        return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", style.bg, style.text)}>
                {style.icon}
                {status === 'pending' ? 'На проверке' : status === 'approved' ? 'Одобрен' : 'Отклонен'}
            </span>
        )
    }

    // Circular progress component
    const CircularProgress = ({ progress, size = 60, color = "#3CE8D1" }: { progress: number; size?: number; color?: string }) => {
        const strokeWidth = 4
        const radius = (size - strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        const offset = circumference - (progress / 100) * circumference

        return (
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#1e3a5f"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                    {progress}
                </span>
            </div>
        )
    }

    // Step header component
    const StepHeader = ({
        step,
        title,
        subtitle,
        icon,
        progress,
        isComplete,
        isExpanded,
        onToggle
    }: {
        step: number
        title: string
        subtitle: string
        icon: React.ReactNode
        progress: number
        isComplete: boolean
        isExpanded: boolean
        onToggle: () => void
    }) => (
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg transition-all",
                "hover:bg-[#1e3a5f]/50",
                isComplete ? "bg-emerald-500/10" : "bg-[#0f2042]"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                )}>
                    {isComplete ? <CheckCircle className="h-6 w-6" /> : icon}
                </div>
                <div className="text-left">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        Шаг {step}: {title}
                        {isComplete && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                    </h3>
                    <p className="text-sm text-[#94a3b8]">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <CircularProgress
                    progress={progress}
                    color={isComplete ? "#10b981" : progress > 0 ? "#ffa726" : "#3CE8D1"}
                />
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[#94a3b8]" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-[#94a3b8]" />
                )}
            </div>
        </button>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    if (error || !application) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <XCircle className="h-16 w-16 text-red-400" />
                <p className="text-red-400">{error || 'Заявка не найдена'}</p>
                <Button onClick={onBack} variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Назад к списку
                </Button>
            </div>
        )
    }

    const formProgress = calculateFormProgress(application)
    const docProgress = calculateDocumentProgress(application)
    const isSubmitted = application.status !== 'draft' && application.status !== 'pending'
    const canSubmit = formProgress === 100 && application.status === 'draft'

    return (
        <div className="space-y-6 pb-8">
            {/* Header with Breadcrumb - per reference format */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f]"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        {/* Breadcrumb: Мои заявки / ID / tender_number */}
                        <nav className="flex items-center gap-2 text-sm text-[#94a3b8] mb-1">
                            <button onClick={onBack} className="hover:text-[#3CE8D1] transition-colors">
                                Мои заявки
                            </button>
                            <span>/</span>
                            <span className="text-[#3CE8D1]">{application.id}</span>
                            {application.tender_number && (
                                <>
                                    <span>/</span>
                                    <span className="text-white">{application.tender_number}</span>
                                </>
                            )}
                        </nav>
                        {/* Title: Заявка: TENDER_NUMBER | LAW-ФЗ with date */}
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            Заявка: {application.tender_number || application.id} | {application.goscontract_data?.law || application.tender_law || '44'}-ФЗ
                            <span className="text-sm font-normal text-[#94a3b8]">
                                ✓ {new Date(application.created_at).toLocaleDateString('ru-RU')}
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Product badge and Status */}
            <div className="flex items-center gap-4">
                <Badge className="bg-[#0f2042] text-[#3CE8D1] border border-[#1e3a5f] px-4 py-2">
                    {application.product_type_display || 'Банковская гарантия'}
                </Badge>
                {getStatusBadge(application.status)}
            </div>

            {/* Application Info Card */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#94a3b8]">Клиент</p>
                                <p className="font-medium text-white">{application.company_name}</p>
                                <p className="text-xs text-[#94a3b8]">ИНН: {application.company_inn}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                <FileText className="h-5 w-5 text-[#3CE8D1]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#94a3b8]">Продукт</p>
                                <p className="font-medium text-white">{application.product_type_display}</p>
                                <p className="text-xs text-[#94a3b8]">{application.tender_law || application.goscontract_data?.law || ''}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                <Banknote className="h-5 w-5 text-[#3CE8D1]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#94a3b8]">Сумма</p>
                                <p className="font-medium text-white">
                                    {parseFloat(application.amount || '0').toLocaleString('ru-RU')} ₽
                                </p>
                                <p className="text-xs text-[#94a3b8]">{application.term_months} мес.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                <Calendar className="h-5 w-5 text-[#3CE8D1]" />
                            </div>
                            <div>
                                <p className="text-xs text-[#94a3b8]">Дата создания</p>
                                <p className="font-medium text-white">
                                    {new Date(application.created_at).toLocaleDateString('ru-RU')}
                                </p>
                                <p className="text-xs text-[#94a3b8]">
                                    {application.target_bank_name || 'Банк не выбран'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Company Information Tabs */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader className="pb-4">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        Информация о компании
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-[#0a1628] mb-4">
                            <TabsTrigger value="general" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black">
                                Общие данные
                            </TabsTrigger>
                            <TabsTrigger value="registration" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black">
                                Регистрация
                            </TabsTrigger>
                            <TabsTrigger value="bank" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black">
                                Банковские реквизиты
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black">
                                Контакты
                            </TabsTrigger>
                        </TabsList>

                        {/* General Information Tab */}
                        <TabsContent value="general" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Наименование</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.name || application.company_name}</p>
                                    <p className="text-sm text-[#94a3b8] mt-1">{application.company_data?.short_name || '-'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Hash className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Реквизиты</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white">ИНН: <span className="font-medium">{application.company_data?.inn || application.company_inn}</span></p>
                                        <p className="text-white">КПП: <span className="font-medium">{application.company_data?.kpp || '-'}</span></p>
                                        <p className="text-white">ОГРН: <span className="font-medium">{application.company_data?.ogrn || '-'}</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Юридический адрес</span>
                                    </div>
                                    <p className="text-white text-sm">{application.company_data?.legal_address || 'Не указан'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Фактический адрес</span>
                                    </div>
                                    <p className="text-white text-sm">{application.company_data?.actual_address || 'Совпадает с юридическим'}</p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Registration Tab */}
                        <TabsContent value="registration" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Руководитель</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.director_name || 'Не указан'}</p>
                                    <p className="text-sm text-[#94a3b8] mt-1">{application.company_data?.director_position || 'Генеральный директор'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Учредители</span>
                                    </div>
                                    {application.company_data?.founders_data && application.company_data.founders_data.length > 0 ? (
                                        <div className="space-y-2">
                                            {application.company_data.founders_data.map((founder, idx) => (
                                                <div key={idx} className="text-white text-sm">
                                                    <span className="font-medium">{founder.name}</span>
                                                    {founder.inn && <span className="text-[#94a3b8]"> (ИНН: {founder.inn})</span>}
                                                    {founder.share && <span className="text-[#94a3b8]"> — {founder.share}%</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[#94a3b8] text-sm">Данные не заполнены</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Bank Requisites Tab */}
                        <TabsContent value="bank" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Банк</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.bank_name || 'Не указан'}</p>
                                    <p className="text-sm text-[#94a3b8] mt-1">БИК: {application.company_data?.bank_bic || '-'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Счета</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white text-sm">Р/с: <span className="font-mono">{application.company_data?.bank_account || '-'}</span></p>
                                        <p className="text-white text-sm">К/с: <span className="font-mono">{application.company_data?.bank_corr_account || '-'}</span></p>
                                    </div>
                                </div>
                            </div>
                            {application.company_data?.bank_accounts_data && application.company_data.bank_accounts_data.length > 0 && (
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Дополнительные счета</span>
                                    </div>
                                    <div className="space-y-3">
                                        {application.company_data.bank_accounts_data.map((acc, idx) => (
                                            <div key={idx} className="p-3 rounded bg-[#0f2042] border border-[#1e3a5f]">
                                                <p className="text-white font-medium">{acc.bank_name}</p>
                                                <p className="text-sm text-[#94a3b8]">БИК: {acc.bic} | Счет: {acc.account}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Contacts Tab */}
                        <TabsContent value="contacts" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Контактное лицо</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.contact_person || 'Не указано'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Phone className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Телефон</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.contact_phone || 'Не указан'}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Mail className="h-4 w-4 text-[#3CE8D1]" />
                                        <span className="text-sm font-medium text-[#94a3b8]">Email</span>
                                    </div>
                                    <p className="text-white font-medium">{application.company_data?.contact_email || 'Не указан'}</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Step 1: Forms */}
            <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                <StepHeader
                    step={1}
                    title="Заполните формы"
                    subtitle="Заполните анкету и данные о компании"
                    icon={<FileText className="h-6 w-6" />}
                    progress={formProgress}
                    isComplete={formProgress === 100}
                    isExpanded={expandedSteps[1]}
                    onToggle={() => toggleStep(1)}
                />
                {expandedSteps[1] && (
                    <CardContent className="p-6 pt-0">
                        <Separator className="my-4 bg-[#1e3a5f]" />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#94a3b8]">Компания</span>
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p className="font-medium text-white truncate">{application.company_name}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#94a3b8]">Тип продукта</span>
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p className="font-medium text-white">{application.product_type_display}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#94a3b8]">Сумма</span>
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p className="font-medium text-white">
                                        {parseFloat(application.amount || '0').toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>
                            </div>
                            {application.tender_number && (
                                <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm text-[#94a3b8]">№ извещения</span>
                                            <p className="font-medium text-white">{application.tender_number}</p>
                                        </div>
                                        <a
                                            href={`https://zakupki.gov.ru/epz/order/notice/ea44/view/common-info.html?regNumber=${application.tender_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#3CE8D1] hover:underline flex items-center gap-1"
                                        >
                                            Открыть на ЕИС
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Step 2: Documents */}
            <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                <StepHeader
                    step={2}
                    title="Загрузите документы"
                    subtitle={`${application.documents?.length || 0} документов загружено`}
                    icon={<Upload className="h-6 w-6" />}
                    progress={docProgress}
                    isComplete={docProgress === 100 && (application.documents?.length || 0) > 0}
                    isExpanded={expandedSteps[2]}
                    onToggle={() => toggleStep(2)}
                />
                {expandedSteps[2] && (
                    <CardContent className="p-6 pt-0">
                        <Separator className="my-4 bg-[#1e3a5f]" />

                        {/* Upload Area */}
                        <div
                            className="border-2 border-dashed border-[#1e3a5f] rounded-lg p-8 text-center mb-6 hover:border-[#3CE8D1]/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            {isUploading ? (
                                <Loader2 className="h-10 w-10 mx-auto text-[#3CE8D1] animate-spin" />
                            ) : (
                                <>
                                    <Upload className="h-10 w-10 mx-auto text-[#3CE8D1] mb-4" />
                                    <p className="text-white font-medium mb-1">Перетащите файлы сюда</p>
                                    <p className="text-sm text-[#94a3b8]">или нажмите для выбора</p>
                                </>
                            )}
                        </div>

                        {/* Documents List */}
                        {application.documents && application.documents.length > 0 ? (
                            <div className="space-y-2">
                                {application.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                            <div>
                                                <p className="font-medium text-white">{doc.name}</p>
                                                <p className="text-xs text-[#94a3b8]">{doc.type_display}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getDocStatusBadge(doc.status)}
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[#94a3b8] hover:text-white"
                                                    asChild
                                                >
                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[#94a3b8] hover:text-white"
                                                    asChild
                                                >
                                                    <a href={doc.file_url} download>
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                {application.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-300"
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-[#94a3b8]">
                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Документы не загружены</p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Step 3: Submit to Bank */}
            <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                <StepHeader
                    step={3}
                    title="Отправка в банк"
                    subtitle={isSubmitted ? "Заявка отправлена" : "Отправьте заявку на рассмотрение"}
                    icon={<Send className="h-6 w-6" />}
                    progress={isSubmitted ? 100 : 0}
                    isComplete={isSubmitted}
                    isExpanded={expandedSteps[3]}
                    onToggle={() => toggleStep(3)}
                />
                {expandedSteps[3] && (
                    <CardContent className="p-6 pt-0">
                        <Separator className="my-4 bg-[#1e3a5f]" />

                        {isSubmitted ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Заявка отправлена
                                </h3>
                                <p className="text-[#94a3b8] mb-4">
                                    Статус: {application.status_display}
                                </p>
                                {application.submitted_at && (
                                    <p className="text-sm text-[#94a3b8]">
                                        Отправлено: {new Date(application.submitted_at).toLocaleString('ru-RU')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="max-w-md mx-auto">
                                    <Send className="h-16 w-16 mx-auto text-[#3CE8D1] mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Готовы отправить?
                                    </h3>
                                    <p className="text-[#94a3b8] mb-6">
                                        После отправки заявка будет передана в банк для рассмотрения.
                                        Редактирование будет недоступно.
                                    </p>
                                    <Button
                                        onClick={handleSubmitToBank}
                                        disabled={!canSubmit || isSubmitting}
                                        className="bg-[#3CE8D1] hover:bg-[#2fd5bf] text-black font-semibold px-8"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        ОТПРАВИТЬ ЗАЯВКУ
                                    </Button>
                                    {!canSubmit && (
                                        <p className="text-sm text-orange-400 mt-4">
                                            Заполните все обязательные поля перед отправкой
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Step 4: Approval & Payment */}
            <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                <StepHeader
                    step={4}
                    title="Согласование и оплата"
                    subtitle="Финальный этап оформления"
                    icon={<CheckCircle className="h-6 w-6" />}
                    progress={application.status === 'approved' || application.status === 'won' ? 100 : 0}
                    isComplete={application.status === 'approved' || application.status === 'won'}
                    isExpanded={expandedSteps[4]}
                    onToggle={() => toggleStep(4)}
                />
                {expandedSteps[4] && (
                    <CardContent className="p-6 pt-0">
                        <Separator className="my-4 bg-[#1e3a5f]" />

                        {application.status === 'approved' || application.status === 'won' ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-20 w-20 mx-auto text-emerald-400 mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    🎉 Заявка одобрена!
                                </h3>
                                <p className="text-[#94a3b8] mb-6">
                                    Поздравляем! Банковская гарантия будет выпущена после оплаты комиссии.
                                </p>
                                {application.commission_data && (
                                    <div className="bg-[#0f2042] rounded-lg p-4 inline-block">
                                        <p className="text-sm text-[#94a3b8] mb-2">Комиссия к оплате</p>
                                        <p className="text-2xl font-bold text-[#3CE8D1]">
                                            {(application.commission_data.total || 0).toLocaleString('ru-RU')} ₽
                                        </p>
                                    </div>
                                )}
                                {application.signing_url && (
                                    <Button
                                        asChild
                                        className="mt-6 bg-[#3CE8D1] hover:bg-[#2fd5bf] text-black font-semibold"
                                    >
                                        <a href={application.signing_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Перейти к подписанию
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ) : application.status === 'rejected' ? (
                            <div className="text-center py-8">
                                <XCircle className="h-20 w-20 mx-auto text-red-400 mb-4" />
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Заявка отклонена
                                </h3>
                                <p className="text-[#94a3b8]">
                                    К сожалению, банк не одобрил данную заявку.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Clock className="h-16 w-16 mx-auto text-[#94a3b8] mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    Ожидание решения банка
                                </h3>
                                <p className="text-[#94a3b8]">
                                    Заявка находится на рассмотрении. Вы получите уведомление о решении.
                                </p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Назад к списку
                </Button>

                {application.status === 'draft' && (
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить заявку
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    ArrowLeft,
    FileText,
    CheckCircle,
    XCircle,
    Loader2,
    MessageSquare,
    ExternalLink,
    Download,
    Edit,
    Save,
    RefreshCw,
    Eye,
    AlertCircle,
    Building2,
    Calendar,
    Banknote,
    Scale,
    FileCheck,
    Clock,
    Hash,
    Percent,
    TrendingUp,
    Shield,
    Truck,
    CreditCard,
    FileSignature,
    Users,
    Phone,
    Mail,
    MapPin,
    Landmark,
    ChevronRight,
    Send,
    // Phase 2: Additional icons for extended company data
    Briefcase,
    UserCheck,
    BadgeCheck,
    CircleDollarSign,
    Globe,
    Award,
    Receipt,
    Fingerprint,
} from "lucide-react"
import { useApplication, usePartnerActions } from "@/hooks/use-applications"
import { toast } from "sonner"
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
import { ApplicationChat } from "./application-chat"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { getStatusConfig } from "@/lib/status-mapping"

interface AdminApplicationDetailProps {
    applicationId: string
    onBack: () => void
}

// ============================================
// Constants — Status & Labels
// ============================================

const STATUS_ICONS: Record<string, React.ReactNode> = {
    draft: <FileText className="h-3.5 w-3.5" />,
    pending: <Clock className="h-3.5 w-3.5" />,
    in_review: <Eye className="h-3.5 w-3.5" />,
    info_requested: <MessageSquare className="h-3.5 w-3.5" />,
    approved: <CheckCircle className="h-3.5 w-3.5" />,
    rejected: <XCircle className="h-3.5 w-3.5" />,
    won: <TrendingUp className="h-3.5 w-3.5" />,
    lost: <XCircle className="h-3.5 w-3.5" />,
}

const PRODUCT_LABELS: Record<string, string> = {
    bank_guarantee: "Банковская гарантия",
    tender_loan: "Тендерный кредит",
    contract_loan: "КИК",
    corporate_credit: "Корпоративный кредит",
    factoring: "Факторинг",
    ved: "ВЭД",
    leasing: "Лизинг",
    insurance: "Страхование",
    special_account: "Спецсчёт",
    rko: "РКО",
    tender_support: "Тендерное сопровождение",
    deposits: "Депозиты",
}

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
    bank_guarantee: <Shield className="h-5 w-5" />,
    tender_loan: <Banknote className="h-5 w-5" />,
    contract_loan: <FileSignature className="h-5 w-5" />,
    corporate_credit: <CreditCard className="h-5 w-5" />,
    factoring: <TrendingUp className="h-5 w-5" />,
    ved: <Truck className="h-5 w-5" />,
    leasing: <Truck className="h-5 w-5" />,
    insurance: <Shield className="h-5 w-5" />,
    special_account: <Landmark className="h-5 w-5" />,
    rko: <Landmark className="h-5 w-5" />,
    tender_support: <FileCheck className="h-5 w-5" />,
    deposits: <Banknote className="h-5 w-5" />,
}

const GUARANTEE_TYPE_LABELS: Record<string, string> = {
    application_security: "Обеспечение заявки",
    contract_execution: "Исполнение контракта",
    advance_return: "Возврат аванса",
    warranty_obligations: "Гарантийные обязательства",
    payment_guarantee: "Гарантии оплаты товара",
    customs_guarantee: "Таможенные гарантии",
    vat_refund: "Возмещение НДС",
}

const TENDER_LAW_LABELS: Record<string, string> = {
    "44_fz": "44-ФЗ",
    "223_fz": "223-ФЗ",
    "615_pp": "615-ПП",
    "185_fz": "185-ФЗ",
    "275_fz": "275-ФЗ",
    kbg: "КБГ",
    commercial: "Коммерческий",
}

const FACTORING_TYPE_LABELS: Record<string, string> = {
    classic: "Классический",
    closed: "Закрытый",
    procurement: "Закупочный",
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
    gov: "Госконтракт",
    commercial: "Коммерческий",
}

const INSURANCE_CATEGORY_LABELS: Record<string, string> = {
    smr: "Строительно-монтажные риски",
    contract: "Контракта",
    personnel: "Персонал",
    transport: "Транспорт",
    property: "Имущество",
    liability: "Ответственность",
}

const INSURANCE_PRODUCT_LABELS: Record<string, string> = {
    // SMR
    smr_full: "СМР полный пакет",
    smr_basic: "СМР базовый",
    smr_risks: "Страхование строительных рисков",
    // Contract
    contract_execution: "Страхование исполнения контракта",
    contract_liability: "Страхование ответственности по контракту",
    // Personnel
    dms: "ДМС",
    critical_illness: "Критические заболевания",
    accident: "Несчастные случаи",
    travel: "Страхование в поездках",
    // Transport
    osago: "ОСАГО юр. лиц",
    fleet: "Страхование автопарков",
    special_tech: "Спецтехника",
    carrier_liability: "Ответственность перевозчика",
    // Property
    construction: "Объекты строительства",
    cargo: "Грузы и перевозки",
    company_property: "Имущество компаний",
    business_interruption: "Перерывы деятельности",
    // Liability
    civil_liability: "Гражданская ответственность",
    hazardous_objects: "Опасные объекты",
    professional_risks: "Профессиональные риски",
    quality_liability: "Ответственность за качество",
}

const CREDIT_SUB_TYPE_LABELS: Record<string, string> = {
    express: "Экспресс-кредит",
    working_capital: "Кредит на пополнение оборотных средств",
    corporate: "Корпоративный кредит",
    one_time_credit: "Разовый кредит",
    non_revolving_line: "Невозобновляемая КЛ",
    revolving_line: "Возобновляемая КЛ",
    overdraft: "Овердрафт",
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    rko: "РКО",
    rko_basic: "РКО Базовый",
    rko_premium: "РКО Премиум",
    rko_business: "РКО Бизнес",
    specaccount: "Спецсчёт",
    special: "Спецсчёт",
    "44fz": "Спецсчет 44-ФЗ",
    "223fz": "Спецсчет 223-ФЗ",
    "615pp": "Спецсчет 615-ПП",
}

const KIK_TYPE_LABELS: Record<string, string> = {
    credit_execution: "Кредит на исполнение",
    loan: "Займ",
    credit: "Кредит",
}

const TENDER_SUPPORT_TYPE_LABELS: Record<string, string> = {
    one_time: "Разовое",
    full_cycle: "Под ключ",
}

const PURCHASE_CATEGORY_LABELS: Record<string, string> = {
    gov_44: "44-ФЗ",
    gov_223: "223-ФЗ",
    property: "Имущественные торги",
    commercial: "Коммерческие",
}

// ============================================
// UI Components
// ============================================

interface DataRowProps {
    label: string
    value?: string | number | boolean | null
    icon?: React.ReactNode
    mono?: boolean
    highlight?: boolean
    badge?: boolean
    badgeVariant?: "default" | "success" | "warning" | "destructive"
}

function DataRow({ label, value, icon, mono, highlight, badge, badgeVariant = "default" }: DataRowProps) {
    if (value === null || value === undefined || value === "") return null
    
    const displayValue = typeof value === "boolean" 
        ? (value ? "Да" : "Нет")
        : String(value)
    
    const variantStyles = {
        default: "bg-slate-500/10 text-slate-300",
        success: "bg-emerald-500/15 text-emerald-400",
        warning: "bg-amber-500/15 text-amber-400",
        destructive: "bg-rose-500/15 text-rose-400",
    }
    
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/30 last:border-0 group hover:bg-white/[0.02] px-1 -mx-1 rounded">
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                {icon && <span className="opacity-60">{icon}</span>}
                <span className="text-sm">{label}</span>
            </div>
            {badge ? (
                <Badge className={cn("font-medium", variantStyles[badgeVariant])}>
                    {displayValue}
                </Badge>
            ) : (
                <span className={cn(
                    "text-sm text-right",
                    mono && "font-mono text-xs bg-slate-800/50 px-2 py-0.5 rounded",
                    highlight && "text-[#3CE8D1] font-semibold",
                    !mono && !highlight && "font-medium"
                )}>
                    {displayValue}
                </span>
            )}
        </div>
    )
}

interface DataCardProps {
    title: string
    icon?: React.ReactNode
    children: React.ReactNode
    className?: string
    headerAction?: React.ReactNode
    accent?: boolean
}

function DataCard({ title, icon, children, className, headerAction, accent }: DataCardProps) {
    return (
        <Card className={cn(
            "border-border/40 bg-[#0a1628]/50 backdrop-blur-sm overflow-hidden",
            accent && "border-l-2 border-l-[#3CE8D1]",
            className
        )}>
            <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-[#3CE8D1]">{icon}</span>}
                        <CardTitle className="text-sm font-semibold tracking-wide">{title}</CardTitle>
                    </div>
                    {headerAction}
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-4">
                {children}
            </CardContent>
        </Card>
    )
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 my-6">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
            <Separator className="flex-1" />
        </div>
    )
}

// ============================================
// Main Component
// ============================================

export function AdminApplicationDetail({ applicationId, onBack }: AdminApplicationDetailProps) {
    const { application, isLoading, refetch } = useApplication(applicationId)
    const { approveApplication, rejectApplication, restoreApplication, requestInfo, saveNotes, sendToBank, syncBankStatus, isLoading: isActioning } = usePartnerActions()

    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showRequestDialog, setShowRequestDialog] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [requestMessage, setRequestMessage] = useState("")
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [editedNotes, setEditedNotes] = useState("")
    const [isSavingNotes, setIsSavingNotes] = useState(false)
    const [isSendingToBank, setIsSendingToBank] = useState(false)
    const [activeTab, setActiveTab] = useState("info")

    const statusCfg = application ? getStatusConfig(application.status) : getStatusConfig("pending")
    const statusIcon = STATUS_ICONS[application?.status || "pending"] || STATUS_ICONS.draft

    const formatCurrency = (amount: string | number | null | undefined) => {
        if (!amount) return null
        return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(parseFloat(String(amount)))
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    // Actions
    const handleApprove = async () => {
        const result = await approveApplication(parseInt(applicationId))
        if (result) {
            toast.success("Заявка одобрена")
            await refetch()
        }
        setShowApproveDialog(false)
    }

    const handleReject = async () => {
        const result = await rejectApplication(parseInt(applicationId), rejectReason)
        if (result) {
            toast.success("Заявка отклонена")
            await refetch()
        }
        setShowRejectDialog(false)
        setRejectReason("")
    }

    const handleRequestInfo = async () => {
        const result = await requestInfo(parseInt(applicationId), requestMessage)
        if (result) {
            toast.success("Запрос отправлен")
            refetch()
        }
        setShowRequestDialog(false)
        setRequestMessage("")
    }

    const handleRestore = async () => {
        const result = await restoreApplication(parseInt(applicationId))
        if (result) {
            toast.success("Заявка восстановлена")
            refetch()
        }
    }

    const handleSaveNotes = async () => {
        setIsSavingNotes(true)
        const result = await saveNotes(parseInt(applicationId), editedNotes)
        if (result) {
            toast.success("Сохранено")
            setIsEditingNotes(false)
            refetch()
        }
        setIsSavingNotes(false)
    }

    const handleSendToBank = async () => {
        setIsSendingToBank(true)
        try {
            const result = await sendToBank(parseInt(applicationId))
            if (result) {
                toast.success(`Заявка отправлена в банк. Ticket ID: ${result.ticket_id}`)
                refetch()
            } else {
                toast.error("Ошибка отправки в банк")
            }
        } catch {
            toast.error("Ошибка отправки в банк")
        } finally {
            setIsSendingToBank(false)
        }
    }

    const handleSyncBankStatus = async () => {
        const result = await syncBankStatus(parseInt(applicationId))
        if (result) {
            if (result.changed) {
                toast.success(`Статус обновлен: ${result.bank_status}`)
            } else {
                toast.info(`Статус не изменился: ${result.bank_status}`)
            }
            refetch()
        } else {
            toast.error("Ошибка синхронизации статуса")
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                    <p className="text-sm text-muted-foreground">Загрузка заявки...</p>
                </div>
            </div>
        )
    }

    // Not found
    if (!application) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 mb-4">
                    <AlertCircle className="h-8 w-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Заявка не найдена</h3>
                <p className="text-muted-foreground mb-6">Возможно, она была удалена или у вас нет доступа</p>
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />Назад к списку
                </Button>
            </div>
        )
    }

    const documentsCount = application.documents?.length || 0
    const gd = application.goscontract_data || {}

    // Check what product we're dealing with
    const isBG = application.product_type === 'bank_guarantee'
    const isKIK = application.product_type === 'contract_loan'
    const isFactoring = application.product_type === 'factoring'
    const isLeasing = application.product_type === 'leasing'
    const isInsurance = application.product_type === 'insurance'
    const isCredit = application.product_type === 'corporate_credit' || application.product_type === 'tender_loan'
    const isRKO = application.product_type === 'rko' || application.product_type === 'special_account'
    const isVED = application.product_type === 'ved'
    const isTenderSupport = application.product_type === 'tender_support'

    return (
        <div className="max-w-7xl 2xl:max-w-[90rem] mx-auto">
            {/* ============================================ */}
            {/* HEADER — Rich, informative */}
            {/* ============================================ */}
            <div className="mb-6 md:mb-8">
                {/* Back + Status Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground -ml-2 self-start">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Назад к списку</span>
                    </Button>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {(application.status === 'pending' || application.status === 'in_review' || application.status === 'info_requested') && (
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowRequestDialog(true)}
                                disabled={isActioning}
                                className="flex-1 sm:flex-none h-9 text-xs"
                            >
                                <MessageSquare className="h-4 w-4 mr-1.5" />Запросить инфо
                            </Button>
                        )}
                        {application.status !== 'rejected' && application.status !== 'lost' &&
                            application.status !== 'approved' && application.status !== 'won' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none h-9 text-xs text-rose-400 border-rose-500/30 hover:text-rose-400 hover:bg-rose-500/10"
                                >
                                    <XCircle className="h-4 w-4 mr-1.5" />Отклонить
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowApproveDialog(true)}
                                    disabled={isActioning}
                                    className="flex-1 sm:flex-none h-9 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                                >
                                    <CheckCircle className="h-4 w-4 mr-1.5" />Одобрить
                                </Button>
                                {/* Send to Bank button - only show if not already sent */}
                                {!application.external_id && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSendToBank}
                                        disabled={isActioning || isSendingToBank}
                                        className="flex-1 sm:flex-none h-9 text-xs text-[#3CE8D1] border-[#3CE8D1]/30 hover:text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                    >
                                        <Send className="h-4 w-4 mr-1.5" />
                                        {isSendingToBank ? "Отправка..." : "Отправить в банк"}
                                    </Button>
                                )}
                                {/* Sync status button - only show if already sent */}
                                {application.external_id && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleSyncBankStatus}
                                        disabled={isActioning}
                                        className="flex-1 sm:flex-none h-9 text-xs text-blue-400 border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/10"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1.5" />Обновить статус
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Main Header Card */}
                <Card className="bg-gradient-to-br from-[#0a1628] to-[#0f1d32] border-border/40 overflow-hidden shadow-xl">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                            {/* Left: Product Info */}
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#3CE8D1]/10 text-[#3CE8D1] shrink-0 shadow-[0_0_15px_rgba(60,232,209,0.1)]">
                                    {PRODUCT_ICONS[application.product_type] || <FileText className="h-6 w-6" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Заявка #{application.id}</h1>
                                        <Badge className={cn("text-[10px] md:text-xs gap-1 py-0.5", statusCfg.bgColor, statusCfg.color)}>
                                            {statusIcon}
                                            {statusCfg.label}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-base md:text-lg font-medium">{PRODUCT_LABELS[application.product_type]}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs md:text-sm text-muted-foreground">
                                        <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                                        <span className="truncate">{application.company_name}</span>
                                        {application.company_inn && (
                                            <>
                                                <span className="opacity-40">•</span>
                                                <span className="font-mono text-[10px] md:text-xs">ИНН {application.company_inn}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Key Metrics */}
                            <div className="grid grid-cols-2 md:flex md:gap-8 border-t border-white/5 pt-4 lg:border-none lg:pt-0">
                                <div className="text-left md:text-right">
                                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-1">Сумма</p>
                                    <p className="text-lg md:text-2xl font-bold text-[#3CE8D1]">{formatCurrency(application.amount) || "—"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-1">Срок</p>
                                    <p className="text-lg md:text-2xl font-bold">{application.term_months ? `${application.term_months} мес.` : "—"}</p>
                                </div>
                                {application.target_bank_name && (
                                    <div className="text-left md:text-right col-span-2 mt-3 md:mt-0">
                                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-1">Целевой банк</p>
                                        <p className="text-base md:text-lg font-semibold text-white/90 truncate max-w-full md:max-w-[200px]">{application.target_bank_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ============================================ */}
            {/* TABS */}
            {/* ============================================ */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                    <TabsList className="mb-4 bg-[#0a1628]/50 border border-border/40 p-1 h-auto flex w-max sm:w-full">
                        <TabsTrigger 
                            value="info" 
                            className="data-[state=active]:bg-[#3CE8D1]/10 data-[state=active]:text-[#3CE8D1] px-4 py-2 text-xs md:text-sm flex-1"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Информация
                        </TabsTrigger>
                        <TabsTrigger 
                            value="company" 
                            className="data-[state=active]:bg-[#3CE8D1]/10 data-[state=active]:text-[#3CE8D1] px-4 py-2 text-xs md:text-sm flex-1"
                        >
                            <Building2 className="h-4 w-4 mr-2" />
                            Компания
                        </TabsTrigger>
                        <TabsTrigger 
                            value="documents" 
                            className="data-[state=active]:bg-[#3CE8D1]/10 data-[state=active]:text-[#3CE8D1] px-4 py-2 text-xs md:text-sm flex-1"
                        >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Документы
                            {documentsCount > 0 && (
                                <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">{documentsCount}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="chat" 
                            className="data-[state=active]:bg-[#3CE8D1]/10 data-[state=active]:text-[#3CE8D1] px-4 py-2 text-xs md:text-sm flex-1"
                        >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Чат
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ============================================ */}
                {/* TAB: Information */}
                {/* ============================================ */}
                <TabsContent value="info" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Left Column — Product Parameters (takes 2 columns) */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* БГ (Bank Guarantee) */}
                            {isBG && (
                                <DataCard 
                                    title="Параметры банковской гарантии" 
                                    icon={<Shield className="h-4 w-4" />}
                                    accent
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div>
                                            <DataRow 
                                                label="Тип гарантии" 
                                                value={GUARANTEE_TYPE_LABELS[application.guarantee_type || gd.bg_type || ""] || application.guarantee_type || gd.bg_type} 
                                                icon={<Shield className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Закон" 
                                                value={TENDER_LAW_LABELS[application.tender_law || gd.law || ""] || application.tender_law || gd.law} 
                                                icon={<Scale className="h-3.5 w-3.5" />}
                                                badge
                                            />
                                            <DataRow 
                                                label="№ извещения" 
                                                value={gd.purchase_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="№ лота" 
                                                value={gd.lot_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                        </div>
                                        <div>
                                            <DataRow 
                                                label="Срок БГ с" 
                                                value={formatDate(gd.guarantee_start_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Срок БГ по" 
                                                value={formatDate(gd.guarantee_end_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Авансирование" 
                                                value={gd.has_prepayment} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                            />
                                            {gd.has_prepayment && gd.advance_percent && (
                                                <DataRow 
                                                    label="Процент аванса" 
                                                    value={`${gd.advance_percent}%`} 
                                                    icon={<Percent className="h-3.5 w-3.5" />}
                                                    highlight
                                                />
                                            )}
                                            <DataRow 
                                                label="Шаблон заказчика" 
                                                value={gd.has_customer_template} 
                                                icon={<FileText className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Experience Section */}
                                    {(gd.contracts_44fz_count !== undefined || gd.contracts_223fz_count !== undefined) && (
                                        <>
                                            <Separator className="my-4" />
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Опыт исполнения контрактов</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                                    <p className="text-2xl font-bold">{gd.contracts_44fz_count || 0}</p>
                                                    <p className="text-xs text-muted-foreground">по 44-ФЗ</p>
                                                </div>
                                                <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                                    <p className="text-2xl font-bold">{gd.contracts_223fz_count || 0}</p>
                                                    <p className="text-xs text-muted-foreground">по 223-ФЗ</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </DataCard>
                            )}

                            {/* КИК (Contract Loan) */}
                            {isKIK && (
                                <DataCard 
                                    title="Параметры КИК" 
                                    icon={<FileSignature className="h-4 w-4" />}
                                    accent
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div>
                                            <DataRow 
                                                label="Тип" 
                                                value={KIK_TYPE_LABELS[gd.contract_loan_type || ""] || gd.contract_loan_type} 
                                                icon={<FileSignature className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Закон" 
                                                value={TENDER_LAW_LABELS[gd.law || ""] || gd.law} 
                                                icon={<Scale className="h-3.5 w-3.5" />}
                                                badge
                                            />
                                            <DataRow 
                                                label="№ извещения" 
                                                value={gd.purchase_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="№ лота" 
                                                value={gd.lot_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="Цена контракта" 
                                                value={formatCurrency(gd.contract_price)} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Сумма кредита" 
                                                value={formatCurrency(gd.credit_amount)} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                                highlight
                                            />
                                        </div>
                                        <div>
                                            <DataRow 
                                                label="Контракт с" 
                                                value={formatDate(gd.contract_start_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Контракт по" 
                                                value={formatDate(gd.contract_end_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Кредит с" 
                                                value={formatDate(gd.credit_start_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Кредит по" 
                                                value={formatDate(gd.credit_end_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            {!gd.ignore_execution_percent && (
                                                <DataRow 
                                                    label="% исполнения контракта" 
                                                    value={gd.contract_execution_percent ? `${gd.contract_execution_percent}%` : undefined} 
                                                    icon={<Percent className="h-3.5 w-3.5" />}
                                                />
                                            )}
                                            {gd.ignore_execution_percent && (
                                                <DataRow 
                                                    label="Игнорировать % исполнения" 
                                                    value={true} 
                                                    icon={<Percent className="h-3.5 w-3.5" />}
                                                />
                                            )}
                                            <DataRow 
                                                label="Авансирование" 
                                                value={gd.has_prepayment} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                            />
                                            {gd.has_prepayment && gd.advance_percent && (
                                                <DataRow 
                                                    label="Процент аванса" 
                                                    value={`${gd.advance_percent}%`} 
                                                    icon={<Percent className="h-3.5 w-3.5" />}
                                                    highlight
                                                />
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Experience Section */}
                                    {(gd.contracts_44fz_count !== undefined || gd.contracts_223fz_count !== undefined) && (
                                        <>
                                            <Separator className="my-4" />
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Опыт исполнения контрактов</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                                    <p className="text-2xl font-bold">{gd.contracts_44fz_count || 0}</p>
                                                    <p className="text-xs text-muted-foreground">по 44-ФЗ</p>
                                                </div>
                                                <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                                    <p className="text-2xl font-bold">{gd.contracts_223fz_count || 0}</p>
                                                    <p className="text-xs text-muted-foreground">по 223-ФЗ</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </DataCard>
                            )}

                            {/* Факторинг */}
                            {isFactoring && (
                                <DataCard 
                                    title="Параметры факторинга" 
                                    icon={<TrendingUp className="h-4 w-4" />}
                                    accent
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div>
                                            <DataRow 
                                                label="Тип факторинга" 
                                                value={FACTORING_TYPE_LABELS[application.factoring_type || gd.factoring_type || ""] || application.factoring_type || gd.factoring_type} 
                                                icon={<TrendingUp className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Тип контракта" 
                                                value={CONTRACT_TYPE_LABELS[gd.contract_type || ""] || gd.contract_type} 
                                                icon={<FileSignature className="h-3.5 w-3.5" />}
                                                badge
                                            />
                                            <DataRow 
                                                label="Закон" 
                                                value={TENDER_LAW_LABELS[gd.law || ""] || gd.law} 
                                                icon={<Scale className="h-3.5 w-3.5" />}
                                                badge
                                            />
                                            <DataRow 
                                                label="№ извещения" 
                                                value={gd.purchase_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="№ лота" 
                                                value={gd.lot_number} 
                                                icon={<Hash className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                        </div>
                                        <div>
                                            <DataRow 
                                                label="ИНН контрагента" 
                                                value={application.contractor_inn || gd.contractor_inn} 
                                                icon={<Building2 className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="ИНН заказчика" 
                                                value={gd.customer_inn} 
                                                icon={<Building2 className="h-3.5 w-3.5" />}
                                                mono 
                                            />
                                            <DataRow 
                                                label="НМЦ" 
                                                value={formatCurrency(gd.nmc)} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Сумма финансирования" 
                                                value={formatCurrency(gd.financing_amount)} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                                highlight
                                            />
                                            <DataRow 
                                                label="Объём отгрузки" 
                                                value={formatCurrency(gd.shipment_volume)} 
                                                icon={<Truck className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Дата финансирования" 
                                                value={formatDate(gd.financing_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Отсрочка (дней)" 
                                                value={gd.payment_delay} 
                                                icon={<Clock className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                    </div>
                                </DataCard>
                            )}

                            {/* Лизинг */}
                            {isLeasing && (
                                <DataCard 
                                    title="Параметры лизинга" 
                                    icon={<Truck className="h-4 w-4" />}
                                    accent
                                >
                                    <DataRow 
                                        label="Предмет лизинга" 
                                        value={gd.leasing_credit_type || application.credit_sub_type} 
                                        icon={<Truck className="h-3.5 w-3.5" />}
                                    />
                                    <DataRow 
                                        label="Сумма лизинга" 
                                        value={formatCurrency(gd.leasing_amount)} 
                                        icon={<Banknote className="h-3.5 w-3.5" />}
                                        highlight
                                    />
                                    <DataRow 
                                        label="Дата окончания" 
                                        value={formatDate(gd.leasing_end_date)} 
                                        icon={<Calendar className="h-3.5 w-3.5" />}
                                    />
                                </DataCard>
                            )}

                            {/* Страхование */}
                            {isInsurance && (
                                <DataCard 
                                    title="Параметры страхования" 
                                    icon={<Shield className="h-4 w-4" />}
                                    accent
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div>
                                            <DataRow 
                                                label="Категория" 
                                                value={INSURANCE_CATEGORY_LABELS[application.insurance_category || gd.insurance_category || ""] || application.insurance_category || gd.insurance_category} 
                                                icon={<Shield className="h-3.5 w-3.5" />}
                                                badge
                                            />
                                            <DataRow 
                                                label="Продукт" 
                                                value={INSURANCE_PRODUCT_LABELS[application.insurance_product_type || gd.insurance_product_type || ""] || application.insurance_product_type || gd.insurance_product_type} 
                                                icon={<FileText className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                        <div>
                                            <DataRow 
                                                label="Страховая сумма" 
                                                value={formatCurrency(gd.insurance_amount)} 
                                                icon={<Banknote className="h-3.5 w-3.5" />}
                                                highlight
                                            />
                                            <DataRow 
                                                label="Срок (мес.)" 
                                                value={gd.insurance_term_months} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                    </div>
                                </DataCard>
                            )}

                            {/* Корпоративный/Тендерный кредит */}
                            {isCredit && (
                                <DataCard 
                                    title="Параметры кредита" 
                                    icon={<CreditCard className="h-4 w-4" />}
                                    accent
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                        <div>
                                            <DataRow 
                                                label="Тип кредита" 
                                                value={CREDIT_SUB_TYPE_LABELS[application.credit_sub_type || ""] || gd.credit_type || application.credit_sub_type} 
                                                icon={<CreditCard className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Обеспечение" 
                                                value={application.pledge_description} 
                                                icon={<Shield className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                        <div>
                                            <DataRow 
                                                label="Кредит с" 
                                                value={formatDate(gd.credit_start_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                            <DataRow 
                                                label="Кредит по" 
                                                value={formatDate(gd.credit_end_date)} 
                                                icon={<Calendar className="h-3.5 w-3.5" />}
                                            />
                                        </div>
                                    </div>
                                </DataCard>
                            )}

                            {/* ВЭД */}
                            {isVED && (
                                <DataCard 
                                    title="Параметры ВЭД" 
                                    icon={<Truck className="h-4 w-4" />}
                                    accent
                                >
                                    <DataRow 
                                        label="Валюта" 
                                        value={application.ved_currency} 
                                        icon={<Banknote className="h-3.5 w-3.5" />}
                                    />
                                    <DataRow 
                                        label="Страна" 
                                        value={application.ved_country} 
                                        icon={<MapPin className="h-3.5 w-3.5" />}
                                    />
                                </DataCard>
                            )}

                            {/* РКО / Спецсчёт */}
                            {isRKO && (
                                <DataCard 
                                    title="Параметры счёта" 
                                    icon={<Landmark className="h-4 w-4" />}
                                    accent
                                >
                                    <DataRow 
                                        label="Тип счёта" 
                                        value={ACCOUNT_TYPE_LABELS[application.account_type || ""]} 
                                        icon={<Landmark className="h-3.5 w-3.5" />}
                                        badge
                                    />
                                </DataCard>
                            )}

                            {/* Тендерное сопровождение */}
                            {isTenderSupport && (
                                <DataCard 
                                    title="Параметры тендерного сопровождения" 
                                    icon={<FileCheck className="h-4 w-4" />}
                                    accent
                                >
                                    <DataRow 
                                        label="Тип" 
                                        value={TENDER_SUPPORT_TYPE_LABELS[application.tender_support_type || ""]} 
                                        icon={<FileCheck className="h-3.5 w-3.5" />}
                                    />
                                    <DataRow 
                                        label="Категория закупок" 
                                        value={PURCHASE_CATEGORY_LABELS[application.purchase_category || ""]} 
                                        icon={<Scale className="h-3.5 w-3.5" />}
                                        badge
                                    />
                                    <DataRow 
                                        label="Отрасль" 
                                        value={application.industry} 
                                        icon={<Building2 className="h-3.5 w-3.5" />}
                                    />
                                </DataCard>
                            )}

                            {/* Tender Info — if available */}
                            {(application.tender_number || application.tender_platform) && (
                                <DataCard 
                                    title="Информация о тендере" 
                                    icon={<FileCheck className="h-4 w-4" />}
                                >
                                    <DataRow 
                                        label="Номер тендера" 
                                        value={application.tender_number} 
                                        icon={<Hash className="h-3.5 w-3.5" />}
                                        mono 
                                    />
                                    <DataRow 
                                        label="Площадка" 
                                        value={application.tender_platform} 
                                        icon={<ExternalLink className="h-3.5 w-3.5" />}
                                    />
                                    <DataRow 
                                        label="Дедлайн" 
                                        value={formatDate(application.tender_deadline)} 
                                        icon={<Calendar className="h-3.5 w-3.5" />}
                                    />
                                </DataCard>
                            )}
                        </div>

                        {/* Right Column — Meta, Notes, Bank */}
                        <div className="space-y-6">
                            {/* Dates Card */}
                            <DataCard title="Даты и мета" icon={<Calendar className="h-4 w-4" />}>
                                <DataRow label="Создано" value={formatDate(application.created_at)} icon={<Calendar className="h-3.5 w-3.5" />} />
                                <DataRow label="Обновлено" value={formatDate(application.updated_at)} icon={<Clock className="h-3.5 w-3.5" />} />
                                <DataRow label="Отправлено" value={formatDate(application.submitted_at)} icon={<ChevronRight className="h-3.5 w-3.5" />} />
                                <DataRow label="Создатель" value={application.created_by_email} icon={<Users className="h-3.5 w-3.5" />} />
                            </DataCard>

                            {/* Bank Integration */}
                            {(application.external_id || application.bank_status || application.commission_data || application.signing_url) && (
                                <DataCard title="Банковская интеграция" icon={<Landmark className="h-4 w-4" />}>
                                    <DataRow label="External ID" value={application.external_id} mono icon={<Hash className="h-3.5 w-3.5" />} />
                                    <DataRow label="Статус банка" value={application.bank_status} icon={<Eye className="h-3.5 w-3.5" />} />
                                    {application.commission_data && (
                                        <>
                                            <Separator className="my-3" />
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Комиссии</p>
                                            <DataRow label="Всего" value={formatCurrency(application.commission_data.total)} highlight />
                                            <DataRow label="Банк" value={formatCurrency(application.commission_data.bank)} />
                                            <DataRow label="Агент" value={formatCurrency(application.commission_data.agent)} />
                                        </>
                                    )}
                                    {application.signing_url && (
                                        <div className="mt-4">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => window.open(application.signing_url!, '_blank')} 
                                                className="w-full"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />Подписать в банке
                                            </Button>
                                        </div>
                                    )}
                                </DataCard>
                            )}

                            {/* Notes */}
                            <DataCard 
                                title="Заметки" 
                                icon={<FileText className="h-4 w-4" />}
                                headerAction={
                                    !isEditingNotes && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => { setEditedNotes(application.notes || ""); setIsEditingNotes(true) }} 
                                            className="h-7 text-xs"
                                        >
                                            <Edit className="h-3 w-3 mr-1" />Редактировать
                                        </Button>
                                    )
                                }
                            >
                                {isEditingNotes ? (
                                    <div className="space-y-3">
                                        <Textarea 
                                            value={editedNotes} 
                                            onChange={(e) => setEditedNotes(e.target.value)} 
                                            rows={5} 
                                            placeholder="Добавьте заметки..."
                                            className="resize-none bg-slate-800/30"
                                        />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                                                {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                                Сохранить
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}>Отмена</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all overflow-wrap-anywhere">
                                        {application.notes || "Нет заметок"}
                                    </p>
                                )}
                            </DataCard>
                        </div>
                    </div>
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: Company */}
                {/* ============================================ */}
                <TabsContent value="company" className="mt-0">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <DataCard title="Основные данные" icon={<Building2 className="h-4 w-4" />} accent>
                            <DataRow label="Название" value={application.company_name} icon={<Building2 className="h-3.5 w-3.5" />} />
                            <DataRow label="ИНН" value={application.company_inn} mono icon={<Hash className="h-3.5 w-3.5" />} />
                            {application.company_data && (
                                <>
                                    <DataRow label="КПП" value={application.company_data.kpp} mono />
                                    <DataRow label="ОГРН" value={application.company_data.ogrn} mono />
                                    <Separator className="my-3" />
                                    <DataRow label="Руководитель" value={application.company_data.director_name} icon={<Users className="h-3.5 w-3.5" />} />
                                    <DataRow label="Должность" value={application.company_data.director_position} />
                                </>
                            )}
                        </DataCard>

                        {application.company_data && (
                            <>
                                <DataCard title="Контактная информация" icon={<Phone className="h-4 w-4" />}>
                                    <DataRow label="Контактное лицо" value={application.company_data.contact_person} icon={<Users className="h-3.5 w-3.5" />} />
                                    <DataRow label="Телефон" value={application.company_data.contact_phone} icon={<Phone className="h-3.5 w-3.5" />} />
                                    <DataRow label="Email" value={application.company_data.contact_email} icon={<Mail className="h-3.5 w-3.5" />} />
                                </DataCard>

                                <DataCard title="Адреса" icon={<MapPin className="h-4 w-4" />}>
                                    {application.company_data.legal_address ? (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />Юридический адрес
                                            </p>
                                            <p className="text-sm">{application.company_data.legal_address}</p>
                                        </div>
                                    ) : (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />Юридический адрес
                                            </p>
                                            <p className="text-sm text-muted-foreground">Не указан</p>
                                        </div>
                                    )}
                                    {application.company_data.actual_address ? (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />Фактический адрес
                                            </p>
                                            <p className="text-sm">{application.company_data.actual_address}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />Фактический адрес
                                            </p>
                                            <p className="text-sm text-muted-foreground">Совпадает с юридическим</p>
                                        </div>
                                    )}
                                </DataCard>

                                <DataCard title="Банковские реквизиты" icon={<Landmark className="h-4 w-4" />}>
                                    <DataRow label="Банк" value={application.company_data.bank_name} icon={<Landmark className="h-3.5 w-3.5" />} />
                                    <DataRow label="БИК" value={application.company_data.bank_bic} mono />
                                    <DataRow label="Р/С" value={application.company_data.bank_account} mono />
                                    <DataRow label="К/С" value={application.company_data.bank_corr_account} mono />
                                </DataCard>

                                {/* ============================================ */}
                                {/* Phase 2: Director Passport Data */}
                                {/* ============================================ */}
                                {(application.company_data.passport_series || application.company_data.passport_number) && (
                                    <DataCard title="Паспортные данные руководителя" icon={<Fingerprint className="h-4 w-4" />}>
                                        <DataRow 
                                            label="Серия и номер" 
                                            value={`${application.company_data.passport_series || ''} ${application.company_data.passport_number || ''}`.trim() || '—'} 
                                            mono 
                                        />
                                        <DataRow label="Кем выдан" value={application.company_data.passport_issued_by} />
                                        <DataRow label="Дата выдачи" value={application.company_data.passport_date} />
                                        <DataRow label="Код подразделения" value={application.company_data.passport_code} mono />
                                    </DataCard>
                                )}

                                {/* Phase 2: Extended Director Info */}
                                {(application.company_data.director_birth_date || application.company_data.director_phone || application.company_data.director_email) && (
                                    <DataCard title="Дополнительные данные руководителя" icon={<UserCheck className="h-4 w-4" />}>
                                        <DataRow label="Дата рождения" value={application.company_data.director_birth_date} icon={<Calendar className="h-3.5 w-3.5" />} />
                                        <DataRow label="Место рождения" value={application.company_data.director_birth_place} />
                                        <DataRow label="Телефон" value={application.company_data.director_phone} icon={<Phone className="h-3.5 w-3.5" />} />
                                        <DataRow label="Email" value={application.company_data.director_email} icon={<Mail className="h-3.5 w-3.5" />} />
                                        {application.company_data.director_registration_address && (
                                            <div className="mt-3">
                                                <p className="text-xs text-muted-foreground mb-1">Адрес регистрации</p>
                                                <p className="text-sm">{application.company_data.director_registration_address}</p>
                                            </div>
                                        )}
                                    </DataCard>
                                )}

                                {/* Phase 2: Tax & Registration Info */}
                                {(application.company_data.tax_system || application.company_data.registration_date || application.company_data.authorized_capital_paid) && (
                                    <DataCard title="Налоги и регистрация" icon={<Receipt className="h-4 w-4" />}>
                                        <DataRow label="Система налогообложения" value={
                                            application.company_data.tax_system === 'osn' ? 'ОСН' :
                                            application.company_data.tax_system === 'usn_income' ? 'УСН (доходы)' :
                                            application.company_data.tax_system === 'usn_income_expense' ? 'УСН (доходы-расходы)' :
                                            application.company_data.tax_system === 'esn' ? 'ЕСН' :
                                            application.company_data.tax_system === 'patent' ? 'Патент' :
                                            application.company_data.tax_system
                                        } />
                                        <DataRow label="Ставка НДС" value={
                                            application.company_data.vat_rate === 'none' ? 'Без НДС' :
                                            application.company_data.vat_rate ? `${application.company_data.vat_rate}%` : '—'
                                        } />
                                        <DataRow label="Дата регистрации" value={application.company_data.registration_date} icon={<Calendar className="h-3.5 w-3.5" />} />
                                        <Separator className="my-3" />
                                        <DataRow label="Уставный капитал (заявл.)" value={
                                            application.company_data.authorized_capital_declared 
                                                ? `${parseFloat(application.company_data.authorized_capital_declared).toLocaleString('ru-RU')} ₽` 
                                                : '—'
                                        } icon={<CircleDollarSign className="h-3.5 w-3.5" />} />
                                        <DataRow label="Уставный капитал (оплач.)" value={
                                            application.company_data.authorized_capital_paid 
                                                ? `${parseFloat(application.company_data.authorized_capital_paid).toLocaleString('ru-RU')} ₽` 
                                                : '—'
                                        } />
                                        <DataRow label="Численность сотрудников" value={application.company_data.employee_count?.toString()} icon={<Users className="h-3.5 w-3.5" />} />
                                        {application.company_data.website && (
                                            <div className="flex items-center gap-2 py-2 border-b border-border/20 last:border-0">
                                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground min-w-[120px]">Сайт</span>
                                                <a href={application.company_data.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3CE8D1] hover:underline flex items-center gap-1 ml-auto">
                                                    {application.company_data.website} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </DataCard>
                                )}

                                {/* Phase 2: Signatory & MCHD */}
                                {(application.company_data.signatory_basis || application.company_data.is_mchd) && (
                                    <DataCard title="Подписант" icon={<FileSignature className="h-4 w-4" />}>
                                        <DataRow label="Основание полномочий" value={
                                            application.company_data.signatory_basis === 'charter' ? 'Устав' :
                                            application.company_data.signatory_basis === 'power_of_attorney' ? 'Доверенность' :
                                            application.company_data.signatory_basis
                                        } />
                                        {application.company_data.is_mchd && (
                                            <>
                                                <Separator className="my-3" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BadgeCheck className="h-4 w-4 text-[#3CE8D1]" />
                                                    <span className="text-sm font-medium">Машиночитаемая доверенность (МЧД)</span>
                                                </div>
                                                <DataRow label="Номер МЧД" value={application.company_data.mchd_number} mono />
                                                <DataRow label="Дата выдачи" value={application.company_data.mchd_issue_date} />
                                                <DataRow label="Действует до" value={application.company_data.mchd_expiry_date} />
                                                <DataRow label="ИНН доверителя" value={application.company_data.mchd_principal_inn} mono />
                                                {application.company_data.mchd_file && (
                                                    <div className="mt-3 pt-3 border-t border-border/20">
                                                        <a
                                                            href={application.company_data.mchd_file}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-sm text-[#3CE8D1] hover:underline"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Скачать файл МЧД
                                                        </a>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </DataCard>
                                )}

                                {/* Phase 2: Enhanced Founders (Physical Persons) with Passport */}
                                {application.company_data.founders_data && application.company_data.founders_data.length > 0 && (
                                    <DataCard title="Учредители (физ. лица)" icon={<Users className="h-4 w-4" />} className="xl:col-span-2">
                                        <div className="space-y-4">
                                            {application.company_data.founders_data.map((founder, idx) => (
                                                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium">{founder.full_name || (founder as {name?: string}).name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {founder.inn && <span className="font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">ИНН: {founder.inn}</span>}
                                                            {founder.share_relative != null && <Badge variant="outline">Доля: {founder.share_relative}%</Badge>}
                                                        </div>
                                                    </div>
                                                    {/* Founder Passport Info */}
                                                    {founder.document && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 mt-2 pt-2 border-t border-border/20">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Серия/Номер</p>
                                                                <p className="text-xs font-mono">{founder.document.series} {founder.document.number}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Дата выдачи</p>
                                                                <p className="text-xs">{founder.document.issued_at}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <p className="text-xs text-muted-foreground">Кем выдан</p>
                                                                <p className="text-xs truncate">{founder.document.authority_name}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Additional founder info */}
                                                    {(founder.birth_date || founder.birth_place) && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/20">
                                                            {founder.birth_date && (
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Дата рождения</p>
                                                                    <p className="text-xs">{founder.birth_date}</p>
                                                                </div>
                                                            )}
                                                            {founder.birth_place && (
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Место рождения</p>
                                                                    <p className="text-xs">{founder.birth_place}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: Legal Founders (Companies) */}
                                {application.company_data.legal_founders_data && application.company_data.legal_founders_data.length > 0 && (
                                    <DataCard title="Учредители (юр. лица)" icon={<Building2 className="h-4 w-4" />} className="xl:col-span-2">
                                        <div className="space-y-3">
                                            {application.company_data.legal_founders_data.map((legalFounder, idx) => (
                                                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium">{legalFounder.name}</span>
                                                        {legalFounder.share_relative != null && <Badge variant="outline">Доля: {legalFounder.share_relative}%</Badge>}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 text-xs">
                                                        {legalFounder.inn && (
                                                            <div>
                                                                <p className="text-muted-foreground">ИНН</p>
                                                                <p className="font-mono">{legalFounder.inn}</p>
                                                            </div>
                                                        )}
                                                        {legalFounder.ogrn && (
                                                            <div>
                                                                <p className="text-muted-foreground">ОГРН</p>
                                                                <p className="font-mono">{legalFounder.ogrn}</p>
                                                            </div>
                                                        )}
                                                        {legalFounder.director_name && (
                                                            <div className="col-span-2">
                                                                <p className="text-muted-foreground">Руководитель</p>
                                                                <p>{legalFounder.director_position || 'Генеральный директор'}: {legalFounder.director_name}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: Leadership */}
                                {application.company_data.leadership_data && application.company_data.leadership_data.length > 0 && (
                                    <DataCard title="Руководство компании" icon={<Briefcase className="h-4 w-4" />} className="xl:col-span-2">
                                        <div className="space-y-3">
                                            {application.company_data.leadership_data.map((leader, idx) => (
                                                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <span className="text-sm font-medium">{leader.full_name}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">({leader.position})</span>
                                                        </div>
                                                        {leader.share_percent != null && <Badge variant="outline">Доля: {leader.share_percent}%</Badge>}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2 text-xs">
                                                        {leader.email && (
                                                            <div>
                                                                <p className="text-muted-foreground">Email</p>
                                                                <p>{leader.email}</p>
                                                            </div>
                                                        )}
                                                        {leader.phone && (
                                                            <div>
                                                                <p className="text-muted-foreground">Телефон</p>
                                                                <p>{leader.phone}</p>
                                                            </div>
                                                        )}
                                                        {leader.passport && (
                                                            <div className="col-span-2">
                                                                <p className="text-muted-foreground">Паспорт</p>
                                                                <p className="font-mono">{leader.passport.series} {leader.passport.number}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: Activities (OKVED) */}
                                <DataCard title="Виды деятельности (ОКВЭД)" icon={<Briefcase className="h-4 w-4" />}>
                                    {application.company_data.activities_data && application.company_data.activities_data.length > 0 ? (
                                        <div className="space-y-2">
                                            {application.company_data.activities_data.map((activity, idx) => (
                                                <div key={idx} className="flex items-start gap-2 py-1.5">
                                                    <span className="font-mono text-xs bg-slate-700/50 px-1.5 py-0.5 rounded shrink-0">{activity.code}</span>
                                                    <span className="text-sm">{activity.name}</span>
                                                    {activity.is_primary && <Badge variant="default" className="shrink-0 ml-auto">Основной</Badge>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Данные ОКВЭД не заполнены</p>
                                    )}
                                </DataCard>

                                {/* Phase 2: Licenses & SRO */}
                                {application.company_data.licenses_data && application.company_data.licenses_data.length > 0 && (
                                    <DataCard title="Лицензии и СРО" icon={<Award className="h-4 w-4" />}>
                                        <div className="space-y-3">
                                            {application.company_data.licenses_data.map((license, idx) => (
                                                <div key={idx} className="p-2 bg-slate-800/30 rounded border border-border/30">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">{license.name}</span>
                                                        {license.type && <Badge variant="outline">{license.type}</Badge>}
                                                    </div>
                                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                                        {license.number && <span>№ {license.number}</span>}
                                                        {license.issued_date && <span>от {license.issued_date}</span>}
                                                        {license.valid_until && <span>до {license.valid_until}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: ETP Accounts */}
                                {application.company_data.etp_accounts_data && application.company_data.etp_accounts_data.length > 0 && (
                                    <DataCard title="Аккаунты ЭТП" icon={<Globe className="h-4 w-4" />}>
                                        <div className="space-y-2">
                                            {application.company_data.etp_accounts_data.map((etp, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                                    <span className="text-sm">{etp.platform}</span>
                                                    {etp.account && <span className="font-mono text-xs bg-slate-700/50 px-2 py-0.5 rounded">{etp.account}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: Contact Persons */}
                                {application.company_data.contact_persons_data && application.company_data.contact_persons_data.length > 0 && (
                                    <DataCard title="Контактные лица" icon={<Users className="h-4 w-4" />}>
                                        <div className="space-y-3">
                                            {application.company_data.contact_persons_data.map((person, idx) => (
                                                <div key={idx} className="p-2 bg-slate-800/30 rounded border border-border/30">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium">
                                                            {[person.last_name, person.first_name, person.patronymic].filter(Boolean).join(' ')}
                                                        </span>
                                                        {person.position && <span className="text-xs text-muted-foreground">{person.position}</span>}
                                                    </div>
                                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                                        {person.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</span>}
                                                        {person.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{person.email}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}

                                {/* Phase 2: Additional Bank Accounts */}
                                {application.company_data.bank_accounts_data && application.company_data.bank_accounts_data.length > 1 && (
                                    <DataCard title="Дополнительные банковские счета" icon={<Landmark className="h-4 w-4" />} className="xl:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {application.company_data.bank_accounts_data.slice(1).map((account, idx) => (
                                                <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-border/30">
                                                    <p className="text-sm font-medium mb-2">{account.bank_name}</p>
                                                    <div className="space-y-1 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">БИК:</span>
                                                            <span className="font-mono">{account.bic}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Р/С:</span>
                                                            <span className="font-mono">{account.account}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </DataCard>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: Documents */}
                {/* ============================================ */}
                <TabsContent value="documents" className="mt-0">
                    {documentsCount > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {application.documents?.map((doc) => (
                                <Card key={doc.id} className="border-border/40 bg-[#0a1628]/50 hover:border-[#3CE8D1]/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#3CE8D1]/10 text-[#3CE8D1] shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{doc.type_display}</p>
                                                </div>
                                            </div>
                                            {doc.file_url && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="shrink-0 hover:bg-[#3CE8D1]/10 hover:text-[#3CE8D1]" 
                                                    onClick={() => window.open(doc.file_url, '_blank')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/10 mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Нет документов</h3>
                            <p className="text-muted-foreground">К этой заявке пока не прикреплены документы</p>
                        </div>
                    )}
                </TabsContent>

                {/* ============================================ */}
                {/* TAB: Chat */}
                {/* ============================================ */}
                <TabsContent value="chat" className="mt-0">
                    <Card className="border-border/40 bg-[#0a1628]/50 overflow-hidden">
                        <CardContent className="p-0 overflow-hidden">
                            <ApplicationChat applicationId={parseInt(applicationId)} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ============================================ */}
            {/* Dialogs */}
            {/* ============================================ */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Одобрить заявку?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Заявка #{application.id} будет переведена в статус «Одобрено».
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} className="bg-emerald-500 hover:bg-emerald-600">
                            <CheckCircle className="h-4 w-4 mr-1.5" />Одобрить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Заявка #{application.id} будет переведена в статус «Отклонено».
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder="Причина отклонения (опционально)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="mt-4"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-rose-500 hover:bg-rose-600">
                            <XCircle className="h-4 w-4 mr-1.5" />Отклонить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Запросить информацию</AlertDialogTitle>
                        <AlertDialogDescription>
                            Клиент получит уведомление о необходимости предоставить дополнительную информацию.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        placeholder="Какая информация нужна?..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        className="mt-4"
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRequestInfo}>
                            <MessageSquare className="h-4 w-4 mr-1.5" />Отправить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

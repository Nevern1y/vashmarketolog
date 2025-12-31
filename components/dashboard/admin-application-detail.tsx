"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
    ArrowLeft,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
    RefreshCw,
    Building2,
    Globe,
    Truck,
    Shield,
    CreditCard,
    Briefcase,
    Gavel,
    Banknote,
    Calendar,
    Hash,
    User,
    Check,
    Send,
    MessageSquarePlus,
    History,
    Download,
    Eye,
    AlertTriangle,
    CheckSquare,
    Square,
    ChevronRight,
    ExternalLink,
    Phone,
    Mail,
} from "lucide-react"
import { useApplication } from "@/hooks/use-applications"
import { getStatusConfig, getStepFromStatus, STEPPER_LABELS } from "@/lib/status-mapping"
import { toast } from "sonner"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
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

interface AdminApplicationDetailProps {
    applicationId: string
    onBack: () => void
}

// ============================================
// Product Configuration (per ТЗ 10 files)
// ============================================

const PRODUCT_ICONS: Record<string, typeof Gavel> = {
    bank_guarantee: Gavel,
    tender_loan: Banknote,
    contract_loan: Banknote,
    corporate_credit: Banknote,
    factoring: FileText,
    ved: Globe,
    leasing: Truck,
    insurance: Shield,
    special_account: CreditCard,
    rko: Building2,
    tender_support: Briefcase,
}

const PRODUCT_LABELS: Record<string, string> = {
    bank_guarantee: 'Банковская гарантия',
    tender_loan: 'Тендерный кредит',
    contract_loan: 'Кредит на исполнение контракта',
    corporate_credit: 'Корпоративный кредит',
    factoring: 'Факторинг',
    ved: 'ВЭД (Внешнеэкономическая деятельность)',
    leasing: 'Лизинг',
    insurance: 'Страхование',
    special_account: 'Спецсчет',
    rko: 'РКО (Расчётно-кассовое обслуживание)',
    tender_support: 'Тендерное сопровождение',
}

// Guarantee types per ТЗ
const GUARANTEE_TYPE_LABELS: Record<string, string> = {
    application_security: 'Обеспечение заявки',
    contract_execution: 'Исполнение контракта',
    advance_return: 'Возврат аванса',
    warranty_obligations: 'Гарантийные обязательства',
    payment_guarantee: 'Гарантии оплаты товара',
    customs_guarantee: 'Таможенные гарантии',
    vat_refund: 'На возмещение НДС',
}

// Tender law types per ТЗ
const TENDER_LAW_LABELS: Record<string, string> = {
    '44_fz': '44-ФЗ',
    '223_fz': '223-ФЗ',
    '615_pp': '615-ПП',
    '185_fz': '185-ФЗ',
    'kbg': 'КБГ',
    'commercial': 'Коммерческий',
}

// Insurance types per ТЗ
const INSURANCE_TYPE_LABELS: Record<string, string> = {
    personnel: 'Персонал',
    transport: 'Транспорт',
    property: 'Имущество',
    liability: 'Ответственность',
}

// Credit sub-types per ТЗ
const CREDIT_SUBTYPE_LABELS: Record<string, string> = {
    one_time_credit: 'Разовый кредит',
    non_revolving_line: 'Невозобновляемая КЛ',
    revolving_line: 'Возобновляемая КЛ',
    overdraft: 'Овердрафт',
    contract_execution: 'Кредит на исполнение контракта',
}

// Factoring types per ТЗ
const FACTORING_TYPE_LABELS: Record<string, string> = {
    classic: 'Классический факторинг',
    closed: 'Закрытый факторинг',
    purchase: 'Закупочный факторинг',
}

// Mock timeline events
const generateTimelineEvents = (app: any) => {
    const events = [
        {
            id: 1,
            type: 'created',
            title: 'Заявка создана',
            description: `Агент: ${app.created_by_name || app.created_by_email || 'Неизвестен'}`,
            timestamp: app.created_at,
            icon: FileText,
            color: 'text-[#4F7DF3]',
        },
    ]

    if (app.documents?.length > 0) {
        events.push({
            id: 2,
            type: 'document',
            title: `Загружено документов: ${app.documents.length}`,
            description: 'Документы ожидают проверки',
            timestamp: app.updated_at || app.created_at,
            icon: FileText,
            color: 'text-[#FFD93D]',
        })
    }

    if (app.external_id) {
        events.push({
            id: 3,
            type: 'sent',
            title: 'Отправлено в банк',
            description: `Ticket ID: ${app.external_id}`,
            timestamp: app.updated_at || app.created_at,
            icon: Send,
            color: 'text-[#3CE8D1]',
        })
    }

    if (app.status === 'approved' || app.status === 'won') {
        events.push({
            id: 4,
            type: 'approved',
            title: 'Заявка одобрена',
            description: 'Гарантия выпущена',
            timestamp: app.updated_at || app.created_at,
            icon: CheckCircle2,
            color: 'text-emerald-400',
        })
    }

    if (app.status === 'rejected' || app.status === 'lost') {
        events.push({
            id: 4,
            type: 'rejected',
            title: 'Заявка отклонена',
            description: app.rejection_reason || 'Причина не указана',
            timestamp: app.updated_at || app.created_at,
            icon: XCircle,
            color: 'text-[#E03E9D]',
        })
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// ============================================
// Helper Functions
// ============================================

const formatCurrency = (amount: string | number | null | undefined) => {
    if (!amount) return '—'
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount)
}

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    } catch {
        return dateStr
    }
}

const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return dateStr
    }
}

// Calculate days since creation
const getDaysSinceCreation = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================
// Component
// ============================================

export function AdminApplicationDetail({ applicationId, onBack }: AdminApplicationDetailProps) {
    const { application, isLoading, error, refetch } = useApplication(applicationId)

    // UI State
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [requestInfoMessage, setRequestInfoMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get goscontract_data from application
    const goscontractData = (application as any)?.goscontract_data || {}

    // Status helpers
    const currentStep = application ? getStepFromStatus(application.status) : 0
    const statusConfig = application ? getStatusConfig(application.status) : null
    const ProductIcon = application ? PRODUCT_ICONS[application.product_type] || FileText : FileText

    // Timeline events
    const timelineEvents = application ? generateTimelineEvents(application) : []

    // Days in work
    const daysInWork = application ? getDaysSinceCreation(application.created_at) : 0

    // ============================================
    // Action Handlers
    // ============================================

    const handleSendToBank = async () => {
        setIsSubmitting(true)
        try {
            // API call would go here
            toast.success('Заявка отправлена в банк')
            refetch()
        } catch (error) {
            toast.error('Ошибка отправки в банк')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRequestInfo = async () => {
        if (!requestInfoMessage.trim()) {
            toast.error('Укажите, какая информация требуется')
            return
        }
        setIsSubmitting(true)
        try {
            // API call would go here
            toast.success('Запрос документов отправлен агенту')
            setShowRequestInfoDialog(false)
            setRequestInfoMessage('')
            refetch()
        } catch (error) {
            toast.error('Ошибка отправки запроса')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Укажите причину отклонения')
            return
        }
        setIsSubmitting(true)
        try {
            // API call would go here
            toast.success('Заявка отклонена')
            setShowRejectDialog(false)
            setRejectReason('')
            refetch()
        } catch (error) {
            toast.error('Ошибка отклонения заявки')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============================================
    // Product-Specific Block Renderers (per ТЗ)
    // ============================================

    const renderBankGuaranteeBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                Параметры банковской гарантии
            </h4>

            {/* Checkboxes per ТЗ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <CheckboxItem checked={goscontractData.has_prepayment} label="Наличие аванса" />
                <CheckboxItem checked={goscontractData.is_recollateralization} label="Переобеспечение" />
                <CheckboxItem checked={goscontractData.is_close_auction} label="Закрытый аукцион" />
                <CheckboxItem checked={goscontractData.is_sole_supplier} label="Единств. поставщик" />
                <CheckboxItem checked={goscontractData.without_eis} label="Без ЕИС" />
                <CheckboxItem checked={goscontractData.auction_not_held} label="Торги не проведены" />
                <CheckboxItem checked={goscontractData.has_customer_template} label="Шаблон заказчика" />
                <CheckboxItem checked={goscontractData.need_credit} label="Нужен кредит" />
            </div>

            {/* Key fields per ТЗ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <InfoField label="Тип гарантии" value={GUARANTEE_TYPE_LABELS[(application as any)?.guarantee_type] || (application as any)?.guarantee_type} />
                <InfoField label="Закон торгов" value={TENDER_LAW_LABELS[(application as any)?.tender_law] || (application as any)?.tender_law} />
                <InfoField label="№ закупки" value={goscontractData.purchase_number} />
                <InfoField label="ИНН Заказчика" value={goscontractData.beneficiary_inn} />
                <InfoField label="Начальная цена" value={formatCurrency(goscontractData.initial_price)} />
                <InfoField label="Предложенная цена" value={formatCurrency(goscontractData.offered_price)} />
                <InfoField label="Исп. контрактов" value={goscontractData.executed_contracts_count} />
                <InfoField label="Предмет закупки" value={goscontractData.subject} />
            </div>
        </div>
    )

    const renderVEDBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Параметры ВЭД
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoField label="Сумма платежа" value={formatCurrency(application?.amount)} />
                <InfoField label="Валюта" value={goscontractData.currency || 'RUB'} />
                <InfoField label="Страна платежа" value={goscontractData.country} />
            </div>
        </div>
    )

    const renderLeasingBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Параметры лизинга
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoField label="Предмет лизинга" value={goscontractData.equipment_type} />
                <InfoField label="Тип кредита" value={CREDIT_SUBTYPE_LABELS[(application as any)?.credit_sub_type] || (application as any)?.credit_sub_type} />
                <InfoField label="Сумма кредита" value={formatCurrency(application?.amount)} />
                <InfoField label="Срок" value={application?.term_months ? `${application.term_months} мес.` : '—'} />
            </div>
        </div>
    )

    const renderFactoringBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Параметры факторинга
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoField label="ИНН Контрагента" value={goscontractData.contractor_inn} />
                <InfoField label="Тип факторинга" value={FACTORING_TYPE_LABELS[(application as any)?.factoring_type] || (application as any)?.factoring_type} />
                <InfoField label="Сумма финансирования" value={formatCurrency(application?.amount)} />
                <InfoField label="Срок" value={application?.term_months ? `${application.term_months} мес.` : '—'} />
            </div>
        </div>
    )

    const renderInsuranceBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Параметры страхования
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoField label="Вид страхования" value={INSURANCE_TYPE_LABELS[(application as any)?.insurance_type] || (application as any)?.insurance_type} />
                <InfoField label="Страховой продукт" value={(application as any)?.insurance_product} />
                <InfoField label="Страховая сумма" value={formatCurrency(application?.amount)} />
                <InfoField label="Срок договора" value={application?.term_months ? `${application.term_months} мес.` : '—'} />
            </div>
        </div>
    )

    const renderContractLoanBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Параметры кредита на исполнение
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                <CheckboxItem checked={goscontractData.has_prepayment} label="Наличие аванса" />
                <CheckboxItem checked={goscontractData.is_close_auction} label="Закрытый аукцион" />
                <CheckboxItem checked={goscontractData.auction_not_held} label="Торги не проведены" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoField label="№ закупки" value={goscontractData.purchase_number} />
                <InfoField label="Закон торгов" value={TENDER_LAW_LABELS[(application as any)?.tender_law] || (application as any)?.tender_law} />
                <InfoField label="ИНН Заказчика" value={goscontractData.beneficiary_inn} />
                <InfoField label="Сумма кредита" value={formatCurrency(application?.amount)} />
            </div>
        </div>
    )

    const renderRKOSpecialAccountBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Параметры РКО/Спецсчета
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <InfoField label="Тип" value={(application?.product_type as string) === 'rko' ? 'РКО' : 'Спецсчет'} />
            </div>
        </div>
    )

    const renderTenderSupportBlock = () => (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Параметры тендерного сопровождения
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <InfoField label="Тип сопровождения" value={(application as any)?.tender_support_type} />
            </div>
        </div>
    )

    const renderProductSpecificBlock = () => {
        if (!application) return null
        const productType = application.product_type as string

        switch (productType) {
            case 'bank_guarantee': return renderBankGuaranteeBlock()
            case 'ved': return renderVEDBlock()
            case 'leasing': return renderLeasingBlock()
            case 'factoring': return renderFactoringBlock()
            case 'insurance': return renderInsuranceBlock()
            case 'contract_loan': return renderContractLoanBlock()
            case 'special_account':
            case 'rko': return renderRKOSpecialAccountBlock()
            case 'tender_support': return renderTenderSupportBlock()
            case 'tender_loan':
            case 'corporate_credit': return renderContractLoanBlock()
            default: return null
        }
    }

    // ============================================
    // Loading / Error States
    // ============================================

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                <p className="text-muted-foreground">Загрузка заявки...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-600">{error}</p>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Попробовать снова
                </Button>
            </div>
        )
    }

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">Заявка не найдена</p>
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                </Button>
            </div>
        )
    }

    // ============================================
    // Main Render
    // ============================================

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* ============================================ */}
                {/* TOP ACTION BAR - Bank Grade */}
                {/* ============================================ */}
                <Card className="border-border bg-slate-800/50">
                    <CardContent className="py-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Back + Title */}
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F7DF3] to-[#3CE8D1]">
                                        <ProductIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-foreground">
                                            Заявка №{application.id}
                                        </h1>
                                        <p className="text-xs text-muted-foreground">
                                            {PRODUCT_LABELS[application.product_type]} • {formatDate(application.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                {statusConfig && (
                                    <Badge className={cn("ml-2 px-3 py-1", statusConfig.bgColor, statusConfig.color)}>
                                        {statusConfig.label}
                                    </Badge>
                                )}

                                {/* External ID */}
                                {(application as any).external_id && (
                                    <Badge variant="outline" className="text-[#4F7DF3] border-[#4F7DF3]/30 bg-[#4F7DF3]/10">
                                        <Building2 className="h-3 w-3 mr-1" />
                                        Банк: {(application as any).external_id}
                                    </Badge>
                                )}

                                {/* Days in work indicator */}
                                <Badge variant="outline" className={cn(
                                    daysInWork >= 5 ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                        daysInWork >= 3 ? "text-[#FFD93D] border-[#FFD93D]/30 bg-[#FFD93D]/10" :
                                            "text-[#3CE8D1] border-[#3CE8D1]/30 bg-[#3CE8D1]/10"
                                )}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {daysInWork} дн. в работе
                                </Badge>
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRequestInfoDialog(true)}
                                    className="gap-2"
                                >
                                    <MessageSquarePlus className="h-4 w-4" />
                                    Запросить документы
                                </Button>

                                {!(application as any).external_id && (
                                    <Button
                                        size="sm"
                                        onClick={handleSendToBank}
                                        disabled={isSubmitting}
                                        className="gap-2 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                    >
                                        <Send className="h-4 w-4" />
                                        Отправить в банк
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowRejectDialog(true)}
                                    className="gap-2 text-[#E03E9D] border-[#E03E9D]/30 hover:bg-[#E03E9D]/10"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Отклонить
                                </Button>

                                <Button variant="outline" size="icon" onClick={() => refetch()}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Stepper */}
                <Card className="border-border">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between overflow-x-auto">
                            {STEPPER_LABELS.map((label, index) => (
                                <div key={index} className="flex flex-1 items-center min-w-0">
                                    <div className="flex flex-col items-center">
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                                            index < currentStep
                                                ? "border-[#3CE8D1] bg-[#3CE8D1] text-[#0a1628]"
                                                : index === currentStep
                                                    ? "border-[#3CE8D1] bg-transparent text-[#3CE8D1]"
                                                    : "border-border bg-transparent text-muted-foreground"
                                        )}>
                                            {index < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                                        </div>
                                        <span className={cn(
                                            "mt-1 text-[10px] font-medium text-center whitespace-nowrap",
                                            index <= currentStep ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {label}
                                        </span>
                                    </div>
                                    {index < STEPPER_LABELS.length - 1 && (
                                        <div className={cn(
                                            "mx-2 h-0.5 flex-1 min-w-4",
                                            index < currentStep ? "bg-[#3CE8D1]" : "bg-border"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ============================================ */}
                {/* MAIN CONTENT - 3 Column Layout */}
                {/* ============================================ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* LEFT: Client & General Info (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        {/* Client Info Card */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Клиент
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-lg font-bold text-foreground">{application.company_name || '—'}</p>
                                    {(application as any).company_inn && (
                                        <p className="text-sm text-muted-foreground font-mono">ИНН {(application as any).company_inn}</p>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <InfoFieldCompact label="Сумма заявки" value={formatCurrency(application.amount)} highlight />
                                    <InfoFieldCompact label="Срок" value={application.term_months ? `${application.term_months} мес.` : '—'} />
                                    <InfoFieldCompact label="Целевой банк" value={application.target_bank_name || '—'} />
                                    <InfoFieldCompact label="Агент" value={application.created_by_name || application.created_by_email || '—'} />
                                </div>

                                {/* Contact Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                                        <Phone className="h-3 w-3" />
                                        Позвонить
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 gap-1">
                                        <Mail className="h-3 w-3" />
                                        Написать
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Banks */}
                        {(application as any).selected_banks?.length > 0 && (
                            <Card className="border-border">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Выбранные банки
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {(application as any).selected_banks.map((bank: string, index: number) => (
                                            <Badge key={index} variant="secondary" className="px-2 py-1 text-xs">
                                                {bank}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* CENTER: Product Params & Documents (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Product-Specific Block */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">Параметры продукта</CardTitle>
                                <CardDescription className="text-xs">
                                    {PRODUCT_LABELS[application.product_type]}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderProductSpecificBlock()}
                            </CardContent>
                        </Card>

                        {/* Documents with Verification */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Документы
                                    </CardTitle>
                                    <Badge variant="outline" className="text-xs">
                                        {application.documents?.length || 0} файлов
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {application.documents && application.documents.length > 0 ? (
                                    <ScrollArea className="h-[280px] pr-4">
                                        <div className="space-y-2">
                                            {application.documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[#4F7DF3]/10 flex items-center justify-center">
                                                            <FileText className="h-4 w-4 text-[#4F7DF3]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{doc.name}</p>
                                                            {doc.type_display && (
                                                                <p className="text-xs text-muted-foreground">{doc.type_display}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DocStatusBadge status={doc.status} />
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                        <p className="text-sm text-muted-foreground">Документы не загружены</p>
                                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowRequestInfoDialog(true)}>
                                            Запросить документы
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: Timeline (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    История
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-4">
                                        {timelineEvents.length > 0 ? (
                                            timelineEvents.map((event, index) => {
                                                const Icon = event.icon
                                                return (
                                                    <div key={event.id} className="flex gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                                event.type === 'created' && "bg-[#4F7DF3]/10",
                                                                event.type === 'document' && "bg-[#FFD93D]/10",
                                                                event.type === 'sent' && "bg-[#3CE8D1]/10",
                                                                event.type === 'approved' && "bg-emerald-400/10",
                                                                event.type === 'rejected' && "bg-[#E03E9D]/10"
                                                            )}>
                                                                <Icon className={cn("h-4 w-4", event.color)} />
                                                            </div>
                                                            {index < timelineEvents.length - 1 && (
                                                                <div className="w-px h-full bg-border my-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <p className="text-sm font-medium">{event.title}</p>
                                                            <p className="text-xs text-muted-foreground">{event.description}</p>
                                                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                                {formatDateTime(event.timestamp)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-8">
                                                <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">Нет событий</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {application.notes && (
                            <Card className="border-[#FFD93D]/30 bg-[#FFD93D]/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#FFD93D]">
                                        <AlertTriangle className="h-4 w-4" />
                                        Примечания
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{application.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* ============================================ */}
                {/* DIALOGS */}
                {/* ============================================ */}

                {/* Request Info Dialog */}
                <AlertDialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Запросить документы</AlertDialogTitle>
                            <AlertDialogDescription>
                                Укажите, какие документы или информация требуются от агента.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                            value={requestInfoMessage}
                            onChange={(e) => setRequestInfoMessage(e.target.value)}
                            placeholder="Например: Требуется загрузить копию паспорта директора и выписку из ЕГРЮЛ..."
                            rows={4}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRequestInfo}
                                disabled={isSubmitting || !requestInfoMessage.trim()}
                                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Отправить запрос
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Reject Dialog */}
                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Отклонить заявку</AlertDialogTitle>
                            <AlertDialogDescription>
                                Укажите причину отклонения. Это сообщение будет отправлено агенту.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Укажите причину отклонения..."
                            rows={4}
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleReject}
                                disabled={isSubmitting || !rejectReason.trim()}
                                className="bg-[#E03E9D] hover:bg-[#c0327e]"
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Отклонить
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    )
}

// ============================================
// Sub-Components
// ============================================

function InfoField({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="p-2 rounded bg-accent/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm font-medium text-foreground mt-0.5 truncate">{value || '—'}</p>
        </div>
    )
}

function InfoFieldCompact({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn(
                "text-sm font-medium",
                highlight ? "text-[#3CE8D1]" : "text-foreground"
            )}>{value || '—'}</span>
        </div>
    )
}

function CheckboxItem({ checked, label }: { checked?: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 p-1.5 rounded bg-accent/30">
            <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded border",
                checked
                    ? "bg-[#3CE8D1] border-[#3CE8D1]"
                    : "bg-transparent border-muted-foreground/30"
            )}>
                {checked && <Check className="h-2.5 w-2.5 text-[#0a1628]" />}
            </div>
            <span className={cn(
                "text-xs",
                checked ? "text-foreground" : "text-muted-foreground"
            )}>
                {label}
            </span>
        </div>
    )
}

function DocStatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string; bgColor: string }> = {
        pending: { label: 'На проверке', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10' },
        verified: { label: 'Проверен', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10' },
        rejected: { label: 'Отклонён', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10' },
    }
    const cfg = config[status] || config.pending
    return (
        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cfg.bgColor, cfg.color)}>
            {cfg.label}
        </span>
    )
}

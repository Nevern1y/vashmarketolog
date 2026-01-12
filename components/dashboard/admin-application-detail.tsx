"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    ArrowLeft,
    Building2,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Send,
    MessageSquare,
    ExternalLink,
    User,
    Phone,
    Mail,
    Download,
    Edit,
    Save,
    X,
    RefreshCw,
    Eye,
    MapPin,
    CreditCard,
    Banknote,
    Briefcase,
    Shield,
    Users,
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

interface AdminApplicationDetailProps {
    applicationId: string
    onBack: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    draft: { label: "Черновик", color: "text-gray-500", bgColor: "bg-gray-500/10" },
    pending: { label: "Новая", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    in_review: { label: "В работе", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    info_requested: { label: "Запрос инфо", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    approved: { label: "Одобрено", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    rejected: { label: "Отклонено", color: "text-rose-500", bgColor: "bg-rose-500/10" },
    won: { label: "Выигран", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    lost: { label: "Проигран", color: "text-rose-500", bgColor: "bg-rose-500/10" },
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
}

// Bank Guarantee types
const GUARANTEE_TYPE_LABELS: Record<string, string> = {
    application_security: "Обеспечение заявки",
    contract_execution: "Исполнение контракта",
    advance_return: "Возврат аванса",
    warranty_obligations: "Гарантийные обязательства",
    payment_guarantee: "Гарантии оплаты товара",
    customs_guarantee: "Таможенные гарантии",
    vat_refund: "Возмещение НДС",
}

// Tender law types
const TENDER_LAW_LABELS: Record<string, string> = {
    "44_fz": "44-ФЗ",
    "223_fz": "223-ФЗ",
    "615_pp": "615-ПП",
    "185_fz": "185-ФЗ",
    kbg: "КБГ (Коммерческая)",
    commercial: "Коммерческий",
}

// Factoring types
const FACTORING_TYPE_LABELS: Record<string, string> = {
    classic: "Классический факторинг",
    closed: "Закрытый факторинг",
    procurement: "Закупочный факторинг",
}

// Insurance category labels
const INSURANCE_CATEGORY_LABELS: Record<string, string> = {
    personnel: "Персонал",
    transport: "Транспорт",
    property: "Имущество",
    liability: "Ответственность",
}

// Insurance product type labels
const INSURANCE_PRODUCT_LABELS: Record<string, string> = {
    dms: "ДМС",
    critical_illness: "Критические заболевания",
    accident: "Несчастные случаи",
    travel: "Страхование в поездках",
    osago: "ОСАГО юр. лиц",
    fleet: "Страхование автопарков",
    special_tech: "Спецтехника",
    carrier_liability: "Ответственность перевозчика",
    construction: "Объекты строительства",
    cargo: "Грузы и перевозки",
    company_property: "Имущество компаний",
    business_interruption: "Перерывы деятельности",
    civil_liability: "Гражданская ответственность",
    hazardous_objects: "Опасные объекты",
    professional_risks: "Профессиональные риски",
    quality_liability: "Ответственность за качество",
}

// Credit sub-types
const CREDIT_SUB_TYPE_LABELS: Record<string, string> = {
    one_time_credit: "Разовый кредит",
    non_revolving_line: "Невозобновляемая КЛ",
    revolving_line: "Возобновляемая КЛ",
    overdraft: "Овердрафт",
}

// Account types
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    rko: "РКО",
    rko_basic: "РКО Базовый",
    rko_premium: "РКО Премиум",
    rko_business: "РКО Бизнес",
    special: "Спецсчёт",
    "44fz": "Спецсчет 44-ФЗ",
    "223fz": "Спецсчет 223-ФЗ",
    "615pp": "Спецсчет 615-ПП",
}

// Tender Support types
const TENDER_SUPPORT_TYPE_LABELS: Record<string, string> = {
    one_time: "Разовое сопровождение",
    full_service: "Тендерное сопровождение под ключ",
}

const PURCHASE_CATEGORY_LABELS: Record<string, string> = {
    "44fz": "Госзакупки по 44-ФЗ",
    "223fz": "Закупки по 223-ФЗ",
    property_auctions: "Имущественные торги",
    commercial: "Коммерческие закупки",
}

// ============================================
// Helper Components
// ============================================

function DataField({ label, value, mono, highlight, icon: Icon, fullWidth }: {
    label: string
    value?: string | number | null
    mono?: boolean
    highlight?: boolean
    icon?: React.ComponentType<{ className?: string }>
    fullWidth?: boolean
}) {
    if (!value && value !== 0) return null
    return (
        <div className={cn("py-2", fullWidth && "col-span-full")}>
            <div className="flex items-start gap-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground block mb-0.5">{label}</span>
                    <span className={cn(
                        "text-sm font-medium break-words",
                        mono && "font-mono text-xs",
                        highlight && "text-[#3CE8D1]"
                    )}>{value}</span>
                </div>
            </div>
        </div>
    )
}

function DataSection({ title, icon: Icon, children, className }: {
    title: string
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("space-y-2", className)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                {Icon && <Icon className="h-4 w-4 text-[#3CE8D1]" />}
                {title}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                {children}
            </div>
        </div>
    )
}


export function AdminApplicationDetail({ applicationId, onBack }: AdminApplicationDetailProps) {
    const { application, isLoading, refetch } = useApplication(applicationId)
    const { approveApplication, rejectApplication, restoreApplication, requestInfo, saveNotes, isLoading: isActioning } = usePartnerActions()

    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showRequestDialog, setShowRequestDialog] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [requestMessage, setRequestMessage] = useState("")
    const [isEditingNotes, setIsEditingNotes] = useState(false)
    const [editedNotes, setEditedNotes] = useState("")
    const [isSavingNotes, setIsSavingNotes] = useState(false)
    const [activeTab, setActiveTab] = useState("overview")

    const statusCfg = application ? STATUS_CONFIG[application.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending

    const formatCurrency = (amount: string | number | null | undefined) => {
        if (!amount) return "—"
        return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(parseFloat(String(amount)))
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "—"
        return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    // Actions
    const handleApprove = async () => {
        const result = await approveApplication(parseInt(applicationId))
        if (result) {
            toast.success(`Заявка одобрена (статус: ${result.status})`)
            await refetch()
        }
        setShowApproveDialog(false)
    }

    const handleReject = async () => {
        const result = await rejectApplication(parseInt(applicationId))
        if (result) {
            toast.success(`Заявка отклонена (статус: ${result.status})`)
            await refetch()
        }
        setShowRejectDialog(false)
        setRejectReason("")
    }

    const handleRequestInfo = async () => {
        const result = await requestInfo(parseInt(applicationId))
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

    const handleReview = async () => {
        const result = await restoreApplication(parseInt(applicationId))
        if (result) {
            toast.success("Заявка отправлена на пересмотр")
            refetch()
        }
    }

    const handleSaveNotes = async () => {
        setIsSavingNotes(true)
        const result = await saveNotes(parseInt(applicationId), editedNotes)
        if (result) {
            toast.success("Заметки сохранены")
            setIsEditingNotes(false)
            refetch()
        }
        setIsSavingNotes(false)
    }

    const startEditNotes = () => {
        setEditedNotes(application?.notes || "")
        setIsEditingNotes(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    if (!application) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Заявка не найдена</p>
                <Button variant="outline" onClick={onBack} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />Назад
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Заявка #{application.id}</h1>
                        <p className="text-sm text-muted-foreground">{PRODUCT_LABELS[application.product_type] || application.product_type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={cn("text-sm px-3 py-1", statusCfg.bgColor, statusCfg.color)}>{statusCfg.label}</Badge>
                    {application.external_id && (
                        <Badge variant="outline" className="text-xs font-mono">
                            EXT: {application.external_id}
                        </Badge>
                    )}
                    {application.bank_status && (
                        <Badge variant="secondary" className="text-xs">
                            Банк: {application.bank_status}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
                {(application.status === 'pending' || application.status === 'in_review' || application.status === 'info_requested') && (
                    <Button variant="outline" onClick={() => setShowRequestDialog(true)} disabled={isActioning}>
                        <MessageSquare className="h-4 w-4 mr-2" />Запросить инфо
                    </Button>
                )}

                {(application.status === 'rejected' || application.status === 'lost') && (
                    <Button
                        variant="outline"
                        onClick={handleRestore}
                        className="text-amber-500 border-amber-500/50 hover:bg-amber-500 hover:text-white"
                        disabled={isActioning}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />Восстановить
                    </Button>
                )}

                {(application.status === 'approved' || application.status === 'won') && (
                    <Button
                        variant="outline"
                        onClick={handleReview}
                        className="text-blue-500 border-blue-500/50 hover:bg-blue-500 hover:text-white"
                        disabled={isActioning}
                    >
                        <Eye className="h-4 w-4 mr-2" />Пересмотреть
                    </Button>
                )}

                {application.status !== 'rejected' && application.status !== 'lost' &&
                    application.status !== 'approved' && application.status !== 'won' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectDialog(true)}
                                className="text-rose-500 border-rose-500/50 hover:bg-rose-500 hover:text-white"
                                disabled={isActioning}
                            >
                                <XCircle className="h-4 w-4 mr-2" />Отклонить
                            </Button>
                            <Button
                                onClick={() => setShowApproveDialog(true)}
                                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                disabled={isActioning}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />Одобрить
                            </Button>
                        </>
                    )}

                {application.signing_url && (
                    <Button variant="outline" onClick={() => window.open(application.signing_url!, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />Подписать в банке
                    </Button>
                )}
            </div>

            {/* Tabs for different sections */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-2xl">
                    <TabsTrigger value="overview">Обзор</TabsTrigger>
                    <TabsTrigger value="company">Компания</TabsTrigger>
                    <TabsTrigger value="product">Продукт</TabsTrigger>
                    <TabsTrigger value="documents">Документы</TabsTrigger>
                    <TabsTrigger value="chat">Чат</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Info Card */}
                        <Card className="lg:col-span-2 border-border">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-[#3CE8D1]" />
                                    Основные данные заявки
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DataSection title="Финансовые параметры" icon={Banknote}>
                                    <DataField label="Сумма" value={formatCurrency(application.amount)} highlight icon={Banknote} />
                                    <DataField label="Срок (мес.)" value={application.term_months} icon={Clock} />
                                    <DataField label="Целевой банк/МФО" value={application.target_bank_name} icon={Building2} />
                                </DataSection>

                                <Separator className="my-4" />

                                <DataSection title="Даты и статус" icon={Calendar}>
                                    <DataField label="Создано" value={formatDate(application.created_at)} icon={Calendar} />
                                    <DataField label="Обновлено" value={formatDate(application.updated_at)} icon={Calendar} />
                                    <DataField label="Отправлено" value={formatDate(application.submitted_at)} icon={Calendar} />
                                    <DataField label="Создатель" value={application.created_by_email} icon={User} />
                                    {application.created_by_name && (
                                        <DataField label="Имя создателя" value={application.created_by_name} />
                                    )}
                                    <DataField label="Партнёр" value={application.partner_email} icon={User} />
                                </DataSection>

                                {/* Tender Info */}
                                {(application.tender_number || application.tender_platform || application.tender_deadline) && (
                                    <>
                                        <Separator className="my-4" />
                                        <DataSection title="Тендерная информация" icon={FileText}>
                                            <DataField label="Номер тендера" value={application.tender_number} mono />
                                            <DataField label="Площадка" value={application.tender_platform} />
                                            <DataField label="Дедлайн" value={formatDate(application.tender_deadline)} icon={Calendar} />
                                        </DataSection>
                                    </>
                                )}

                                {/* Bank Integration */}
                                {(application.external_id || application.bank_status || application.commission_data) && (
                                    <>
                                        <Separator className="my-4" />
                                        <DataSection title="Интеграция с банком" icon={Building2}>
                                            <DataField label="External ID" value={application.external_id} mono />
                                            <DataField label="Статус банка" value={application.bank_status} />
                                            {application.commission_data && (
                                                <>
                                                    <DataField label="Комиссия всего" value={application.commission_data.total != null ? formatCurrency(application.commission_data.total) : null} />
                                                    <DataField label="Комиссия банка" value={application.commission_data.bank != null ? formatCurrency(application.commission_data.bank) : null} />
                                                    <DataField label="Комиссия агента" value={application.commission_data.agent != null ? formatCurrency(application.commission_data.agent) : null} />
                                                </>
                                            )}
                                        </DataSection>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes Card */}
                        <Card className="border-border">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Edit className="h-4 w-4 text-[#3CE8D1]" />
                                        Заметки менеджера
                                    </CardTitle>
                                    {!isEditingNotes && (
                                        <Button variant="ghost" size="sm" onClick={startEditNotes}>
                                            <Edit className="h-3 w-3 mr-1" />Редактировать
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isEditingNotes ? (
                                    <div className="space-y-2">
                                        <Textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} rows={6} placeholder="Добавьте заметки..." />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-[#3CE8D1] text-[#0a1628]">
                                                {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}Сохранить
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}><X className="h-3 w-3 mr-1" />Отмена</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.notes || "Нет заметок"}</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Company Tab */}
                <TabsContent value="company" className="mt-6">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-[#3CE8D1]" />
                                Полные данные компании
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Basic Company Info */}
                            <DataSection title="Основная информация" icon={Building2}>
                                <DataField label="Название" value={application.company_name} />
                                <DataField label="ИНН" value={application.company_inn} mono />
                                {application.company_data && (
                                    <>
                                        <DataField label="КПП" value={application.company_data.kpp} mono />
                                        <DataField label="ОГРН" value={application.company_data.ogrn} mono />
                                        <DataField label="Краткое наименование" value={application.company_data.short_name} />
                                    </>
                                )}
                            </DataSection>

                            {application.company_data && (
                                <>
                                    {/* Director Info */}
                                    <DataSection title="Руководитель" icon={User}>
                                        <DataField label="ФИО руководителя" value={application.company_data.director_name} icon={User} />
                                        <DataField label="Должность" value={application.company_data.director_position} />
                                        {application.company_data.passport_series && (
                                            <>
                                                <DataField label="Паспорт серия/номер" value={`${application.company_data.passport_series} ${application.company_data.passport_number}`} mono />
                                                <DataField label="Выдан" value={application.company_data.passport_issued_by} />
                                                <DataField label="Дата выдачи" value={formatDate(application.company_data.passport_date)} />
                                                <DataField label="Код подразделения" value={application.company_data.passport_code} mono />
                                            </>
                                        )}
                                    </DataSection>

                                    {/* Addresses */}
                                    <DataSection title="Адреса" icon={MapPin}>
                                        <DataField label="Юридический адрес" value={application.company_data.legal_address} icon={MapPin} fullWidth />
                                        <DataField label="Фактический адрес" value={application.company_data.actual_address} icon={MapPin} fullWidth />
                                    </DataSection>

                                    {/* Contacts */}
                                    <DataSection title="Контакты" icon={Phone}>
                                        <DataField label="Контактное лицо" value={application.company_data.contact_person} icon={User} />
                                        <DataField label="Телефон" value={application.company_data.contact_phone} icon={Phone} />
                                        <DataField label="Email" value={application.company_data.contact_email} icon={Mail} />
                                    </DataSection>

                                    {/* Bank Details */}
                                    <DataSection title="Банковские реквизиты" icon={CreditCard}>
                                        <DataField label="Банк" value={application.company_data.bank_name} icon={Building2} />
                                        <DataField label="БИК" value={application.company_data.bank_bic} mono />
                                        <DataField label="Расчётный счёт" value={application.company_data.bank_account} mono />
                                        <DataField label="Корреспондентский счёт" value={application.company_data.bank_corr_account} mono />
                                    </DataSection>

                                    {/* Founders */}
                                    {application.company_data.founders_data && application.company_data.founders_data.length > 0 && (
                                        <DataSection title="Учредители" icon={Users}>
                                            <div className="col-span-full space-y-2">
                                                {application.company_data.founders_data.map((founder, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 p-2 rounded-lg bg-accent/30">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="text-sm font-medium">{founder.name}</span>
                                                            {founder.inn && <span className="text-xs text-muted-foreground ml-2">ИНН: {founder.inn}</span>}
                                                            {founder.share != null && <span className="text-xs text-muted-foreground ml-2">Доля: {founder.share}%</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </DataSection>
                                    )}

                                    {/* Additional Bank Accounts */}
                                    {application.company_data.bank_accounts_data && application.company_data.bank_accounts_data.length > 0 && (
                                        <DataSection title="Дополнительные счета" icon={CreditCard}>
                                            <div className="col-span-full space-y-2">
                                                {application.company_data.bank_accounts_data.map((acc, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 p-2 rounded-lg bg-accent/30">
                                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <span className="text-sm font-medium font-mono">{acc.account}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">{acc.bank_name}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">БИК: {acc.bic}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </DataSection>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Product Tab */}
                <TabsContent value="product" className="mt-6">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#3CE8D1]" />
                                Параметры продукта: {PRODUCT_LABELS[application.product_type] || application.product_type}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Bank Guarantee specific */}
                            {application.product_type === 'bank_guarantee' && (
                                <>
                                    <DataSection title="Параметры гарантии" icon={Shield}>
                                        <DataField label="Тип гарантии" value={application.guarantee_type ? GUARANTEE_TYPE_LABELS[application.guarantee_type] || application.guarantee_type : null} />
                                        <DataField label="Закон" value={application.tender_law ? TENDER_LAW_LABELS[application.tender_law] || application.tender_law : null} />
                                    </DataSection>

                                    {application.goscontract_data && (
                                        <>
                                            <DataSection title="Данные госконтракта" icon={FileText}>
                                                <DataField label="№ извещения" value={application.goscontract_data.purchase_number} mono />
                                                <DataField label="№ лота" value={application.goscontract_data.lot_number} mono />
                                                <DataField label="Предмет закупки" value={application.goscontract_data.subject} fullWidth />
                                                <DataField label="ИНН заказчика" value={application.goscontract_data.beneficiary_inn} mono />
                                                <DataField label="Наименование заказчика" value={application.goscontract_data.beneficiary_name} />
                                                <DataField label="Начальная (максимальная) цена" value={formatCurrency(application.goscontract_data.initial_price)} />
                                                <DataField label="Предложенная цена" value={formatCurrency(application.goscontract_data.offered_price)} />
                                            </DataSection>

                                            <DataSection title="Сроки гарантии" icon={Calendar}>
                                                <DataField label="Срок БГ с" value={formatDate(application.goscontract_data.guarantee_start_date)} icon={Calendar} />
                                                <DataField label="Срок БГ по" value={formatDate(application.goscontract_data.guarantee_end_date)} icon={Calendar} />
                                            </DataSection>

                                            <DataSection title="Дополнительные параметры" icon={Briefcase}>
                                                {application.goscontract_data.has_prepayment && (
                                                    <DataField label="Авансирование" value={application.goscontract_data.advance_percent ? `Да (${application.goscontract_data.advance_percent}%)` : "Да"} />
                                                )}
                                                {application.goscontract_data.is_close_auction && <DataField label="Закрытые торги" value="Да" />}
                                                {application.goscontract_data.has_customer_template && <DataField label="Шаблон заказчика" value="Да" />}
                                                {application.goscontract_data.is_single_supplier && <DataField label="Единственный поставщик" value="Да" />}
                                                {application.goscontract_data.is_resecuring && <DataField label="Переобеспечение" value="Да" />}
                                                {application.goscontract_data.no_eis_placement && <DataField label="Без размещения в ЕИС" value="Да" />}
                                                {application.goscontract_data.tender_not_held && <DataField label="Торги не проведены" value="Да" />}
                                                {application.goscontract_data.needs_credit && <DataField label="Нужен кредит" value="Да" />}
                                                {(application.goscontract_data.contracts_44fz_count != null || application.goscontract_data.contracts_223fz_count != null) && (
                                                    <>
                                                        <DataField label="Исполнено (44-ФЗ)" value={application.goscontract_data.contracts_44fz_count} />
                                                        <DataField label="Исполнено (223-ФЗ)" value={application.goscontract_data.contracts_223fz_count} />
                                                    </>
                                                )}
                                            </DataSection>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Contract Loan (КИК) specific */}
                            {application.product_type === 'contract_loan' && application.goscontract_data && (
                                <>
                                    <DataSection title="Параметры КИК" icon={CreditCard}>
                                        <DataField label="Тип продукта" value={
                                            application.goscontract_data.contract_loan_type === 'credit_execution' ? 'Кредит на исполнение контракта' :
                                                application.goscontract_data.contract_loan_type === 'loan' ? 'Займ' :
                                                    application.goscontract_data.contract_loan_type
                                        } />
                                        <DataField label="№ извещения/контракта" value={application.goscontract_data.purchase_number} mono />
                                        <DataField label="№ лота" value={application.goscontract_data.lot_number} mono />
                                        <DataField label="Цена контракта" value={formatCurrency(application.goscontract_data.contract_price)} />
                                    </DataSection>

                                    <DataSection title="Сроки контракта" icon={Calendar}>
                                        <DataField label="Срок контракта с" value={formatDate(application.goscontract_data.contract_start_date)} icon={Calendar} />
                                        <DataField label="Срок контракта по" value={formatDate(application.goscontract_data.contract_end_date)} icon={Calendar} />
                                    </DataSection>

                                    <DataSection title="Параметры кредита" icon={Banknote}>
                                        <DataField label="Сумма кредита" value={formatCurrency(application.goscontract_data.credit_amount)} highlight />
                                        <DataField label="Срок кредита с" value={formatDate(application.goscontract_data.credit_start_date)} icon={Calendar} />
                                        <DataField label="Срок кредита по" value={formatDate(application.goscontract_data.credit_end_date)} icon={Calendar} />
                                        {application.goscontract_data.has_prepayment && (
                                            <DataField label="Авансирование" value={application.goscontract_data.advance_percent ? `${application.goscontract_data.advance_percent}%` : "Да"} />
                                        )}
                                        {application.goscontract_data.contract_execution_percent != null && !application.goscontract_data.ignore_execution_percent && (
                                            <DataField label="Выполнение контракта" value={`${application.goscontract_data.contract_execution_percent}%`} />
                                        )}
                                    </DataSection>
                                </>
                            )}

                            {/* Factoring specific */}
                            {application.product_type === 'factoring' && (
                                <DataSection title="Параметры факторинга" icon={CreditCard}>
                                    <DataField label="Тип факторинга" value={application.factoring_type ? FACTORING_TYPE_LABELS[application.factoring_type] || application.factoring_type : null} />
                                    <DataField label="ИНН контрагента" value={application.contractor_inn} mono />
                                    <DataField label="Срок финансирования (дней)" value={application.financing_term_days} />
                                </DataSection>
                            )}

                            {/* VED specific */}
                            {application.product_type === 'ved' && (
                                <DataSection title="Параметры ВЭД" icon={ExternalLink}>
                                    <DataField label="Валюта" value={application.ved_currency} />
                                    <DataField label="Страна платежа" value={application.ved_country} />
                                </DataSection>
                            )}

                            {/* Insurance specific */}
                            {application.product_type === 'insurance' && (
                                <DataSection title="Параметры страхования" icon={Shield}>
                                    <DataField label="Категория" value={application.insurance_category ? INSURANCE_CATEGORY_LABELS[application.insurance_category] || application.insurance_category : null} />
                                    <DataField label="Страховой продукт" value={application.insurance_product_type ? INSURANCE_PRODUCT_LABELS[application.insurance_product_type] || application.insurance_product_type : null} />
                                </DataSection>
                            )}

                            {/* Leasing specific */}
                            {application.product_type === 'leasing' && (
                                <DataSection title="Параметры лизинга" icon={CreditCard}>
                                    <DataField label="Тип кредита" value={application.credit_sub_type ? CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type : null} />
                                    {application.goscontract_data?.equipment_type && (
                                        <DataField label="Тип оборудования" value={application.goscontract_data.equipment_type} />
                                    )}
                                </DataSection>
                            )}

                            {/* Corporate/Tender Credit specific */}
                            {(application.product_type === 'corporate_credit' || application.product_type === 'tender_loan') && (
                                <DataSection title="Параметры кредита" icon={CreditCard}>
                                    <DataField label="Тип кредита" value={application.credit_sub_type ? CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type : null} />
                                    <DataField label="Обеспечение/залог" value={application.pledge_description} />
                                    <DataField label="Срок финансирования (дней)" value={application.financing_term_days} />
                                </DataSection>
                            )}

                            {/* Tender Support specific */}
                            {application.product_type === 'tender_support' && (
                                <DataSection title="Параметры тендерного сопровождения" icon={Briefcase}>
                                    <DataField label="Вариант сопровождения" value={application.tender_support_type ? TENDER_SUPPORT_TYPE_LABELS[application.tender_support_type] || application.tender_support_type : null} />
                                    <DataField label="Тип закупки" value={application.purchase_category ? PURCHASE_CATEGORY_LABELS[application.purchase_category] || application.purchase_category : null} />
                                    <DataField label="Закупки в отрасли" value={application.industry} />
                                </DataSection>
                            )}

                            {/* RKO/SpecAccount specific */}
                            {(application.product_type === 'rko' || application.product_type === 'special_account') && (
                                <DataSection title="Параметры счёта" icon={CreditCard}>
                                    <DataField label="Тип счёта" value={application.account_type ? ACCOUNT_TYPE_LABELS[application.account_type] || application.account_type : null} />
                                </DataSection>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-6">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4 text-[#3CE8D1]" />
                                Документы заявки
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {application.documents && application.documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {application.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="h-5 w-5 text-[#4F7DF3] shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{doc.name}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.type_display}</p>
                                                    <Badge variant="outline" className="text-xs mt-1">{doc.status_display}</Badge>
                                                </div>
                                            </div>
                                            {doc.file_url && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => window.open(doc.file_url, '_blank')}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">Нет прикреплённых документов</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Chat Tab */}
                <TabsContent value="chat" className="mt-6">
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-[#3CE8D1]" />
                                Чат по заявке
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ApplicationChat applicationId={applicationId} className="border-0" />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Одобрить заявку?</AlertDialogTitle>
                        <AlertDialogDescription>Заявка #{applicationId} будет одобрена.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} className="bg-[#3CE8D1] text-[#0a1628]">Одобрить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Укажите причину отклонения:</p>
                                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Причина..." />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-rose-500">Отклонить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Запросить информацию</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Что нужно уточнить у клиента?</p>
                                <Textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} placeholder="Сообщение..." />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRequestInfo} className="bg-[#4F7DF3]">Отправить</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

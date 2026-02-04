"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getStatusConfig } from "@/lib/status-mapping"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"
import {
    Search,
    Loader2,
    RefreshCw,
    Eye,
    MoreHorizontal,
    UserPlus,
    MessageSquare,
    Building2,
    Banknote,
    Calendar,
    ChevronDown,
    ChevronRight,
    FileText,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Clock,
    ExternalLink,
    Download,
    Shield,
    Briefcase,
} from "lucide-react"
import { useApplications, usePartnerActions, useApplication } from "@/hooks/use-applications"
import { usePartners } from "@/hooks/use-partners"
import { CompanyExtendedDataSections } from "@/components/dashboard/company-data-sections"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"

// ============================================
// Types & Config
// ============================================

interface AdminApplicationsViewProps {
    onSelectApplication?: (applicationId: string) => void
}

const PRODUCT_TABS = [
    { value: "all", label: "Все продукты", shortLabel: "Все" },
    { value: "bank_guarantee", label: "Банковские гарантии", shortLabel: "БГ", prefix: "БГ" },
    { value: "tender_loan", label: "Кредиты для бизнеса", shortLabel: "Кредит", prefix: "КР" },
    { value: "contract_loan", label: "КИК", shortLabel: "КИК", prefix: "КИК" },
    { value: "corporate_credit", label: "Корпоративный кредит", shortLabel: "Корп. кредит", prefix: "КК" },
    { value: "leasing", label: "Лизинг для юрлиц", shortLabel: "Лизинг", prefix: "ЛЗ" },
    { value: "factoring", label: "Факторинг для бизнеса", shortLabel: "Факторинг", prefix: "ФК" },
    { value: "insurance", label: "Страхование СМР", shortLabel: "Страх.", prefix: "СТР" },
    { value: "ved", label: "Международные платежи", shortLabel: "ВЭД", prefix: "МП" },
    { value: "rko", label: "РКО и спецсчета", shortLabel: "РКО", prefix: "РКО" },
    { value: "special_account", label: "Спецсчет", shortLabel: "Спецсчет", prefix: "СС" },
    { value: "tender_support", label: "Тендерное сопровождение", shortLabel: "Сопров.", prefix: "ТС" },
    { value: "deposits", label: "Депозиты", shortLabel: "Депозит", prefix: "ДП" },
]

// Product-specific labels
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
    kbg: "КБГ (Коммерческая)",
    commercial: "Коммерческий",
}

const FACTORING_TYPE_LABELS: Record<string, string> = {
    classic: "Классический факторинг",
    closed: "Закрытый факторинг",
    procurement: "Закупочный факторинг",
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
    special_account: "Спецсчёт",
    "44fz": "Спецсчет 44-ФЗ",
    "223fz": "Спецсчет 223-ФЗ",
    "615pp": "Спецсчет 615-ПП",
}

// ============================================
// Helper Components
// ============================================

function DataField({ label, value, mono, highlight, icon: Icon }: {
    label: string
    value?: string | number | null
    mono?: boolean
    highlight?: boolean
    icon?: React.ComponentType<{ className?: string }>
}) {
    if (!value && value !== 0) return null
    return (
        <div className="flex items-start gap-2 py-1">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
            <div className="min-w-0 flex-1">
                <span className="text-xs text-muted-foreground block">{label}</span>
                <span className={cn(
                    "text-sm font-medium break-all overflow-wrap-anywhere",
                    mono && "font-mono text-xs",
                    highlight && "text-[#3CE8D1]"
                )}>{value}</span>
            </div>
        </div>
    )
}

function DataSection({ title, icon: Icon, children }: {
    title: string
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-1">
                {Icon && <Icon className="h-4 w-4 text-[#3CE8D1]" />}
                {title}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-1 pl-1">
                {children}
            </div>
        </div>
    )
}

// ============================================
// Expanded Row Component
// ============================================

function ApplicationExpandedDetails({ applicationId }: { applicationId: number }) {
    const { application, isLoading } = useApplication(applicationId)

    const formatCurrency = (amount: string | number | undefined | null) => {
        if (amount === null || amount === undefined || amount === "") return "—"
        return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(parseFloat(String(amount))) + " ₽"
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return "—"
        return new Date(dateStr).toLocaleDateString("ru-RU")
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                <span className="ml-2 text-sm text-muted-foreground">Загрузка данных заявки...</span>
            </div>
        )
    }

    if (!application) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                Не удалось загрузить данные заявки
            </div>
        )
    }

    const productLabel = PRODUCT_TABS.find(p => p.value === application.product_type)?.label || getProductTypeLabel(application.product_type, application.product_type_display)
    const statusCfg = getStatusConfig(application.status)
    const primaryAmount = getPrimaryAmountValue(application)

    return (
        <div className="p-4 md:p-6 space-y-6 bg-accent/20 border-t border-border">
            {/* Header with main info */}
            <div className="flex flex-wrap items-center gap-4">
                <Badge className={cn("text-sm px-3 py-1", statusCfg.bgColor, statusCfg.color)}>
                    {statusCfg.label}
                </Badge>
                <span className="text-sm text-muted-foreground">Продукт: <span className="font-medium text-foreground">{productLabel}</span></span>
                {application.external_id && (
                    <span className="text-sm text-muted-foreground">External ID: <span className="font-mono text-xs text-foreground">{application.external_id}</span></span>
                )}
            </div>

            {/* Main Info Section */}
            <DataSection title="Основные данные" icon={Briefcase}>
                <DataField label="Сумма" value={formatCurrency(primaryAmount)} highlight icon={Banknote} />
                <DataField label="Срок (мес.)" value={application.term_months} icon={Clock} />
                <DataField label="Целевой банк/МФО" value={application.target_bank_name} icon={Building2} />
                <DataField label="Создано" value={formatDate(application.created_at)} icon={Calendar} />
                <DataField label="Обновлено" value={formatDate(application.updated_at)} icon={Calendar} />
                <DataField label="Отправлено" value={formatDate(application.submitted_at)} icon={Calendar} />
                {application.created_by_email && (
                    <DataField label="Создатель" value={`${application.created_by_name || ""} (${application.created_by_email})`} icon={User} />
                )}
                {application.partner_email && (
                    <DataField label="Партнёр" value={application.partner_email} icon={User} />
                )}
            </DataSection>

            {/* Company Data Section */}
            <DataSection title="Данные компании" icon={Building2}>
                <DataField label="Название" value={application.company_name} />
                <DataField label="ИНН" value={application.company_inn} mono />
                {application.company_data && (
                    <>
                        <DataField label="КПП" value={application.company_data.kpp} mono />
                        <DataField label="ОГРН" value={application.company_data.ogrn} mono />
                        <DataField label="Руководитель" value={application.company_data.director_name} icon={User} />
                        <DataField label="Должность" value={application.company_data.director_position} />
                        <DataField label="Юридический адрес" value={application.company_data.legal_address} icon={MapPin} />
                        <DataField label="Фактический адрес" value={application.company_data.actual_address} icon={MapPin} />
                        <DataField label="Контактное лицо" value={application.company_data.contact_person} icon={User} />
                        <DataField label="Телефон" value={application.company_data.contact_phone} icon={Phone} />
                        <DataField label="Email" value={application.company_data.contact_email} icon={Mail} />
                        <DataField label="Банк" value={application.company_data.bank_name} icon={Building2} />
                        <DataField label="БИК" value={application.company_data.bank_bic} mono />
                        <DataField label="Р/С" value={application.company_data.bank_account} mono />
                        <DataField label="К/С" value={application.company_data.bank_corr_account} mono />
                        {/* Phase 2: OKVED Activities */}
                        {application.company_data.activities_data && application.company_data.activities_data.length > 0 && (
                            <div className="col-span-full mt-2 pt-2 border-t border-border/30">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                    <Briefcase className="h-3 w-3" />ОКВЭД
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {application.company_data.activities_data.slice(0, 5).map((activity, idx) => (
                                        <span key={idx} className="text-xs font-mono bg-slate-700/50 px-1.5 py-0.5 rounded">
                                            {activity.code}
                                            {activity.is_primary && <span className="text-[#3CE8D1] ml-1">•</span>}
                                        </span>
                                    ))}
                                    {application.company_data.activities_data.length > 5 && (
                                        <span className="text-xs text-muted-foreground">+{application.company_data.activities_data.length - 5}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DataSection>

            {/* Extended Company Data Sections (Founders, Leadership, Licenses, etc.) */}
            {application.company_data && (
                <CompanyExtendedDataSections companyData={application.company_data} />
            )}

            {/* Tender Info Section */}
            {(application.tender_number || application.tender_platform || application.tender_deadline) && (
                <DataSection title="Тендерная информация" icon={FileText}>
                    <DataField label="Номер тендера" value={application.tender_number} mono />
                    <DataField label="Площадка" value={application.tender_platform} />
                    <DataField label="Дедлайн" value={formatDate(application.tender_deadline)} icon={Calendar} />
                </DataSection>
            )}

            {/* Product-Specific Sections */}
            {application.product_type === "bank_guarantee" && application.goscontract_data && (
                <DataSection title="Параметры банковской гарантии" icon={Shield}>
                    <DataField label="Тип гарантии" value={application.guarantee_type ? GUARANTEE_TYPE_LABELS[application.guarantee_type] || application.guarantee_type : null} />
                    <DataField label="Закон" value={application.tender_law ? TENDER_LAW_LABELS[application.tender_law] || application.tender_law : null} />
                    <DataField label="№ извещения" value={application.goscontract_data.purchase_number} mono />
                    <DataField label="№ лота" value={application.goscontract_data.lot_number} mono />
                    <DataField label="Предмет закупки" value={application.goscontract_data.subject} />
                    <DataField label="ИНН заказчика" value={application.goscontract_data.beneficiary_inn} mono />
                    <DataField label="Наименование заказчика" value={application.goscontract_data.beneficiary_name} />
                    <DataField label="Начальная цена" value={formatCurrency(application.goscontract_data.initial_price)} />
                    <DataField label="Предложенная цена" value={formatCurrency(application.goscontract_data.offered_price)} />
                    <DataField label="Дата начала БГ" value={formatDate(application.goscontract_data.guarantee_start_date)} />
                    <DataField label="Дата окончания БГ" value={formatDate(application.goscontract_data.guarantee_end_date)} />
                    {application.goscontract_data.has_prepayment && (
                        <DataField label="Авансирование" value={application.goscontract_data.advance_percent ? `${application.goscontract_data.advance_percent}%` : "Да"} />
                    )}
                    {application.goscontract_data.is_close_auction && <DataField label="Закрытые торги" value="Да" />}
                    {application.goscontract_data.has_customer_template && <DataField label="Шаблон заказчика" value="Да" />}
                    {application.goscontract_data.is_single_supplier && <DataField label="Единственный поставщик" value="Да" />}
                    <DataField label="Исполнено контрактов (44-ФЗ)" value={application.goscontract_data.contracts_44fz_count} />
                    <DataField label="Исполнено контрактов (223-ФЗ)" value={application.goscontract_data.contracts_223fz_count} />
                </DataSection>
            )}

            {application.product_type === "contract_loan" && application.goscontract_data && (
                <DataSection title="Параметры КИК" icon={CreditCard}>
                    <DataField label="Тип продукта" value={application.goscontract_data.contract_loan_type === "credit_execution" ? "Кредит на исполнение контракта" : application.goscontract_data.contract_loan_type === "loan" ? "Займ" : application.goscontract_data.contract_loan_type} />
                    <DataField label="№ извещения/контракта" value={application.goscontract_data.purchase_number} mono />
                    <DataField label="№ лота" value={application.goscontract_data.lot_number} mono />
                    <DataField label="Цена контракта" value={formatCurrency(application.goscontract_data.contract_price)} />
                    <DataField label="Срок контракта с" value={formatDate(application.goscontract_data.contract_start_date)} />
                    <DataField label="Срок контракта по" value={formatDate(application.goscontract_data.contract_end_date)} />
                    <DataField label="Сумма кредита" value={formatCurrency(application.goscontract_data.credit_amount)} />
                    <DataField label="Срок кредита с" value={formatDate(application.goscontract_data.credit_start_date)} />
                    <DataField label="Срок кредита по" value={formatDate(application.goscontract_data.credit_end_date)} />
                    {application.goscontract_data.has_prepayment && (
                        <DataField label="Авансирование" value={application.goscontract_data.advance_percent ? `${application.goscontract_data.advance_percent}%` : "Да"} />
                    )}
                    {application.goscontract_data.contract_execution_percent != null && !application.goscontract_data.ignore_execution_percent && (
                        <DataField label="Выполнение контракта" value={`${application.goscontract_data.contract_execution_percent}%`} />
                    )}
                </DataSection>
            )}

            {application.product_type === "factoring" && (
                <DataSection title="Параметры факторинга" icon={CreditCard}>
                    <DataField label="Тип факторинга" value={application.factoring_type ? FACTORING_TYPE_LABELS[application.factoring_type] || application.factoring_type : null} />
                    <DataField label="ИНН контрагента" value={application.contractor_inn} mono />
                    <DataField label="Срок финансирования" value={application.financing_term_days ? `${application.financing_term_days} дн.` : null} />
                </DataSection>
            )}

            {application.product_type === "ved" && (
                <DataSection title="Параметры ВЭД" icon={ExternalLink}>
                    <DataField label="Валюта" value={application.ved_currency} />
                    <DataField label="Страна платежа" value={application.ved_country} />
                </DataSection>
            )}

            {application.product_type === "insurance" && (
                <DataSection title="Параметры страхования" icon={Shield}>
                    <DataField label="Категория" value={application.insurance_category ? INSURANCE_CATEGORY_LABELS[application.insurance_category] || application.insurance_category : null} />
                    <DataField label="Продукт" value={application.insurance_product_type ? INSURANCE_PRODUCT_LABELS[application.insurance_product_type] || application.insurance_product_type : null} />
                </DataSection>
            )}

            {application.product_type === "leasing" && (
                <DataSection title="Параметры лизинга" icon={CreditCard}>
                    <DataField label="Тип кредита" value={application.credit_sub_type ? CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type : null} />
                    {application.goscontract_data?.equipment_type && (
                        <DataField label="Тип оборудования" value={application.goscontract_data.equipment_type} />
                    )}
                </DataSection>
            )}

            {(application.product_type === "tender_loan" || application.product_type === "corporate_credit") && (
                <DataSection title="Параметры кредита" icon={CreditCard}>
                    <DataField label="Тип кредита" value={application.credit_sub_type ? CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type : null} />
                    <DataField label="Обеспечение/залог" value={application.pledge_description} />
                    <DataField label="Срок (дни)" value={application.financing_term_days ? `${application.financing_term_days} дн.` : null} />
                </DataSection>
            )}

            {(application.product_type === "rko" || application.product_type === "special_account") && (
                <DataSection title="Параметры счёта" icon={CreditCard}>
                    <DataField label="Тип счёта" value={application.account_type ? ACCOUNT_TYPE_LABELS[application.account_type] || application.account_type : null} />
                </DataSection>
            )}

            {/* Bank Integration Section */}
            {(application.external_id || application.bank_status || application.signing_url || application.commission_data) && (
                <DataSection title="Интеграция с банком" icon={Building2}>
                    <DataField label="External ID" value={application.external_id} mono />
                    <DataField label="Статус банка" value={application.bank_status} />
                    {application.signing_url && (
                        <div className="flex items-center gap-2 py-1">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <span className="text-xs text-muted-foreground block">URL подписания</span>
                                <a href={application.signing_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#3CE8D1] hover:underline truncate block max-w-xs">
                                    Открыть в банке
                                </a>
                            </div>
                        </div>
                    )}
                    {application.commission_data && (
                        <>
                            <DataField label="Комиссия всего" value={application.commission_data.total != null ? formatCurrency(application.commission_data.total) : null} />
                            <DataField label="Комиссия банка" value={application.commission_data.bank != null ? formatCurrency(application.commission_data.bank) : null} />
                            <DataField label="Комиссия агента" value={application.commission_data.agent != null ? formatCurrency(application.commission_data.agent) : null} />
                        </>
                    )}
                </DataSection>
            )}

            {/* Documents Section */}
            {application.documents && application.documents.length > 0 && (
                <DataSection title="Документы" icon={FileText}>
                    <div className="col-span-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {application.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="h-4 w-4 text-[#4F7DF3] shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-sm truncate block">{doc.name}</span>
                                            <span className="text-xs text-muted-foreground">{doc.type_display}</span>
                                        </div>
                                    </div>
                                    {doc.file_url && (
                                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => window.open(doc.file_url, '_blank')}>
                                            <Download className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </DataSection>
            )}

            {/* Notes Section */}
            {application.notes && (
                <DataSection title="Заметки" icon={MessageSquare}>
                    <div className="col-span-full">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all overflow-wrap-anywhere">{application.notes}</p>
                    </div>
                </DataSection>
            )}
        </div>
    )
}

// ============================================
// Main Component
// ============================================

export function AdminApplicationsView({ onSelectApplication }: AdminApplicationsViewProps) {
    const { applications, isLoading, refetch } = useApplications()
    const { partners } = usePartners()
    const { assignPartner, isLoading: isAssigning } = usePartnerActions()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [productFilter, setProductFilter] = useState<string>("all")
    const [creatorFilter, setCreatorFilter] = useState<number | null>(null)
    const [creatorLabel, setCreatorLabel] = useState<string>("")
    const [showAssignDialog, setShowAssignDialog] = useState(false)
    const [selectedAppForAssign, setSelectedAppForAssign] = useState<number | null>(null)
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return (applications || []).filter((app) => {
            if (statusFilter !== "all" && app.status !== statusFilter) return false
            if (productFilter !== "all" && app.product_type !== productFilter) return false
            if (creatorFilter && app.created_by !== creatorFilter) return false
            const query = searchQuery.toLowerCase()
            if (query) {
                return (
                    app.id.toString().includes(query) ||
                    app.company_name?.toLowerCase().includes(query) ||
                    (app.company_inn || "").toLowerCase().includes(query) ||
                    (app.created_by_email || "").toLowerCase().includes(query) ||
                    (app.created_by_name || "").toLowerCase().includes(query) ||
                    (app.tender_number || "").toLowerCase().includes(query) ||
                    (app.external_id || "").toLowerCase().includes(query)
                )
            }
            return true
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [applications, statusFilter, productFilter, creatorFilter, searchQuery])

    // Stats
    const stats = useMemo(() => {
        const apps = applications || []
        return {
            total: apps.length,
            pending: apps.filter(a => a.status === "pending" || a.status === "in_review").length,
            approved: apps.filter(a => a.status === "approved" || a.status === "won").length,
        }
    }, [applications])

    // Handlers
    const handleRowClick = (appId: number) => {
        if (onSelectApplication) {
            onSelectApplication(appId.toString())
        }
    }

    const handleCreatorClick = (app: typeof filteredApplications[0], e: React.MouseEvent) => {
        e.stopPropagation()
        if (!app.created_by) return

        if (creatorFilter === app.created_by) {
            setCreatorFilter(null)
            setCreatorLabel("")
            return
        }

        setCreatorFilter(app.created_by)
        setCreatorLabel(app.created_by_name || app.created_by_email || `ID ${app.created_by}`)
    }

    const clearCreatorFilter = () => {
        setCreatorFilter(null)
        setCreatorLabel("")
    }

    const toggleExpand = (appId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setExpandedRows(prev => {
            const newSet = new Set(prev)
            if (newSet.has(appId)) {
                newSet.delete(appId)
            } else {
                newSet.add(appId)
            }
            return newSet
        })
    }

    const handleOpenAssignDialog = (appId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedAppForAssign(appId)
        setSelectedPartnerId("")
        setShowAssignDialog(true)
    }

    const handleConfirmAssign = async () => {
        if (!selectedAppForAssign || !selectedPartnerId) return
        const result = await assignPartner(selectedAppForAssign, parseInt(selectedPartnerId))
        if (result) {
            toast.success("Партнёр назначен")
            refetch()
        }
        setShowAssignDialog(false)
    }

    const formatCurrency = (amount: string | number | null | undefined) => {
        if (amount === null || amount === undefined || amount === "") return null
        return new Intl.NumberFormat("ru-RU", {
            maximumFractionDigits: 0,
        }).format(Number(amount))
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU")
    }

    const getProductPrefix = (productType: string) => {
        return PRODUCT_TABS.find(p => p.value === productType)?.prefix || "ЗА"
    }

    const getCreatorBadge = (role?: string) => {
        if (!role) return null
        const config: Record<string, { label: string; className: string }> = {
            agent: { label: "А", className: "bg-[#4F7DF3]/10 text-[#4F7DF3] border-[#4F7DF3]/30" },
            client: { label: "К", className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border-[#3CE8D1]/30" },
            admin: { label: "ADM", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
            partner: { label: "П", className: "bg-[#E03E9D]/10 text-[#E03E9D] border-[#E03E9D]/30" },
        }
        const badge = config[role] || { label: role.toUpperCase(), className: "bg-muted text-muted-foreground border-border" }

        return (
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", badge.className)}>
                {badge.label}
            </Badge>
        )
    }

    const getTenderLaw = (app: typeof filteredApplications[0]) => {
        return app.tender_law || app.goscontract_data?.law || null
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    // Mobile Application Card
    const ApplicationCard = ({ app }: { app: typeof filteredApplications[0] }) => {
        const statusCfg = getStatusConfig(app.status)
        const isExpanded = expandedRows.has(app.id)
        const law = getTenderLaw(app)
        const primaryAmount = getPrimaryAmountValue(app)
        const amountLabel = primaryAmount !== null ? `${formatCurrency(primaryAmount)} ₽` : "—"

        return (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                    onClick={() => handleRowClick(app.id)}
                    className="p-3 md:p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                >
                    {/* Header: ID + Status + Expand */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                                onClick={(e) => toggleExpand(app.id, e)}
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <span className="text-sm font-mono text-[#3CE8D1]">
                                {getProductPrefix(app.product_type)}-{app.id}
                            </span>
                            {law && (
                                <Badge variant="outline" className="text-xs">
                                    {TENDER_LAW_LABELS[law] || law}
                                </Badge>
                            )}
                        </div>
                        <Badge className={cn("text-xs", statusCfg.bgColor, statusCfg.color)}>
                            {statusCfg.label}
                        </Badge>
                    </div>

                    {/* Company */}
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{app.company_name || "—"}</p>
                            {app.company_inn && (
                                <p className="text-xs text-muted-foreground">ИНН: {app.company_inn}</p>
                            )}
                        </div>
                    </div>

                    {/* Amount + Date */}
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{amountLabel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(app.created_at)}</span>
                        </div>
                    </div>

                    {/* Creator + Bank */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                            <User className="h-3 w-3 shrink-0" />
                            {getCreatorBadge(app.created_by_role)}
                            <button
                                type="button"
                                onClick={(e) => handleCreatorClick(app, e)}
                                className="truncate hover:underline"
                                title="Фильтр по создателю"
                            >
                                {app.created_by_name || app.created_by_email || "—"}
                            </button>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleRowClick(app.id)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Просмотр
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleOpenAssignDialog(app.id, e as unknown as React.MouseEvent)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Назначить партнёра
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && <ApplicationExpandedDetails applicationId={app.id} />}
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Заявки</h1>
                    <p className="text-sm text-muted-foreground">
                        {stats.total} всего • {stats.pending} в работе • {stats.approved} одобрено
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto">
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Обновить
                </Button>
            </div>

            {/* Product Tabs - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {PRODUCT_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => { setProductFilter(tab.value) }}
                            className={cn(
                                "px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                productFilter === tab.value
                                    ? "bg-[#3CE8D1] text-black"
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            <span className="md:hidden">{tab.shortLabel}</span>
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="p-3 md:py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Поиск по ID, компании, ИНН, агенту, тендеру..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Статус" />
                            </SelectTrigger>
<SelectContent>
                                <SelectItem value="all">Все статусы</SelectItem>
                                <SelectItem value="draft">Создание заявки</SelectItem>
                                <SelectItem value="pending">Отправка на скоринг</SelectItem>
                                <SelectItem value="in_review">На рассмотрении в банке</SelectItem>
                                <SelectItem value="info_requested">Возвращение на доработку</SelectItem>
                                <SelectItem value="approved">Одобрен</SelectItem>
                                <SelectItem value="rejected">Отказано</SelectItem>
                                <SelectItem value="won">Выдан</SelectItem>
                                <SelectItem value="lost">Не выдан</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {creatorFilter && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                        Фильтр по создателю: {creatorLabel}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={clearCreatorFilter}>
                        Сбросить
                    </Button>
                </div>
            )}

            {/* Applications List */}
            <Card className="border-border">
                <CardContent className="p-0">
                    {filteredApplications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">Заявки не найдены</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Card View */}
                            <div className="md:hidden p-3 space-y-3">
                                {filteredApplications.map((app) => (
                                    <ApplicationCard key={app.id} app={app} />
                                ))}
                            </div>

                            {/* Desktop: Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/30">
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 w-10"></th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 min-w-[60px]">#</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 min-w-[200px]">Компания</th>
                                            <th className="hidden lg:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[120px]">Продукт</th>
                                            <th className="hidden 2xl:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[100px]">Закон</th>
                                            <th className="hidden lg:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[120px]">МФО/Банк</th>
                                            <th className="hidden lg:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[100px]">Сумма</th>
                                            <th className="hidden 2xl:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[150px]">Создатель</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 min-w-[100px]">Статус</th>
                                            <th className="hidden lg:table-cell text-left text-xs font-semibold text-muted-foreground p-4 min-w-[100px]">Дата</th>
                                            <th className="hidden 2xl:table-cell text-center text-xs font-semibold text-muted-foreground p-4 min-w-[50px]">
                                                <MessageSquare className="h-4 w-4 mx-auto" />
                                            </th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4 min-w-[50px]">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredApplications.map((app) => {
                                            const statusCfg = getStatusConfig(app.status)
                                            const isExpanded = expandedRows.has(app.id)
                                            const law = getTenderLaw(app)
                                            const primaryAmount = getPrimaryAmountValue(app)
                                            const amountLabel = primaryAmount !== null ? `${formatCurrency(primaryAmount)} ₽` : "—"

                                            return (
                                                <React.Fragment key={app.id}>
                                                    <tr
                                                        className={cn("hover:bg-muted/30 cursor-pointer transition-colors", isExpanded && "bg-accent/30")}
                                                        onClick={() => handleRowClick(app.id)}
                                                    >
                                                        <td className="p-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => toggleExpand(app.id, e)}
                                                            >
                                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            </Button>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm font-mono text-[#3CE8D1]">
                                                                {getProductPrefix(app.product_type)}-{app.id}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {app.company_name || "—"}
                                                                </p>
                                                                {app.company_inn && (
                                                                    <p className="text-xs text-muted-foreground font-mono">
                                                                        ИНН {app.company_inn}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="hidden lg:table-cell p-4">
                                                            <span className="text-sm text-foreground">
                                                                {PRODUCT_TABS.find(p => p.value === app.product_type)?.shortLabel || getProductTypeLabel(app.product_type, app.product_type_display)}
                                                            </span>
                                                        </td>
                                                        <td className="hidden 2xl:table-cell p-4">
                                                            {law ? (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {TENDER_LAW_LABELS[law] || law}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                        <td className="hidden lg:table-cell p-4">
                                                            <span className="text-sm text-foreground">
                                                                {app.target_bank_name || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="hidden lg:table-cell p-4">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {amountLabel}
                                                            </span>
                                                        </td>
                                                        <td className="hidden 2xl:table-cell p-4">
                                                            <div className="max-w-[180px] space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    {getCreatorBadge(app.created_by_role)}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleCreatorClick(app, e)}
                                                                        className="text-sm text-foreground truncate hover:underline"
                                                                        title="Фильтр по создателю"
                                                                    >
                                                                        {app.created_by_name || "—"}
                                                                    </button>
                                                                </div>
                                                                {app.created_by_email && (
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {app.created_by_email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge className={cn("text-xs", statusCfg.bgColor, statusCfg.color)}>
                                                                {statusCfg.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="hidden lg:table-cell p-4">
                                                            <span className="text-sm text-muted-foreground">
                                                                {formatDate(app.created_at)}
                                                            </span>
                                                        </td>
                                                        <td className="hidden 2xl:table-cell p-4 text-center">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </td>
                                                        <td className="p-4">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleRowClick(app.id)}>
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Просмотр
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => handleOpenAssignDialog(app.id, e as unknown as React.MouseEvent)}>
                                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                                        Назначить партнёра
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={12} className="p-0">
                                                                <ApplicationExpandedDetails applicationId={app.id} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Partner Assignment Dialog */}
            <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-[#3CE8D1]" />
                            Назначить партнёра
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>Выберите партнёра для заявки #{selectedAppForAssign}</p>
                                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите партнёра..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {partners.map((p) => (
                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                {p.first_name} {p.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAssign}
                            disabled={!selectedPartnerId || isAssigning}
                            className="w-full sm:w-auto bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        >
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Назначить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

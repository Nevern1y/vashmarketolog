"use client"

import { useState } from "react"
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

interface AdminApplicationDetailProps {
    applicationId: string
    onBack: () => void
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "Новая", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    in_review: { label: "В работе", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    info_requested: { label: "Запрос инфо", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    approved: { label: "Одобрено", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    rejected: { label: "Отклонено", color: "text-rose-500", bgColor: "bg-rose-500/10" },
    won: { label: "Выигран", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
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
}

// Bank Guarantee types (ТЗ: Банковская гарантия)
const GUARANTEE_TYPE_LABELS: Record<string, string> = {
    application_security: "Обеспечение заявки",
    contract_execution: "Исполнение контракта",
    advance_return: "Возврат аванса",
    warranty_obligations: "Гарантийные обязательства",
    payment_guarantee: "Гарантии оплаты товара",
    customs_guarantee: "Таможенные гарантии",
    vat_refund: "Возмещение НДС",
}

// Tender law types (ТЗ: Банковская гарантия)
const TENDER_LAW_LABELS: Record<string, string> = {
    "44_fz": "44-ФЗ",
    "223_fz": "223-ФЗ",
    "615_pp": "615-ПП",
    "185_fz": "185-ФЗ",
    kbg: "КБГ (Коммерческая)",
    commercial: "Коммерческий",
}

// Factoring types (ТЗ: Факторинг)
const FACTORING_TYPE_LABELS: Record<string, string> = {
    classic: "Классический факторинг",
    closed: "Закрытый факторинг",
    procurement: "Закупочный факторинг",
}

// Insurance category labels (ТЗ: Страхование)
const INSURANCE_CATEGORY_LABELS: Record<string, string> = {
    personnel: "Персонал",
    transport: "Транспорт",
    property: "Имущество",
    liability: "Ответственность",
}

// Insurance product type labels (ТЗ: Страхование)
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

// Credit sub-types (ТЗ: Корпоративный кредит)
const CREDIT_SUB_TYPE_LABELS: Record<string, string> = {
    one_time_credit: "Разовый кредит",
    non_revolving_line: "Невозобновляемая КЛ",
    revolving_line: "Возобновляемая КЛ",
    overdraft: "Овердрафт",
}

// Account types (ТЗ: РКО и Спецсчета)
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    rko: "РКО",
    special: "Спецсчёт",
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

    const statusCfg = application ? STATUS_CONFIG[application.status] || STATUS_CONFIG.pending : STATUS_CONFIG.pending

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(parseFloat(amount || "0"))
    }

    const formatDate = (dateStr: string | null) => {
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
        // Set status back to in_review for reconsideration
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Заявка #{application.id}</h1>
                        <p className="text-sm text-muted-foreground">{PRODUCT_LABELS[application.product_type] || application.product_type}</p>
                    </div>
                </div>
                <Badge className={cn("text-sm px-3 py-1", statusCfg.bgColor, statusCfg.color)}>{statusCfg.label}</Badge>
            </div>

            {/* Action Buttons - Dynamic based on status */}
            <div className="flex items-center gap-3">
                {/* Request Info button - only for applications under review */}
                {(application.status === 'pending' || application.status === 'in_review' || application.status === 'info_requested') && (
                    <Button variant="outline" onClick={() => setShowRequestDialog(true)} disabled={isActioning}>
                        <MessageSquare className="h-4 w-4 mr-2" />Запросить инфо
                    </Button>
                )}

                {/* Status: rejected/lost → only Restore button (no Approve) */}
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

                {/* Status: approved/won → only Review button (no Reject) */}
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

                {/* Status: pending/in_review/info_requested → both Reject and Approve */}
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

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left: Company Info */}
                <Card className="col-span-4 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" />Компания</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow label="Название" value={application.company_name} />
                        <InfoRow label="ИНН" value={application.company_inn} mono />
                        {application.company_data && (
                            <>
                                <InfoRow label="КПП" value={application.company_data.kpp} mono />
                                <InfoRow label="ОГРН" value={application.company_data.ogrn} mono />
                                <InfoRow label="Руководитель" value={application.company_data.director_name} />
                            </>
                        )}
                        <Separator className="my-3" />
                        <InfoRow label="Создано" value={formatDate(application.created_at)} />
                        <InfoRow label="Обновлено" value={formatDate(application.updated_at)} />
                    </CardContent>
                </Card>

                {/* Middle: Application Details */}
                <Card className="col-span-4 border-border">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Параметры заявки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow label="Сумма" value={formatCurrency(application.amount)} highlight />
                        <InfoRow label="Срок" value={`${application.term_months} мес.`} />
                        <InfoRow label="Целевой банк" value={application.target_bank_name || "—"} />
                        {application.tender_number && <InfoRow label="№ тендера" value={application.tender_number} mono />}
                        {application.tender_platform && <InfoRow label="Площадка" value={application.tender_platform} />}
                        {application.tender_deadline && <InfoRow label="Дедлайн" value={formatDate(application.tender_deadline)} />}
                        {application.external_id && <InfoRow label="External ID" value={application.external_id} mono />}
                        {application.bank_status && <InfoRow label="Статус банка" value={application.bank_status} />}

                        {/* Product-specific fields section */}
                        <Separator className="my-3" />
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Параметры продукта</p>

                        {/* Bank Guarantee specific */}
                        {application.product_type === 'bank_guarantee' && (
                            <>
                                {application.guarantee_type && (
                                    <InfoRow
                                        label="Тип гарантии"
                                        value={GUARANTEE_TYPE_LABELS[application.guarantee_type] || application.guarantee_type}
                                    />
                                )}
                                {application.tender_law && (
                                    <InfoRow
                                        label="Закон"
                                        value={TENDER_LAW_LABELS[application.tender_law] || application.tender_law}
                                    />
                                )}
                                {application.goscontract_data?.purchase_number && (
                                    <InfoRow label="№ закупки" value={application.goscontract_data.purchase_number} mono />
                                )}
                                {application.goscontract_data?.subject && (
                                    <InfoRow label="Предмет закупки" value={application.goscontract_data.subject} />
                                )}
                                {application.goscontract_data?.beneficiary_inn && (
                                    <InfoRow label="ИНН заказчика" value={application.goscontract_data.beneficiary_inn} mono />
                                )}
                                {application.goscontract_data?.beneficiary_name && (
                                    <InfoRow label="Заказчик" value={application.goscontract_data.beneficiary_name} />
                                )}
                                {application.goscontract_data?.initial_price && (
                                    <InfoRow label="Начальная цена" value={formatCurrency(application.goscontract_data.initial_price)} />
                                )}
                                {application.goscontract_data?.offered_price && (
                                    <InfoRow label="Предложенная цена" value={formatCurrency(application.goscontract_data.offered_price)} />
                                )}
                                {application.goscontract_data?.guarantee_start_date && (
                                    <InfoRow label="Срок БГ с" value={formatDate(application.goscontract_data.guarantee_start_date)} />
                                )}
                                {application.goscontract_data?.guarantee_end_date && (
                                    <InfoRow label="Срок БГ по" value={formatDate(application.goscontract_data.guarantee_end_date)} />
                                )}
                                {/* BG Checkboxes per ТЗ */}
                                {application.goscontract_data?.is_close_auction && (
                                    <InfoRow label="Закрытый конкурс/аукцион" value="Да" />
                                )}
                                {application.goscontract_data?.has_advance && (
                                    <InfoRow label="Наличие аванса" value="Да" />
                                )}
                                {application.goscontract_data?.is_resecuring && (
                                    <InfoRow label="Является переобеспечением" value="Да" />
                                )}
                                {application.goscontract_data?.is_single_supplier && (
                                    <InfoRow label="Единственный поставщик" value="Да" />
                                )}
                                {application.goscontract_data?.no_eis_placement && (
                                    <InfoRow label="Без размещения в ЕИС" value="Да" />
                                )}
                                {application.goscontract_data?.tender_not_held && (
                                    <InfoRow label="Торги ещё не проведены" value="Да" />
                                )}
                                {application.goscontract_data?.needs_credit && (
                                    <InfoRow label="Клиенту нужен кредит" value="Да" />
                                )}
                            </>
                        )}

                        {/* Factoring specific */}
                        {application.product_type === 'factoring' && (
                            <>
                                {application.factoring_type && (
                                    <InfoRow
                                        label="Тип факторинга"
                                        value={FACTORING_TYPE_LABELS[application.factoring_type] || application.factoring_type}
                                    />
                                )}
                                {application.contractor_inn && (
                                    <InfoRow label="ИНН контрагента" value={application.contractor_inn} mono />
                                )}
                                {application.financing_term_days && (
                                    <InfoRow label="Срок финансирования" value={`${application.financing_term_days} дн.`} />
                                )}
                            </>
                        )}

                        {/* VED specific */}
                        {application.product_type === 'ved' && (
                            <>
                                {application.ved_currency && (
                                    <InfoRow label="Валюта" value={application.ved_currency} />
                                )}
                                {application.ved_country && (
                                    <InfoRow label="Страна платежа" value={application.ved_country} />
                                )}
                            </>
                        )}

                        {/* Insurance specific */}
                        {application.product_type === 'insurance' && (
                            <>
                                {application.insurance_category && (
                                    <InfoRow
                                        label="Категория"
                                        value={INSURANCE_CATEGORY_LABELS[application.insurance_category] || application.insurance_category}
                                    />
                                )}
                                {application.insurance_product_type && (
                                    <InfoRow
                                        label="Страховой продукт"
                                        value={INSURANCE_PRODUCT_LABELS[application.insurance_product_type] || application.insurance_product_type}
                                    />
                                )}
                            </>
                        )}

                        {/* Leasing specific */}
                        {application.product_type === 'leasing' && (
                            <>
                                {application.credit_sub_type && (
                                    <InfoRow
                                        label="Тип кредита"
                                        value={CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type}
                                    />
                                )}
                                {application.goscontract_data?.equipment_type && (
                                    <InfoRow label="Тип оборудования" value={application.goscontract_data.equipment_type} />
                                )}
                            </>
                        )}

                        {/* Corporate/Contract Credit specific */}
                        {(application.product_type === 'corporate_credit' || application.product_type === 'contract_loan' || application.product_type === 'tender_loan') && (
                            <>
                                {application.credit_sub_type && (
                                    <InfoRow
                                        label="Тип кредита"
                                        value={CREDIT_SUB_TYPE_LABELS[application.credit_sub_type] || application.credit_sub_type}
                                    />
                                )}
                                {application.pledge_description && (
                                    <InfoRow label="Обеспечение/залог" value={application.pledge_description} />
                                )}
                                {application.financing_term_days && (
                                    <InfoRow label="Срок (дни)" value={`${application.financing_term_days} дн.`} />
                                )}
                            </>
                        )}

                        {/* RKO/SpecAccount specific */}
                        {(application.product_type === 'rko' || application.product_type === 'special_account') && (
                            <>
                                {application.account_type && (
                                    <InfoRow
                                        label="Тип счёта"
                                        value={ACCOUNT_TYPE_LABELS[application.account_type] || application.account_type}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Notes & Documents */}
                <div className="col-span-4 space-y-6">
                    {/* Notes */}
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2"><Edit className="h-4 w-4" />Заметки менеджера</CardTitle>
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
                                    <Textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} rows={4} placeholder="Добавьте заметки..." />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes} className="bg-[#3CE8D1] text-[#0a1628]">
                                            {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}Сохранить
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(false)}><X className="h-3 w-3 mr-1" />Отмена</Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">{application.notes || "Нет заметок"}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border-border">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" />Документы</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {application.documents && application.documents.length > 0 ? (
                                <div className="space-y-2">
                                    {application.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="text-sm truncate max-w-[150px]">{doc.name}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}>
                                                <Download className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Нет прикреплённых документов</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Chat Section */}
            <Card className="border-border mt-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Чат по заявке
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ApplicationChat applicationId={applicationId} className="border-0" />
                </CardContent>
            </Card>

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

function InfoRow({ label, value, mono, highlight }: { label: string; value?: string; mono?: boolean; highlight?: boolean }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("font-medium", mono && "font-mono text-xs", highlight && "text-[#3CE8D1]")}>{value || "—"}</span>
        </div>
    )
}

"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import api, { type ApiError } from "@/lib/api"
import {
    Search,
    Loader2,
    RefreshCw,
    Phone,
    Mail,
    User,
    Calendar,
    Banknote,
    Clock,
    MoreHorizontal,
    MessageSquare,
    FileText,
    Building2,
    UserPlus,
    ExternalLink,
    Trash2,
    CheckCircle2,
} from "lucide-react"
import { useLeads, useLeadActions, useLeadComments, useLeadNotificationSettings, LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from "@/hooks/use-leads"
import type { Lead, LeadComment, LeadConvertData } from "@/hooks/use-leads"
import { useAdminUsers, getAdminDisplayName } from "@/hooks/use-admin-users"
import { ArrowRightCircle, UserCog, Send, Settings, X, Plus, Download } from "lucide-react"
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
    DropdownMenuSeparator,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

// ============================================
// Product Type Labels
// ============================================
const PRODUCT_TYPE_LABELS: Record<string, string> = {
    bank_guarantee: "Банковская гарантия",
    tender_loan: "Тендерный кредит",
    contract_loan: "КИК",
    corporate_credit: "Корпоративный кредит",
    factoring: "Факторинг",
    leasing: "Лизинг",
    ved: "ВЭД",
    insurance: "Страхование",
    rko: "РКО",
    special_account: "Спецсчет",
    tender_support: "Тендерное сопровождение",
    deposits: "Депозиты",
}

// ============================================
// Form Name Labels (mapping technical names to readable)
// ============================================
const FORM_NAME_LABELS: Record<string, string> = {
    // Landing page forms (actual values from lider-garant)
    callback_modal: "Обратный звонок",
    app_shell_callback: "Быстрый звонок",
    header_form: "Заявка из шапки",
    top_application_form: "Форма БГ (главная)",
    guarantee_calculator: "Калькулятор БГ",
    application_form_section: "Заявка на продукт",
    
    // Calculator forms
    calculator_bg: "Калькулятор БГ",
    calculator_credit: "Калькулятор кредита",
    calculator_guarantee: "Калькулятор гарантии",
    
    // Contact forms
    contact_form: "Контактная форма",
    callback_form: "Обратный звонок",
    consultation_form: "Консультация",
    question_form: "Вопрос специалисту",
    
    // Product forms
    bank_guarantee_form: "Заявка на БГ",
    tender_loan_form: "Заявка на тендерный кредит",
    credit_form: "Заявка на кредит",
    factoring_form: "Заявка на факторинг",
    leasing_form: "Заявка на лизинг",
    rko_form: "Заявка на РКО",
    insurance_form: "Заявка на страхование",
    deposit_form: "Заявка на депозит",
    ved_form: "Заявка на ВЭД",
    
    // Landing pages
    landing_bg: "Лендинг БГ",
    landing_credit: "Лендинг кредит",
    landing_main: "Главный лендинг",
    partners_modal: "Партнерская заявка",
    
    // Other
    footer_form: "Форма в футере",
    popup_form: "Всплывающая форма",
    sidebar_form: "Боковая форма",
}

/**
 * Get readable form name or return original if not found
 */
function getFormNameLabel(formName: string | null | undefined): string {
    if (!formName) return "—"
    return FORM_NAME_LABELS[formName] || formName
}

function getLeadProductLabel(lead: Lead): string {
    if (lead.form_name === "partners_modal") {
        return "Партнерство"
    }

    return PRODUCT_TYPE_LABELS[lead.product_type] || lead.product_type
}

// ============================================
// Main Component
// ============================================
export function AdminLeadsView() {
    const { leads, isLoading, refetch } = useLeads()
    const { updateLead, deleteLead, convertToApplication, isLoading: isActionLoading } = useLeadActions()
    const { admins, isLoading: isLoadingAdmins } = useAdminUsers()

    // Notification settings
    const { 
        settings: notificationSettings, 
        isLoading: isLoadingSettings, 
        updateSettings 
    } = useLeadNotificationSettings()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sourceFilter, setSourceFilter] = useState<string>("all")
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showConvertDialog, setShowConvertDialog] = useState(false)
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
    const [showNotesDialog, setShowNotesDialog] = useState(false)
    const [notesValue, setNotesValue] = useState("")
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [showAssignDialog, setShowAssignDialog] = useState(false)
    const [selectedManagerId, setSelectedManagerId] = useState<string>("unassigned")
    const [newCommentText, setNewCommentText] = useState("")
    const [isExporting, setIsExporting] = useState(false)
    
    // Settings dialog state
    const [showSettingsDialog, setShowSettingsDialog] = useState(false)
    const [emailEnabled, setEmailEnabled] = useState(true)
    const [emailList, setEmailList] = useState<string[]>([])
    const [newEmail, setNewEmail] = useState("")

    // Smart Convert Dialog state - for leads with incomplete data
    const [showSmartConvertDialog, setShowSmartConvertDialog] = useState(false)
    const [convertProductType, setConvertProductType] = useState("bank_guarantee")
    const [convertGuaranteeType, setConvertGuaranteeType] = useState("")
    const [convertAmount, setConvertAmount] = useState("")
    const [convertTermMonths, setConvertTermMonths] = useState("")

    // Comments for selected lead
    const { 
        comments, 
        isLoading: isLoadingComments, 
        addComment, 
        refetch: refetchComments 
    } = useLeadComments(selectedLead?.id ?? null)

    // Filtered leads
    const filteredLeads = useMemo(() => {
        return (leads || []).filter((lead) => {
            if (statusFilter !== "all" && lead.status !== statusFilter) return false
            if (sourceFilter !== "all" && lead.source !== sourceFilter) return false
            const query = searchQuery.toLowerCase()
            if (query) {
                const email = lead.email || ""
                const inn = lead.inn || ""
                const message = lead.message || ""
                const formName = lead.form_name || ""
                const pageUrl = lead.page_url || ""
                return (
                    lead.id.toString().includes(query) ||
                    lead.full_name.toLowerCase().includes(query) ||
                    lead.phone.toLowerCase().includes(query) ||
                    email.toLowerCase().includes(query) ||
                    inn.toLowerCase().includes(query) ||
                    message.toLowerCase().includes(query) ||
                    formName.toLowerCase().includes(query) ||
                    pageUrl.toLowerCase().includes(query)
                )
            }
            return true
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [leads, statusFilter, sourceFilter, searchQuery])

    // Stats
    const stats = useMemo(() => {
        const all = leads || []
        return {
            total: all.length,
            new: all.filter(l => l.status === "new").length,
            contacted: all.filter(l => l.status === "contacted").length,
            converted: all.filter(l => l.status === "converted").length,
        }
    }, [leads])

    // Handlers
    const handleStatusChange = async (leadId: number, newStatus: string) => {
        const result = await updateLead(leadId, { status: newStatus })
        if (result) {
            toast.success("Статус обновлён")
            refetch()
        } else {
            toast.error("Ошибка обновления статуса")
        }
    }

    const handleDeleteConfirm = async () => {
        if (!selectedLeadId) return
        const result = await deleteLead(selectedLeadId)
        if (result) {
            toast.success("Лид удалён")
            refetch()
        } else {
            toast.error("Ошибка удаления")
        }
        setShowDeleteDialog(false)
        setSelectedLeadId(null)
    }

    const handleConvertConfirm = async () => {
        if (!selectedLeadId) return
        const { data, error } = await convertToApplication(selectedLeadId)
        if (data) {
            toast.success(`Лид конвертирован в заявку`)
            refetch()
        } else {
            toast.error(error || "Ошибка конвертации")
        }
        setShowConvertDialog(false)
        setSelectedLeadId(null)
    }

    /**
     * Check if lead has complete data for direct conversion
     */
    const hasCompleteData = (lead: Lead): boolean => {
        return lead.amount !== null && lead.term_months !== null
    }

    /**
     * Get lead completeness info for UI indicators
     */
    const getLeadCompleteness = (lead: Lead): { type: 'ready' | 'interested' | 'callback'; color: string; label: string } => {
        const hasAmount = lead.amount !== null
        const hasTermMonths = lead.term_months !== null
        const hasInn = !!lead.inn
        const hasProduct = lead.product_type && lead.product_type !== 'bank_guarantee'

        if (lead.form_name === 'partners_modal') {
            return { type: 'interested', color: 'bg-indigo-400/10 text-indigo-400', label: 'Партнер' }
        }

        if (hasAmount && hasTermMonths) {
            return { type: 'ready', color: 'bg-emerald-400/10 text-emerald-400', label: 'Готов' }
        }
        if (hasProduct || hasAmount || hasInn || lead.guarantee_type) {
            return { type: 'interested', color: 'bg-amber-400/10 text-amber-400', label: 'Заинтересован' }
        }
        return { type: 'callback', color: 'bg-slate-400/10 text-slate-400', label: 'Обращение' }
    }

    const openConvertDialog = (lead: Lead) => {
        if (lead.converted_application) {
            toast.error("Этот лид уже конвертирован в заявку")
            return
        }
        
        setSelectedLead(lead)
        setSelectedLeadId(lead.id)
        
        // Prefill form with lead data
        setConvertProductType(lead.product_type || 'bank_guarantee')
        setConvertGuaranteeType(lead.guarantee_type || '')
        setConvertAmount(lead.amount?.toString() || '')
        setConvertTermMonths(lead.term_months?.toString() || '')
        
        // Check data completeness
        if (hasCompleteData(lead)) {
            // Complete data - show simple confirmation dialog
            setShowConvertDialog(true)
        } else {
            // Incomplete data - show smart convert dialog with form
            setShowSmartConvertDialog(true)
        }
    }

    /**
     * Handle smart convert with additional data
     */
    const handleSmartConvert = async () => {
        if (!selectedLeadId) return
        
        // Validate required fields
        if (!convertAmount || !convertTermMonths) {
            toast.error("Укажите сумму и срок")
            return
        }
        
        const convertData: LeadConvertData = {
            amount: convertAmount,
            term_months: parseInt(convertTermMonths),
            product_type: convertProductType,
            guarantee_type: convertGuaranteeType || undefined,
        }
        
        const { data, error } = await convertToApplication(selectedLeadId, convertData)
        if (data) {
            toast.success(`Лид конвертирован в заявку`)
            refetch()
        } else {
            toast.error(error || "Ошибка конвертации")
        }
        
        setShowSmartConvertDialog(false)
        setSelectedLeadId(null)
        setSelectedLead(null)
        // Reset form
        setConvertAmount('')
        setConvertTermMonths('')
        setConvertProductType('bank_guarantee')
        setConvertGuaranteeType('')
    }

    const openAssignDialog = (lead: Lead) => {
        setSelectedLeadId(lead.id)
        setSelectedManagerId(lead.assigned_to?.toString() || "unassigned")
        setShowAssignDialog(true)
    }

    const handleAssignManager = async () => {
        if (!selectedLeadId) return
        const assignedTo = selectedManagerId && selectedManagerId !== "unassigned" ? parseInt(selectedManagerId) : null
        const result = await updateLead(selectedLeadId, { assigned_to: assignedTo })
        if (result) {
            toast.success(assignedTo ? "Менеджер назначен" : "Менеджер снят")
            refetch()
        } else {
            toast.error("Ошибка назначения")
        }
        setShowAssignDialog(false)
        setSelectedLeadId(null)
        setSelectedManagerId("unassigned")
    }

    const handleAddComment = async () => {
        if (!newCommentText.trim()) {
            toast.error("Введите текст комментария")
            return
        }
        const result = await addComment(newCommentText.trim())
        if (result) {
            toast.success("Комментарий добавлен")
            setNewCommentText("")
        } else {
            toast.error("Ошибка добавления комментария")
        }
    }

    const handleExportCsv = async () => {
        try {
            setIsExporting(true)
            const { blob, filename } = await api.getBlob("/applications/admin/leads/export_csv/")
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = downloadUrl
            link.download = filename || "leads_export.csv"
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(downloadUrl)
            toast.success("Экспорт CSV начат")
        } catch (err) {
            const apiError = err as ApiError
            toast.error(apiError.message || "Ошибка экспорта CSV")
        } finally {
            setIsExporting(false)
        }
    }

    // Settings dialog handlers
    const openSettingsDialog = () => {
        if (notificationSettings) {
            setEmailEnabled(notificationSettings.email_enabled)
            setEmailList(notificationSettings.recipient_emails || [])
        }
        setNewEmail("")
        setShowSettingsDialog(true)
    }

    const handleAddEmail = () => {
        const email = newEmail.trim()
        if (!email) return
        if (!email.includes("@") || !email.includes(".")) {
            toast.error("Некорректный email адрес")
            return
        }
        if (emailList.includes(email)) {
            toast.error("Этот email уже в списке")
            return
        }
        setEmailList([...emailList, email])
        setNewEmail("")
    }

    const handleRemoveEmail = (email: string) => {
        setEmailList(emailList.filter(e => e !== email))
    }

    const handleSaveSettings = async () => {
        const result = await updateSettings({
            email_enabled: emailEnabled,
            recipient_emails: emailList,
        })
        if (result) {
            toast.success("Настройки сохранены")
            setShowSettingsDialog(false)
        } else {
            toast.error("Ошибка сохранения настроек")
        }
    }

    const handleSaveNotes = async () => {
        if (!selectedLeadId) return
        const result = await updateLead(selectedLeadId, { notes: notesValue })
        if (result) {
            toast.success("Заметка сохранена")
            refetch()
        } else {
            toast.error("Ошибка сохранения")
        }
        setShowNotesDialog(false)
        setSelectedLeadId(null)
        setNotesValue("")
    }

    const openNotesDialog = (lead: Lead) => {
        setSelectedLeadId(lead.id)
        setNotesValue(lead.notes || "")
        setShowNotesDialog(true)
    }

    const openDetailsDialog = (lead: Lead) => {
        setSelectedLead(lead)
        setShowDetailsDialog(true)
    }

    const formatCurrency = (amount: string | null) => {
        if (!amount) return "—"
        return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(parseFloat(amount)) + " ₽"
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatPhone = (phone: string) => {
        // Format phone for tel: link
        return phone.replace(/\D/g, "")
    }

    const formatPagePath = (url?: string) => {
        if (!url) return ""
        try {
            const parsed = new URL(url)
            const path = `${parsed.pathname}${parsed.search}`
            return path || parsed.pathname || url
        } catch {
            return url
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Лиды с сайта</h1>
                    <p className="text-sm text-muted-foreground">
                        {stats.total} всего • {stats.new} новых • {stats.contacted} в работе • {stats.converted} конвертировано
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={openSettingsDialog} className="flex-1 sm:flex-none">
                        <Settings className="h-4 w-4 mr-2" />
                        Настройки
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className="flex-1 sm:flex-none"
                    >
                        {isExporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Экспорт CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="flex-1 sm:flex-none">
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Обновить
                    </Button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {[
                        { value: "all", label: "Все" },
                        { value: "new", label: "Новые", color: "bg-[#3CE8D1]/20 text-[#3CE8D1]" },
                        { value: "contacted", label: "Связались", color: "bg-[#4F7DF3]/20 text-[#4F7DF3]" },
                        { value: "qualified", label: "Квалифицированы", color: "bg-[#FFD93D]/20 text-[#FFD93D]" },
                        { value: "converted", label: "Конвертированы", color: "bg-emerald-500/20 text-emerald-400" },
                        { value: "rejected", label: "Отклонены", color: "bg-[#E03E9D]/20 text-[#E03E9D]" },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={cn(
                                "px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                statusFilter === tab.value
                                    ? "bg-[#3CE8D1] text-black"
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                        >
                            {tab.label}
                            {tab.value !== "all" && (
                                <span className="ml-1.5 text-xs opacity-70">
                                    ({leads?.filter(l => l.status === tab.value).length || 0})
                                </span>
                            )}
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
                                placeholder="Поиск по имени, телефону, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Source Filter */}
                        <Select value={sourceFilter} onValueChange={setSourceFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Источник" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все источники</SelectItem>
                                <SelectItem value="website_calculator">Калькулятор</SelectItem>
                                <SelectItem value="website_form">Форма на сайте</SelectItem>
                                <SelectItem value="landing_page">Лендинг</SelectItem>
                                <SelectItem value="phone">Звонок</SelectItem>
                                <SelectItem value="other">Другое</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Leads List */}
            <Card className="border-border">
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Лиды не найдены</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Заявки с публичного сайта появятся здесь
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredLeads.map((lead) => {
                                const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new
                                const sourceConfig = LEAD_SOURCE_CONFIG[lead.source] || LEAD_SOURCE_CONFIG.other
                                const completeness = getLeadCompleteness(lead)

                                return (
                                    <div
                                        key={lead.id}
                                        className="p-4 md:p-5 hover:bg-accent/30 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            {/* Left: Contact Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-mono text-muted-foreground">#{lead.id}</span>
                                                        <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn("text-xs", sourceConfig.color)}>
                                                            {sourceConfig.label}
                                                        </Badge>
                                                        {/* Lead completeness indicator */}
                                                        {lead.status !== 'converted' && (
                                                            <Badge variant="outline" className={cn("text-xs", completeness.color)}>
                                                                {completeness.label}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                                                        {formatDate(lead.created_at)}
                                                    </span>
                                                </div>

                                                {/* Contact */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="text-sm font-medium text-foreground">{lead.full_name}</span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                    <a
                                                        href={`tel:+${formatPhone(lead.phone)}`}
                                                        className="flex items-center gap-1.5 text-[#3CE8D1] hover:underline"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {lead.phone}
                                                    </a>
                                                    {lead.email && (
                                                        <a
                                                            href={`mailto:${lead.email}`}
                                                            className="flex items-center gap-1.5 text-[#4F7DF3] hover:underline"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {lead.email}
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <FileText className="h-3.5 w-3.5" />
                                                        {getLeadProductLabel(lead)}
                                                    </span>
                                                    {lead.inn && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Building2 className="h-3.5 w-3.5" />
                                                            ИНН: {lead.inn}
                                                        </span>
                                                    )}
                                                    {lead.amount && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Banknote className="h-3.5 w-3.5" />
                                                            {formatCurrency(lead.amount)}
                                                        </span>
                                                    )}
                                                    {lead.term_months && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {lead.term_months} мес.
                                                        </span>
                                                    )}
                                                </div>

                                                {lead.message && (
                                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 whitespace-pre-line italic">
                                                        Сообщение: {lead.message}
                                                    </p>
                                                )}

                                                {(lead.form_name || lead.page_url) && (
                                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                        {lead.form_name && (
                                                            <span>Форма: {getFormNameLabel(lead.form_name)}</span>
                                                        )}
                                                        {lead.page_url && (
                                                            <a
                                                                href={lead.page_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-[#4F7DF3] hover:underline"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Страница: {formatPagePath(lead.page_url)}
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Assigned manager preview */}
                                                {lead.assigned_to_email && (
                                                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <UserCog className="h-3 w-3" />
                                                        Менеджер: {lead.assigned_to_email}
                                                    </p>
                                                )}

                                                {/* Notes preview */}
                                                {lead.notes && (
                                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1 italic">
                                                        Заметка: {lead.notes}
                                                    </p>
                                                )}

                                                {/* Mobile date */}
                                                <div className="sm:hidden mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(lead.created_at)}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Status change dropdown */}
                                                <Select
                                                    value={lead.status}
                                                    onValueChange={(value) => handleStatusChange(lead.id, value)}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">Новый</SelectItem>
                                                        <SelectItem value="contacted">Связались</SelectItem>
                                                        <SelectItem value="qualified">Квалифицирован</SelectItem>
                                                        <SelectItem value="converted">Конвертирован</SelectItem>
                                                        <SelectItem value="rejected">Отклонён</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                {/* More actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openDetailsDialog(lead)}>
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Детали заявки
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openNotesDialog(lead)}>
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            Добавить заметку
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openAssignDialog(lead)}>
                                                            <UserCog className="h-4 w-4 mr-2" />
                                                            Назначить менеджера
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => window.open(`tel:+${formatPhone(lead.phone)}`)}
                                                        >
                                                            <Phone className="h-4 w-4 mr-2" />
                                                            Позвонить
                                                        </DropdownMenuItem>
                                                        {lead.email && (
                                                            <DropdownMenuItem
                                                                onClick={() => window.open(`mailto:${lead.email}`)}
                                                            >
                                                                <Mail className="h-4 w-4 mr-2" />
                                                                Написать
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        {!lead.converted_application && (
                                                            <DropdownMenuItem
                                                                onClick={() => openConvertDialog(lead)}
                                                                className="text-[#3CE8D1] focus:text-[#3CE8D1]"
                                                            >
                                                                <ArrowRightCircle className="h-4 w-4 mr-2" />
                                                                Конвертировать в заявку
                                                            </DropdownMenuItem>
                                                        )}
                                                        {lead.converted_application && (
                                                            <DropdownMenuItem disabled className="text-muted-foreground">
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                Уже конвертирован
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setSelectedLeadId(lead.id)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Удалить
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Лид будет удалён навсегда.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Удалить"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Convert to Application Confirmation Dialog */}
            <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Конвертировать лид в заявку?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Будет создана новая заявка на основе данных этого лида. 
                            Лид получит статус "Конвертирован" и будет связан с созданной заявкой.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConvertConfirm}
                            className="bg-[#3CE8D1] text-black hover:bg-[#3CE8D1]/90"
                        >
                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Конвертировать"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Smart Convert Dialog - for leads with incomplete data */}
            <Dialog open={showSmartConvertDialog} onOpenChange={setShowSmartConvertDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Конвертировать лид в заявку</DialogTitle>
                        <DialogDescription>
                            Проверьте и дозаполните данные для создания заявки
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedLead && (
                        <div className="space-y-4 py-2">
                            {/* Contact info (read-only) */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground text-xs">ФИО</Label>
                                    <p className="font-medium">{selectedLead.full_name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs">Телефон</Label>
                                    <p className="font-medium">{selectedLead.phone}</p>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            {/* Editable fields */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Тип продукта</Label>
                                    <Select value={convertProductType} onValueChange={setConvertProductType}>
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                {/* Guarantee type - only for bank_guarantee */}
                                {convertProductType === 'bank_guarantee' && (
                                    <div>
                                        <Label>Тип гарантии</Label>
                                        <Select value={convertGuaranteeType || "none"} onValueChange={(v) => setConvertGuaranteeType(v === "none" ? "" : v)}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue placeholder="Выберите тип" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Не указан</SelectItem>
                                                <SelectItem value="application_security">Обеспечение заявки</SelectItem>
                                                <SelectItem value="contract_execution">Исполнение контракта</SelectItem>
                                                <SelectItem value="advance_return">Возврат аванса</SelectItem>
                                                <SelectItem value="warranty_obligations">Гарантийные обязательства</SelectItem>
                                                <SelectItem value="payment_guarantee">Гарантия оплаты</SelectItem>
                                                <SelectItem value="customs_guarantee">Таможенная гарантия</SelectItem>
                                                <SelectItem value="vat_refund">Возмещение НДС</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>
                                            Сумма, ₽ <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={convertAmount}
                                            onChange={(e) => setConvertAmount(e.target.value)}
                                            placeholder="1000000"
                                            className="mt-1.5"
                                            min={0}
                                        />
                                    </div>
                                    <div>
                                        <Label>
                                            Срок, мес. <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            type="number"
                                            value={convertTermMonths}
                                            onChange={(e) => setConvertTermMonths(e.target.value)}
                                            placeholder="12"
                                            className="mt-1.5"
                                            min={1}
                                            max={120}
                                        />
                                    </div>
                                </div>
                                
                                {/* Info about missing data */}
                                {(!selectedLead.amount || !selectedLead.term_months) && (
                                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                        Этот лид содержит неполные данные. Укажите недостающую информацию для создания заявки.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSmartConvertDialog(false)}>
                            Отмена
                        </Button>
                        <Button 
                            onClick={handleSmartConvert}
                            disabled={!convertAmount || !convertTermMonths || isActionLoading}
                            className="bg-[#3CE8D1] text-black hover:bg-[#3CE8D1]/90"
                        >
                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Создать заявку
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Manager Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Назначить менеджера</DialogTitle>
                        <DialogDescription>
                            Выберите менеджера, ответственного за работу с этим лидом
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Менеджер</Label>
                        <Select 
                            value={selectedManagerId} 
                            onValueChange={setSelectedManagerId}
                        >
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Выберите менеджера" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Не назначен</SelectItem>
                                {admins.map((admin) => (
                                    <SelectItem key={admin.id} value={admin.id.toString()}>
                                        {getAdminDisplayName(admin)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleAssignManager} disabled={isActionLoading || isLoadingAdmins}>
                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Назначить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Notes Dialog */}
            <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Заметка по лиду</DialogTitle>
                        <DialogDescription>
                            Добавьте комментарий или заметку для этого лида
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="notes">Заметка</Label>
                        <Textarea
                            id="notes"
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Введите текст заметки..."
                            className="mt-2"
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveNotes} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            <Dialog
                open={showDetailsDialog}
                onOpenChange={(open) => {
                    setShowDetailsDialog(open)
                    if (!open) setSelectedLead(null)
                }}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Детали заявки</DialogTitle>
                        <DialogDescription>Все введенные данные и источник заявки</DialogDescription>
                    </DialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>ФИО</Label>
                                    <p className="mt-1 text-sm">{selectedLead.full_name}</p>
                                </div>
                                <div>
                                    <Label>Телефон</Label>
                                    <p className="mt-1 text-sm">{selectedLead.phone}</p>
                                </div>
                                <div>
                                    <Label>Email</Label>
                                    <p className="mt-1 text-sm">{selectedLead.email || "—"}</p>
                                </div>
                                <div>
                                    <Label>ИНН</Label>
                                    <p className="mt-1 text-sm">{selectedLead.inn || "—"}</p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Продукт</Label>
                                    <p className="mt-1 text-sm">
                                        {selectedLead.product_type_display || PRODUCT_TYPE_LABELS[selectedLead.product_type] || selectedLead.product_type}
                                    </p>
                                </div>
                                <div>
                                    <Label>Тип гарантии</Label>
                                    <p className="mt-1 text-sm">{selectedLead.guarantee_type_display || "—"}</p>
                                </div>
                                <div>
                                    <Label>Сумма</Label>
                                    <p className="mt-1 text-sm">{formatCurrency(selectedLead.amount)}</p>
                                </div>
                                <div>
                                    <Label>Срок</Label>
                                    <p className="mt-1 text-sm">{selectedLead.term_months ? `${selectedLead.term_months} мес.` : "—"}</p>
                                </div>
                            </div>

                            <div>
                                <Label>Сообщение клиента</Label>
                                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedLead.message || "—"}</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Источник</Label>
                                    <p className="mt-1 text-sm">{selectedLead.source_display || (LEAD_SOURCE_CONFIG[selectedLead.source] || LEAD_SOURCE_CONFIG.other).label}</p>
                                </div>
                                <div>
                                    <Label>Форма</Label>
                                    <p className="mt-1 text-sm">{getFormNameLabel(selectedLead.form_name)}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Страница</Label>
                                    {selectedLead.page_url ? (
                                        <a
                                            href={selectedLead.page_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1 block text-sm text-[#4F7DF3] hover:underline"
                                        >
                                            {selectedLead.page_url}
                                        </a>
                                    ) : (
                                        <p className="mt-1 text-sm">—</p>
                                    )}
                                </div>
                                <div className="sm:col-span-2">
                                    <Label>Реферер</Label>
                                    {selectedLead.referrer ? (
                                        <a
                                            href={selectedLead.referrer}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-1 block text-sm text-[#4F7DF3] hover:underline"
                                        >
                                            {selectedLead.referrer}
                                        </a>
                                    ) : (
                                        <p className="mt-1 text-sm">—</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label>UTM</Label>
                                <p className="mt-1 text-sm">
                                    {(selectedLead.utm_source || "—")} / {(selectedLead.utm_medium || "—")} / {(selectedLead.utm_campaign || "—")}
                                </p>
                                {(selectedLead.utm_term || selectedLead.utm_content) && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        term: {selectedLead.utm_term || "—"} • content: {selectedLead.utm_content || "—"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>Заметка менеджера</Label>
                                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedLead.notes || "—"}</p>
                            </div>

                            {/* Comments Section */}
                            <div className="border-t pt-4">
                                <Label className="flex items-center gap-2 mb-3">
                                    <MessageSquare className="h-4 w-4" />
                                    Комментарии ({comments.length})
                                </Label>
                                
                                {/* Add Comment Form */}
                                <div className="flex gap-2 mb-4">
                                    <Textarea
                                        value={newCommentText}
                                        onChange={(e) => setNewCommentText(e.target.value)}
                                        placeholder="Добавить комментарий..."
                                        className="min-h-[60px] resize-none"
                                        rows={2}
                                    />
                                    <Button 
                                        type="button"
                                        onClick={handleAddComment}
                                        disabled={!newCommentText.trim() || isLoadingComments}
                                        className="h-[60px] px-4 shrink-0"
                                    >
                                        {isLoadingComments ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Добавить
                                    </Button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                    {isLoadingComments ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : comments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-3">
                                            Комментариев пока нет
                                        </p>
                                    ) : (
                                        comments.map((comment) => {
                                            const authorName = comment.author_name?.trim() || "Менеджер"
                                            const authorInitial = authorName.charAt(0).toUpperCase() || "М"

                                            return (
                                                <div 
                                                    key={comment.id} 
                                                    className="bg-muted/50 rounded-lg p-3"
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-[#3CE8D1]/15 text-[#3CE8D1] flex items-center justify-center text-xs font-semibold shrink-0">
                                                            {authorInitial}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {authorName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                    {formatDate(comment.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                {comment.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Назначенный менеджер</Label>
                                    <p className="mt-1 text-sm">{selectedLead.assigned_to_email || "Не назначен"}</p>
                                </div>
                                <div>
                                    <Label>Конвертирован в заявку</Label>
                                    <p className="mt-1 text-sm">
                                        {selectedLead.converted_application 
                                            ? `#${selectedLead.converted_application}` 
                                            : "Нет"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Создан</Label>
                                    <p className="mt-1 text-sm">{formatDate(selectedLead.created_at)}</p>
                                </div>
                                <div>
                                    <Label>Связались</Label>
                                    <p className="mt-1 text-sm">{selectedLead.contacted_at ? formatDate(selectedLead.contacted_at) : "—"}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                            Закрыть
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Настройки оповещений</DialogTitle>
                        <DialogDescription>
                            Настройте email-уведомления о новых лидах с сайта
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Email enabled toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="email-enabled" className="text-sm font-medium">
                                    Email-уведомления
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Отправлять email при получении нового лида
                                </p>
                            </div>
                            <Switch
                                id="email-enabled"
                                checked={emailEnabled}
                                onCheckedChange={setEmailEnabled}
                            />
                        </div>

                        {/* Email recipients */}
                        <div className="space-y-2">
                            <Label>Получатели уведомлений</Label>
                            <p className="text-xs text-muted-foreground">
                                Если список пуст — уведомления получат все администраторы
                            </p>
                            
                            {/* Add email form */}
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault()
                                            handleAddEmail()
                                        }
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon"
                                    onClick={handleAddEmail}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Email list */}
                            {emailList.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {emailList.map((email) => (
                                        <div
                                            key={email}
                                            className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-1.5"
                                        >
                                            <span className="text-sm">{email}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleRemoveEmail(email)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                            Отмена
                        </Button>
                        <Button onClick={handleSaveSettings} disabled={isLoadingSettings}>
                            {isLoadingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

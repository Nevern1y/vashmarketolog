"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
    UserPlus,
    ExternalLink,
    Trash2,
    CheckCircle2,
} from "lucide-react"
import { useLeads, useLeadActions, LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from "@/hooks/use-leads"
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
// Main Component
// ============================================
export function AdminLeadsView() {
    const { leads, isLoading, refetch } = useLeads()
    const { updateLead, deleteLead, isLoading: isActionLoading } = useLeadActions()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sourceFilter, setSourceFilter] = useState<string>("all")
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null)
    const [showNotesDialog, setShowNotesDialog] = useState(false)
    const [notesValue, setNotesValue] = useState("")

    // Filtered leads
    const filteredLeads = useMemo(() => {
        return (leads || []).filter((lead) => {
            if (statusFilter !== "all" && lead.status !== statusFilter) return false
            if (sourceFilter !== "all" && lead.source !== sourceFilter) return false
            const query = searchQuery.toLowerCase()
            if (query) {
                return (
                    lead.id.toString().includes(query) ||
                    lead.full_name.toLowerCase().includes(query) ||
                    lead.phone.toLowerCase().includes(query) ||
                    lead.email.toLowerCase().includes(query)
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

    const openNotesDialog = (lead: typeof leads[0]) => {
        setSelectedLeadId(lead.id)
        setNotesValue(lead.notes || "")
        setShowNotesDialog(true)
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
                <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto">
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Обновить
                </Button>
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
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                                return (
                                    <div
                                        key={lead.id}
                                        className="p-4 md:p-5 hover:bg-accent/30 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                                            {/* Left: Contact Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-muted-foreground">#{lead.id}</span>
                                                        <Badge className={cn("text-xs", statusConfig.bgColor, statusConfig.color)}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                        <Badge variant="outline" className={cn("text-xs", sourceConfig.color)}>
                                                            {sourceConfig.label}
                                                        </Badge>
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
                                                        {PRODUCT_TYPE_LABELS[lead.product_type] || lead.product_type}
                                                    </span>
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
                                                        <DropdownMenuItem onClick={() => openNotesDialog(lead)}>
                                                            <MessageSquare className="h-4 w-4 mr-2" />
                                                            Добавить заметку
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
        </div>
    )
}

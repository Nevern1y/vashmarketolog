"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
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
    ChevronRight,
} from "lucide-react"
import { useApplications, usePartnerActions } from "@/hooks/use-applications"
import { usePartners } from "@/hooks/use-partners"
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: "Новая", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    in_review: { label: "В работе", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    info_requested: { label: "Запрос", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    approved: { label: "Одобрено", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    rejected: { label: "Отклонено", color: "text-rose-500", bgColor: "bg-rose-500/10" },
    won: { label: "Выигран", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    lost: { label: "Проигран", color: "text-rose-500", bgColor: "bg-rose-500/10" },
}

const PRODUCT_TABS = [
    { value: "all", label: "Все продукты", shortLabel: "Все" },
    { value: "bank_guarantee", label: "Банковские гарантии", shortLabel: "БГ", prefix: "БГ" },
    { value: "tender_loan", label: "Кредиты для бизнеса", shortLabel: "Кредит", prefix: "КР" },
    { value: "leasing", label: "Лизинг для юрлиц", shortLabel: "Лизинг", prefix: "ЛЗ" },
    { value: "factoring", label: "Факторинг для бизнеса", shortLabel: "Факторинг", prefix: "ФК" },
    { value: "insurance", label: "Страхование СМР", shortLabel: "Страх.", prefix: "СТР" },
    { value: "ved", label: "Международные платежи", shortLabel: "ВЭД", prefix: "МП" },
    { value: "rko", label: "РКО и спецсчета", shortLabel: "РКО", prefix: "РКО" },
    { value: "deposit", label: "Депозиты", shortLabel: "Депозит", prefix: "ДП" },
]

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
    const [showAssignDialog, setShowAssignDialog] = useState(false)
    const [selectedAppForAssign, setSelectedAppForAssign] = useState<number | null>(null)
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return (applications || []).filter((app) => {
            if (statusFilter !== "all" && app.status !== statusFilter) return false
            if (productFilter !== "all" && app.product_type !== productFilter) return false
            const query = searchQuery.toLowerCase()
            if (query) {
                return (
                    app.id.toString().includes(query) ||
                    app.company_name?.toLowerCase().includes(query) ||
                    (app.company_inn || "").toLowerCase().includes(query)
                )
            }
            return true
        }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }, [applications, statusFilter, productFilter, searchQuery])

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

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat("ru-RU", {
            maximumFractionDigits: 0,
        }).format(parseFloat(amount))
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU")
    }

    const getProductPrefix = (productType: string) => {
        return PRODUCT_TABS.find(p => p.value === productType)?.prefix || "ЗА"
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
        const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
        return (
            <div
                onClick={() => handleRowClick(app.id)}
                className="p-3 md:p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
            >
                {/* Header: ID + Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <span className="text-sm font-mono text-[#3CE8D1]">
                            {getProductPrefix(app.product_type)}-{app.id}
                        </span>
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
                        <span className="font-medium">{formatCurrency(app.amount)} ₽</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(app.created_at)}</span>
                    </div>
                </div>

                {/* Bank + Actions */}
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground truncate">{app.target_bank_name || "—"}</span>
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
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Поиск по ID, компании, ИНН..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue placeholder="Статус" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все статусы</SelectItem>
                                <SelectItem value="pending">Новая</SelectItem>
                                <SelectItem value="in_review">В работе</SelectItem>
                                <SelectItem value="info_requested">Запрос инфо</SelectItem>
                                <SelectItem value="approved">Одобрено</SelectItem>
                                <SelectItem value="rejected">Отклонено</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

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
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">#</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Компания</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Продукт</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">МФО/Банк</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Сумма</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Статус</th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Дата</th>
                                            <th className="text-center text-xs font-semibold text-muted-foreground p-4">
                                                <MessageSquare className="h-4 w-4 mx-auto" />
                                            </th>
                                            <th className="text-left text-xs font-semibold text-muted-foreground p-4">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredApplications.map((app) => {
                                            const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
                                            return (
                                                <tr
                                                    key={app.id}
                                                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                                                    onClick={() => handleRowClick(app.id)}
                                                >
                                                    <td className="p-4">
                                                        <span className="text-sm font-mono text-muted-foreground">
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
                                                    <td className="p-4">
                                                        <span className="text-sm text-foreground">
                                                            {PRODUCT_TABS.find(p => p.value === app.product_type)?.label || app.product_type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-foreground">
                                                            {app.target_bank_name || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm font-medium text-foreground">
                                                            {formatCurrency(app.amount)} ₽
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge className={cn("text-xs", statusCfg.bgColor, statusCfg.color)}>
                                                            {statusCfg.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(app.created_at)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
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

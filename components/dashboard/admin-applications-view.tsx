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
    ChevronDown,
    MessageSquare,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    info_requested: { label: "Запрос инфо", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    approved: { label: "Одобрено", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    rejected: { label: "Отклонено", color: "text-rose-500", bgColor: "bg-rose-500/10" },
    won: { label: "Выигран", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    lost: { label: "Проигран", color: "text-rose-500", bgColor: "bg-rose-500/10" },
}

const PRODUCT_CONFIG: Record<string, { label: string; prefix: string }> = {
    bank_guarantee: { label: "Банковская гарантия", prefix: "БГ" },
    tender_loan: { label: "Тендерный кредит", prefix: "ТК" },
    contract_loan: { label: "КИК", prefix: "КИК" },
    corporate_credit: { label: "Корпоративный кредит", prefix: "КК" },
    factoring: { label: "Факторинг", prefix: "ФК" },
    ved: { label: "ВЭД", prefix: "ВЭД" },
    leasing: { label: "Лизинг", prefix: "ЛЗ" },
    insurance: { label: "Страхование", prefix: "СТР" },
    special_account: { label: "Спецсчёт", prefix: "СС" },
    rko: { label: "РКО", prefix: "РКО" },
    tender_support: { label: "Тендерное сопровождение", prefix: "ТС" },
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
    const [showAssignDialog, setShowAssignDialog] = useState(false)
    const [selectedAppForAssign, setSelectedAppForAssign] = useState<number | null>(null)
    const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return (applications || []).filter((app) => {
            // Status filter
            if (statusFilter !== "all" && app.status !== statusFilter) return false
            // Product filter
            if (productFilter !== "all" && app.product_type !== productFilter) return false
            // Search query
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
            style: "currency",
            currency: "RUB",
            maximumFractionDigits: 0,
        }).format(parseFloat(amount))
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Заявки</h1>
                    <p className="text-sm text-muted-foreground">
                        Всего {stats.total} заявок • {stats.pending} в работе • {stats.approved} одобрено
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Обновить
                </Button>
            </div>

            {/* Product Tabs per ТЗ */}
            <Tabs value={productFilter} onValueChange={setProductFilter} className="w-full">
                <TabsList className="h-10 p-1 bg-muted/50 overflow-x-auto flex-wrap gap-1">
                    <TabsTrigger value="all" className="text-xs px-3">Все</TabsTrigger>
                    <TabsTrigger value="bank_guarantee" className="text-xs px-3">Гарантии</TabsTrigger>
                    <TabsTrigger value="tender_loan" className="text-xs px-3">Кредиты</TabsTrigger>
                    <TabsTrigger value="ved" className="text-xs px-3">ВЭД</TabsTrigger>
                    <TabsTrigger value="leasing" className="text-xs px-3">Лизинг</TabsTrigger>
                    <TabsTrigger value="insurance" className="text-xs px-3">Страхование</TabsTrigger>
                    <TabsTrigger value="special_account" className="text-xs px-3">Спецсчета</TabsTrigger>
                    <TabsTrigger value="rko" className="text-xs px-3">РКО</TabsTrigger>
                    <TabsTrigger value="tender_support" className="text-xs px-3">Тендерное сопровождение</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="py-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
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
                            <SelectTrigger className="w-[160px]">
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

            {/* Applications Table */}
            <Card className="border-border">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
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
                                    <th className="text-center text-xs font-semibold text-muted-foreground p-4"><MessageSquare className="h-4 w-4 mx-auto" /></th>
                                    <th className="text-left text-xs font-semibold text-muted-foreground p-4">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredApplications.map((app) => {
                                    const statusCfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending
                                    const productCfg = PRODUCT_CONFIG[app.product_type]
                                    return (
                                        <tr
                                            key={app.id}
                                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                                            onClick={() => handleRowClick(app.id)}
                                        >
                                            <td className="p-4">
                                                <span className="text-sm font-mono text-muted-foreground">
                                                    {productCfg?.prefix || "ЗА"}-{app.id}
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
                                                    {productCfg?.label || app.product_type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-foreground">
                                                    {app.target_bank_name || "—"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium text-foreground">
                                                    {formatCurrency(app.amount)}
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

                    {filteredApplications.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground">Заявки не найдены</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Partner Assignment Dialog */}
            <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <AlertDialogContent>
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
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAssign}
                            disabled={!selectedPartnerId || isAssigning}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
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

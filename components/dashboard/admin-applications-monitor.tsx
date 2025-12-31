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
    Building2,
    FileText,
    ExternalLink,
    Eye,
    MoreHorizontal,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Send,
    UserPlus,
    ChevronRight,
    Calendar,
    TrendingUp,
} from "lucide-react"
import { useApplications } from "@/hooks/use-applications"
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { parseBankStatus } from "@/lib/status-mapping"
import { toast } from "sonner"

// ============================================
// Types
// ============================================

interface AdminApplicationsMonitorProps {
    onSelectApplication?: (applicationId: string) => void
}

// ============================================
// Status Configuration (Django internal statuses)
// ============================================

const INTERNAL_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; priority: number }> = {
    draft: { label: 'Черновик', color: 'text-slate-400', bgColor: 'bg-slate-700/50', priority: 0 },
    pending: { label: 'Новая', color: 'text-[#4F7DF3]', bgColor: 'bg-[#4F7DF3]/10', priority: 3 },
    in_review: { label: 'В обработке', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10', priority: 2 },
    info_requested: { label: 'Запрос инфо', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10', priority: 4 },
    approved: { label: 'Одобрено', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10', priority: 1 },
    rejected: { label: 'Отклонено', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10', priority: 0 },
    won: { label: 'Выигран', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', priority: 0 },
    lost: { label: 'Проигран', color: 'text-[#FF521D]', bgColor: 'bg-[#FF521D]/10', priority: 0 },
}

// Product type labels per ТЗ (8 products)
const PRODUCT_TYPE_CONFIG: Record<string, { label: string; prefix: string; icon: string }> = {
    bank_guarantee: { label: 'Гарантии', prefix: 'БГ', icon: '🛡️' },
    tender_loan: { label: 'Кредиты', prefix: 'ТК', icon: '💳' },
    contract_loan: { label: 'Кредит на исполнение', prefix: 'КИК', icon: '📋' },
    corporate_credit: { label: 'Корпоративный кредит', prefix: 'КК', icon: '🏢' },
    factoring: { label: 'Факторинг', prefix: 'ФК', icon: '📊' },
    ved: { label: 'ВЭД', prefix: 'ВЭД', icon: '🌍' },
    leasing: { label: 'Лизинг', prefix: 'ЛЗ', icon: '🚛' },
    insurance: { label: 'Страхование', prefix: 'СТР', icon: '🛡️' },
    special_account: { label: 'Спецсчета', prefix: 'СС', icon: '🏦' },
    rko: { label: 'РКО', prefix: 'РКО', icon: '💼' },
    tender_support: { label: 'Тендерное сопровождение', prefix: 'ТС', icon: '📝' },
}

// ============================================
// Component
// ============================================

export function AdminApplicationsMonitor({ onSelectApplication }: AdminApplicationsMonitorProps) {
    const { applications, isLoading, error, refetch } = useApplications()

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [productFilter, setProductFilter] = useState<string>("all")
    const [agentFilter, setAgentFilter] = useState<string>("all")
    const [urgencyFilter, setUrgencyFilter] = useState<string>("all")

    // Get unique agents for filter dropdown
    const uniqueAgents = useMemo(() => {
        const agents = new Map<string, string>()
        applications?.forEach(app => {
            const agentId = app.created_by_email || ''
            const agentName = app.created_by_name || app.created_by_email || ''
            if (agentId && !agents.has(agentId)) {
                agents.set(agentId, agentName)
            }
        })
        return Array.from(agents.entries()).map(([id, name]) => ({ id, name }))
    }, [applications])

    // Calculate days since creation
    const getDaysSinceCreation = (createdAt: string) => {
        const created = new Date(createdAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - created.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Get urgency level based on days
    const getUrgencyLevel = (days: number, status: string): 'critical' | 'warning' | 'normal' | 'completed' => {
        if (['approved', 'rejected', 'won', 'lost'].includes(status)) return 'completed'
        if (days >= 5) return 'critical'
        if (days >= 3) return 'warning'
        return 'normal'
    }

    // Filtered applications
    const filteredApplications = useMemo(() => {
        return (applications || [])
            .filter((app) => {
                // Status filter
                if (statusFilter !== "all" && app.status !== statusFilter) {
                    return false
                }
                // Product filter (8 products per ТЗ)
                if (productFilter !== "all" && app.product_type !== productFilter) {
                    return false
                }
                // Agent filter
                if (agentFilter !== "all" && app.created_by_email !== agentFilter) {
                    return false
                }
                // Urgency filter
                if (urgencyFilter !== "all") {
                    const days = getDaysSinceCreation(app.created_at)
                    const urgency = getUrgencyLevel(days, app.status)
                    if (urgencyFilter !== urgency) {
                        return false
                    }
                }
                // Search query (INN or company name)
                if (searchQuery) {
                    const query = searchQuery.toLowerCase()
                    const matchesCompany = app.company_name?.toLowerCase().includes(query)
                    const matchesInn = (app.company_inn || '').toLowerCase().includes(query)
                    const matchesId = app.id.toString().includes(query)
                    const matchesExternalId = (app.external_id || '').toLowerCase().includes(query)
                    if (!matchesCompany && !matchesInn && !matchesId && !matchesExternalId) {
                        return false
                    }
                }
                return true
            })
            // Sort by priority (pending/info_requested first) then by date
            .sort((a, b) => {
                const priorityA = INTERNAL_STATUS_CONFIG[a.status]?.priority || 0
                const priorityB = INTERNAL_STATUS_CONFIG[b.status]?.priority || 0
                if (priorityB !== priorityA) return priorityB - priorityA
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })
    }, [applications, statusFilter, productFilter, agentFilter, urgencyFilter, searchQuery])

    // Formatters
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

    // Generate composite application ID (uses PRODUCT_TYPE_CONFIG)
    const getCompositeId = (app: { id: number; product_type: string; created_at: string }) => {
        const year = new Date(app.created_at).getFullYear()
        const paddedId = app.id.toString().padStart(5, '0')
        const prefix = PRODUCT_TYPE_CONFIG[app.product_type]?.prefix || 'ЗА'
        return `${prefix}-${year}-${paddedId}`
    }

    // Get product label display
    const getProductLabel = (productType: string) => {
        return PRODUCT_TYPE_CONFIG[productType]?.label || productType
    }

    // Get bank/МФО display from application
    const getBankDisplay = (app: any) => {
        if (app.selected_banks && Array.isArray(app.selected_banks) && app.selected_banks.length > 0) {
            if (app.selected_banks.length === 1) {
                return app.selected_banks[0]
            }
            return `${app.selected_banks.length} банков`
        }
        return app.target_bank_name || '—'
    }

    // Get status badge for display
    const getStatusBadge = (app: { status: string; bank_status: string; external_id: string | null }) => {
        if (app.external_id && app.bank_status) {
            const bankConfig = parseBankStatus(app.bank_status)
            return (
                <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    bankConfig.bgColor,
                    bankConfig.color
                )}>
                    {bankConfig.label}
                </span>
            )
        }
        const config = INTERNAL_STATUS_CONFIG[app.status] || {
            label: app.status,
            color: 'text-slate-400',
            bgColor: 'bg-slate-700/50'
        }
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                config.bgColor,
                config.color
            )}>
                {config.label}
            </span>
        )
    }

    // Get urgency badge
    const getUrgencyBadge = (days: number, status: string) => {
        const urgency = getUrgencyLevel(days, status)

        if (urgency === 'completed') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-700/30 text-slate-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Завершено
                </span>
            )
        }

        if (urgency === 'critical') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400 animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    {days} дн.
                </span>
            )
        }

        if (urgency === 'warning') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#FFD93D]/10 text-[#FFD93D]">
                    <Clock className="h-3 w-3" />
                    {days} дн.
                </span>
            )
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#3CE8D1]/10 text-[#3CE8D1]">
                <Clock className="h-3 w-3" />
                {days} дн.
            </span>
        )
    }

    // Handle row click
    const handleRowClick = (appId: number) => {
        if (onSelectApplication) {
            onSelectApplication(appId.toString())
        }
    }

    // Quick actions
    const handleSendToBank = (appId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        toast.info(`Отправка заявки #${appId} в банк...`)
    }

    const handleAssignPartner = (appId: number, e: React.MouseEvent) => {
        e.stopPropagation()
        toast.info(`Назначение партнёра для заявки #${appId}...`)
    }

    // Stats
    const stats = useMemo(() => {
        const apps = applications || []
        const urgent = apps.filter(a => {
            const days = getDaysSinceCreation(a.created_at)
            return getUrgencyLevel(days, a.status) === 'critical'
        }).length
        return {
            total: apps.length,
            pending: apps.filter(a => a.status === 'pending' || a.status === 'in_review').length,
            sentToBank: apps.filter(a => !!a.external_id).length,
            urgent,
        }
    }, [applications])

    // ============================================
    // Render
    // ============================================

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header with Title */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Мониторинг заявок</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Управление и отслеживание всех заявок в системе
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Обновить
                    </Button>
                </div>

                {/* Stats Cards - Enhanced */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-border bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Всего заявок</p>
                                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-slate-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FFD93D]/30 bg-gradient-to-br from-[#FFD93D]/5 to-transparent">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">На рассмотрении</p>
                                    <p className="text-3xl font-bold text-[#FFD93D] mt-1">{stats.pending}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-[#FFD93D]/10 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-[#FFD93D]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#3CE8D1]/30 bg-gradient-to-br from-[#3CE8D1]/5 to-transparent">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Отправлено в банк</p>
                                    <p className="text-3xl font-bold text-[#3CE8D1] mt-1">{stats.sentToBank}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-[#3CE8D1]/10 flex items-center justify-center">
                                    <Building2 className="h-6 w-6 text-[#3CE8D1]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Требуют внимания</p>
                                    <p className="text-3xl font-bold text-red-400 mt-1">{stats.urgent}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Toolbar - Enhanced */}
                <Card className="border-border">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по ИНН, компании, ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-background border-border"
                                />
                            </div>
                            {/* Product Filter */}
                            <Select value={productFilter} onValueChange={setProductFilter}>
                                <SelectTrigger className="w-[160px] bg-background border-border">
                                    <SelectValue placeholder="Продукт" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все продукты</SelectItem>
                                    <SelectItem value="bank_guarantee">🛡️ Гарантии</SelectItem>
                                    <SelectItem value="tender_loan">💳 Кредиты</SelectItem>
                                    <SelectItem value="ved">🌍 ВЭД</SelectItem>
                                    <SelectItem value="leasing">🚛 Лизинг</SelectItem>
                                    <SelectItem value="insurance">🛡️ Страхование</SelectItem>
                                    <SelectItem value="special_account">🏦 Спецсчета</SelectItem>
                                    <SelectItem value="rko">💼 РКО</SelectItem>
                                    <SelectItem value="tender_support">📝 Тендерное сопровождение</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] bg-background border-border">
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="pending">Новые</SelectItem>
                                    <SelectItem value="in_review">В обработке</SelectItem>
                                    <SelectItem value="info_requested">Запрос инфо</SelectItem>
                                    <SelectItem value="approved">Одобрено</SelectItem>
                                    <SelectItem value="rejected">Отклонено</SelectItem>
                                    <SelectItem value="won">Выигран</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Urgency Filter */}
                            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                                <SelectTrigger className="w-[140px] bg-background border-border">
                                    <SelectValue placeholder="Срочность" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    <SelectItem value="critical">🔴 Критичные</SelectItem>
                                    <SelectItem value="warning">🟡 Внимание</SelectItem>
                                    <SelectItem value="normal">🟢 В норме</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Agent Filter */}
                            <Select value={agentFilter} onValueChange={setAgentFilter}>
                                <SelectTrigger className="w-[160px] bg-background border-border">
                                    <SelectValue placeholder="Агент" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все агенты</SelectItem>
                                    {uniqueAgents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {agent.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table - Enhanced */}
                {isLoading ? (
                    <Card className="border-border">
                        <CardContent className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-10 w-10 animate-spin text-[#3CE8D1]" />
                                <p className="text-sm text-muted-foreground">Загрузка заявок...</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card className="border-red-500/30 bg-red-500/5">
                        <CardContent className="py-8 text-center">
                            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                            <p className="text-red-400 font-medium">{error}</p>
                            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                                Повторить
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-800/50 border-b border-border">
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID заявки</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ticket ID</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Дата</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">В работе</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">МФО/Банк</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Клиент</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Продукт</th>
                                        <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Сумма</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Статус</th>
                                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredApplications.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="px-4 py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                                                    <p className="text-muted-foreground font-medium">
                                                        {searchQuery || statusFilter !== 'all' || agentFilter !== 'all'
                                                            ? "Заявки по заданным критериям не найдены"
                                                            : "Нет заявок в системе"}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground/70">
                                                        Попробуйте изменить фильтры
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredApplications.map((app, index) => {
                                            const days = getDaysSinceCreation(app.created_at)
                                            const urgency = getUrgencyLevel(days, app.status)

                                            return (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => handleRowClick(app.id)}
                                                    className={cn(
                                                        "group transition-all cursor-pointer",
                                                        index % 2 === 0 ? "bg-slate-900/20" : "bg-transparent",
                                                        "hover:bg-[#3CE8D1]/10",
                                                        urgency === 'critical' && "border-l-2 border-l-red-500",
                                                        urgency === 'warning' && "border-l-2 border-l-[#FFD93D]"
                                                    )}
                                                >
                                                    {/* Internal ID */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm font-bold text-[#3CE8D1]">
                                                                {getCompositeId(app)}
                                                            </span>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </td>

                                                    {/* Bank Ticket ID */}
                                                    <td className="px-4 py-3">
                                                        {app.external_id ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="font-mono text-sm text-[#4F7DF3] cursor-help">
                                                                        {app.external_id}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>ID заявки в банке</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground/30">—</span>
                                                        )}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-muted-foreground font-mono">
                                                            {formatDate(app.created_at)}
                                                        </span>
                                                    </td>

                                                    {/* Days in progress */}
                                                    <td className="px-4 py-3">
                                                        {getUrgencyBadge(days, app.status)}
                                                    </td>

                                                    {/* МФО/Банк */}
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-foreground">
                                                            {getBankDisplay(app)}
                                                        </span>
                                                    </td>

                                                    {/* Client */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col max-w-[180px]">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="text-sm font-medium text-foreground truncate cursor-help">
                                                                        {app.company_name || '—'}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{app.company_name || 'Название не указано'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            {app.company_inn && (
                                                                <span className="text-xs text-muted-foreground font-mono">
                                                                    ИНН {app.company_inn}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Product */}
                                                    <td className="px-4 py-3">
                                                        <Badge variant="secondary" className="text-xs font-medium">
                                                            {PRODUCT_TYPE_CONFIG[app.product_type]?.icon} {getProductLabel(app.product_type)}
                                                        </Badge>
                                                    </td>

                                                    {/* Amount */}
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-mono text-sm font-bold text-foreground">
                                                            {formatCurrency(app.amount)}
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        {getStatusBadge(app)}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-[#3CE8D1]"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleRowClick(app.id)
                                                                        }}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Открыть заявку</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleRowClick(app.id)
                                                                    }}>
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Просмотреть
                                                                    </DropdownMenuItem>
                                                                    {!app.external_id && (
                                                                        <DropdownMenuItem onClick={(e) => handleSendToBank(app.id, e)}>
                                                                            <Send className="h-4 w-4 mr-2" />
                                                                            Отправить в банк
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={(e) => handleAssignPartner(app.id, e)}>
                                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                                        Назначить партнёра
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Footer with row count */}
                        <div className="px-4 py-3 border-t border-border bg-slate-800/30">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                    Показано: <strong className="text-foreground">{filteredApplications.length}</strong> из {applications?.length || 0} заявок
                                </span>
                                <span>
                                    Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
                                </span>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    )
}

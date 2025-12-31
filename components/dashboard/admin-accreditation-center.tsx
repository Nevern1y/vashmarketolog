"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    Users,
    FileText,
    RefreshCw,
    Building2,
    Mail,
    Phone,
    Calendar,
    Download,
    Eye,
    User,
    Search,
    ChevronRight,
    Shield,
    CheckSquare,
    Square,
    ExternalLink,
    Copy,
    AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// ============================================
// Types
// ============================================

interface AgentAccreditation {
    id: number
    email: string
    phone?: string
    first_name: string
    last_name: string
    accreditation_status: 'none' | 'pending' | 'approved' | 'rejected'
    accreditation_submitted_at: string | null
    accreditation_comment: string
    company_name: string | null
    date_joined: string
    // New fields per ТЗ Настройки (Organization + Requisites tabs)
    company_inn?: string
    company_address?: string
    company_website?: string
    company_email?: string
    company_phone?: string
    director_name?: string
    director_position?: string
    signatory_basis?: 'charter' | 'power_of_attorney'
    tax_system?: string
    vat_rate?: string
    bank_bik?: string
    bank_name?: string
    bank_account?: string
    bank_corr_account?: string
}

interface DocumentVerification {
    id: string
    name: string
    description: string
    verified: boolean
    rejected: boolean
}

// Tax system options per ТЗ Настройки
const TAX_SYSTEM_LABELS: Record<string, string> = {
    osn: 'ОСН (Общая)',
    usn_income: 'УСН (Доходы)',
    usn_income_expense: 'УСН (Доходы-Расходы)',
    esn: 'ЕСХН',
    patent: 'ПСН (Патент)',
}

// Signatory basis labels per ТЗ
const SIGNATORY_BASIS_LABELS: Record<string, string> = {
    charter: 'Устава',
    power_of_attorney: 'Доверенности',
}

// Document types for accreditation (per agent_accreditation.pdf)
const ACCREDITATION_DOCUMENTS = [
    { id: 'charter', name: 'Устав организации', description: 'Устав в последней редакции' },
    { id: 'inn', name: 'Свидетельство ИНН', description: 'Копия свидетельства о постановке на учёт' },
    { id: 'ogrn', name: 'Свидетельство ОГРН', description: 'Копия свидетельства о регистрации' },
    { id: 'protocol', name: 'Решение/Протокол', description: 'Протокол о назначении директора' },
    { id: 'contract', name: 'Агентский договор', description: 'Подписанный договор с печатью' },
] as const

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    none: { label: 'Не подана', color: 'text-slate-400', bgColor: 'bg-slate-700/50', icon: AlertCircle },
    pending: { label: 'На проверке', color: 'text-[#FFD93D]', bgColor: 'bg-[#FFD93D]/10', icon: Clock },
    approved: { label: 'Аккредитован', color: 'text-[#3CE8D1]', bgColor: 'bg-[#3CE8D1]/10', icon: CheckCircle },
    rejected: { label: 'Отклонена', color: 'text-[#E03E9D]', bgColor: 'bg-[#E03E9D]/10', icon: XCircle },
}

// ============================================
// Component
// ============================================

export function AdminAccreditationCenter() {
    // State
    const [agents, setAgents] = useState<AgentAccreditation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAgent, setSelectedAgent] = useState<AgentAccreditation | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [rejectComment, setRejectComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Document verification state (local UI state)
    const [docVerification, setDocVerification] = useState<Record<string, DocumentVerification>>({})

    // Initialize doc verification when agent selected
    useEffect(() => {
        if (selectedAgent) {
            const initial: Record<string, DocumentVerification> = {}
            ACCREDITATION_DOCUMENTS.forEach(doc => {
                initial[doc.id] = {
                    id: doc.id,
                    name: doc.name,
                    description: doc.description,
                    verified: false,
                    rejected: false,
                }
            })
            setDocVerification(initial)
        }
    }, [selectedAgent?.id])

    // Calculate verification progress
    const verificationProgress = useMemo(() => {
        const docs = Object.values(docVerification)
        const verified = docs.filter(d => d.verified).length
        const rejected = docs.filter(d => d.rejected).length
        const total = docs.length
        const completed = verified + rejected
        return {
            verified,
            rejected,
            total,
            completed,
            percent: total > 0 ? Math.round((verified / total) * 100) : 0,
            allVerified: verified === total,
            hasRejected: rejected > 0,
        }
    }, [docVerification])

    // Load pending agents on mount
    useEffect(() => {
        loadAgents()
    }, [])

    const loadAgents = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/auth/admin/accreditation/?status=pending')
            const data: AgentAccreditation[] = Array.isArray(response)
                ? response
                : (response as any)?.results || []
            setAgents(data.sort((a, b) =>
                new Date(a.accreditation_submitted_at || 0).getTime() -
                new Date(b.accreditation_submitted_at || 0).getTime()
            ))
        } catch (error) {
            toast.error('Ошибка загрузки')
        } finally {
            setIsLoading(false)
        }
    }

    // Filtered agents
    const filteredAgents = useMemo(() => {
        if (!searchQuery.trim()) return agents
        const query = searchQuery.toLowerCase()
        return agents.filter(a =>
            a.email.toLowerCase().includes(query) ||
            (a.company_name || '').toLowerCase().includes(query) ||
            (a.company_inn || '').includes(query) ||
            `${a.first_name} ${a.last_name}`.toLowerCase().includes(query)
        )
    }, [agents, searchQuery])

    // Helpers
    const getFullName = (agent: AgentAccreditation) => {
        if (agent.first_name || agent.last_name) {
            return `${agent.last_name || ''} ${agent.first_name || ''}`.trim()
        }
        return agent.email.split('@')[0]
    }

    const getInitials = (agent: AgentAccreditation) => {
        if (agent.first_name && agent.last_name) {
            return `${agent.last_name[0]}${agent.first_name[0]}`.toUpperCase()
        }
        return agent.email.substring(0, 2).toUpperCase()
    }

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const getDaysWaiting = (submittedAt: string | null) => {
        if (!submittedAt) return 0
        const submitted = new Date(submittedAt)
        const now = new Date()
        return Math.ceil((now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Toggle document verification
    const toggleDocVerified = (docId: string) => {
        setDocVerification(prev => ({
            ...prev,
            [docId]: {
                ...prev[docId],
                verified: !prev[docId].verified,
                rejected: false, // Can't be both
            }
        }))
    }

    const toggleDocRejected = (docId: string) => {
        setDocVerification(prev => ({
            ...prev,
            [docId]: {
                ...prev[docId],
                rejected: !prev[docId].rejected,
                verified: false, // Can't be both
            }
        }))
    }

    // Contact actions
    const handleCall = (phone?: string) => {
        if (phone) {
            window.open(`tel:${phone}`, '_self')
        } else {
            toast.error('Телефон не указан')
        }
    }

    const handleEmail = (email: string) => {
        window.open(`mailto:${email}`, '_blank')
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} скопирован`)
    }

    // Actions
    const handleAction = (type: 'approve' | 'reject') => {
        if (type === 'approve' && !verificationProgress.allVerified) {
            toast.warning('Сначала проверьте все документы')
            return
        }
        setActionType(type)
    }

    const confirmAction = async () => {
        if (!selectedAgent || !actionType) return

        setIsSubmitting(true)
        try {
            const endpoint = actionType === 'approve'
                ? `/auth/admin/accreditation/${selectedAgent.id}/approve/`
                : `/auth/admin/accreditation/${selectedAgent.id}/reject/`

            const payload = actionType === 'reject' ? { comment: rejectComment } : {}

            await api.post(endpoint, payload)

            toast.success(actionType === 'approve'
                ? `Агент ${getFullName(selectedAgent)} аккредитован`
                : `Заявка агента ${getFullName(selectedAgent)} отклонена`
            )

            setAgents(agents.filter(a => a.id !== selectedAgent.id))
            setSelectedAgent(null)
            setActionType(null)
            setRejectComment('')
        } catch (error: any) {
            toast.error(error.message || 'Ошибка обработки')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============================================
    // Render
    // ============================================

    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Shield className="h-6 w-6 text-[#3CE8D1]" />
                            Центр аккредитации
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Проверка и одобрение заявок на аккредитацию агентов
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[#FFD93D] border-[#FFD93D]/30 px-3 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {agents.length} ожидают
                        </Badge>
                        <Button variant="outline" size="sm" onClick={loadAgents} disabled={isLoading}>
                            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                            Обновить
                        </Button>
                    </div>
                </div>

                {/* Main Split View */}
                <div className="grid grid-cols-12 gap-4 min-h-[calc(100vh-200px)]">
                    {/* LEFT: Agent List (4 cols) */}
                    <Card className="col-span-4 border-border flex flex-col">
                        <CardHeader className="pb-3 border-b border-border">
                            <div className="flex items-center justify-between mb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Очередь заявок
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    {filteredAgents.length}
                                </Badge>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по ИНН, компании..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9 text-sm"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
                                </div>
                            ) : filteredAgents.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <CheckCircle className="h-12 w-12 text-[#3CE8D1]/30 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {searchQuery ? 'Агенты не найдены' : 'Нет заявок на проверку'}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                        Все заявки обработаны
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className="h-full">
                                    <div className="divide-y divide-border">
                                        {filteredAgents.map((agent) => {
                                            const days = getDaysWaiting(agent.accreditation_submitted_at)
                                            const isSelected = selectedAgent?.id === agent.id
                                            const isUrgent = days >= 3

                                            return (
                                                <div
                                                    key={agent.id}
                                                    onClick={() => setSelectedAgent(agent)}
                                                    className={cn(
                                                        "p-4 cursor-pointer transition-all",
                                                        isSelected
                                                            ? "bg-[#3CE8D1]/10 border-l-2 border-l-[#3CE8D1]"
                                                            : "hover:bg-accent/50",
                                                        isUrgent && !isSelected && "border-l-2 border-l-[#FFD93D]"
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                                            isSelected ? "bg-[#3CE8D1] text-[#0a1628]" : "bg-[#4F7DF3]/20 text-[#4F7DF3]"
                                                        )}>
                                                            {getInitials(agent)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-foreground truncate">
                                                                    {getFullName(agent)}
                                                                </p>
                                                                {isUrgent && (
                                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#FFD93D] border-[#FFD93D]/30">
                                                                        {days}д
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {agent.company_name || agent.email}
                                                            </p>
                                                            {agent.company_inn && (
                                                                <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                                                                    ИНН {agent.company_inn}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform",
                                                            isSelected && "text-[#3CE8D1] rotate-90"
                                                        )} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>

                    {/* RIGHT: Detail Panel (8 cols) */}
                    <Card className="col-span-8 border-border flex flex-col overflow-hidden">
                        {selectedAgent ? (
                            <>
                                {/* Header with Contact Actions */}
                                <CardHeader className="pb-4 border-b border-border bg-slate-800/30">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4F7DF3] to-[#3CE8D1] flex items-center justify-center text-lg font-bold text-white">
                                                {getInitials(selectedAgent)}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-foreground">
                                                    {getFullName(selectedAgent)}
                                                </h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedAgent.company_name || 'Компания не указана'}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <Badge variant="outline" className={cn(
                                                        "text-xs",
                                                        STATUS_CONFIG[selectedAgent.accreditation_status].color,
                                                        STATUS_CONFIG[selectedAgent.accreditation_status].bgColor
                                                    )}>
                                                        {STATUS_CONFIG[selectedAgent.accreditation_status].label}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Подана: {formatDateTime(selectedAgent.accreditation_submitted_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Contact Buttons */}
                                        <div className="flex items-center gap-2">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleEmail(selectedAgent.email)}
                                                        className="h-9 w-9"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Написать email</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleCall(selectedAgent.phone || selectedAgent.company_phone)}
                                                        className="h-9 w-9"
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Позвонить</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {/* ============================================ */}
                                    {/* DOCUMENT VERIFICATION CHECKLIST */}
                                    {/* ============================================ */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Проверка документов
                                            </h3>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs",
                                                    verificationProgress.allVerified && "text-[#3CE8D1] border-[#3CE8D1]/30",
                                                    verificationProgress.hasRejected && "text-[#E03E9D] border-[#E03E9D]/30",
                                                    !verificationProgress.allVerified && !verificationProgress.hasRejected && "text-[#FFD93D] border-[#FFD93D]/30"
                                                )}
                                            >
                                                {verificationProgress.verified}/{verificationProgress.total} проверено
                                            </Badge>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <Progress
                                                value={verificationProgress.percent}
                                                className="h-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {verificationProgress.allVerified
                                                    ? '✓ Все документы проверены'
                                                    : `Осталось проверить: ${verificationProgress.total - verificationProgress.verified}`
                                                }
                                            </p>
                                        </div>

                                        {/* Document List with Checkboxes */}
                                        <div className="space-y-2">
                                            {ACCREDITATION_DOCUMENTS.map((doc) => {
                                                const state = docVerification[doc.id]
                                                return (
                                                    <div
                                                        key={doc.id}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                            state?.verified && "border-[#3CE8D1]/30 bg-[#3CE8D1]/5",
                                                            state?.rejected && "border-[#E03E9D]/30 bg-[#E03E9D]/5",
                                                            !state?.verified && !state?.rejected && "border-border bg-accent/30"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                                state?.verified && "bg-[#3CE8D1]/20",
                                                                state?.rejected && "bg-[#E03E9D]/20",
                                                                !state?.verified && !state?.rejected && "bg-[#4F7DF3]/10"
                                                            )}>
                                                                {state?.verified ? (
                                                                    <CheckCircle className="h-4 w-4 text-[#3CE8D1]" />
                                                                ) : state?.rejected ? (
                                                                    <XCircle className="h-4 w-4 text-[#E03E9D]" />
                                                                ) : (
                                                                    <FileText className="h-4 w-4 text-[#4F7DF3]" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className={cn(
                                                                    "text-sm font-medium",
                                                                    state?.verified && "text-[#3CE8D1]",
                                                                    state?.rejected && "text-[#E03E9D] line-through"
                                                                )}>
                                                                    {doc.name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {doc.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                disabled
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-8 w-8",
                                                                    state?.verified && "text-[#3CE8D1] bg-[#3CE8D1]/10"
                                                                )}
                                                                onClick={() => toggleDocVerified(doc.id)}
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "h-8 w-8",
                                                                    state?.rejected && "text-[#E03E9D] bg-[#E03E9D]/10"
                                                                )}
                                                                onClick={() => toggleDocRejected(doc.id)}
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Company Info Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Organization Data */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                                <Building2 className="h-3 w-3" />
                                                Юридические данные
                                            </h3>
                                            <div className="space-y-2">
                                                <InfoRow
                                                    label="ИНН"
                                                    value={selectedAgent.company_inn}
                                                    mono
                                                    copyable
                                                    onCopy={() => copyToClipboard(selectedAgent.company_inn || '', 'ИНН')}
                                                />
                                                <InfoRow label="Руководитель" value={selectedAgent.director_name} />
                                                <InfoRow label="Должность" value={selectedAgent.director_position} />
                                                <InfoRow
                                                    label="Действует на основании"
                                                    value={SIGNATORY_BASIS_LABELS[selectedAgent.signatory_basis || ''] || selectedAgent.signatory_basis}
                                                />
                                                <InfoRow
                                                    label="Система налогообложения"
                                                    value={TAX_SYSTEM_LABELS[selectedAgent.tax_system || ''] || selectedAgent.tax_system}
                                                />
                                                <InfoRow label="Ставка НДС" value={selectedAgent.vat_rate} />
                                            </div>
                                        </div>

                                        {/* Bank Requisites */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                                <Building2 className="h-3 w-3" />
                                                Банковские реквизиты
                                            </h3>
                                            <div className="space-y-2">
                                                <InfoRow
                                                    label="БИК"
                                                    value={selectedAgent.bank_bik}
                                                    mono
                                                    copyable
                                                    onCopy={() => copyToClipboard(selectedAgent.bank_bik || '', 'БИК')}
                                                />
                                                <InfoRow label="Банк" value={selectedAgent.bank_name} />
                                                <InfoRow
                                                    label="Р/С"
                                                    value={selectedAgent.bank_account}
                                                    mono
                                                    copyable
                                                    onCopy={() => copyToClipboard(selectedAgent.bank_account || '', 'Р/С')}
                                                />
                                                <InfoRow
                                                    label="К/С"
                                                    value={selectedAgent.bank_corr_account}
                                                    mono
                                                    copyable
                                                    onCopy={() => copyToClipboard(selectedAgent.bank_corr_account || '', 'К/С')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Contact Info */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            Контактные данные
                                        </h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 rounded-lg bg-accent/30">
                                                <p className="text-[10px] text-muted-foreground uppercase">Email</p>
                                                <p className="text-sm font-medium mt-0.5 truncate">{selectedAgent.email}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-accent/30">
                                                <p className="text-[10px] text-muted-foreground uppercase">Телефон</p>
                                                <p className="text-sm font-medium mt-0.5 font-mono">{selectedAgent.phone || selectedAgent.company_phone || '—'}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-accent/30">
                                                <p className="text-[10px] text-muted-foreground uppercase">Дата регистрации</p>
                                                <p className="text-sm font-medium mt-0.5">{formatDateTime(selectedAgent.date_joined)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Decision Section */}
                                    <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t border-border">
                                        {verificationProgress.hasRejected && (
                                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E03E9D]/10 border border-[#E03E9D]/30 mb-4">
                                                <AlertTriangle className="h-4 w-4 text-[#E03E9D]" />
                                                <p className="text-sm text-[#E03E9D]">
                                                    {verificationProgress.rejected} документ(ов) отклонено. Рекомендуется отклонить заявку.
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                className="flex-1 h-12 text-[#E03E9D] border-[#E03E9D]/50 hover:bg-[#E03E9D] hover:text-white hover:border-[#E03E9D]"
                                                onClick={() => handleAction('reject')}
                                            >
                                                <XCircle className="h-5 w-5 mr-2" />
                                                Отклонить
                                            </Button>
                                            <Button
                                                size="lg"
                                                className={cn(
                                                    "flex-1 h-12",
                                                    verificationProgress.allVerified
                                                        ? "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                                        : "bg-slate-600 text-slate-300 cursor-not-allowed"
                                                )}
                                                onClick={() => handleAction('approve')}
                                                disabled={!verificationProgress.allVerified}
                                            >
                                                <CheckCircle className="h-5 w-5 mr-2" />
                                                Аккредитовать
                                            </Button>
                                        </div>
                                        {!verificationProgress.allVerified && (
                                            <p className="text-xs text-muted-foreground text-center mt-2">
                                                Для аккредитации необходимо проверить все документы
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <User className="h-16 w-16 text-muted-foreground/20 mb-4" />
                                <h3 className="text-lg font-medium text-muted-foreground">Выберите агента</h3>
                                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                                    Кликните на агента в списке слева для просмотра деталей и проверки документов
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ============================================ */}
                {/* Confirmation Dialog */}
                {/* ============================================ */}
                <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {actionType === 'approve' ? 'Одобрить аккредитацию?' : 'Отклонить аккредитацию?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                {actionType === 'approve' ? (
                                    <p>
                                        Агент <strong>{selectedAgent && getFullName(selectedAgent)}</strong> получит
                                        полный доступ к системе и сможет создавать заявки.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        <p>
                                            Агент <strong>{selectedAgent && getFullName(selectedAgent)}</strong> не
                                            сможет создавать заявки до повторной подачи аккредитации.
                                        </p>
                                        <div>
                                            <label className="text-sm font-medium">Причина отклонения (обязательно):</label>
                                            <Textarea
                                                value={rejectComment}
                                                onChange={(e) => setRejectComment(e.target.value)}
                                                placeholder="Укажите причину отклонения..."
                                                className="mt-2"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmAction}
                                disabled={isSubmitting || (actionType === 'reject' && !rejectComment.trim())}
                                className={actionType === 'approve'
                                    ? 'bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]'
                                    : 'bg-[#E03E9D] hover:bg-[#c0327e]'}
                            >
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {actionType === 'approve' ? 'Аккредитовать' : 'Отклонить'}
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

function InfoRow({
    label,
    value,
    mono,
    copyable,
    onCopy
}: {
    label: string
    value?: string | null
    mono?: boolean
    copyable?: boolean
    onCopy?: () => void
}) {
    return (
        <div className="flex items-center justify-between p-2 rounded bg-accent/30">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1">
                <span className={cn(
                    "text-sm font-medium text-foreground",
                    mono && "font-mono"
                )}>
                    {value || '—'}
                </span>
                {copyable && value && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onCopy}
                    >
                        <Copy className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    )
}

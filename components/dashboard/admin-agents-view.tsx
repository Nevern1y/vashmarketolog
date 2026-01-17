"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Users,
    FileText,
    RefreshCw,
    Building2,
    Search,
    ChevronRight,
    Shield,
    ChevronDown,
    ChevronUp,
    User,
    CreditCard,
    MapPin,
    Landmark,
    Download,
    ExternalLink,
    Mail,
    Phone,
    Eye,
    Filter,
    Trash2,
    Plus,
    Send,
    Bell,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useDocumentRequests, useUserDocuments } from "@/hooks/use-document-requests"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
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

// =============================================================================
// TYPES
// =============================================================================

const REQUIRED_DOCS = [
    { id: 4, name: 'Устав организации' },
    { id: 5, name: 'Свидетельство ИНН' },
    { id: 6, name: 'Свидетельство ОГРН' },
    { id: 7, name: 'Решение/Протокол' },
]

interface AgentDocument {
    id: number
    name: string
    document_type_id: number | null
    status: string
    uploaded_at: string | null
    file_url: string | null
}

interface Founder {
    full_name?: string
    inn?: string
    share_relative?: number
    birth_date?: string
    birth_place?: string
    citizen?: string
}

interface Agent {
    id: number
    email: string
    phone: string | null
    first_name: string
    last_name: string
    accreditation_status: 'none' | 'pending' | 'approved' | 'rejected'
    accreditation_submitted_at: string | null
    accreditation_comment: string | null
    date_joined: string
    company_name: string | null
    company_short_name: string | null
    company_inn: string | null
    company_ogrn: string | null
    company_kpp: string | null
    company_legal_form: string | null
    is_resident: boolean
    legal_address: string | null
    legal_address_postal_code: string | null
    actual_address: string | null
    actual_address_postal_code: string | null
    okato: string | null
    oktmo: string | null
    okpo: string | null
    okfs: string | null
    okved: string | null
    registration_date: string | null
    registration_authority: string | null
    authorized_capital_declared: string | null
    authorized_capital_paid: string | null
    company_website: string | null
    company_email: string | null
    company_phone: string | null
    director_name: string | null
    director_position: string | null
    director_birth_date: string | null
    director_birth_place: string | null
    director_email: string | null
    director_phone: string | null
    passport_series: string | null
    passport_number: string | null
    passport_issued_by: string | null
    passport_date: string | null
    passport_code: string | null
    signatory_basis: string | null
    tax_system: string | null
    vat_rate: string | null
    bank_bik: string | null
    bank_name: string | null
    bank_account: string | null
    bank_corr_account: string | null
    founders_data: Founder[]
    documents: AgentDocument[]
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected' | 'none'

// =============================================================================
// COMPONENT
// =============================================================================

export function AdminAgentsView() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Modal state
    const [activeTab, setActiveTab] = useState('info')
    const [docAction, setDocAction] = useState<{ doc: AgentDocument, action: 'approve' | 'reject' } | null>(null)
    const [deleteDoc, setDeleteDoc] = useState<AgentDocument | null>(null)
    const [rejectComment, setRejectComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Document request state
    const [isRequestDocOpen, setIsRequestDocOpen] = useState(false)
    const [requestDocName, setRequestDocName] = useState('')
    const [requestDocComment, setRequestDocComment] = useState('')
    const { createRequest, isLoading: isRequestLoading } = useDocumentRequests()

    // Collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        company: true,
        registration: false,
        director: false,
        bank: false,
        founders: false,
    })

    // Load all agents
    useEffect(() => {
        loadAgents()
    }, [])

    const loadAgents = async () => {
        setIsLoading(true)
        try {
            // Get all agents with status=all (backend defaults to 'pending' otherwise)
            const res = await api.get('/auth/admin/accreditation/?status=all')
            setAgents(Array.isArray(res) ? res : (res as any)?.results || [])
        } catch (err) {
            toast.error('Ошибка загрузки агентов')
        } finally {
            setIsLoading(false)
        }
    }

    // Filter agents
    const filteredAgents = useMemo(() => {
        let result = [...agents]

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(a => a.accreditation_status === statusFilter)
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(a =>
                a.email.toLowerCase().includes(q) ||
                (a.company_name || '').toLowerCase().includes(q) ||
                (a.company_inn || '').includes(q) ||
                (a.first_name || '').toLowerCase().includes(q) ||
                (a.last_name || '').toLowerCase().includes(q)
            )
        }

        return result
    }, [agents, statusFilter, searchQuery])

    // Helpers
    const getName = (a: Agent) =>
        a.first_name || a.last_name ? `${a.last_name || ''} ${a.first_name || ''}`.trim() : a.email.split('@')[0]

    const getInitials = (a: Agent) =>
        a.first_name && a.last_name ? `${a.last_name[0]}${a.first_name[0]}`.toUpperCase() : a.email.substring(0, 2).toUpperCase()

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="bg-emerald-500/10 text-emerald-500">Аккредитован</Badge>
            case 'pending':
                return <Badge className="bg-amber-500/10 text-amber-500">На проверке</Badge>
            case 'rejected':
                return <Badge className="bg-rose-500/10 text-rose-500">Отклонён</Badge>
            default:
                return <Badge variant="outline">Не подана</Badge>
        }
    }

    const formatDate = (date: string | null) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('ru-RU')
    }

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const openAgentModal = (agent: Agent) => {
        setSelectedAgent(agent)
        setActiveTab('info')
        setIsModalOpen(true)
    }

    // Document actions
    const handleDocumentAction = async () => {
        if (!docAction || !selectedAgent) return

        setIsSubmitting(true)
        try {
            const newStatus = docAction.action === 'approve' ? 'verified' : 'rejected'

            // API call to approve/reject document
            await api.post(`/documents/${docAction.doc.id}/verify/`, {
                status: newStatus,
                rejection_reason: docAction.action === 'reject' ? rejectComment : ''
            })

            toast.success(docAction.action === 'approve' ? 'Документ одобрен' : 'Документ отклонён')

            // Update selectedAgent documents locally for immediate UI update
            const updateDocs = (docs: AgentDocument[]) =>
                docs.map(d => d.id === docAction.doc.id ? { ...d, status: newStatus } : d)

            setSelectedAgent(prev => prev ? {
                ...prev,
                documents: updateDocs(prev.documents)
            } : null)

            // Also update the agents list
            setAgents(prev => prev.map(a =>
                a.id === selectedAgent.id
                    ? { ...a, documents: updateDocs(a.documents) }
                    : a
            ))

            setDocAction(null)
            setRejectComment('')
        } catch (err) {
            toast.error('Ошибка при обработке документа')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Delete document
    const handleDeleteDocument = async () => {
        if (!deleteDoc || !selectedAgent) return

        setIsSubmitting(true)
        try {
            await api.delete(`/documents/${deleteDoc.id}/`)
            toast.success('Документ удалён')

            // Update selectedAgent documents locally for immediate UI update
            setSelectedAgent(prev => prev ? {
                ...prev,
                documents: prev.documents.filter(d => d.id !== deleteDoc.id)
            } : null)

            // Also update the agents list
            setAgents(prev => prev.map(a =>
                a.id === selectedAgent.id
                    ? { ...a, documents: a.documents.filter(d => d.id !== deleteDoc.id) }
                    : a
            ))

            setDeleteDoc(null)
        } catch (err) {
            toast.error('Ошибка при удалении документа')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Request document from agent
    const handleRequestDocument = async () => {
        if (!selectedAgent || !requestDocName.trim()) return

        setIsSubmitting(true)
        try {
            await createRequest({
                user: selectedAgent.id,
                document_type_name: requestDocName,
                comment: requestDocComment
            })
            toast.success('Запрос на документ отправлен агенту')
            setIsRequestDocOpen(false)
            setRequestDocName('')
            setRequestDocComment('')
        } catch (err) {
            toast.error('Ошибка при отправке запроса')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get pending documents count for badge
    const getPendingDocsCount = (agent: Agent) => {
        return agent.documents?.filter(d => d.status === 'pending').length || 0
    }

    // Agent status counts
    const statusCounts = useMemo(() => ({
        all: agents.length,
        approved: agents.filter(a => a.accreditation_status === 'approved').length,
        pending: agents.filter(a => a.accreditation_status === 'pending').length,
        rejected: agents.filter(a => a.accreditation_status === 'rejected').length,
        none: agents.filter(a => a.accreditation_status === 'none').length,
    }), [agents])

    // Loading
    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-[#3CE8D1]" />
                        Агенты
                    </h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">Управление агентами и их документами</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadAgents} disabled={isLoading} className="w-full sm:w-auto">
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Обновить
                </Button>
            </div>

            {/* Stats - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
                <Card className={cn("cursor-pointer transition-colors", statusFilter === 'all' && "border-[#3CE8D1]")} onClick={() => setStatusFilter('all')}>
                    <CardContent className="p-3 md:p-4">
                        <div className="text-xl md:text-2xl font-bold">{statusCounts.all}</div>
                        <div className="text-xs text-muted-foreground">Всего</div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-colors", statusFilter === 'approved' && "border-emerald-500")} onClick={() => setStatusFilter('approved')}>
                    <CardContent className="p-3 md:p-4">
                        <div className="text-xl md:text-2xl font-bold text-emerald-500">{statusCounts.approved}</div>
                        <div className="text-xs text-muted-foreground">Аккредит.</div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-colors", statusFilter === 'pending' && "border-amber-500")} onClick={() => setStatusFilter('pending')}>
                    <CardContent className="p-3 md:p-4">
                        <div className="text-xl md:text-2xl font-bold text-amber-500">{statusCounts.pending}</div>
                        <div className="text-xs text-muted-foreground">На проверке</div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-colors", statusFilter === 'rejected' && "border-rose-500")} onClick={() => setStatusFilter('rejected')}>
                    <CardContent className="p-3 md:p-4">
                        <div className="text-xl md:text-2xl font-bold text-rose-500">{statusCounts.rejected}</div>
                        <div className="text-xs text-muted-foreground">Отклонено</div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-colors col-span-2 sm:col-span-1", statusFilter === 'none' && "border-slate-500")} onClick={() => setStatusFilter('none')}>
                    <CardContent className="p-3 md:p-4">
                        <div className="text-xl md:text-2xl font-bold text-slate-500">{statusCounts.none}</div>
                        <div className="text-xs text-muted-foreground">Не подали</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Поиск по имени, email, ИНН, компании..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Agents List */}
            <Card>
                <CardHeader>
                    <CardTitle>Список агентов ({filteredAgents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAgents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
                            <p className="text-muted-foreground">Нет агентов по выбранным критериям</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    onClick={() => openAgentModal(agent)}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors gap-3"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                                            <AvatarFallback className="bg-[#4F7DF3]/20 text-[#4F7DF3] text-sm md:text-base">
                                                {getInitials(agent)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold truncate text-sm md:text-base">{getName(agent)}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground truncate">{agent.company_short_name || agent.company_name || agent.email}</p>
                                            {agent.company_inn && (
                                                <p className="text-xs text-muted-foreground">ИНН: {agent.company_inn}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-4 shrink-0 sm:ml-4 pl-13 sm:pl-0">
                                        <div className="text-left sm:text-right">
                                            {getStatusBadge(agent.accreditation_status)}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDate(agent.date_joined)}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Agent Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-4 md:p-6">
                    <div className="sr-only">
                        <DialogTitle>{selectedAgent ? getName(selectedAgent) : "Детали агента"}</DialogTitle>
                        <DialogDescription>Информация об агенте и его документах</DialogDescription>
                    </div>
                    {selectedAgent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14">
                                        <AvatarFallback className="bg-gradient-to-br from-[#4F7DF3] to-[#3CE8D1] text-white text-lg">
                                            {getInitials(selectedAgent)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <DialogTitle className="text-xl">{getName(selectedAgent)}</DialogTitle>
                                        <DialogDescription className="flex items-center gap-3">
                                            <span>{selectedAgent.company_short_name || selectedAgent.company_name || '—'}</span>
                                            {getStatusBadge(selectedAgent.accreditation_status)}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Информация
                                    </TabsTrigger>
                                    <TabsTrigger value="documents">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Документы ({selectedAgent.documents?.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="flex-1 overflow-y-auto mt-4 space-y-4">
                                    {/* Contact info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-accent/30">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedAgent.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedAgent.phone || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">Регистрация: {formatDate(selectedAgent.date_joined)}</span>
                                        </div>
                                    </div>

                                    {/* Company Info */}
                                    <Collapsible open={openSections.company} onOpenChange={() => toggleSection('company')}>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-[#4F7DF3]" />
                                                    <span className="font-semibold text-sm">Общая информация о компании</span>
                                                </div>
                                                {openSections.company ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-3 px-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InfoRow label="Полное наименование" value={selectedAgent.company_name} />
                                                <InfoRow label="Краткое наименование" value={selectedAgent.company_short_name} />
                                                <InfoRow label="ИНН" value={selectedAgent.company_inn} highlight />
                                                <InfoRow label="ОГРН" value={selectedAgent.company_ogrn} highlight />
                                                <InfoRow label="КПП" value={selectedAgent.company_kpp} />
                                                <InfoRow label="ОПФ" value={selectedAgent.company_legal_form} />
                                                <InfoRow label="Сайт" value={selectedAgent.company_website} />
                                                <InfoRow label="Email компании" value={selectedAgent.company_email} />
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-border/50">
                                                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />Адреса
                                                </h4>
                                                <div className="grid grid-cols-1 gap-2">
                                                    <InfoRow label="Юридический адрес" value={selectedAgent.legal_address} />
                                                    <InfoRow label="Фактический адрес" value={selectedAgent.actual_address} />
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>

                                    {/* Registration */}
                                    <Collapsible open={openSections.registration} onOpenChange={() => toggleSection('registration')}>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <Landmark className="h-4 w-4 text-[#4F7DF3]" />
                                                    <span className="font-semibold text-sm">Государственная регистрация</span>
                                                </div>
                                                {openSections.registration ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-3 px-1">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <InfoRow label="ОКАТО" value={selectedAgent.okato} />
                                                <InfoRow label="ОКТМО" value={selectedAgent.oktmo} />
                                                <InfoRow label="ОКПО" value={selectedAgent.okpo} />
                                                <InfoRow label="ОКФС" value={selectedAgent.okfs} />
                                                <InfoRow label="Дата регистрации" value={formatDate(selectedAgent.registration_date)} />
                                                <InfoRow label="ОКВЭД" value={selectedAgent.okved} />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>

                                    {/* Director */}
                                    <Collapsible open={openSections.director} onOpenChange={() => toggleSection('director')}>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-[#4F7DF3]" />
                                                    <span className="font-semibold text-sm">Руководитель</span>
                                                </div>
                                                {openSections.director ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-3 px-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InfoRow label="ФИО" value={selectedAgent.director_name} highlight />
                                                <InfoRow label="Должность" value={selectedAgent.director_position} />
                                                <InfoRow label="Email" value={selectedAgent.director_email} />
                                                <InfoRow label="Телефон" value={selectedAgent.director_phone} />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>

                                    {/* Bank */}
                                    <Collapsible open={openSections.bank} onOpenChange={() => toggleSection('bank')}>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4 text-[#4F7DF3]" />
                                                    <span className="font-semibold text-sm">Банковские реквизиты</span>
                                                </div>
                                                {openSections.bank ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-3 px-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <InfoRow label="Банк" value={selectedAgent.bank_name} />
                                                <InfoRow label="БИК" value={selectedAgent.bank_bik} highlight />
                                                <InfoRow label="Р/с" value={selectedAgent.bank_account} highlight />
                                                <InfoRow label="К/с" value={selectedAgent.bank_corr_account} />
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </TabsContent>

                                <TabsContent value="documents" className="flex-1 overflow-y-auto mt-4">
                                    {/* Header with Request Document button */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">Документы</h3>
                                            {getPendingDocsCount(selectedAgent) > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white">
                                                    {getPendingDocsCount(selectedAgent)}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-[#4F7DF3] text-[#4F7DF3] hover:bg-[#4F7DF3] hover:text-white"
                                            onClick={() => setIsRequestDocOpen(true)}
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Запросить документ
                                        </Button>
                                    </div>

                                    {selectedAgent.documents && selectedAgent.documents.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedAgent.documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className={cn(
                                                        "flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border gap-3",
                                                        doc.status === 'verified' && "border-emerald-500/30 bg-emerald-500/5",
                                                        doc.status === 'rejected' && "border-rose-500/30 bg-rose-500/5",
                                                        doc.status === 'pending' && "border-amber-500/30 bg-amber-500/5"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                                            doc.status === 'verified' && "bg-emerald-500/20",
                                                            doc.status === 'rejected' && "bg-rose-500/20",
                                                            doc.status === 'pending' && "bg-amber-500/20"
                                                        )}>
                                                            {doc.status === 'verified' ? (
                                                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                            ) : doc.status === 'rejected' ? (
                                                                <XCircle className="h-5 w-5 text-rose-500" />
                                                            ) : (
                                                                <Clock className="h-5 w-5 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{doc.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Загружен: {formatDate(doc.uploaded_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {doc.file_url && (
                                                            <>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Eye className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <a href={doc.file_url} download>
                                                                        <Download className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                            </>
                                                        )}
                                                        {doc.status === 'pending' && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                                                    onClick={() => setDocAction({ doc, action: 'approve' })}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                                                    onClick={() => setDocAction({ doc, action: 'reject' })}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                            onClick={() => setDeleteDoc(doc)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">У агента нет загруженных документов</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => setIsRequestDocOpen(true)}
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Запросить документ
                                            </Button>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Document Action Dialog */}
            <AlertDialog open={!!docAction} onOpenChange={() => setDocAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {docAction?.action === 'approve' ? 'Подтвердить документ?' : 'Отклонить документ?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {docAction?.action === 'reject' ? (
                                <div className="space-y-3">
                                    <p>Укажите причину отклонения:</p>
                                    <Textarea
                                        value={rejectComment}
                                        onChange={(e) => setRejectComment(e.target.value)}
                                        placeholder="Причина отклонения..."
                                    />
                                </div>
                            ) : (
                                <p>Документ "{docAction?.doc.name}" будет отмечен как проверенный.</p>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDocumentAction}
                            disabled={isSubmitting || (docAction?.action === 'reject' && !rejectComment.trim())}
                            className={docAction?.action === 'approve' ? 'bg-emerald-500' : 'bg-rose-500'}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {docAction?.action === 'approve' ? 'Подтвердить' : 'Отклонить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Document Dialog */}
            <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Документ "{deleteDoc?.name}" будет безвозвратно удалён. Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDocument}
                            disabled={isSubmitting}
                            className="bg-rose-500 hover:bg-rose-600"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Request Document Dialog */}
            <Dialog open={isRequestDocOpen} onOpenChange={setIsRequestDocOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-[#4F7DF3]" />
                            Запросить документ
                        </DialogTitle>
                        <DialogDescription>
                            Агент получит уведомление с запросом на загрузку документа
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Название документа *</label>
                            <Input
                                placeholder="Например: Паспорт директора"
                                value={requestDocName}
                                onChange={(e) => setRequestDocName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Комментарий (опционально)</label>
                            <Textarea
                                placeholder="Дополнительные указания..."
                                value={requestDocComment}
                                onChange={(e) => setRequestDocComment(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRequestDocOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            onClick={handleRequestDocument}
                            disabled={!requestDocName.trim() || isSubmitting}
                            className="bg-[#4F7DF3] hover:bg-[#3d6ae0]"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Send className="h-4 w-4 mr-2" />
                            Отправить запрос
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface InfoRowProps {
    label: string
    value?: string | null
    highlight?: boolean
}

function InfoRow({ label, value, highlight }: InfoRowProps) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn(
                "text-sm break-words",
                highlight ? "font-semibold text-[#3CE8D1]" : "font-medium"
            )}>
                {value || '—'}
            </span>
        </div>
    )
}

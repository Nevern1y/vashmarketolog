"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { getStatusConfig } from "@/lib/status-mapping"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"
import type { ApplicationListItem, PaginatedResponse } from "@/hooks/use-applications"
import {
    Clock,
    Loader2,
    Users,
    FileText,
    RefreshCw,
    Building2,
    Search,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    User,
    CreditCard,
    MapPin,
    Download,
    Mail,
    Phone,
    Eye,
    Filter,
    Trash2,
    Send,
    Edit,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useDocumentRequests } from "@/hooks/use-document-requests"
import { useAdminUsers } from "@/hooks/use-admin-users"

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



interface AgentDocument {
    id: number
    name: string
    document_type_id: number | null
    status: string
    uploaded_at: string | null
    file_url: string | null
    company: number | null  // null = agent's own doc, number = client's doc
    company_name: string | null
}

// Type for CRM client
interface CRMClient {
    id: number
    short_name: string | null
    name: string | null
    inn: string | null
    client_status: 'pending' | 'confirmed'
}

// Type for client document
interface ClientDocument {
    id: number
    name: string
    file_url: string | null
    document_type_id: number
    type_display: string
    status: string
    status_display: string
    uploaded_at: string
}


interface Agent {
    id: number
    email: string
    phone: string | null
    first_name: string
    last_name: string
    is_active: boolean
    accreditation_status: 'none' | 'pending' | 'approved' | 'rejected'
    accreditation_submitted_at: string | null
    accreditation_comment: string | null
    date_joined: string
    company_name: string | null
    company_short_name: string | null
    company_inn: string | null
    company_legal_form: string | null
    is_resident: boolean

    legal_address: string | null

    actual_address: string | null
    company_website: string | null
    company_email: string | null
    company_phone: string | null
    director_name: string | null
    director_position: string | null
    director_email: string | null
    director_phone: string | null
    bank_bik: string | null
    bank_name: string | null
    bank_account: string | null
    bank_corr_account: string | null

    documents: AgentDocument[]
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected' | 'none'

// =============================================================================
// COMPONENT
// =============================================================================

interface AdminAgentsViewProps {
    onOpenApplication?: (applicationId: number) => void
}

export function AdminAgentsView({ onOpenApplication }: AdminAgentsViewProps) {
    const [agents, setAgents] = useState<Agent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [agentApplications, setAgentApplications] = useState<ApplicationListItem[]>([])
    const [isAgentAppsLoading, setIsAgentAppsLoading] = useState(false)

    // Modal state
    const [activeTab, setActiveTab] = useState('info')
    const [deleteDoc, setDeleteDoc] = useState<AgentDocument | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false)
    const [isEditingAgent, setIsEditingAgent] = useState(false)
    const [editForm, setEditForm] = useState({
        email: '',
        phone: '',
        first_name: '',
        last_name: '',
    })

    const { updateUser, blockUser, unblockUser, deleteUser, isSaving: isUserSaving } = useAdminUsers()

    // Document request state
    const [isRequestDocOpen, setIsRequestDocOpen] = useState(false)
    const [requestDocName, setRequestDocName] = useState('')
    const [requestDocComment, setRequestDocComment] = useState('')
    const { createRequest } = useDocumentRequests()

    // Client documents state (for Documents tab)
    const [agentClients, setAgentClients] = useState<CRMClient[]>([])
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
    const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([])
    const [isLoadingClients, setIsLoadingClients] = useState(false)
    const [isLoadingClientDocs, setIsLoadingClientDocs] = useState(false)
    const [documentsSubTab, setDocumentsSubTab] = useState<'agent' | 'clients'>('agent')


    // Collapsible sections
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        company: true,
        director: false,
        bank: false,
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

    // Load agent's CRM clients
    const loadAgentClients = async (agentId: number) => {
        setIsLoadingClients(true)
        setAgentClients([])
        setSelectedClientId(null)
        setClientDocuments([])
        try {
            const res = await api.get(`/companies/agent_clients/?agent_id=${agentId}`)
            setAgentClients(Array.isArray(res) ? res : [])
        } catch (err) {
            toast.error('Ошибка загрузки клиентов агента')
        } finally {
            setIsLoadingClients(false)
        }
    }

    // Load documents for selected client
    const loadClientDocuments = async (clientId: number, agentId: number) => {
        setIsLoadingClientDocs(true)
        try {
            const res = await api.get(`/documents/by_clients/?agent_id=${agentId}&client_id=${clientId}`)
            setClientDocuments(Array.isArray(res) ? res : [])
        } catch (err) {
            toast.error('Ошибка загрузки документов клиента')
        } finally {
            setIsLoadingClientDocs(false)
        }
    }

    // Load clients when switching to clients sub-tab
    const handleDocumentsSubTabChange = (value: string) => {
        setDocumentsSubTab(value as 'agent' | 'clients')
        if (value === 'clients' && selectedAgent && agentClients.length === 0) {
            loadAgentClients(selectedAgent.id)
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

    const formatAmount = (amount?: string | number | null) => {
        if (amount === null || amount === undefined || amount === '') return '—'
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(amount)) + ' ₽'
    }

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const openAgentModal = (agent: Agent) => {
        setSelectedAgent(agent)
        setActiveTab('info')
        setIsModalOpen(true)
        setAgentApplications([])
        setIsEditingAgent(false)
        setEditForm({
            email: agent.email || '',
            phone: agent.phone || '',
            first_name: agent.first_name || '',
            last_name: agent.last_name || '',
        })
    }

    const handleEditChange = (field: keyof typeof editForm, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveAgent = async () => {
        if (!selectedAgent) return

        const result = await updateUser(selectedAgent.id, {
            email: editForm.email.trim() || undefined,
            phone: editForm.phone.trim() || undefined,
            first_name: editForm.first_name.trim() || undefined,
            last_name: editForm.last_name.trim() || undefined,
        })

        if (!result) {
            toast.error('Ошибка обновления агента')
            return
        }

        toast.success('Данные агента обновлены')
        setSelectedAgent(prev => prev ? {
            ...prev,
            email: editForm.email,
            phone: editForm.phone,
            first_name: editForm.first_name,
            last_name: editForm.last_name,
        } : prev)
        setAgents(prev => prev.map(agent => (
            agent.id === selectedAgent.id
                ? { ...agent, email: editForm.email, phone: editForm.phone, first_name: editForm.first_name, last_name: editForm.last_name }
                : agent
        )))
        setIsEditingAgent(false)
    }

    const handleToggleBlock = async () => {
        if (!selectedAgent) return
        const action = selectedAgent.is_active ? blockUser : unblockUser
        const result = await action(selectedAgent.id)
        if (!result) {
            toast.error('Ошибка обновления статуса')
            return
        }
        const nextActive = !selectedAgent.is_active
        toast.success(nextActive ? 'Агент разблокирован' : 'Агент заблокирован')
        setSelectedAgent(prev => prev ? { ...prev, is_active: nextActive } : prev)
        setAgents(prev => prev.map(agent => (
            agent.id === selectedAgent.id
                ? { ...agent, is_active: nextActive }
                : agent
        )))
    }

    const handleDeleteAgent = async () => {
        if (!selectedAgent) return
        const success = await deleteUser(selectedAgent.id)
        if (!success) {
            toast.error('Ошибка удаления агента')
            return
        }
        toast.success('Агент удалён')
        setIsDeleteUserOpen(false)
        setIsModalOpen(false)
        setSelectedAgent(null)
        setAgents(prev => prev.filter(agent => agent.id !== selectedAgent.id))
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
    // Agent status counts
    const statusCounts = useMemo(() => ({
        all: agents.length,
        approved: agents.filter(a => a.accreditation_status === 'approved').length,
        pending: agents.filter(a => a.accreditation_status === 'pending').length,
        rejected: agents.filter(a => a.accreditation_status === 'rejected').length,
        none: agents.filter(a => a.accreditation_status === 'none').length,
    }), [agents])

    const loadAgentApplications = useCallback(async (agentId: number) => {
        setIsAgentAppsLoading(true)
        try {
            const res = await api.get<PaginatedResponse<ApplicationListItem>>('/applications/', {
                created_by: String(agentId),
            })
            const results = Array.isArray(res)
                ? res
                : (res as PaginatedResponse<ApplicationListItem>).results || []
            setAgentApplications(results)
        } catch (err) {
            setAgentApplications([])
            toast.error('Ошибка загрузки заявок агента')
        } finally {
            setIsAgentAppsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!selectedAgent || !isModalOpen || activeTab !== 'applications') return
        loadAgentApplications(selectedAgent.id)
    }, [selectedAgent, isModalOpen, activeTab, loadAgentApplications])

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
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
                                            <div className="flex flex-col items-start sm:items-end gap-1">
                                                {getStatusBadge(agent.accreditation_status)}
                                                {!agent.is_active && (
                                                    <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">Заблокирован</Badge>
                                                )}
                                            </div>
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
                <DialogContent className="w-full max-w-4xl max-h-[calc(100vh-1rem)] supports-[height:100dvh]:max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100vh-1.5rem)] sm:supports-[height:100dvh]:max-h-[calc(100dvh-1.5rem)] overflow-hidden flex min-h-0 flex-col p-3 sm:p-4 md:p-6">
                    <div className="sr-only">
                        <DialogTitle>{selectedAgent ? getName(selectedAgent) : "Детали агента"}</DialogTitle>
                        <DialogDescription>Информация об агенте и его документах</DialogDescription>
                    </div>
                    {selectedAgent && (
                        <>
                            <DialogHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                                                {!selectedAgent.is_active && (
                                                    <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">Заблокирован</Badge>
                                                )}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsEditingAgent(true)}
                                            disabled={isUserSaving || !selectedAgent.is_active}
                                            className="gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Редактировать
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={selectedAgent.is_active ? "outline" : "default"}
                                            onClick={handleToggleBlock}
                                            disabled={isUserSaving}
                                            className={selectedAgent.is_active ? "text-amber-600 border-amber-500/40" : "bg-emerald-600 hover:bg-emerald-700"}
                                        >
                                            {selectedAgent.is_active ? "Заблокировать" : "Разблокировать"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-rose-500 border-rose-500/40"
                                            disabled={selectedAgent.is_active || isUserSaving}
                                            onClick={() => setIsDeleteUserOpen(true)}
                                        >
                                            Удалить
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <TabsList className="flex w-full">
                                    <TabsTrigger value="info" className="flex-1 min-w-0 gap-1.5 px-2 sm:px-4">
                                        <Building2 className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">Информация</span>
                                        <span className="sm:hidden">Инфо</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="documents" className="flex-1 min-w-0 gap-1.5 px-2 sm:px-4">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">Документы</span>
                                        <span className="sm:hidden">Доки</span>
                                        {(selectedAgent.documents?.length || 0) > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                {selectedAgent.documents?.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="applications" className="flex-1 min-w-0 gap-1.5 px-2 sm:px-4">
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span className="hidden sm:inline">Заявки</span>
                                        <span className="sm:hidden">Заяв</span>
                                        {agentApplications.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                                {agentApplications.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] space-y-4">
                                    {isEditingAgent && (
                                        <div className="rounded-lg border p-3 md:p-4 bg-accent/30 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="agent-first-name">Имя</Label>
                                                    <Input
                                                        id="agent-first-name"
                                                        value={editForm.first_name}
                                                        onChange={(e) => handleEditChange('first_name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="agent-last-name">Фамилия</Label>
                                                    <Input
                                                        id="agent-last-name"
                                                        value={editForm.last_name}
                                                        onChange={(e) => handleEditChange('last_name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="agent-email">Email</Label>
                                                    <Input
                                                        id="agent-email"
                                                        type="email"
                                                        value={editForm.email}
                                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="agent-phone">Телефон</Label>
                                                    <Input
                                                        id="agent-phone"
                                                        value={editForm.phone}
                                                        onChange={(e) => handleEditChange('phone', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveAgent}
                                                    disabled={isUserSaving}
                                                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                                >
                                                    Сохранить
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setIsEditingAgent(false)}
                                                >
                                                    Отмена
                                                </Button>
                                            </div>
                                        </div>
                                    )}
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

                                                <InfoRow label="ОПФ" value={selectedAgent.company_legal_form} />
                                                <InfoRow label="Сайт" value={selectedAgent.company_website} />
                                                <InfoRow label="Email компании" value={selectedAgent.company_email} />
                                                <InfoRow label="Телефон компании" value={selectedAgent.company_phone} />

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
                                                <InfoRow label="Контактный телефон" value={selectedAgent.company_phone} />
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

                                <TabsContent value="documents" className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                                    {/* Sub-tabs for Agent docs vs Client docs */}
                                    <Tabs value={documentsSubTab} onValueChange={handleDocumentsSubTabChange}>
                                        <TabsList className="mb-4 w-full">
                                            <TabsTrigger value="agent" className="flex-1">Документы агента</TabsTrigger>
                                            <TabsTrigger value="clients" className="flex-1">Документы клиентов</TabsTrigger>
                                        </TabsList>

                                        {/* Agent Documents Sub-Tab */}
                                        <TabsContent value="agent">
                                            {/* Header with Request Document button */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-sm">Документы агента</h3>
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

                                            {/* Filter: only agent's own documents (company === null) */}
                                            {(() => {
                                                const agentOwnDocs = selectedAgent.documents?.filter(d => d.company === null) || []
                                                return agentOwnDocs.length > 0 ? (
                                                <div className="space-y-2">
                                                    {agentOwnDocs.map((doc) => (
                                                        <div
                                                            key={doc.id}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border gap-3"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                                    <FileText className="h-5 w-5 text-muted-foreground" />
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
                                                    <p className="text-muted-foreground">У агента нет собственных документов</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Документы клиентов доступны на вкладке "Документы клиентов"</p>
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
                                            )
                                            })()}
                                        </TabsContent>

                                        {/* Client Documents Sub-Tab */}
                                        <TabsContent value="clients">
                                            <div className="space-y-4">
                                                {/* Client selector */}
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Выберите клиента</label>
                                                    {isLoadingClients ? (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Загрузка клиентов...
                                                        </div>
                                                    ) : agentClients.length > 0 ? (
                                                        <Select
                                                            value={selectedClientId?.toString() || ''}
                                                            onValueChange={(v) => {
                                                                const clientId = Number(v)
                                                                setSelectedClientId(clientId)
                                                                if (selectedAgent) {
                                                                    loadClientDocuments(clientId, selectedAgent.id)
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Выберите клиента агента" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {agentClients.map(client => (
                                                                    <SelectItem key={client.id} value={client.id.toString()}>
                                                                        {client.short_name || client.name || 'Без названия'} (ИНН: {client.inn || '—'})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">У агента нет CRM-клиентов</p>
                                                    )}
                                                </div>

                                                {/* Client documents list */}
                                                {selectedClientId && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-medium">Документы клиента</h4>
                                                        {isLoadingClientDocs ? (
                                                            <div className="flex items-center justify-center py-8">
                                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                            </div>
                                                        ) : clientDocuments.length > 0 ? (
                                                            <div className="space-y-2">
                                                                {clientDocuments.map((doc) => (
                                                                    <div
                                                                        key={doc.id}
                                                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-medium text-sm">{doc.name}</p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    {doc.type_display} • {formatDate(doc.uploaded_at)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                                                                                {doc.status_display}
                                                                            </Badge>
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
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-8">
                                                                <FileText className="h-8 w-8 text-muted-foreground/20 mb-2" />
                                                                <p className="text-sm text-muted-foreground">Документов не найдено</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>

                                <TabsContent value="applications" className="mt-4 flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                                    {isAgentAppsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : agentApplications.length > 0 ? (
                                        <div className="space-y-2">
                                            {agentApplications.map((app) => {
                                                const statusCfg = getStatusConfig(app.status)
                                                const amount = getPrimaryAmountValue(app)
                                                return (
                                                    <div
                                                        key={app.id}
                                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border gap-3"
                                                    >
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-mono text-[#3CE8D1]">#{app.id}</span>
                                                                <Badge className={cn("text-xs", statusCfg.bgColor, statusCfg.color)}>
                                                                    {statusCfg.label}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm font-medium text-foreground truncate mt-1">
                                                                {app.company_name || "—"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {getProductTypeLabel(app.product_type, app.product_type_display)}
                                                                {amount ? ` • ${formatAmount(amount)}` : ""}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-xs text-muted-foreground">Создано: {formatDate(app.created_at)}</div>
                                                            {onOpenApplication && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setIsModalOpen(false)
                                                                        onOpenApplication(app.id)
                                                                    }}
                                                                >
                                                                    Открыть
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">У агента нет заявок</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>

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

            {/* Delete Agent Dialog */}
            <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить агента?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Удаление доступно только после блокировки. Данные пользователя будут удалены без возможности восстановления.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAgent} className="bg-rose-600 hover:bg-rose-700">
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
                "text-sm break-all overflow-wrap-anywhere",
                highlight ? "font-semibold text-[#3CE8D1]" : "font-medium"
            )}>
                {value || '—'}
            </span>
        </div>
    )
}

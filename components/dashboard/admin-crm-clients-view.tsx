"use client"

import { useState, useMemo } from "react"
import { useAdminCRMClients, type AdminCRMClient } from "@/hooks/use-admin-crm-clients"
import { useAdminDirectClients, type AdminDirectClient } from "@/hooks/use-admin-direct-clients"
import { useApplications } from "@/hooks/use-applications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    Loader2,
    Building2,
    User,
    RefreshCw,
    FileText,
    Eye,
    Users,
    UserCheck,
    Edit,
    Ban,
    Trash2
} from "lucide-react"
import { toast } from "sonner"
import { getStatusConfig } from "@/lib/status-mapping"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"
import { cn } from "@/lib/utils"
import { EditClientSheet } from "@/components/dashboard/edit-client-sheet"

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || "—"}</p>
        </div>
    )
}

interface AdminCRMClientsViewProps {
    onOpenApplication?: (applicationId: number) => void
}

export function AdminCRMClientsView({ onOpenApplication }: AdminCRMClientsViewProps) {
    // Main tab state: "agent_clients" or "direct_clients"
    const [mainTab, setMainTab] = useState<'agent_clients' | 'direct_clients'>('agent_clients')
    
    const {
        clients,
        isLoading,
        error,
        refetch,
        confirmClient,
        rejectClient,
        blockClient,
        unblockClient,
        deleteClient
    } = useAdminCRMClients()

    const {
        clients: directClients,
        isLoading: isDirectLoading,
        error: directError,
        refetch: refetchDirect,
        updateClient: updateDirectClient,
        blockClient: blockDirectClient,
        unblockClient: unblockDirectClient,
        deleteClient: deleteDirectClient
    } = useAdminDirectClients()

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all')
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [duplicateClient, setDuplicateClient] = useState<AdminCRMClient | null>(null)
    const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)

    const [selectedClient, setSelectedClient] = useState<AdminCRMClient | null>(null)
    const [selectedDirectClient, setSelectedDirectClient] = useState<AdminDirectClient | null>(null)
    const [isClientModalOpen, setIsClientModalOpen] = useState(false)
    const [isDirectClientModalOpen, setIsDirectClientModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'info' | 'applications'>('info')
    const [directSearchQuery, setDirectSearchQuery] = useState("")
    const [directAccreditedFilter, setDirectAccreditedFilter] = useState<'all' | 'accredited' | 'not_accredited'>('all')
    const [editClientId, setEditClientId] = useState<number | null>(null)
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'crm' | 'direct'; client: AdminCRMClient | AdminDirectClient } | null>(null)
    const [isDirectEditing, setIsDirectEditing] = useState(false)
    const [directEditForm, setDirectEditForm] = useState({
        name: '',
        short_name: '',
        inn: '',
        kpp: '',
        ogrn: '',
        region: '',
        director_name: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
    })

    const { applications, isLoading: isAppsLoading } = useApplications()

    const confirmClientAction = async (client: AdminCRMClient) => {
        setProcessingId(client.id)
        const success = await confirmClient(client.id)
        setProcessingId(null)

        if (success) {
            toast.success(`Клиент "${client.short_name || client.name}" закреплён`)
        } else {
            toast.error("Ошибка при закреплении клиента")
        }
    }

    const handleConfirm = (client: AdminCRMClient) => {
        if (client.has_duplicates) {
            setDuplicateClient(client)
            setIsDuplicateDialogOpen(true)
            return
        }

        confirmClientAction(client)
    }

    const handleDuplicateConfirm = async () => {
        if (!duplicateClient) return
        await confirmClientAction(duplicateClient)
        setIsDuplicateDialogOpen(false)
        setDuplicateClient(null)
    }

    const handleReject = async (client: AdminCRMClient) => {
        setProcessingId(client.id)
        const success = await rejectClient(client.id)
        setProcessingId(null)

        if (success) {
            toast.success(`Статус клиента "${client.short_name || client.name}" сброшен`)
        }
    }

    const handleToggleBlock = async (client: AdminCRMClient) => {
        const action = client.is_active ? blockClient : unblockClient
        const success = await action(client.id)
        if (success) {
            toast.success(client.is_active ? 'Клиент заблокирован' : 'Клиент разблокирован')
        }
    }

    const handleToggleDirectBlock = async (client: AdminDirectClient) => {
        const action = client.is_active ? blockDirectClient : unblockDirectClient
        const success = await action(client.id)
        if (success) {
            toast.success(client.is_active ? 'Клиент заблокирован' : 'Клиент разблокирован')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        const { type, client } = deleteTarget
        const success = type === 'crm'
            ? await deleteClient(client.id)
            : await deleteDirectClient(client.id)

        if (success) {
            toast.success('Клиент удалён')
        }
        setDeleteTarget(null)
    }

    const openEditClient = (clientId: number) => {
        setEditClientId(clientId)
        setIsEditSheetOpen(true)
    }

    const handleDirectEditChange = (field: keyof typeof directEditForm, value: string) => {
        setDirectEditForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveDirectClient = async () => {
        if (!selectedDirectClient) return
        const result = await updateDirectClient(selectedDirectClient.id, {
            name: directEditForm.name || undefined,
            short_name: directEditForm.short_name || undefined,
            inn: directEditForm.inn || undefined,
            kpp: directEditForm.kpp || undefined,
            ogrn: directEditForm.ogrn || undefined,
            region: directEditForm.region || undefined,
            director_name: directEditForm.director_name || undefined,
            contact_person: directEditForm.contact_person || undefined,
            contact_phone: directEditForm.contact_phone || undefined,
            contact_email: directEditForm.contact_email || undefined,
        })
        if (!result) {
            toast.error('Ошибка обновления клиента')
            return
        }
        toast.success('Данные клиента обновлены')
        setSelectedDirectClient(prev => prev ? {
            ...prev,
            ...directEditForm,
        } : prev)
        setIsDirectEditing(false)
    }

    // Filter clients
    const filteredClients = clients.filter(client => {
        const matchesSearch =
            (client.inn?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (client.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (client.short_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (client.agent_email?.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus =
            statusFilter === 'all' ||
            client.client_status === statusFilter

        return matchesSearch && matchesStatus
    })

    const pendingCount = clients.filter(c => c.client_status === 'pending').length
    const confirmedCount = clients.filter(c => c.client_status === 'confirmed').length

    // Direct clients stats and filtering
    const accreditedCount = directClients.filter(c => c.is_accredited).length
    const notAccreditedCount = directClients.filter(c => !c.is_accredited).length

    const filteredDirectClients = directClients.filter(client => {
        const matchesSearch =
            (client.inn?.toLowerCase().includes(directSearchQuery.toLowerCase())) ||
            (client.name?.toLowerCase().includes(directSearchQuery.toLowerCase())) ||
            (client.short_name?.toLowerCase().includes(directSearchQuery.toLowerCase())) ||
            (client.owner_email?.toLowerCase().includes(directSearchQuery.toLowerCase())) ||
            (client.contact_person?.toLowerCase().includes(directSearchQuery.toLowerCase()))

        const matchesAccredited =
            directAccreditedFilter === 'all' ||
            (directAccreditedFilter === 'accredited' && client.is_accredited) ||
            (directAccreditedFilter === 'not_accredited' && !client.is_accredited)

        return matchesSearch && matchesAccredited
    })

    const clientApplications = useMemo(() => {
        if (!selectedClient) return []
        return (applications || []).filter(app => app.company === selectedClient.id)
    }, [applications, selectedClient])

    const openClientModal = (client: AdminCRMClient) => {
        setSelectedClient(client)
        setActiveTab('info')
        setIsClientModalOpen(true)
    }

    const openDirectClientModal = (client: AdminDirectClient) => {
        setSelectedDirectClient(client)
        setActiveTab('info')
        setIsDirectClientModalOpen(true)
        setIsDirectEditing(false)
        setDirectEditForm({
            name: client.name || '',
            short_name: client.short_name || '',
            inn: client.inn || '',
            kpp: client.kpp || '',
            ogrn: client.ogrn || '',
            region: client.region || '',
            director_name: client.director_name || '',
            contact_person: client.contact_person || '',
            contact_phone: client.contact_phone || '',
            contact_email: client.contact_email || '',
        })
    }

    const directClientApplications = useMemo(() => {
        if (!selectedDirectClient) return []
        return (applications || []).filter(app => app.company === selectedDirectClient.id)
    }, [applications, selectedDirectClient])

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("ru-RU")
        } catch {
            return dateStr
        }
    }

    const formatAmount = (amount?: string | number | null) => {
        if (amount === null || amount === undefined || amount === '') return '—'
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(amount)) + ' ₽'
    }

    if (isLoading && isDirectLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
            </div>
        )
    }

    return (
        <>
            <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Клиенты</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Управление клиентами агентов и прямыми клиентами
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mainTab === 'agent_clients' ? refetch() : refetchDirect()}
                    className="gap-2 w-full sm:w-auto"
                >
                    <RefreshCw className="h-4 w-4" />
                    Обновить
                </Button>
            </div>

            {/* Main Tabs: Agent Clients / Direct Clients */}
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'agent_clients' | 'direct_clients')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="agent_clients" className="gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Клиенты агентов</span>
                        <span className="sm:hidden">Агентов</span>
                        <Badge variant="secondary" className="ml-1">{clients.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="direct_clients" className="gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Прямые клиенты</span>
                        <span className="sm:hidden">Прямые</span>
                        <Badge variant="secondary" className="ml-1">{directClients.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Agent Clients (existing functionality) */}
                <TabsContent value="agent_clients" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardContent className="p-3 md:pt-6 md:p-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg">
                                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-bold">{pendingCount}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">Ожидают</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-3 md:pt-6 md:p-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-green-500/20 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-bold">{confirmedCount}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">Закреплено</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-3 md:pt-6 md:p-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg">
                                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-bold">{clients.length}</p>
                                <p className="text-xs md:text-sm text-muted-foreground">Всего</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Поиск по ИНН, названию или агенту..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                    <div className="flex gap-2 min-w-max pb-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            Все
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                            className="gap-2"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Ожидают
                        </Button>
                        <Button
                            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('confirmed')}
                            className="gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Закреплённые
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
                    {error}
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    {/* Mobile: Card View */}
                    <div className="md:hidden p-3 space-y-3">
                        {filteredClients.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Клиенты не найдены
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <div key={client.id} className="p-3 rounded-lg border bg-card">
                                    {/* Company + Status */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-muted rounded-lg shrink-0">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {client.short_name || client.name || "Без названия"}
                                                </p>
                                                <code className="text-xs bg-muted px-1 rounded">{client.inn || "—"}</code>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {client.client_status === 'confirmed' ? (
                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs shrink-0">
                                                    Закреплён
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs shrink-0">
                                                    Ожидает
                                                </Badge>
                                            )}
                                            {!client.is_active && (
                                                <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">
                                                    Заблокирован
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {/* Agent */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{client.agent_name} ({client.agent_email})</span>
                                    </div>
                                    {/* Duplicate warning */}
                                    {client.has_duplicates && (
                                        <div className="mb-3">
                                            <Badge variant="destructive" className="gap-1 text-xs">
                                                <AlertTriangle className="h-3 w-3" />
                                                Дубликат
                                            </Badge>
                                        </div>
                                    )}
                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-1"
                                            onClick={() => openClientModal(client)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            Профиль
                                        </Button>
                                        {client.client_status === 'pending' ? (
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
                                                onClick={() => handleConfirm(client)}
                                                disabled={processingId === client.id}
                                            >
                                                {processingId === client.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                Закрепить
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10 gap-1"
                                                onClick={() => handleReject(client)}
                                                disabled={processingId === client.id}
                                            >
                                                {processingId === client.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <XCircle className="h-4 w-4" />
                                                )}
                                                Снять
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop: Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Компания</TableHead>
                                    <TableHead>ИНН</TableHead>
                                    <TableHead>Агент</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead className="hidden xl:table-cell">Дубликаты</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Клиенты не найдены
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-muted rounded-lg">
                                                        <Building2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {client.short_name || client.name || "Без названия"}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {client.contact_person || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {client.inn || "—"}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm">{client.agent_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {client.agent_email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {client.client_status === 'confirmed' ? (
                                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            Закреплён
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            На рассмотрении
                                                        </Badge>
                                                    )}
                                                    {!client.is_active && (
                                                        <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">
                                                            Заблокирован
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                {client.has_duplicates ? (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Есть дубликат
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">Нет</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1"
                                                        onClick={() => openClientModal(client)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Профиль
                                                    </Button>
                                                    {client.client_status === 'pending' ? (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 gap-1"
                                                            onClick={() => handleConfirm(client)}
                                                            disabled={processingId === client.id}
                                                        >
                                                            {processingId === client.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            )}
                                                            Закрепить
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10 gap-1"
                                                            onClick={() => handleReject(client)}
                                                            disabled={processingId === client.id}
                                                        >
                                                            {processingId === client.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4" />
                                                            )}
                                                            Снять
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
                </TabsContent>

                {/* Tab 2: Direct Clients */}
                <TabsContent value="direct_clients" className="space-y-4">
                    {isDirectLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
                        </div>
                    ) : (
                        <>
                            {/* Stats for Direct Clients */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                                    <CardContent className="p-3 md:pt-6 md:p-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="p-2 md:p-3 bg-green-500/20 rounded-lg">
                                                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold">{accreditedCount}</p>
                                                <p className="text-xs md:text-sm text-muted-foreground">Аккредитованы</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                                    <CardContent className="p-3 md:pt-6 md:p-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg">
                                                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold">{notAccreditedCount}</p>
                                                <p className="text-xs md:text-sm text-muted-foreground">Не аккредитованы</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                                    <CardContent className="p-3 md:pt-6 md:p-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg">
                                                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-xl md:text-2xl font-bold">{directClients.length}</p>
                                                <p className="text-xs md:text-sm text-muted-foreground">Всего</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Filters for Direct Clients */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Поиск по ИНН, названию, email или контактному лицу..."
                                        value={directSearchQuery}
                                        onChange={(e) => setDirectSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                                    <div className="flex gap-2 min-w-max pb-2">
                                        <Button
                                            variant={directAccreditedFilter === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDirectAccreditedFilter('all')}
                                        >
                                            Все
                                        </Button>
                                        <Button
                                            variant={directAccreditedFilter === 'accredited' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDirectAccreditedFilter('accredited')}
                                            className="gap-2"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Аккредитованы
                                        </Button>
                                        <Button
                                            variant={directAccreditedFilter === 'not_accredited' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setDirectAccreditedFilter('not_accredited')}
                                            className="gap-2"
                                        >
                                            <AlertTriangle className="h-4 w-4" />
                                            Не аккредитованы
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Error for Direct Clients */}
                            {directError && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
                                    {directError}
                                </div>
                            )}

                            {/* Direct Clients Table */}
                            <Card>
                                <CardContent className="p-0">
                                    {/* Mobile: Card View */}
                                    <div className="md:hidden p-3 space-y-3">
                                        {filteredDirectClients.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                Прямых клиентов не найдено
                                            </div>
                                        ) : (
                                            filteredDirectClients.map((client) => (
                                                <div key={client.id} className="p-3 rounded-lg border bg-card">
                                                    {/* Company + Status */}
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-muted rounded-lg shrink-0">
                                                                <Building2 className="h-4 w-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {client.short_name || client.name || "Без названия"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {client.contact_person || "—"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {client.is_accredited ? (
                                                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs shrink-0">
                                                                    Аккредитован
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs shrink-0">
                                                                    Не аккредитован
                                                                </Badge>
                                                            )}
                                                            {!client.is_active && (
                                                                <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">
                                                                    Заблокирован
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* INN */}
                                                    <div className="mb-2">
                                                        <code className="text-xs bg-muted px-1 rounded">{client.inn || "—"}</code>
                                                    </div>
                                                    {/* Owner */}
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                                        <User className="h-3 w-3" />
                                                        <span className="truncate">{client.owner_email}</span>
                                                    </div>
                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 gap-1"
                                                            onClick={() => openDirectClientModal(client)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            Профиль
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Desktop: Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Компания</TableHead>
                                                    <TableHead>ИНН</TableHead>
                                                    <TableHead>Владелец</TableHead>
                                                    <TableHead>Статус</TableHead>
                                                    <TableHead className="hidden xl:table-cell">Заявки</TableHead>
                                                    <TableHead className="text-right">Действия</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredDirectClients.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                            Прямых клиентов не найдено
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredDirectClients.map((client) => (
                                                        <TableRow key={client.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-muted rounded-lg">
                                                                        <Building2 className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {client.short_name || client.name || "Без названия"}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {client.contact_person || "—"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                                    {client.inn || "—"}
                                                                </code>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    <div>
                                                                        <p className="text-sm">{client.owner_name || client.owner_email}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {client.owner_email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    {client.is_accredited ? (
                                                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                            Аккредитован
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                                            Не аккредитован
                                                                        </Badge>
                                                                    )}
                                                                    {!client.is_active && (
                                                                        <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">
                                                                            Заблокирован
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                <span className="text-sm">{client.applications_count || 0}</span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-1"
                                                                    onClick={() => openDirectClientModal(client)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    Профиль
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>
            </div>

            <Dialog
                open={isClientModalOpen}
                onOpenChange={(open) => {
                    setIsClientModalOpen(open)
                    if (!open) setSelectedClient(null)
                }}
            >
                <DialogContent className="w-full max-w-4xl max-h-[calc(100vh-0.5rem)] max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100vh-1rem)] sm:max-h-[calc(100dvh-1rem)] overflow-hidden flex min-h-0 flex-col p-3 sm:p-4 md:p-6">
                    {selectedClient && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedClient.short_name || selectedClient.name || "Клиент"}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ИНН {selectedClient.inn || "—"}</code>
                                    {selectedClient.client_status === 'confirmed' ? (
                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Закреплён</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">На рассмотрении</Badge>
                                    )}
                                    {!selectedClient.is_active && (
                                        <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">Заблокирован</Badge>
                                    )}
                                </DialogDescription>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => openEditClient(selectedClient.id)}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={selectedClient.is_active ? 'outline' : 'default'}
                                        className={selectedClient.is_active ? 'text-amber-600 border-amber-500/40' : 'bg-emerald-600 hover:bg-emerald-700'}
                                        onClick={() => handleToggleBlock(selectedClient)}
                                    >
                                        {selectedClient.is_active ? (
                                            <>
                                                <Ban className="h-4 w-4 mr-1" />
                                                Заблокировать
                                            </>
                                        ) : (
                                            'Разблокировать'
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-rose-500 border-rose-500/40"
                                        disabled={selectedClient.is_active}
                                        onClick={() => setDeleteTarget({ type: 'crm', client: selectedClient })}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Удалить
                                    </Button>
                                </div>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'applications')} className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Информация
                                    </TabsTrigger>
                                    <TabsTrigger value="applications">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Заявки
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-4">
                                    {isDirectEditing && (
                                        <div className="rounded-lg border p-3 md:p-4 bg-accent/30 space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-name">Компания</Label>
                                                    <Input
                                                        id="direct-name"
                                                        value={directEditForm.name}
                                                        onChange={(e) => handleDirectEditChange('name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-short-name">Краткое название</Label>
                                                    <Input
                                                        id="direct-short-name"
                                                        value={directEditForm.short_name}
                                                        onChange={(e) => handleDirectEditChange('short_name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-inn">ИНН</Label>
                                                    <Input
                                                        id="direct-inn"
                                                        value={directEditForm.inn}
                                                        onChange={(e) => handleDirectEditChange('inn', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-kpp">КПП</Label>
                                                    <Input
                                                        id="direct-kpp"
                                                        value={directEditForm.kpp}
                                                        onChange={(e) => handleDirectEditChange('kpp', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-ogrn">ОГРН</Label>
                                                    <Input
                                                        id="direct-ogrn"
                                                        value={directEditForm.ogrn}
                                                        onChange={(e) => handleDirectEditChange('ogrn', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-region">Регион</Label>
                                                    <Input
                                                        id="direct-region"
                                                        value={directEditForm.region}
                                                        onChange={(e) => handleDirectEditChange('region', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-director">Руководитель</Label>
                                                    <Input
                                                        id="direct-director"
                                                        value={directEditForm.director_name}
                                                        onChange={(e) => handleDirectEditChange('director_name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-contact-person">Контактное лицо</Label>
                                                    <Input
                                                        id="direct-contact-person"
                                                        value={directEditForm.contact_person}
                                                        onChange={(e) => handleDirectEditChange('contact_person', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-contact-phone">Телефон</Label>
                                                    <Input
                                                        id="direct-contact-phone"
                                                        value={directEditForm.contact_phone}
                                                        onChange={(e) => handleDirectEditChange('contact_phone', e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="direct-contact-email">Email</Label>
                                                    <Input
                                                        id="direct-contact-email"
                                                        type="email"
                                                        value={directEditForm.contact_email}
                                                        onChange={(e) => handleDirectEditChange('contact_email', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button size="sm" onClick={handleSaveDirectClient} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                                    Сохранить
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setIsDirectEditing(false)}>
                                                    Отмена
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InfoRow label="Компания" value={selectedClient.name} />
                                        <InfoRow label="Краткое название" value={selectedClient.short_name} />
                                        <InfoRow label="ИНН" value={selectedClient.inn} />
                                        <InfoRow label="ОГРН" value={selectedClient.ogrn} />
                                        <InfoRow label="КПП" value={selectedClient.kpp} />
                                        <InfoRow label="Регион" value={selectedClient.region} />
                                        <InfoRow label="Руководитель" value={selectedClient.director_name} />
                                        <InfoRow label="Контактное лицо" value={selectedClient.contact_person} />
                                        <InfoRow label="Телефон" value={selectedClient.contact_phone} />
                                        <InfoRow label="Email" value={selectedClient.contact_email} />
                                        <InfoRow label="Агент" value={selectedClient.agent_name || selectedClient.agent_email} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="applications" className="mt-4 flex-1 min-h-0 overflow-y-auto">
                                    {isAppsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : clientApplications.length > 0 ? (
                                        <div className="space-y-2">
                                            {clientApplications.map((app) => {
                                                const statusCfg = getStatusConfig(app.status)
                                                const amount = getPrimaryAmountValue(app)
                                                const creatorName = app.created_by_name || app.created_by_email || "—"
                                                const creatorRoleMeta = app.created_by_role === "agent"
                                                    ? { label: "Агент", className: "bg-[#4F7DF3]/10 text-[#4F7DF3] border-[#4F7DF3]/30" }
                                                    : app.created_by_role === "client"
                                                        ? { label: "Клиент", className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border-[#3CE8D1]/30" }
                                                        : app.created_by_role === "admin"
                                                            ? { label: "Админ", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
                                                            : app.created_by_role === "partner"
                                                                ? { label: "Партнер", className: "bg-[#E03E9D]/10 text-[#E03E9D] border-[#E03E9D]/30" }
                                                                : { label: "Создатель", className: "bg-muted text-muted-foreground border-border" }
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
                                                                {getProductTypeLabel(app.product_type, app.product_type_display)}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                <User className="h-3 w-3" />
                                                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", creatorRoleMeta.className)}>
                                                                    {creatorRoleMeta.label}
                                                                </Badge>
                                                                <span className="truncate" title={creatorName}>{creatorName}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {amount ? formatAmount(amount) : "—"} • {formatDate(app.created_at)}
                                                            </p>
                                                        </div>
                                                        {onOpenApplication && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsClientModalOpen(false)
                                                                    onOpenApplication(app.id)
                                                                }}
                                                            >
                                                                Открыть
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">У клиента нет заявок</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Direct Client Detail Modal */}
            <Dialog
                open={isDirectClientModalOpen}
                onOpenChange={(open) => {
                    setIsDirectClientModalOpen(open)
                    if (!open) setSelectedDirectClient(null)
                }}
            >
                <DialogContent className="w-full max-w-4xl max-h-[calc(100vh-0.5rem)] max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100vh-1rem)] sm:max-h-[calc(100dvh-1rem)] overflow-hidden flex min-h-0 flex-col p-3 sm:p-4 md:p-6">
                    {selectedDirectClient && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selectedDirectClient.short_name || selectedDirectClient.name || "Клиент"}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">ИНН {selectedDirectClient.inn || "—"}</code>
                                    {selectedDirectClient.is_accredited ? (
                                        <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Аккредитован</Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">Не аккредитован</Badge>
                                    )}
                                    {!selectedDirectClient.is_active && (
                                        <Badge variant="outline" className="text-rose-500 border-rose-500/30 text-xs">Заблокирован</Badge>
                                    )}
                                </DialogDescription>
                                <div className="flex flex-wrap items-center gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setIsDirectEditing(true)}
                                        disabled={!selectedDirectClient.is_active}
                                    >
                                        <Edit className="h-4 w-4" />
                                        Редактировать
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={selectedDirectClient.is_active ? 'outline' : 'default'}
                                        className={selectedDirectClient.is_active ? 'text-amber-600 border-amber-500/40' : 'bg-emerald-600 hover:bg-emerald-700'}
                                        onClick={() => handleToggleDirectBlock(selectedDirectClient)}
                                    >
                                        {selectedDirectClient.is_active ? (
                                            <>
                                                <Ban className="h-4 w-4 mr-1" />
                                                Заблокировать
                                            </>
                                        ) : (
                                            'Разблокировать'
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-rose-500 border-rose-500/40"
                                        disabled={selectedDirectClient.is_active}
                                        onClick={() => setDeleteTarget({ type: 'direct', client: selectedDirectClient })}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Удалить
                                    </Button>
                                </div>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'applications')} className="flex-1 min-h-0 overflow-hidden flex flex-col">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="info">
                                        <Building2 className="h-4 w-4 mr-2" />
                                        Информация
                                    </TabsTrigger>
                                    <TabsTrigger value="applications">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Заявки
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InfoRow label="Компания" value={selectedDirectClient.name} />
                                        <InfoRow label="Краткое название" value={selectedDirectClient.short_name} />
                                        <InfoRow label="ИНН" value={selectedDirectClient.inn} />
                                        <InfoRow label="ОГРН" value={selectedDirectClient.ogrn} />
                                        <InfoRow label="КПП" value={selectedDirectClient.kpp} />
                                        <InfoRow label="Регион" value={selectedDirectClient.region} />
                                        <InfoRow label="Руководитель" value={selectedDirectClient.director_name} />
                                        <InfoRow label="Контактное лицо" value={selectedDirectClient.contact_person} />
                                        <InfoRow label="Телефон" value={selectedDirectClient.contact_phone} />
                                        <InfoRow label="Email" value={selectedDirectClient.contact_email} />
                                        <InfoRow label="Владелец (email)" value={selectedDirectClient.owner_email} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="applications" className="mt-4 flex-1 min-h-0 overflow-y-auto">
                                    {isAppsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    ) : directClientApplications.length > 0 ? (
                                        <div className="space-y-2">
                                            {directClientApplications.map((app) => {
                                                const statusCfg = getStatusConfig(app.status)
                                                const amount = getPrimaryAmountValue(app)
                                                const creatorName = app.created_by_name || app.created_by_email || "—"
                                                const creatorRoleMeta = app.created_by_role === "agent"
                                                    ? { label: "Агент", className: "bg-[#4F7DF3]/10 text-[#4F7DF3] border-[#4F7DF3]/30" }
                                                    : app.created_by_role === "client"
                                                        ? { label: "Клиент", className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border-[#3CE8D1]/30" }
                                                        : app.created_by_role === "admin"
                                                            ? { label: "Админ", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" }
                                                            : app.created_by_role === "partner"
                                                                ? { label: "Партнер", className: "bg-[#E03E9D]/10 text-[#E03E9D] border-[#E03E9D]/30" }
                                                                : { label: "Создатель", className: "bg-muted text-muted-foreground border-border" }
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
                                                                {getProductTypeLabel(app.product_type, app.product_type_display)}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                                <User className="h-3 w-3" />
                                                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5", creatorRoleMeta.className)}>
                                                                    {creatorRoleMeta.label}
                                                                </Badge>
                                                                <span className="truncate" title={creatorName}>{creatorName}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {amount ? formatAmount(amount) : "—"} • {formatDate(app.created_at)}
                                                            </p>
                                                        </div>
                                                        {onOpenApplication && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsDirectClientModalOpen(false)
                                                                    onOpenApplication(app.id)
                                                                }}
                                                            >
                                                                Открыть
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">У клиента нет заявок</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <EditClientSheet
                isOpen={isEditSheetOpen}
                clientId={editClientId}
                onClose={() => {
                    setIsEditSheetOpen(false)
                    setEditClientId(null)
                }}
                onSaved={() => refetch()}
                mode="edit"
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Удаление доступно только после блокировки. Клиент будет удалён без возможности восстановления.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isDuplicateDialogOpen}
                onOpenChange={(open) => {
                    setIsDuplicateDialogOpen(open)
                    if (!open) {
                        setDuplicateClient(null)
                    }
                }}
            >
                <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердите закрепление</AlertDialogTitle>
                        <AlertDialogDescription>
                            {duplicateClient
                                ? `Компания с ИНН ${duplicateClient.inn} уже закреплена за другим агентом. Продолжить?`
                                : "Компания уже закреплена за другим агентом. Продолжить?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border bg-transparent">
                            Отмена
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDuplicateConfirm}
                            disabled={processingId === duplicateClient?.id}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        >
                            Закрепить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

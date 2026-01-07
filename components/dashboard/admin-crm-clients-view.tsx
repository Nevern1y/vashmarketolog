"use client"

import { useState } from "react"
import { useAdminCRMClients, type AdminCRMClient } from "@/hooks/use-admin-crm-clients"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
    RefreshCw
} from "lucide-react"
import { toast } from "sonner"

export function AdminCRMClientsView() {
    const {
        clients,
        isLoading,
        error,
        refetch,
        confirmClient,
        rejectClient
    } = useAdminCRMClients()

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all')
    const [processingId, setProcessingId] = useState<number | null>(null)

    const handleConfirm = async (client: AdminCRMClient) => {
        if (client.has_duplicates) {
            const confirmed = window.confirm(
                `Внимание! Компания с ИНН ${client.inn} уже закреплена за другим агентом. Продолжить?`
            )
            if (!confirmed) return
        }

        setProcessingId(client.id)
        const success = await confirmClient(client.id)
        setProcessingId(null)

        if (success) {
            toast.success(`Клиент "${client.short_name || client.name}" закреплён`)
        } else {
            toast.error("Ошибка при закреплении клиента")
        }
    }

    const handleReject = async (client: AdminCRMClient) => {
        setProcessingId(client.id)
        const success = await rejectClient(client.id)
        setProcessingId(null)

        if (success) {
            toast.success(`Статус клиента "${client.short_name || client.name}" сброшен`)
        }
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Управление клиентами агентов</h1>
                    <p className="text-muted-foreground">
                        Проверка и закрепление CRM клиентов за агентами
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    className="gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Обновить
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">На рассмотрении</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500/20 rounded-lg">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{confirmedCount}</p>
                                <p className="text-sm text-muted-foreground">Закреплено</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg">
                                <Building2 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{clients.length}</p>
                                <p className="text-sm text-muted-foreground">Всего клиентов</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по ИНН, названию или агенту..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
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
                        На рассмотрении
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

            {/* Error */}
            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4 text-destructive">
                    {error}
                </div>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Компания</TableHead>
                                <TableHead>ИНН</TableHead>
                                <TableHead>Агент</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Дубликаты</TableHead>
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
                                                        {client.contact_email}
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
                                        </TableCell>
                                        <TableCell>
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
                </CardContent>
            </Card>
        </div>
    )
}

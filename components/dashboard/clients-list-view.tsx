"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Users, Loader2, AlertCircle, RefreshCw, Filter, ChevronLeft, ChevronRight, Building2, Phone, Mail, MapPin } from "lucide-react"
import { AddClientModal } from "./add-client-modal"
import { EditClientSheet } from "./edit-client-sheet"
import { useCRMClients, useCRMClientMutations, type CreateCompanyPayload } from "@/hooks/use-companies"
import { toast } from "sonner"

interface ClientsListViewProps {
  onCreateApplication?: (clientId: number) => void
}

export function ClientsListView({ onCreateApplication }: ClientsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<{ id: number; name: string } | null>(null)

  // Edit sheet state
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [clientToEdit, setClientToEdit] = useState<number | null>(null)
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('edit')

  // API Hooks
  const { clients, isLoading, error, refetch } = useCRMClients()
  const { createClient, deleteClient, isLoading: mutating, error: mutationError } = useCRMClientMutations()

  // Filter clients by search and status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.inn?.includes(searchQuery) ||
      client.short_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      client.client_status === statusFilter ||
      (statusFilter === "pending" && !client.client_status)

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize)

  // Handle add client
  const handleAddClient = async (newClient: CreateCompanyPayload) => {
    const created = await createClient(newClient)
    if (created) {
      toast.success(`Клиент "${newClient.name}" добавлен`)
      setIsAddModalOpen(false)
      refetch()
    } else {
      toast.error(mutationError || "Ошибка добавления клиента")
    }
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (id: number, name: string) => {
    setClientToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  // Confirm delete client
  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    const success = await deleteClient(clientToDelete.id)
    if (success) {
      toast.success("Клиент удален")
      refetch()
    } else {
      toast.error("Ошибка удаления клиента")
    }

    setDeleteDialogOpen(false)
    setClientToDelete(null)
  }

  // Open sheet in view mode
  const openViewSheet = (id: number) => {
    setClientToEdit(id)
    setSheetMode('view')
    setEditSheetOpen(true)
  }

  // Open sheet in edit mode
  const openEditSheet = (id: number) => {
    setClientToEdit(id)
    setSheetMode('edit')
    setEditSheetOpen(true)
  }

  // Close edit sheet
  const closeEditSheet = () => {
    setEditSheetOpen(false)
    setClientToEdit(null)
  }

  // Navigate to create application with pre-selected client
  const handleCreateApplication = (clientId: number) => {
    const client = clients.find(c => c.id === clientId)
    // Block if client is not confirmed (per PDF agent_add_client spec)
    if (client && getClientStatus(client) !== 'confirmed') {
      toast.error("Создание заявки доступно только для закрепленных клиентов")
      return
    }
    if (onCreateApplication) {
      onCreateApplication(clientId)
    } else {
      toast.info("Функция создания заявки недоступна")
    }
  }

  // Get client status label and style per PDF spec
  type ClientStatus = 'pending' | 'confirmed'
  const getClientStatus = (client: typeof clients[0]): ClientStatus => {
    // Priority 1: Use explicit client_status from backend API
    if (client.client_status === 'confirmed') return 'confirmed'
    if (client.client_status === 'pending') return 'pending'
    // Priority 2: Fallback - if client has owner (user_id), they have registered
    if (client.owner) return 'confirmed'
    // Default: pending (just added by agent)
    return 'pending'
  }

  const getStatusBadge = (client: typeof clients[0]) => {
    const status = getClientStatus(client)
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3CE8D1]/10 text-[#3CE8D1]">
          Закреплен
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFD93D]/10 text-[#FFD93D]">
        На рассмотрении
      </span>
    )
  }

  // Get accreditation badge for client
  const getAccreditationBadge = (client: typeof clients[0]) => {
    if ((client as any).is_accredited) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#3CE8D1]/10 text-[#3CE8D1]">
          ✓ Аккредитован
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f97316]/10 text-[#f97316]">
        ⚠ Не аккредитован
      </span>
    )
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU")
    } catch {
      return dateStr
    }
  }

  // Loading skeleton (6 columns per ТЗ)
  const TableSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-40" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Клиенты</h1>
          <p className="text-muted-foreground text-sm hidden sm:block">Управление клиентской базой</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] gap-2 flex-1 sm:flex-none"
            onClick={() => setIsAddModalOpen(true)}
            disabled={mutating}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Добавить клиента</span>
            <span className="sm:hidden">Добавить</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Clients Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 md:pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4">
                <CardTitle className="text-base md:text-lg">Список клиентов</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {filteredClients.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию, ИНН..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">На рассмотрении</SelectItem>
                  <SelectItem value="confirmed">Закреплен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 md:p-6 md:pt-0">
          {/* Mobile: Card View */}
          <div className="md:hidden p-3 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" />
              </div>
            ) : paginatedClients.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Users className="h-8 w-8" />
                <p>Клиенты не найдены</p>
              </div>
            ) : (
              paginatedClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => openViewSheet(client.id)}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a1628] text-white text-xs font-semibold shrink-0">
                        {(client.short_name || client.name || "??")
                          .replace(/[^А-Яа-яA-Za-z]/g, "")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{client.short_name || client.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{client.inn || "—"}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={mutating}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewSheet(client.id)}>
                            <Eye className="h-4 w-4 mr-2" />Просмотр
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditSheet(client.id)}>
                            <Edit className="h-4 w-4 mr-2" />Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => openDeleteDialog(client.id, client.name)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {getStatusBadge(client)}
                    {getAccreditationBadge(client)}
                  </div>
                  {/* Contacts */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {client.contact_person && (
                      <span>{client.contact_person}</span>
                    )}
                    {client.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{client.region}
                      </span>
                    )}
                    {(client.applications_count !== undefined && client.applications_count > 0) && (
                      <span className="text-[#3CE8D1]">{client.applications_count} заявок</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Краткое наименование</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">ИНН / ОГРН</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[150px]">Контакты</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[120px]">Регион</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[80px]">Акт. заявки</TableHead>
                  <TableHead className="min-w-[120px]">Статус клиента</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">Аккредитация</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : paginatedClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="h-8 w-8" />
                        <p>Клиенты не найдены</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => openViewSheet(client.id)}
                    >
                      {/* Column 1: Краткое наименование организации */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a1628] text-white text-xs font-semibold">
                            {(client.short_name || client.name || "??")
                              .replace(/[^А-Яа-яA-Za-z]/g, "")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{client.short_name || client.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      {/* Column 2: ИНН / ОГРН per ТЗ */}
                      <TableCell className="hidden lg:table-cell">
                        <div>
                          <p className="font-mono text-sm font-medium">{client.inn || "—"}</p>
                          {client.ogrn && (
                            <p className="font-mono text-xs text-muted-foreground">{client.ogrn}</p>
                          )}
                        </div>
                      </TableCell>
                      {/* Column 3: Контакты (email/phone) */}
                      <TableCell className="hidden xl:table-cell">
                        <div className="text-sm">
                          <p className="text-foreground">{client.contact_person || "—"}</p>
                          <p className="text-xs text-muted-foreground">{client.email || client.phone || "—"}</p>
                        </div>
                      </TableCell>
                      {/* Column 4: Регион */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm text-muted-foreground">{client.region || "—"}</span>
                      </TableCell>
                      {/* Column 5: Акт. заявки */}
                      <TableCell className="hidden xl:table-cell">
                        <span className="inline-flex h-6 min-w-6 px-2 items-center justify-center rounded-full bg-[#3CE8D1]/10 text-xs font-semibold text-[#3CE8D1]">
                          {client.applications_count ?? "—"}
                        </span>
                      </TableCell>
                      {/* Column 6: Статус клиента */}
                      <TableCell>
                        {getStatusBadge(client)}
                      </TableCell>
                      {/* Column 7: Аккредитация */}
                      <TableCell className="hidden lg:table-cell">
                        {getAccreditationBadge(client)}
                      </TableCell>
                      {/* Column 7: Actions */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={mutating}>
                              {mutating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewSheet(client.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditSheet(client.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(client.id, client.name)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t px-3 md:px-0">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">На страницу:</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClient}
      />

      {/* Edit/View Client Sheet */}
      <EditClientSheet
        isOpen={editSheetOpen}
        clientId={clientToEdit}
        onClose={closeEditSheet}
        onSaved={() => refetch()}
        mode={sheetMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Клиент <strong>"{clientToDelete?.name}"</strong> и все его заявки будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutating}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              disabled={mutating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {mutating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

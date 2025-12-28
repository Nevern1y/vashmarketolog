"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Users, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { AddClientModal } from "./add-client-modal"
import { EditClientSheet } from "./edit-client-sheet"
import { useCRMClients, useCRMClientMutations, type CreateCompanyPayload } from "@/hooks/use-companies"
import { toast } from "sonner"

interface ClientsListViewProps {
  onCreateApplication?: (clientId: number) => void
}

export function ClientsListView({ onCreateApplication }: ClientsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
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

  // Filter clients by search (by name/inn/short_name)
  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.inn?.includes(searchQuery) ||
      client.short_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
    if (onCreateApplication) {
      onCreateApplication(clientId)
    } else {
      toast.info("Функция создания заявки недоступна")
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU")
    } catch {
      return dateStr
    }
  }

  // Loading skeleton (5 columns)
  const TableSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-48" /></TableCell>
          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Клиенты</h1>
          <p className="text-muted-foreground">Управление клиентской базой</p>
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
            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] gap-2"
            onClick={() => setIsAddModalOpen(true)}
            disabled={mutating}
          >
            <Plus className="h-4 w-4" />
            Добавить клиента
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
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Список клиентов</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, ИНН..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Компания</TableHead>
                <TableHead>Реквизиты</TableHead>
                <TableHead>Заявок</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8" />
                      <p>Клиенты не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    {/* Column 1: Company Name + Contact Person */}
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
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {client.contact_person || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {/* Column 2: INN + Region */}
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm font-medium">{client.inn}</p>
                        <p className="text-xs text-muted-foreground">{client.region || "—"}</p>
                      </div>
                    </TableCell>
                    {/* Column 3: Active Applications Count */}
                    <TableCell>
                      <span className="inline-flex h-6 min-w-6 px-2 items-center justify-center rounded-full bg-[#3CE8D1]/10 text-xs font-semibold text-[#3CE8D1]">
                        —
                      </span>
                    </TableCell>
                    {/* Column 4: Status Badge */}
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                        Новый
                      </span>
                    </TableCell>
                    {/* Column 5: Actions */}
                    <TableCell>
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
                          <DropdownMenuItem onClick={() => handleCreateApplication(client.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать заявку
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
        <AlertDialogContent>
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

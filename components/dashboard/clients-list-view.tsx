"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Building2, Users, FileText, Phone, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { AddClientModal } from "./add-client-modal"
import { useCRMClients, useCRMClientMutations, type CreateCompanyPayload } from "@/hooks/use-companies"
import { toast } from "sonner"

export function ClientsListView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // API Hooks
  const { clients, isLoading, error, refetch } = useCRMClients()
  const { createClient, deleteClient, isLoading: mutating, error: mutationError } = useCRMClientMutations()

  // Filter clients by search
  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.inn?.includes(searchQuery) ||
      client.short_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Stats (calculated from API data)
  const stats = {
    totalClients: clients.length,
    totalApplications: 0, // Would need separate API call
    newThisMonth: clients.filter((c) => {
      const created = new Date(c.created_at)
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return created > monthAgo
    }).length,
  }

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

  // Handle delete client
  const handleDeleteClient = async (id: number, name: string) => {
    if (!confirm(`Удалить клиента "${name}"?`)) return

    const success = await deleteClient(id)
    if (success) {
      toast.success("Клиент удален")
      refetch()
    } else {
      toast.error("Ошибка удаления клиента")
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

  // Loading skeleton
  const TableSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
            className="bg-[#00d4aa] text-white hover:bg-[#00b894] gap-2"
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                <Users className="h-6 w-6 text-[#00d4aa]" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                )}
                <p className="text-sm text-muted-foreground">Всего клиентов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97316]/10">
                <FileText className="h-6 w-6 text-[#f97316]" />
              </div>
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Всего заявок</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats.newThisMonth}</p>
                )}
                <p className="text-sm text-muted-foreground">Новых за месяц</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <TableHead>ИНН</TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Заявок</TableHead>
                <TableHead>Добавлен</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8" />
                      <p>Клиенты не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
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
                            {client.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{client.inn}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">—</p>
                        <p className="text-xs text-muted-foreground">—</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">—</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#00d4aa]/10 text-xs font-semibold text-[#00d4aa]">
                        —
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.created_at)}
                    </TableCell>
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
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Просмотр
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать заявку
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClient(client.id, client.name)}
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

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddClient}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Building2, Users, FileText, Phone } from "lucide-react"
import type { Client } from "@/lib/types"
import { AddClientModal } from "./add-client-modal"

const mockClients: Client[] = [
  {
    id: "1",
    inn: "7707083893",
    companyName: 'ООО "Технологии Будущего"',
    shortName: 'ООО "ТехБуд"',
    legalAddress: "г. Москва, ул. Примерная, д. 1, офис 100",
    actualAddress: "г. Москва, ул. Примерная, д. 1, офис 100",
    phone: "+7 (495) 123-45-67",
    email: "info@techbud.ru",
    website: "https://techbud.ru",
    contactPerson: "Иванов Иван Иванович",
    contactPosition: "Генеральный директор",
    contactPhone: "+7 (999) 123-45-67",
    contactEmail: "ivanov@techbud.ru",
    createdAt: "2024-01-15",
    applicationsCount: 5,
  },
  {
    id: "2",
    inn: "7702345678",
    companyName: 'АО "СтройКомплект"',
    shortName: 'АО "СК"',
    legalAddress: "г. Москва, ул. Строителей, д. 10",
    actualAddress: "г. Москва, ул. Строителей, д. 10",
    phone: "+7 (495) 234-56-78",
    email: "info@stroykomplekt.ru",
    contactPerson: "Петров Петр Петрович",
    contactPosition: "Финансовый директор",
    contactPhone: "+7 (999) 234-56-78",
    contactEmail: "petrov@stroykomplekt.ru",
    createdAt: "2024-01-10",
    applicationsCount: 12,
  },
  {
    id: "3",
    inn: "7703456789",
    companyName: 'ООО "ЛогистикПро"',
    shortName: 'ООО "ЛП"',
    legalAddress: "г. Санкт-Петербург, пр. Невский, д. 50",
    actualAddress: "г. Санкт-Петербург, пр. Невский, д. 50",
    phone: "+7 (812) 345-67-89",
    email: "info@logistikpro.ru",
    contactPerson: "Сидоров Сидор Сидорович",
    contactPosition: "Коммерческий директор",
    contactPhone: "+7 (999) 345-67-89",
    contactEmail: "sidorov@logistikpro.ru",
    createdAt: "2024-01-20",
    applicationsCount: 3,
  },
]

export function ClientsListView() {
  const [clients, setClients] = useState(mockClients)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredClients = clients.filter(
    (client) =>
      client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.inn.includes(searchQuery) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    totalClients: clients.length,
    totalApplications: clients.reduce((sum, c) => sum + c.applicationsCount, 0),
    newThisMonth: clients.filter((c) => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
  }

  const handleAddClient = (newClient: Omit<Client, "id" | "createdAt" | "applicationsCount">) => {
    const client: Client = {
      ...newClient,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split("T")[0],
      applicationsCount: 0,
    }
    setClients([client, ...clients])
    setIsAddModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Клиенты</h1>
          <p className="text-muted-foreground">Управление клиентской базой</p>
        </div>
        <Button className="bg-[#00d4aa] text-white hover:bg-[#00b894] gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Добавить клиента
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                <Users className="h-6 w-6 text-[#00d4aa]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
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
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
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
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
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
                placeholder="Поиск по названию, ИНН, контакту..."
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
                <TableHead>Контактное лицо</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Заявок</TableHead>
                <TableHead>Добавлен</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0a1628] text-white text-xs font-semibold">
                        {client.shortName
                          .replace(/[^А-Яа-яA-Za-z]/g, "")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{client.shortName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{client.companyName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{client.inn}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.contactPerson}</p>
                      <p className="text-xs text-muted-foreground">{client.contactPosition}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{client.contactPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#00d4aa]/10 text-xs font-semibold text-[#00d4aa]">
                      {client.applicationsCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.createdAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
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
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredClients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Клиенты не найдены</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddClient} />
    </div>
  )
}

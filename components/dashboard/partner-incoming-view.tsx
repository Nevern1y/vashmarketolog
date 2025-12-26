"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Inbox, Clock, CheckCircle2, AlertCircle, Eye, Building2 } from "lucide-react"
import type { PartnerApplication } from "@/lib/types"

interface PartnerIncomingViewProps {
  onOpenDetail: (id: string) => void
}

const mockApplications: PartnerApplication[] = [
  {
    id: "1",
    clientCompany: 'ООО "Технологии Будущего"',
    productType: "Банковская гарантия",
    amount: 5000000,
    status: "new",
    receivedAt: "2024-01-25 14:30",
    deadline: "2024-01-28",
  },
  {
    id: "2",
    clientCompany: 'АО "СтройКомплект"',
    productType: "Тендерный кредит",
    amount: 12500000,
    status: "in-review",
    receivedAt: "2024-01-24 10:15",
    deadline: "2024-01-27",
  },
  {
    id: "3",
    clientCompany: 'ООО "ЛогистикПро"',
    productType: "Банковская гарантия",
    amount: 3200000,
    status: "info-requested",
    receivedAt: "2024-01-23 09:00",
    deadline: "2024-01-26",
  },
  {
    id: "4",
    clientCompany: 'ПАО "ЭнергоСеть"',
    productType: "Банковская гарантия",
    amount: 8700000,
    status: "new",
    receivedAt: "2024-01-25 16:45",
    deadline: "2024-01-29",
  },
]

export function PartnerIncomingView({ onOpenDetail }: PartnerIncomingViewProps) {
  const [applications] = useState(mockApplications)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || app.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: applications.length,
    new: applications.filter((a) => a.status === "new").length,
    inReview: applications.filter((a) => a.status === "in-review").length,
    infoRequested: applications.filter((a) => a.status === "info-requested").length,
  }

  const getStatusBadge = (status: PartnerApplication["status"]) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-[#00d4aa]/10 text-[#00d4aa] gap-1">
            <Inbox className="h-3 w-3" />
            Новая
          </Badge>
        )
      case "in-review":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 gap-1">
            <Clock className="h-3 w-3" />
            На рассмотрении
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-[#00d4aa]/10 text-[#00d4aa] gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Одобрена
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Отклонена
          </Badge>
        )
      case "info-requested":
        return (
          <Badge className="bg-[#f97316]/10 text-[#f97316] gap-1">
            <AlertCircle className="h-3 w-3" />
            Запрос информации
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isUrgent = (deadline?: string) => {
    if (!deadline) return false
    const diff = new Date(deadline).getTime() - Date.now()
    return diff < 24 * 60 * 60 * 1000 // Less than 24 hours
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Входящие заявки</h1>
        <p className="text-muted-foreground">Заявки, ожидающие вашего решения</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                <Inbox className="h-6 w-6 text-[#00d4aa]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.new}</p>
                <p className="text-sm text-muted-foreground">Новых</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inReview}</p>
                <p className="text-sm text-muted-foreground">На рассмотрении</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97316]/10">
                <AlertCircle className="h-6 w-6 text-[#f97316]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.infoRequested}</p>
                <p className="text-sm text-muted-foreground">Запрос информации</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Список заявок</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по компании..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="new">Новые</SelectItem>
                  <SelectItem value="in-review">На рассмотрении</SelectItem>
                  <SelectItem value="info-requested">Запрос информации</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Компания</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Получено</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id} className={isUrgent(app.deadline) ? "bg-destructive/5" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{app.clientCompany}</span>
                    </div>
                  </TableCell>
                  <TableCell>{app.productType}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(app.amount)}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{app.receivedAt}</TableCell>
                  <TableCell>
                    <span className={isUrgent(app.deadline) ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {app.deadline}
                      {isUrgent(app.deadline) && " !"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenDetail(app.id)}
                      className="gap-1 bg-transparent"
                    >
                      <Eye className="h-3 w-3" />
                      Открыть
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

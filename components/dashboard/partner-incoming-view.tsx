"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Inbox, Clock, CheckCircle2, AlertCircle, Eye, Building2, RefreshCw, Loader2 } from "lucide-react"
import { useApplications, type ApplicationListItem } from "@/hooks/use-applications"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"

interface PartnerIncomingViewProps {
  onOpenDetail: (id: string) => void
}

type PartnerAppStatus = "pending" | "in_review" | "info_requested" | "approved" | "rejected"

export function PartnerIncomingView({ onOpenDetail }: PartnerIncomingViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // API Hook - backend automatically filters for assigned partner
  const { applications, isLoading, error, refetch } = useApplications()

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toString().includes(searchQuery)
    const matchesStatus = filterStatus === "all" || app.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Stats from API data
  const stats = {
    total: applications.length,
    new: applications.filter((a) => a.status === "pending").length,
    inReview: applications.filter((a) => a.status === "in_review").length,
    infoRequested: applications.filter((a) => a.status === "info_requested").length,
  }

  // Status badge mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-[#F59E0B]/10 text-[#F59E0B] gap-1">
            <Inbox className="h-3 w-3" />
            Скоринг
          </Badge>
        )
      case "in_review":
        return (
          <Badge className="bg-[#4F7DF3]/10 text-[#4F7DF3] gap-1">
            <Clock className="h-3 w-3" />
            На рассмотрении
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 gap-1">
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
      case "info_requested":
        return (
          <Badge className="bg-[#FFD93D]/10 text-[#FFD93D] gap-1">
            <AlertCircle className="h-3 w-3" />
            Возвращение на доработку
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined || amount === "") return "—"
    const num = typeof amount === "number" ? amount : parseFloat(amount)
    if (Number.isNaN(num)) return "—"
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  // Check if deadline is urgent (less than 24 hours)
  const isUrgent = (createdAt: string) => {
    // Applications older than 2 days are considered urgent
    const created = new Date(createdAt)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    return created < twoDaysAgo
  }

  // Generate composite application ID (TZ requirement)
  // Format: БГ-2025-00001 (Product prefix + Year + Zero-padded ID)
  const getCompositeId = (app: ApplicationListItem) => {
    const year = new Date(app.created_at).getFullYear()
    const paddedId = app.id.toString().padStart(5, '0')

    // Product type prefix mapping
    const prefixMap: Record<string, string> = {
      bank_guarantee: 'БГ',
      tender_loan: 'ТК',
      contract_loan: 'КИК',
      corporate_credit: 'КК',
      factoring: 'ФК',
      leasing: 'ЛЗ',
    }
    const prefix = prefixMap[app.product_type] || 'ЗА'

    return `${prefix}-${year}-${paddedId}`
  }

  // Loading skeleton
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Входящие заявки</h1>
          <p className="text-muted-foreground">Заявки, ожидающие вашего решения</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.total}</p>
                )}
                <p className="text-sm text-muted-foreground">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <Inbox className="h-6 w-6 text-[#3CE8D1]" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.new}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.infoRequested}</p>
                )}
                <p className="text-sm text-muted-foreground">Возвращение на доработку</p>
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
                  <SelectItem value="pending">Новые</SelectItem>
                  <SelectItem value="in_review">На рассмотрении</SelectItem>
                  <SelectItem value="info_requested">Возвращение на доработку</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№ Заявки</TableHead>
                <TableHead>Клиент / ИНН</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Получено</TableHead>
                <TableHead>Срок</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p>Заявки не найдены</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow
                    key={app.id}
                    className={isUrgent(app.created_at) ? "bg-destructive/5" : ""}
                  >
                    {/* Composite ID Column */}
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-[#3CE8D1]">
                        {getCompositeId(app)}
                      </span>
                    </TableCell>
                    {/* Client + INN Column */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {app.company_name || `Заявка #${app.id}`}
                          </span>
                        </div>
                        {app.company_inn && (
                          <span className="text-xs text-muted-foreground font-mono ml-6">
                            ИНН: {app.company_inn}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getProductTypeLabel(app.product_type, app.product_type_display)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(getPrimaryAmountValue(app))}
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(app.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className={isUrgent(app.created_at) ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {app.term_months} мес.
                        {isUrgent(app.created_at) && " ⚠️"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDetail(app.id.toString())}
                        className="gap-1 bg-transparent"
                      >
                        <Eye className="h-3 w-3" />
                        Открыть
                      </Button>
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

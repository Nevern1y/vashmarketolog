"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Search, TrendingUp, Calendar, Building2, Eye, Loader2, FileX, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react"
import React, { useState } from "react"
import { useWonApplications, type ApplicationListItem } from "@/hooks/use-applications"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"

interface MyVictoriesViewProps {
  onOpenDetail?: (applicationId: number) => void
}

export function MyVictoriesView({ onOpenDetail }: MyVictoriesViewProps) {
  const { victories, isLoading, error } = useWonApplications()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const TENDER_LAW_LABELS: Record<string, string> = {
    "44_fz": "44-ФЗ",
    "223_fz": "223-ФЗ",
    "615_pp": "615-ПП",
    "185_fz": "185-ФЗ",
    "275_fz": "275-ФЗ",
    kbg: "КБГ",
    commercial: "Коммерческий",
  }

  // Map API status to display status
  const getDisplayStatus = (status: string): "awaiting-contract" | "contract-signed" | "completed" => {
    if (status === "won") return "completed"
    if (status === "approved") return "contract-signed"
    return "awaiting-contract"
  }

  const filteredVictories = victories.filter((v) => {
    const matchesSearch =
      v.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductTypeLabel(v.product_type, v.product_type_display).toLowerCase().includes(searchQuery.toLowerCase())
    const displayStatus = getDisplayStatus(v.status)
    const matchesStatus = filterStatus === "all" || displayStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = victories.reduce((sum, v) => sum + (getPrimaryAmountValue(v) ?? 0), 0)
  const completedCount = victories.filter((v) => v.status === "won").length

  const getStatusBadge = (status: string) => {
    const displayStatus = getDisplayStatus(status)
    switch (displayStatus) {
      case "completed":
        return <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1]">Исполнен</Badge>
      case "contract-signed":
        return <Badge className="bg-blue-500/10 text-blue-500">Контракт подписан</Badge>
      case "awaiting-contract":
        return <Badge className="bg-[#f97316]/10 text-[#f97316]">Ожидает контракт</Badge>
    }
  }

  const getDecisionLabel = (status: string) => {
    return status === "won" ? "Выдано" : "Одобрено"
  }

  const getTenderLaw = (victory: ApplicationListItem) => {
    const law = victory.tender_law || victory.goscontract_data?.law
    return law ? (TENDER_LAW_LABELS[law] || law) : null
  }

  const toggleExpanded = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—"
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU")
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
          <p className="text-muted-foreground">Загрузка побед...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">Ошибка загрузки</p>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (victories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Мои победы</h1>
          <p className="text-muted-foreground">История выигранных тендеров и контрактов</p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <FileX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Пока нет побед</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Здесь будут отображаться ваши выигранные тендеры и одобренные заявки.
              Создайте заявку и дождитесь её одобрения.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Мои победы</h1>
        <p className="text-muted-foreground">История выигранных тендеров и контрактов</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <Trophy className="h-6 w-6 text-[#3CE8D1]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{victories.length}</p>
                <p className="text-sm text-muted-foreground">Всего побед</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97316]/10">
                <TrendingUp className="h-6 w-6 text-[#f97316]" />
              </div>
              <div>
        <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Исполнено контрактов</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>История побед</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
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
                  <SelectItem value="awaiting-contract">Ожидает контракт</SelectItem>
                  <SelectItem value="contract-signed">Контракт подписан</SelectItem>
                  <SelectItem value="completed">Исполнен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заявка</TableHead>
                  <TableHead>Компания</TableHead>
                  <TableHead>Продукт</TableHead>
                  <TableHead>Банк</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVictories.map((victory) => {
                  const isExpanded = expandedId === victory.id
                  const productLabel = getProductTypeLabel(victory.product_type, victory.product_type_display)
                  const amountLabel = formatCurrency(getPrimaryAmountValue(victory))
                  const tenderLaw = getTenderLaw(victory)

                  return (
                    <React.Fragment key={victory.id}>
                      <TableRow className={isExpanded ? "bg-accent/30" : undefined}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleExpanded(victory.id)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                            <p className="font-medium">#{victory.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {victory.company_name}
                          </div>
                        </TableCell>
                        <TableCell>{productLabel}</TableCell>
                        <TableCell>{victory.target_bank_name || "—"}</TableCell>
                        <TableCell className="font-medium">{amountLabel}</TableCell>
                        <TableCell>{formatDate(victory.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(victory.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenDetail?.(victory.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-accent/10">
                            <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#3CE8D1]/10 px-2.5 py-1 text-xs text-[#3CE8D1]">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {getDecisionLabel(victory.status)}
                                  </span>
                                  <span className="text-muted-foreground">Детали принятия заявки</span>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => onOpenDetail?.(victory.id)}>
                                  Открыть заявку
                                </Button>
                              </div>
                              <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">Продукт</p>
                                  <p className="font-medium">{productLabel}</p>
                                </div>
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">Сумма</p>
                                  <p className="font-medium">{amountLabel}</p>
                                </div>
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">Банк</p>
                                  <p className="font-medium">{victory.target_bank_name || "—"}</p>
                                </div>
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">Закон</p>
                                  <p className="font-medium">{tenderLaw || "—"}</p>
                                </div>
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">№ закупки</p>
                                  <p className="font-medium">{victory.tender_number || victory.goscontract_data?.purchase_number || "—"}</p>
                                </div>
                                <div className="rounded-md border border-border/40 bg-muted/40 p-3">
                                  <p className="text-xs text-muted-foreground">Дата создания</p>
                                  <p className="font-medium">{formatDate(victory.created_at)}</p>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}

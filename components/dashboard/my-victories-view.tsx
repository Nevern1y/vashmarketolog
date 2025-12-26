"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Search, TrendingUp, Calendar, Building2, Eye, Loader2, FileX } from "lucide-react"
import { useState } from "react"
import { useWonApplications, type ApplicationListItem } from "@/hooks/use-applications"

export function MyVictoriesView() {
  const { victories, isLoading, error } = useWonApplications()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  // Map API status to display status
  const getDisplayStatus = (status: string): "awaiting-contract" | "contract-signed" | "completed" => {
    if (status === "won") return "completed"
    if (status === "approved") return "contract-signed"
    return "awaiting-contract"
  }

  const filteredVictories = victories.filter((v) => {
    const matchesSearch =
      v.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.product_type_display.toLowerCase().includes(searchQuery.toLowerCase())
    const displayStatus = getDisplayStatus(v.status)
    const matchesStatus = filterStatus === "all" || displayStatus === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = victories.reduce((sum, v) => sum + parseFloat(v.amount || "0"), 0)
  const completedCount = victories.filter((v) => v.status === "won").length

  const getStatusBadge = (status: string) => {
    const displayStatus = getDisplayStatus(status)
    switch (displayStatus) {
      case "completed":
        return <Badge className="bg-[#00d4aa]/10 text-[#00d4aa]">Исполнен</Badge>
      case "contract-signed":
        return <Badge className="bg-blue-500/10 text-blue-500">Контракт подписан</Badge>
      case "awaiting-contract":
        return <Badge className="bg-[#f97316]/10 text-[#f97316]">Ожидает контракт</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
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
          <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                <Trophy className="h-6 w-6 text-[#00d4aa]" />
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
                <TableHead>Сумма</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVictories.map((victory) => (
                <TableRow key={victory.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">#{victory.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {victory.company_name}
                    </div>
                  </TableCell>
                  <TableCell>{victory.product_type_display}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(parseFloat(victory.amount))}</TableCell>
                  <TableCell>{formatDate(victory.created_at)}</TableCell>
                  <TableCell>{getStatusBadge(victory.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
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

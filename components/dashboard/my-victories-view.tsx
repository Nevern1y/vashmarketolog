"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Search, TrendingUp, Calendar, Building2, Eye } from "lucide-react"

interface Victory {
  id: string
  applicationNumber: string
  purchaseNumber: string
  customerName: string
  productType: string
  amount: number
  wonDate: string
  contractDate?: string
  status: "awaiting-contract" | "contract-signed" | "completed"
}

const mockVictories: Victory[] = [
  {
    id: "1",
    applicationNumber: "BG-2024-001",
    purchaseNumber: "0148300005424000001",
    customerName: "ПАО Газпром",
    productType: "Банковская гарантия",
    amount: 5000000,
    wonDate: "2024-01-10",
    contractDate: "2024-01-15",
    status: "completed",
  },
  {
    id: "2",
    applicationNumber: "BG-2024-005",
    purchaseNumber: "0148300005424000015",
    customerName: "АО РЖД",
    productType: "Банковская гарантия",
    amount: 12500000,
    wonDate: "2024-01-18",
    contractDate: "2024-01-22",
    status: "contract-signed",
  },
  {
    id: "3",
    applicationNumber: "TK-2024-002",
    purchaseNumber: "0148300005424000022",
    customerName: "ООО Лукойл",
    productType: "Тендерный кредит",
    amount: 3200000,
    wonDate: "2024-01-25",
    status: "awaiting-contract",
  },
]

export function MyVictoriesView() {
  const [victories] = useState(mockVictories)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredVictories = victories.filter((v) => {
    const matchesSearch =
      v.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || v.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const totalAmount = victories.reduce((sum, v) => sum + v.amount, 0)
  const completedCount = victories.filter((v) => v.status === "completed").length

  const getStatusBadge = (status: Victory["status"]) => {
    switch (status) {
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
                <TableHead>Заказчик</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата победы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVictories.map((victory) => (
                <TableRow key={victory.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{victory.applicationNumber}</p>
                      <p className="text-xs text-muted-foreground">{victory.purchaseNumber}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {victory.customerName}
                    </div>
                  </TableCell>
                  <TableCell>{victory.productType}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(victory.amount)}</TableCell>
                  <TableCell>{victory.wonDate}</TableCell>
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

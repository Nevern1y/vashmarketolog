"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, Check, X, Shield } from "lucide-react"

interface Application {
  id: string
  createdAt: string
  agent: string
  client: string
  product: string
  amount: string
  status: "approved" | "declined" | "reviewing" | "draft"
}

const initialApplications: Application[] = [
  {
    id: "BG-2024-001",
    createdAt: "15.12.2024",
    agent: "Иванов А.А.",
    client: "ООО Рога и Копыта",
    product: "Госзакупки",
    amount: "5 000 000 ₽",
    status: "reviewing",
  },
  {
    id: "BG-2024-002",
    createdAt: "14.12.2024",
    agent: "Петров Б.Б.",
    client: "ИП Сидоров",
    product: "Кредит",
    amount: "2 500 000 ₽",
    status: "reviewing",
  },
  {
    id: "BG-2024-003",
    createdAt: "13.12.2024",
    agent: "Козлов В.В.",
    client: "АО СтройТех",
    product: "Лизинг",
    amount: "10 000 000 ₽",
    status: "approved",
  },
  {
    id: "BG-2024-004",
    createdAt: "12.12.2024",
    agent: "Смирнова Г.Г.",
    client: "ООО Инновации",
    product: "Госзакупки",
    amount: "1 200 000 ₽",
    status: "declined",
  },
  {
    id: "BG-2024-005",
    createdAt: "11.12.2024",
    agent: "Николаев Д.Д.",
    client: "ООО ПромСервис",
    product: "Кредит",
    amount: "8 000 000 ₽",
    status: "reviewing",
  },
  {
    id: "BG-2024-006",
    createdAt: "10.12.2024",
    agent: "Федоров Е.Е.",
    client: "КФХ Урожай",
    product: "Лизинг",
    amount: "3 500 000 ₽",
    status: "draft",
  },
  {
    id: "BG-2024-007",
    createdAt: "09.12.2024",
    agent: "Морозов Ж.Ж.",
    client: "ООО Логистик",
    product: "Госзакупки",
    amount: "15 000 000 ₽",
    status: "approved",
  },
]

const statusConfig = {
  approved: { label: "Одобрено", className: "bg-green-100 text-green-700" },
  declined: { label: "Отклонено", className: "bg-red-100 text-red-700" },
  reviewing: { label: "На рассмотрении", className: "bg-cyan-100 text-cyan-700" },
  draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
}

export function AdminDashboard() {
  const [applications, setApplications] = useState<Application[]>(initialApplications)
  const [searchQuery, setSearchQuery] = useState("")

  const handleApprove = (id: string) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "approved" } : app)))
  }

  const handleReject = (id: string) => {
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "declined" } : app)))
  }

  const filteredApplications = applications.filter(
    (app) =>
      app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.agent.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const reviewingCount = applications.filter((a) => a.status === "reviewing").length

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b bg-[#0a1628] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f97316]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">LIDER GARANT | ADMINISTRATOR</p>
            <p className="text-xs text-white/60">Панель модерации заявок</p>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Все заявки</h1>
            <p className="text-muted-foreground">
              Ожидают рассмотрения: <span className="font-semibold text-[#f97316]">{reviewingCount}</span>
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, клиенту, агенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Дата</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Агент</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Клиент</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Продукт</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Сумма</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Статус</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app, index) => (
                    <tr
                      key={app.id}
                      className={cn("border-b transition-colors", index % 2 === 0 ? "bg-white" : "bg-muted/10")}
                    >
                      <td className="px-4 py-4 text-sm font-medium">{app.id}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{app.createdAt}</td>
                      <td className="px-4 py-4 text-sm">{app.agent}</td>
                      <td className="px-4 py-4 text-sm">{app.client}</td>
                      <td className="px-4 py-4 text-sm">{app.product}</td>
                      <td className="px-4 py-4 text-sm font-medium">{app.amount}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusConfig[app.status].className,
                          )}
                        >
                          {statusConfig[app.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApprove(app.id)}
                            disabled={app.status === "approved"}
                            className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReject(app.id)}
                            disabled={app.status === "declined"}
                            className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Отклонить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

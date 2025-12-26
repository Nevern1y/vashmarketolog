"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

type TabType = "tenders" | "accounts" | "special" | "credit"

interface Application {
  id: string
  createdAt: string
  bank: string
  agent: string
  client: string
  tariff: string
  status: "approved" | "declined" | "reviewing" | "draft"
  updatedAt: string
}

interface MyApplicationsViewProps {
  onOpenDetail?: (id: string) => void
}

const tabs: { id: TabType; label: string }[] = [
  { id: "tenders", label: "Госторги" },
  { id: "accounts", label: "Расчетные счета" },
  { id: "special", label: "Спецсчета" },
  { id: "credit", label: "Экспресс-кредит" },
]

const mockApplications: Application[] = [
  {
    id: "BG-2024-001",
    createdAt: "15.12.2024",
    bank: "Сбербанк",
    agent: "Иванов А.А.",
    client: "ООО Рога и Копыта",
    tariff: "Стандарт",
    status: "approved",
    updatedAt: "16.12.2024",
  },
  {
    id: "BG-2024-002",
    createdAt: "14.12.2024",
    bank: "ВТБ",
    agent: "Петров Б.Б.",
    client: "ИП Сидоров",
    tariff: "Премиум",
    status: "reviewing",
    updatedAt: "15.12.2024",
  },
  {
    id: "BG-2024-003",
    createdAt: "13.12.2024",
    bank: "Альфа-Банк",
    agent: "Козлов В.В.",
    client: "АО СтройТех",
    tariff: "Базовый",
    status: "declined",
    updatedAt: "14.12.2024",
  },
  {
    id: "BG-2024-004",
    createdAt: "12.12.2024",
    bank: "Тинькофф",
    agent: "Смирнова Г.Г.",
    client: "ООО Инновации",
    tariff: "Стандарт",
    status: "approved",
    updatedAt: "13.12.2024",
  },
  {
    id: "BG-2024-005",
    createdAt: "11.12.2024",
    bank: "Газпромбанк",
    agent: "Николаев Д.Д.",
    client: "ООО ПромСервис",
    tariff: "Премиум",
    status: "draft",
    updatedAt: "11.12.2024",
  },
  {
    id: "BG-2024-006",
    createdAt: "10.12.2024",
    bank: "Россельхозбанк",
    agent: "Федоров Е.Е.",
    client: "КФХ Урожай",
    tariff: "Базовый",
    status: "reviewing",
    updatedAt: "12.12.2024",
  },
  {
    id: "BG-2024-007",
    createdAt: "09.12.2024",
    bank: "Открытие",
    agent: "Морозов Ж.Ж.",
    client: "ООО Логистик",
    tariff: "Стандарт",
    status: "approved",
    updatedAt: "10.12.2024",
  },
]

const statusConfig = {
  approved: { label: "Одобрено", className: "bg-green-100 text-green-700" },
  declined: { label: "Отклонено", className: "bg-red-100 text-red-700" },
  reviewing: { label: "На рассмотрении", className: "bg-cyan-100 text-cyan-700" },
  draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
}

export function MyApplicationsView({ onOpenDetail }: MyApplicationsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("accounts")
  const [showDeclined, setShowDeclined] = useState(false)
  const [showCancelled, setShowCancelled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredApplications = mockApplications.filter((app) => {
    if (!showDeclined && app.status === "declined") return false
    if (
      searchQuery &&
      !app.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !app.client.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Мои заявки</h1>
        <p className="text-muted-foreground">Управление заявками на банковские продукты</p>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <nav className="flex gap-4 lg:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-[#00d4aa] text-[#00d4aa]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="showDeclined"
              checked={showDeclined}
              onCheckedChange={(checked) => setShowDeclined(checked === true)}
            />
            <Label htmlFor="showDeclined" className="text-sm font-normal whitespace-nowrap">
              Показать отказные
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showCancelled"
              checked={showCancelled}
              onCheckedChange={(checked) => setShowCancelled(checked === true)}
            />
            <Label htmlFor="showCancelled" className="text-sm font-normal whitespace-nowrap">
              Отмененные клиентом
            </Label>
          </div>
        </div>
        <p className="text-sm text-muted-foreground lg:ml-auto">
          Общее количество заявок: <span className="font-medium text-foreground">{filteredApplications.length}</span>
        </p>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Номер заявки
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Дата создания
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Банк</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Агент</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Клиент</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Тариф</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Статус заявки
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                    Дата изменения
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app, index) => (
                  <tr
                    key={app.id}
                    onClick={() => onOpenDetail?.(app.id)}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/30 cursor-pointer",
                      index % 2 === 0 ? "bg-white" : "bg-muted/10",
                    )}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{app.id}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{app.createdAt}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{app.bank}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{app.agent}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{app.client}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{app.tariff}</td>
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
                    <td className="px-4 py-4 text-sm text-muted-foreground">{app.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

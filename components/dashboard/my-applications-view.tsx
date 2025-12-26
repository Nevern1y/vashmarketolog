"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApplications, type ApplicationListItem } from "@/hooks/use-applications"

type TabType = "tenders" | "accounts" | "special" | "credit"

interface MyApplicationsViewProps {
  onOpenDetail?: (id: string) => void
}

const tabs: { id: TabType; label: string }[] = [
  { id: "tenders", label: "Госторги" },
  { id: "accounts", label: "Расчетные счета" },
  { id: "special", label: "Спецсчета" },
  { id: "credit", label: "Экспресс-кредит" },
]

// Map API status to display config
const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
  pending: { label: "На рассмотрении", className: "bg-cyan-100 text-cyan-700" },
  in_review: { label: "В работе", className: "bg-blue-100 text-blue-700" },
  info_requested: { label: "Запрошена информация", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Одобрено", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонено", className: "bg-red-100 text-red-700" },
  won: { label: "Выигран", className: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Проигран", className: "bg-orange-100 text-orange-700" },
}

// Map product types to tabs
const productTypeToTab: Record<string, TabType> = {
  bank_guarantee: "tenders",
  tender_loan: "tenders",
  factoring: "accounts",
  leasing: "credit",
}

export function MyApplicationsView({ onOpenDetail }: MyApplicationsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("tenders")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState<string[]>([])

  // Fetch applications from API
  const { applications, isLoading, error, refetch } = useApplications()

  // Filter applications based on tab, search, and status
  const filteredApplications = applications.filter((app) => {
    // Filter by tab (product type)
    const appTab = productTypeToTab[app.product_type] || "tenders"
    if (appTab !== activeTab) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        app.id.toString().includes(query) ||
        app.company_name?.toLowerCase().includes(query) ||
        app.product_type_display?.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // Filter by status
    if (statusFilters.length > 0 && !statusFilters.includes(app.status)) {
      return false
    }

    return true
  })

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  // Format date from ISO string
  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return isoDate
    }
  }

  // Format amount
  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount)
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(num)
    } catch {
      return amount
    }
  }

  // Get status config
  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-600" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Мои заявки</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#00d4aa] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* Applications List */}
        <div className="space-y-4">
          {/* Loading State */}
          {isLoading && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Загрузка заявок...</p>
              </div>
            </Card>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-red-600">
                <AlertCircle className="h-8 w-8" />
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Попробовать снова
                </Button>
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredApplications.length === 0 && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>Заявки не найдены</p>
                {(searchQuery || statusFilters.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setStatusFilters([])
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Applications */}
          {!isLoading && !error && filteredApplications.map((app) => {
            const status = getStatusConfig(app.status)

            return (
              <Card
                key={app.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => onOpenDetail?.(app.id.toString())}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">#{app.id}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            status.className
                          )}
                        >
                          {app.status_display || status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {app.company_name || "Без компании"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Продукт</p>
                        <p className="font-medium">{app.product_type_display}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Сумма</p>
                        <p className="font-medium">{formatAmount(app.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Срок</p>
                        <p className="font-medium">{app.term_months} мес.</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Дата</p>
                        <p className="font-medium">{formatDate(app.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters Sidebar */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold">Фильтры</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Статус</p>
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${key}`}
                    checked={statusFilters.includes(key)}
                    onCheckedChange={() => toggleStatusFilter(key)}
                  />
                  <Label htmlFor={`status-${key}`} className="text-sm cursor-pointer">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", config.className)}>
                      {config.label}
                    </span>
                  </Label>
                </div>
              ))}

              {statusFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setStatusFilters([])}
                >
                  Сбросить
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

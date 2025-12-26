"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Search, Check, X, Shield, Loader2, RefreshCw, Building2 } from "lucide-react"
import { useApplications } from "@/hooks/use-applications"

const statusConfig: Record<string, { label: string; className: string }> = {
  approved: { label: "Одобрено", className: "bg-green-100 text-green-700" },
  rejected: { label: "Отклонено", className: "bg-red-100 text-red-700" },
  declined: { label: "Отклонено", className: "bg-red-100 text-red-700" },
  pending: { label: "Новая", className: "bg-cyan-100 text-cyan-700" },
  in_review: { label: "На рассмотрении", className: "bg-blue-100 text-blue-700" },
  info_requested: { label: "Запрос информации", className: "bg-orange-100 text-orange-700" },
  draft: { label: "Черновик", className: "bg-gray-100 text-gray-600" },
  won: { label: "Выигран", className: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Проигран", className: "bg-rose-100 text-rose-700" },
}

export function AdminDashboard() {
  const { applications, isLoading, error, refetch } = useApplications()
  const [searchQuery, setSearchQuery] = useState("")

  const handleApprove = (id: number) => {
    // TODO: Implement assign to partner flow
    console.log("Approve application:", id)
  }

  const handleReject = (id: number) => {
    // TODO: Implement reject flow
    console.log("Reject application:", id)
  }

  const filteredApplications = applications.filter(
    (app) =>
      app.id.toString().includes(searchQuery.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.target_bank_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pendingCount = applications.filter((a) => a.status === "pending" || a.status === "in_review").length

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
              Ожидают рассмотрения: <span className="font-semibold text-[#f97316]">{pendingCount}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Обновить
            </Button>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по ID, клиенту, банку..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#00d4aa]" />
            <span className="ml-2 text-muted-foreground">Загрузка заявок...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                Повторить
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Applications Table */}
        {!isLoading && !error && (
          <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Дата</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Клиент</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Продукт</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Сумма</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          Целевой банк
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                          {searchQuery ? "Заявки не найдены" : "Нет заявок"}
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app, index) => {
                        const statusCfg = statusConfig[app.status] || { label: app.status_display || app.status, className: "bg-gray-100 text-gray-600" }
                        const formattedDate = new Date(app.created_at).toLocaleDateString("ru-RU")
                        const formattedAmount = new Intl.NumberFormat("ru-RU", {
                          style: "currency",
                          currency: "RUB",
                          maximumFractionDigits: 0,
                        }).format(parseFloat(app.amount))

                        return (
                          <tr
                            key={app.id}
                            className={cn("border-b transition-colors hover:bg-muted/50", index % 2 === 0 ? "bg-white" : "bg-muted/10")}
                          >
                            <td className="px-4 py-4 text-sm font-medium">#{app.id}</td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{formattedDate}</td>
                            <td className="px-4 py-4 text-sm">{app.company_name || "—"}</td>
                            <td className="px-4 py-4 text-sm">{app.product_type_display}</td>
                            <td className="px-4 py-4 text-sm font-medium">{formattedAmount}</td>
                            <td className="px-4 py-4 text-sm">
                              {app.target_bank_name ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                  <Building2 className="h-3 w-3" />
                                  {app.target_bank_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  statusCfg.className,
                                )}
                              >
                                {statusCfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={app.status === "approved" || app.status === "won"}
                                  className="h-8 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Назначить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(app.id)}
                                  disabled={app.status === "rejected" || app.status === "declined"}
                                  className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Отклонить
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

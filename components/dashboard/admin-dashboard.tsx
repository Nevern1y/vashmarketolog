"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Search, Shield, Loader2, RefreshCw, Building2, Eye, FileText,
  DollarSign, Calendar, User, ExternalLink, Download, MessageSquare,
  RotateCcw, UserPlus, LogOut, Clock, StickyNote, X, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle
} from "lucide-react"
import { useApplications, useApplication, usePartnerActions } from "@/hooks/use-applications"
import { usePartners } from "@/hooks/use-partners"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { ApplicationChat } from "./application-chat"
import { PartnersTab } from "./partners-tab"

// ============================================
// TOR-COMPLIANT STATUS CONFIGURATION
// ============================================
const statusConfig: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
  approved: {
    label: "Одобрено",
    className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border border-[#3CE8D1]/30",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: {
    label: "Отклонено",
    className: "bg-[#E03E9D]/10 text-[#E03E9D] border border-[#E03E9D]/30",
    icon: <XCircle className="h-3 w-3" />
  },
  declined: {
    label: "Отклонено",
    className: "bg-[#E03E9D]/10 text-[#E03E9D] border border-[#E03E9D]/30",
    icon: <XCircle className="h-3 w-3" />
  },
  pending: {
    label: "Новая",
    className: "bg-[#4F7DF3]/10 text-[#4F7DF3] border border-[#4F7DF3]/30"
  },
  in_review: {
    label: "В обработке",
    className: "bg-[#3CE8D1]/10 text-[#3CE8D1] border border-[#3CE8D1]/30"
  },
  info_requested: {
    label: "Запрос инфо",
    className: "bg-[#FFD93D]/10 text-[#FFD93D] border border-[#FFD93D]/30",
    icon: <AlertTriangle className="h-3 w-3" />
  },
  draft: {
    label: "Черновик",
    className: "bg-slate-700/50 text-slate-400 border border-slate-600/30"
  },
  won: {
    label: "Выигран",
    className: "bg-[#3CE8D1]/15 text-[#3CE8D1] border border-[#3CE8D1]/30",
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  lost: {
    label: "Проигран",
    className: "bg-[#FF521D]/10 text-[#FF521D] border border-[#FF521D]/30"
  },
}

export function AdminDashboard() {
  const { applications, isLoading, error, refetch } = useApplications()
  const { partners } = usePartners()
  const { logout } = useAuth()
  const { assignPartner, requestInfo, approveApplication, rejectApplication, restoreApplication, saveNotes, isLoading: isActioning } = usePartnerActions()

  // State
  const [activeTab, setActiveTab] = useState<"applications" | "partners">("applications")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("")
  const [internalNotes, setInternalNotes] = useState<string>("")
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  // Fetch detailed application data when drawer opens
  const { application: selectedApp, isLoading: isLoadingApp, refetch: refetchApp } = useApplication(drawerOpen ? selectedAppId : null)

  // Handlers
  const handleViewDetails = (appId: number) => {
    setSelectedAppId(appId)
    setSelectedPartnerId("")
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedAppId(null)
    setSelectedPartnerId("")
  }

  const handleAssignPartner = async () => {
    if (!selectedApp || !selectedPartnerId) return
    const result = await assignPartner(selectedApp.id, parseInt(selectedPartnerId))
    if (result) {
      refetch()
      refetchApp()
      setSelectedPartnerId("")
    }
  }

  const handleRequestInfo = async () => {
    if (!selectedApp) return
    const result = await requestInfo(selectedApp.id)
    if (result) {
      refetch()
      refetchApp()
    }
    setShowReturnDialog(false)
  }

  const handleApprove = async () => {
    if (!selectedApp) return
    const result = await approveApplication(selectedApp.id)
    if (result) {
      refetch()
      refetchApp()
    }
    setShowApproveDialog(false)
  }

  const handleReject = async () => {
    if (!selectedApp) return
    const result = await rejectApplication(selectedApp.id)
    if (result) {
      refetch()
      refetchApp()
    }
    setShowRejectDialog(false)
  }

  const handleRestore = async () => {
    if (!selectedApp) return
    const result = await restoreApplication(selectedApp.id)
    if (result) {
      refetch()
      refetchApp()
    }
    setShowRestoreDialog(false)
  }

  const handleSaveNotes = async () => {
    if (!selectedApp) return
    const result = await saveNotes(selectedApp.id, internalNotes)
    if (result) {
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    }
  }

  // Sync notes when selectedApp changes
  useEffect(() => {
    if (selectedApp?.notes) {
      setInternalNotes(selectedApp.notes)
    } else {
      setInternalNotes("")
    }
    setNoteSaved(false)
  }, [selectedApp])

  // Filtered applications
  const filteredApplications = (applications || []).filter((app) => {
    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false
    }
    // Search query
    const query = searchQuery.toLowerCase()
    return (
      app.id.toString().includes(query) ||
      app.company_name?.toLowerCase().includes(query) ||
      (app.company_inn || "").toLowerCase().includes(query) ||
      (app.target_bank_name || "").toLowerCase().includes(query)
    )
  })

  const pendingCount = (applications || []).filter((a) => a.status === "pending" || a.status === "in_review").length

  // Formatters
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(parseFloat(amount))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getCheckoUrl = (inn?: string) => {
    if (!inn) return null
    return `https://checko.ru/company/${inn}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================ */}
      {/* PREMIUM HEADER */}
      {/* ============================================ */}
      <header className="sticky top-0 z-40 border-b bg-slate-900 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white">LIDER GARANT</h1>
                <p className="text-xs font-medium text-slate-400">Административная панель</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="gap-2 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выход</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================ */}
      <main className="p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              activeTab === "applications"
                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <FileText className="h-4 w-4" />
            Заявки
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700">
              {pendingCount}
            </Badge>
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              activeTab === "partners"
                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Building2 className="h-4 w-4" />
            Партнёры
          </button>
        </div>

        {/* Partners Tab Content */}
        {activeTab === "partners" && <PartnersTab />}

        {/* Applications Tab Content */}
        {activeTab === "applications" && (
          <>
            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Заявки</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ожидают рассмотрения: <span className="font-semibold text-[#FFD93D]">{pendingCount}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="gap-2 border-border hover:bg-accent"
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  Обновить
                </Button>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-card border-border">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">Новые</SelectItem>
                    <SelectItem value="in_review">В обработке</SelectItem>
                    <SelectItem value="info_requested">Запрос инфо</SelectItem>
                    <SelectItem value="approved">Одобрено</SelectItem>
                    <SelectItem value="rejected">Отклонено</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-card border-border focus:border-[#3CE8D1] focus:ring-[#3CE8D1]"
                  />
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-[#3CE8D1]" />
                  <span className="text-sm text-muted-foreground">Загрузка заявок...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-8 text-center">
                  <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                    Повторить
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ============================================ */}
            {/* PRO DATA GRID */}
            {/* ============================================ */}
            {!isLoading && !error && (
              <Card className="shadow-sm border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    {/* Table Header - TOR Compliant */}
                    <thead>
                      <tr className="bg-accent/50 border-b border-border">
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">ID</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Дата</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Клиент</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Продукт</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">Сумма</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Банк
                          </span>
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">Статус</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredApplications.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="h-10 w-10 text-gray-300" />
                              <p className="text-gray-500 font-medium">
                                {searchQuery ? "Заявки не найдены" : "Нет заявок"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredApplications.map((app) => {
                          const statusCfg = statusConfig[app.status] || {
                            label: app.status_display || app.status,
                            className: "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                          }

                          return (
                            <tr
                              key={app.id}
                              className="group cursor-pointer transition-colors hover:bg-[#3CE8D1]/5"
                              onClick={() => handleViewDetails(app.id)}
                            >
                              {/* ID - Monospace */}
                              <td className="px-4 py-4">
                                <span className="font-mono text-sm font-medium text-foreground">#{app.id}</span>
                              </td>

                              {/* Date */}
                              <td className="px-4 py-4">
                                <span className="text-sm text-muted-foreground">{formatDate(app.created_at)}</span>
                              </td>

                              {/* Client - Bold + INN */}
                              <td className="px-4 py-3">
                                {app.company_name && app.company_name !== '—' ? (
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">{app.company_name}</span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      ИНН: {app.company_inn && app.company_inn !== '—' ? app.company_inn : "—"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>

                              {/* Product */}
                              <td className="px-4 py-4">
                                <span className="text-sm text-muted-foreground">{app.product_type_display}</span>
                              </td>

                              {/* Amount - Monospace Right-Aligned */}
                              <td className="px-4 py-4 text-right">
                                <span className="font-mono text-sm font-semibold text-foreground">
                                  {formatCurrency(app.amount)}
                                </span>
                              </td>

                              {/* Bank */}
                              <td className="px-4 py-4">
                                {app.target_bank_name ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    {app.target_bank_name}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">—</span>
                                )}
                              </td>

                              {/* Status - TOR Pill */}
                              <td className="px-4 py-4">
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                  statusCfg.className
                                )}>
                                  {statusCfg.icon}
                                  {statusCfg.label}
                                </span>
                              </td>

                              {/* Action - Ghost Button */}
                              <td className="px-4 py-4 text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDetails(app.id)
                                  }}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </main>

      {/* ============================================ */}
      {/* PREMIUM SLIDE-OVER DRAWER */}
      {/* ============================================ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={handleCloseDrawer}
          />

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-[600px] bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Sticky Header */}
            <div className="flex-shrink-0 sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-foreground">
                    Заявка <span className="font-mono">#{selectedApp?.id}</span>
                  </h2>
                  {selectedApp && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      statusConfig[selectedApp.status]?.className || "bg-gray-100 text-gray-600"
                    )}>
                      {statusConfig[selectedApp.status]?.icon}
                      {statusConfig[selectedApp.status]?.label || selectedApp.status}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseDrawer}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingApp ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                </div>
              ) : selectedApp ? (
                <div className="p-6 space-y-6">
                  {/* Client Intelligence Card */}
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Информация о клиенте
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Компания</p>
                          <p className="text-sm font-semibold text-foreground mt-1">
                            {selectedApp.company_name || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ИНН</p>
                          <p className="text-sm font-mono text-foreground mt-1">
                            {selectedApp.company_inn || "—"}
                          </p>
                        </div>
                        {selectedApp.company_data?.director_name && (
                          <div className="col-span-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Директор</p>
                            <p className="text-sm text-foreground mt-1 flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {selectedApp.company_data.director_name}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedApp.company_inn && (
                        <a
                          href={getCheckoUrl(selectedApp.company_inn) || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-[#3CE8D1] hover:text-[#2fd4c0] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Проверить на Checko.ru
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </CardContent>
                  </Card>

                  {/* Application Summary */}
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Параметры заявки
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                          <DollarSign className="h-5 w-5 text-[#3CE8D1]" />
                          <div>
                            <p className="text-xs text-muted-foreground">Сумма</p>
                            <p className="font-mono font-semibold text-foreground">
                              {formatCurrency(selectedApp.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                          <Calendar className="h-5 w-5 text-[#4F7DF3]" />
                          <div>
                            <p className="text-xs text-muted-foreground">Срок</p>
                            <p className="font-semibold text-foreground">{selectedApp.term_months} мес.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                          <FileText className="h-5 w-5 text-[#E03E9D]" />
                          <div>
                            <p className="text-xs text-muted-foreground">Продукт</p>
                            <p className="font-semibold text-foreground">{selectedApp.product_type_display}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
                          <Building2 className="h-5 w-5 text-[#FFD93D]" />
                          <div>
                            <p className="text-xs text-muted-foreground">Целевой банк</p>
                            <p className="font-semibold text-foreground">{selectedApp.target_bank_name || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manager Notes - Sticky Note Style */}
                  <Card className="border-[#FFD93D]/30 bg-[#FFD93D]/5 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-[#FFD93D] flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        Заметки менеджера
                      </CardTitle>
                      <CardDescription className="text-xs text-[#FFD93D]/70">
                        Только для администратора
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Внутренние заметки по заявке..."
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        className="min-h-[80px] resize-none bg-card border-[#FFD93D]/30 focus:border-[#FFD93D] focus:ring-[#FFD93D]"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className={cn(
                          "text-xs transition-opacity",
                          noteSaved ? "text-[#3CE8D1] opacity-100" : "opacity-0"
                        )}>
                          ✓ Сохранено
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveNotes}
                          disabled={isActioning}
                          className="h-7 px-3 text-xs border-[#FFD93D]/30 text-[#FFD93D] hover:bg-[#FFD93D]/10"
                        >
                          💾 Сохранить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Partner Assignment */}
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        Назначение партнёра
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                          <SelectTrigger className="flex-1 bg-card border-border">
                            <SelectValue placeholder="Выберите партнёра..." />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map((partner) => {
                              // Extract bank name from last_name (format: "LastName (BankName)")
                              const lastNameParts = partner.last_name?.match(/(.+?)\s*\((.+)\)/)
                              const bankName = lastNameParts ? lastNameParts[2] : partner.last_name
                              const displayName = bankName || `${partner.first_name} ${partner.last_name}`.trim()
                              return (
                                <SelectItem key={partner.id} value={partner.id.toString()}>
                                  {displayName} ({partner.email})
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAssignPartner}
                          disabled={!selectedPartnerId || isActioning}
                          className="gap-2 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        >
                          {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                          Назначить
                        </Button>
                      </div>
                      {selectedApp.partner_email && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          Текущий партнёр: <span className="font-medium text-[#3CE8D1]">{selectedApp.partner_email}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chat Module */}
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Чат по заявке
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ApplicationChat applicationId={selectedApp.id} className="border-0 shadow-none" />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  Заявка не найдена
                </div>
              )}
            </div>

            {/* Sticky Footer Actions */}
            {selectedApp && (
              <div className="flex-shrink-0 sticky bottom-0 bg-card border-t border-border px-6 py-4">
                <div className="flex items-center gap-3">
                  {/* Show Restore button for rejected applications */}
                  {selectedApp.status === "rejected" ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowRestoreDialog(true)}
                      disabled={isActioning}
                      className="gap-2 flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Восстановить
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectDialog(true)}
                        disabled={isActioning}
                        className="gap-2 flex-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Отклонить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowReturnDialog(true)}
                        disabled={isActioning || selectedApp.status === "info_requested"}
                        className="gap-2 flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Вернуть
                      </Button>
                      <Button
                        onClick={() => setShowApproveDialog(true)}
                        disabled={isActioning || selectedApp.status === "approved" || selectedApp.status === "in_review"}
                        className="gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Одобрить
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ALERT DIALOG - Return to Revision */}
      {/* ============================================ */}
      <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Вернуть заявку на доработку?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Заявка будет возвращена агенту для предоставления дополнительной информации.
              Статус изменится на «Запрос информации».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestInfo}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================ */}
      {/* ALERT DIALOG - Approve Application */}
      {/* ============================================ */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Одобрить заявку?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Заявка будет переведена в статус «В работе» и станет доступна для партнёров.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Одобрить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================ */}
      {/* ALERT DIALOG - Reject Application */}
      {/* ============================================ */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Отклонить заявку?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Заявка будет отклонена. Это действие можно отменить позже, изменив статус вручную.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Отклонить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================================ */}
      {/* ALERT DIALOG - Restore Application */}
      {/* ============================================ */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Восстановить заявку?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Заявка будет возвращена на рассмотрение со статусом «Новая».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Восстановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

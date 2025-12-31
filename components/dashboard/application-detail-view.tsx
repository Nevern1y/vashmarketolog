"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  RefreshCw,
  Loader2,
  AlertCircle,
  Send,
  Building2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api"
import { ApplicationChat } from "./application-chat"
import { useApplication } from "@/hooks/use-applications"
import { useDocumentMutations } from "@/hooks/use-documents"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  getStatusConfig,
  getStepFromStatus,
  isNegativeStatus,
  getDocStatusConfig,
  STEPPER_LABELS,
} from "@/lib/status-mapping"

interface ApplicationDetailViewProps {
  applicationId: string
  onBack: () => void
}

// Document status icon mapping
const DOC_STATUS_ICONS = {
  clock: Clock,
  check: CheckCircle2,
  x: XCircle,
} as const

// Format date from ISO string
const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "—"
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

export function ApplicationDetailView({ applicationId, onBack }: ApplicationDetailViewProps) {
  const { user } = useAuth()
  const { application, isLoading, error, refetch } = useApplication(applicationId)
  const { uploadDocument, isLoading: isUploading } = useDocumentMutations()

  // State for re-upload functionality
  const [replacingDocId, setReplacingDocId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for send to bank functionality (Phase 7)
  const [isSending, setIsSending] = useState(false)

  // State for sync status functionality (Phase 7.2)
  const [isSyncing, setIsSyncing] = useState(false)

  // Response types for bank integration
  interface SendToBankResponse {
    message: string
    ticket_id: string
    bank_status: string
  }

  interface SyncStatusResponse {
    message: string
    bank_status: string
    bank_status_id: number
    changed: boolean
  }

  // Handler for sending application to Realist Bank
  const handleSendToBank = async () => {
    if (!application || isSending) return

    setIsSending(true)
    try {
      const response = await api.post<SendToBankResponse>(`/applications/${applicationId}/send_to_bank/`)
      toast.success(response.message || 'Заявка успешно отправлена в банк!')
      refetch() // Refresh to show updated external_id
    } catch (error: any) {
      const errorMsg = error.message || 'Ошибка при отправке в банк'
      toast.error(errorMsg)
    } finally {
      setIsSending(false)
    }
  }

  // Handler for syncing status from Realist Bank (Phase 7.2)
  const handleSyncStatus = async () => {
    if (!application || isSyncing || !application.external_id) return

    setIsSyncing(true)
    try {
      const response = await api.post<SyncStatusResponse>(`/applications/${applicationId}/sync_status/`)
      const newStatus = response.bank_status || 'Обновлено'
      toast.success(`Статус обновлен: ${newStatus}`)
      refetch() // Refresh to show updated bank_status
    } catch (error: any) {
      const errorMsg = error.message || 'Не удалось получить статус от банка'
      toast.error(errorMsg)
    } finally {
      setIsSyncing(false)
    }
  }

  // Handle re-upload click - opens file picker for specific document
  const handleReuploadClick = (docId: number) => {
    setReplacingDocId(docId)
    fileInputRef.current?.click()
  }

  // Handle file selection for re-upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingDocId) {
      setReplacingDocId(null)
      return
    }

    // Upload new document (MVP: uploads as new, doesn't actually replace)
    const doc = await uploadDocument({
      name: file.name,
      file: file,
      document_type: 'other',
    })

    if (doc?.id) {
      toast.success(`Документ "${file.name}" загружен`)
      refetch() // Refresh application to show new state
    } else {
      toast.error('Ошибка загрузки документа')
    }

    // Reset state
    setReplacingDocId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Derive current step from application status
  const currentStep = application ? getStepFromStatus(application.status) : 0
  const isRejected = application ? isNegativeStatus(application.status) : false
  const statusConfig = application ? getStatusConfig(application.status) : null

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Загрузка заявки...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-red-600">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Попробовать снова
        </Button>
      </div>
    )
  }

  // Not found state
  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">Заявка не найдена</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                Заявка №{application.id}
              </h1>
              {statusConfig && (
                <span className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                  statusConfig.bgColor,
                  statusConfig.color
                )}>
                  {statusConfig.label.toUpperCase()}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 lg:gap-4 text-sm text-muted-foreground">
              <span>Создана: {formatDate(application.created_at)}</span>
              <span className="hidden lg:inline">•</span>
              <span>Банк: {application.target_bank_name || "—"}</span>
              <span className="hidden lg:inline">•</span>
              <span>Клиент: {application.company_name || "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Show external_id badge with sync button if sent to bank */}
          {application.external_id && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                <Building2 className="h-3 w-3 mr-1" />
                Банк ID: {application.external_id}
                {application.bank_status && application.bank_status !== 'new' && application.bank_status !== 'sent' && (
                  <span className="ml-1 text-xs opacity-75">({application.bank_status})</span>
                )}
              </Badge>
              {/* Sync status button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                onClick={handleSyncStatus}
                disabled={isSyncing}
                title="Обновить статус из банка"
              >
                <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
              </Button>
            </div>
          )}

          {/* SIGNING BUTTON - appears when bank provides signing_url */}
          {application.signing_url && (
            <Button
              onClick={() => window.open(application.signing_url!, '_blank')}
              className="bg-gradient-to-r from-[#E03E9D] to-[#9b2575] hover:from-[#c93589] hover:to-[#841f63] text-white shadow-lg animate-pulse"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Подписать в Банке
            </Button>
          )}

          {/* Send to Bank button - visible for agents when not yet sent */}
          {(user?.role === 'agent' || user?.role === 'admin') && !application.external_id && (
            <Button
              onClick={handleSendToBank}
              disabled={isSending}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
              size="sm"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Отправить в банк
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid - 65/35 split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65%_35%]">
        {/* Left Column - Main Info & Docs */}
        <div className="space-y-6">
          {/* Progress Timeline - Uses STEPPER_LABELS from centralized mapping */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Статус заявки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {STEPPER_LABELS.map((label, index) => (
                  <div key={index} className="flex flex-1 items-center min-w-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                          // Completed steps
                          index < currentStep
                            ? "border-[#3CE8D1] bg-[#3CE8D1] text-[#0a1628]"
                            // Current step (or rejected at this step)
                            : index === currentStep
                              ? isRejected && index >= 2
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-[#3CE8D1] bg-white text-[#3CE8D1]"
                              // Future steps
                              : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {index < currentStep ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isRejected && index === currentStep && index >= 2 ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-medium text-center whitespace-nowrap",
                          index <= currentStep ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {index < STEPPER_LABELS.length - 1 && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1 min-w-4",
                          index < currentStep ? "bg-[#3CE8D1]" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* About Application Card - Shows product-specific fields */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">О заявке</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Basic Info */}
                <div>
                  <span className="text-muted-foreground">Продукт:</span>
                  <p className="font-medium">{application.product_type_display || application.product_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Сумма:</span>
                  <p className="font-medium">{Number(application.amount).toLocaleString('ru-RU')} ₽</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Срок:</span>
                  <p className="font-medium">{application.term_months} мес.</p>
                </div>
                {application.target_bank_name && (
                  <div>
                    <span className="text-muted-foreground">Целевой банк:</span>
                    <p className="font-medium">{application.target_bank_name}</p>
                  </div>
                )}

                {/* Product-Specific Fields from goscontract_data */}
                {application.goscontract_data?.contractor_inn && (
                  <div>
                    <span className="text-muted-foreground">ИНН Контрагента:</span>
                    <p className="font-medium">{application.goscontract_data.contractor_inn}</p>
                  </div>
                )}
                {application.goscontract_data?.country && (
                  <div>
                    <span className="text-muted-foreground">Страна:</span>
                    <p className="font-medium">{application.goscontract_data.country}</p>
                  </div>
                )}
                {application.goscontract_data?.equipment_type && (
                  <div>
                    <span className="text-muted-foreground">Предмет лизинга:</span>
                    <p className="font-medium">{application.goscontract_data.equipment_type}</p>
                  </div>
                )}
                {application.goscontract_data?.purchase_number && (
                  <div>
                    <span className="text-muted-foreground">Номер закупки:</span>
                    <p className="font-medium">{application.goscontract_data.purchase_number}</p>
                  </div>
                )}
                {application.goscontract_data?.beneficiary_inn && (
                  <div>
                    <span className="text-muted-foreground">ИНН Заказчика:</span>
                    <p className="font-medium">{application.goscontract_data.beneficiary_inn}</p>
                  </div>
                )}
              </div>
              {application.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Примечания:</span>
                  <p className="text-sm mt-1">{application.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Пакет документов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document List from API */}
              {application.documents && application.documents.length > 0 ? (
                <div className="space-y-2">
                  {application.documents.map((doc) => {
                    const docConfig = getDocStatusConfig(doc.status)
                    const StatusIcon = DOC_STATUS_ICONS[docConfig.iconType]
                    const showReplaceButton = doc.status === 'rejected' && application.status === 'info_requested'

                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3",
                          docConfig.bgColor,
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{doc.name}</span>
                            {doc.type_display && (
                              <span className="text-xs text-muted-foreground">{doc.type_display}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-8 sm:ml-0">
                          <StatusIcon className={cn("h-5 w-5 shrink-0", docConfig.color)} />
                          <span className={cn("text-xs font-medium", docConfig.color)}>{docConfig.label}</span>
                          {showReplaceButton && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-card ml-2"
                              onClick={() => handleReuploadClick(doc.id)}
                              disabled={isUploading && replacingDocId === doc.id}
                            >
                              {isUploading && replacingDocId === doc.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="mr-1 h-3 w-3" />
                              )}
                              Загрузить заново
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Документы не прикреплены
                </p>
              )}

              {/* Hidden file input for re-upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

              {/* Upload zone (only for drafts or info_requested) */}
              {(application.status === 'draft' || application.status === 'info_requested') && (
                <div
                  className="rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-[#3CE8D1] hover:bg-[#3CE8D1]/5 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium text-foreground">Загрузить дополнительные файлы</p>
                  <p className="text-xs text-muted-foreground">Перетащите файлы сюда или нажмите для выбора</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat (Real API-powered) */}
        <div className="lg:sticky lg:top-6">
          <ApplicationChat
            applicationId={applicationId}
            className="lg:h-[600px]"
          />
        </div>
      </div>
    </div>
  )
}

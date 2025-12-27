"use client"

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
  AlertCircle
} from "lucide-react"
import { ApplicationChat } from "./application-chat"
import { useApplication } from "@/hooks/use-applications"
import { useAuth } from "@/lib/auth-context"
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
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
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
                            ? "border-[#00d4aa] bg-[#00d4aa] text-white"
                            // Current step (or rejected at this step)
                            : index === currentStep
                              ? isRejected && index >= 2
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-[#00d4aa] bg-white text-[#00d4aa]"
                              // Future steps
                              : "border-gray-200 bg-white text-gray-400",
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
                          index < currentStep ? "bg-[#00d4aa]" : "bg-gray-200",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
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
                            <Button size="sm" variant="outline" className="h-7 text-xs bg-white ml-2">
                              <RefreshCw className="mr-1 h-3 w-3" />
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

              {/* Upload zone (only for drafts or info_requested) */}
              {(application.status === 'draft' || application.status === 'info_requested') && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 cursor-pointer">
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

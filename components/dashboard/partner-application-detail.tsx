"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Building2,
  FileText,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  Download,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { useApplication, usePartnerActions } from "@/hooks/use-applications"
import { toast } from "sonner"

interface PartnerApplicationDetailProps {
  applicationId: string
  onBack: () => void
}

export function PartnerApplicationDetail({ applicationId, onBack }: PartnerApplicationDetailProps) {
  const [decisionModal, setDecisionModal] = useState<"approve" | "reject" | "request-info" | null>(null)
  const [comment, setComment] = useState("")

  // API Hooks
  const { application, isLoading, error, refetch } = useApplication(parseInt(applicationId))
  const { submitDecision, isLoading: submitting } = usePartnerActions()

  // Format currency
  const formatCurrency = (amount: string | number) => {
    try {
      const num = typeof amount === "string" ? parseFloat(amount) : amount
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(num)
    } catch {
      return amount.toString()
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  // Handle decision submission
  const handleDecision = async (type: "approve" | "reject" | "request-info") => {
    const result = await submitDecision(parseInt(applicationId), {
      decision: type === "approve" ? "approved" : type === "reject" ? "rejected" : "info_requested",
      comment: comment,
    })

    if (result) {
      const messages = {
        approve: "Заявка одобрена",
        reject: "Заявка отклонена",
        "request-info": "Запрос информации отправлен",
      }
      toast.success(messages[type])
      setDecisionModal(null)
      setComment("")
      onBack()
    } else {
      toast.error("Ошибка при отправке решения")
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Новая", className: "bg-[#00d4aa]/10 text-[#00d4aa]" },
      in_review: { label: "На рассмотрении", className: "bg-blue-500/10 text-blue-500" },
      approved: { label: "Одобрена", className: "bg-[#00d4aa]/10 text-[#00d4aa]" },
      rejected: { label: "Отклонена", className: "bg-red-500/10 text-red-500" },
      info_requested: { label: "Запрос информации", className: "bg-[#f97316]/10 text-[#f97316]" },
    }
    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-600" }
    return <Badge className={`${config.className} text-sm px-3 py-1`}>{config.label}</Badge>
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Error state
  if (error || !application) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Заявка #{applicationId}</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div>
              <p className="font-medium text-red-700">Ошибка загрузки заявки</p>
              <p className="text-sm text-red-600">{error || "Заявка не найдена"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate deadline urgency (2 days from creation)
  const createdDate = new Date(application.created_at)
  const deadline = new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000)
  const isUrgent = deadline.getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Заявка #{applicationId}</h1>
            <p className="text-muted-foreground">
              Получена: {formatDate(application.created_at)}
            </p>
          </div>
        </div>
        {getStatusBadge(application.status)}
      </div>

      {/* Deadline Warning */}
      {isUrgent && (
        <Card className="border-[#f97316] bg-[#f97316]/5 shadow-sm">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316]/10">
              <AlertTriangle className="h-5 w-5 text-[#f97316]" />
            </div>
            <div>
              <p className="font-medium text-[#f97316]">
                Срок рассмотрения: {formatDate(deadline.toISOString())}
              </p>
              <p className="text-sm text-muted-foreground">
                Осталось менее 24 часов для принятия решения
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="client">Клиент</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
        </TabsList>

        {/* Product Info Tab */}
        <TabsContent value="info">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Параметры продукта</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                      <FileText className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Тип продукта</p>
                      <p className="font-medium">{application.product_type_display}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                      <DollarSign className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Сумма</p>
                      <p className="font-medium text-lg">{formatCurrency(application.amount)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                      <Calendar className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Срок</p>
                      <p className="font-medium">{application.term_months} месяцев</p>
                    </div>
                  </div>
                  {application.notes && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                        <FileText className="h-5 w-5 text-[#00d4aa]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Примечания</p>
                        <p className="font-medium">{application.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Tab */}
        <TabsContent value="client">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Компания</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {application.company_name || "Не указана"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ИНН</p>
                  <p className="font-medium font-mono">
                    {application.company_inn || "Не указан"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Контактное лицо</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{application.created_by_name || "Не указано"}</p>
                      <p className="text-sm text-muted-foreground">Заявитель</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{application.created_by_email || "Не указан"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Прикрепленные документы</CardTitle>
              <CardDescription>Документы, предоставленные клиентом</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.documents && application.documents.length > 0 ? (
                  application.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type_display}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (doc.file_url) {
                            window.open(doc.file_url, '_blank')
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Скачать
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Документы не прикреплены</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Block - only show for pending/in_review applications */}
      {["pending", "in_review", "info_requested"].includes(application.status) && (
        <Card className="shadow-sm border-2">
          <CardHeader>
            <CardTitle>Принять решение</CardTitle>
            <CardDescription>Выберите действие по заявке</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[#00d4aa] text-white hover:bg-[#00b894] gap-2"
                onClick={() => setDecisionModal("approve")}
                disabled={submitting}
              >
                <CheckCircle2 className="h-5 w-5" />
                Одобрить заявку
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="gap-2"
                onClick={() => setDecisionModal("reject")}
                disabled={submitting}
              >
                <XCircle className="h-5 w-5" />
                Отклонить заявку
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white bg-transparent"
                onClick={() => setDecisionModal("request-info")}
                disabled={submitting}
              >
                <HelpCircle className="h-5 w-5" />
                Запросить информацию
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Modals */}
      <Dialog open={decisionModal === "approve"} onOpenChange={() => setDecisionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#00d4aa]" />
              Одобрить заявку
            </DialogTitle>
            <DialogDescription>
              Подтвердите одобрение заявки. Клиент получит уведомление о положительном решении.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Комментарий (необязательно)</Label>
              <Textarea
                placeholder="Условия одобрения, комментарии..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionModal(null)} disabled={submitting}>
              Отмена
            </Button>
            <Button
              className="bg-[#00d4aa] text-white hover:bg-[#00b894]"
              onClick={() => handleDecision("approve")}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Подтвердить одобрение"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionModal === "reject"} onOpenChange={() => setDecisionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Отклонить заявку
            </DialogTitle>
            <DialogDescription>
              Укажите причину отклонения. Клиент получит уведомление с вашим комментарием.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Причина отклонения *</Label>
              <Textarea
                placeholder="Укажите причину отклонения..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionModal(null)} disabled={submitting}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision("reject")}
              disabled={!comment || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Подтвердить отклонение"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={decisionModal === "request-info"} onOpenChange={() => setDecisionModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#f97316]" />
              Запросить информацию
            </DialogTitle>
            <DialogDescription>
              Укажите, какая дополнительная информация или документы требуются для рассмотрения заявки.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Запрос *</Label>
              <Textarea
                placeholder="Опишите, какая информация или документы требуются..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionModal(null)} disabled={submitting}>
              Отмена
            </Button>
            <Button
              className="bg-[#f97316] text-white hover:bg-[#ea580c]"
              onClick={() => handleDecision("request-info")}
              disabled={!comment || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                "Отправить запрос"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

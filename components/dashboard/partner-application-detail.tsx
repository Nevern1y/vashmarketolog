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
  Banknote,
  Hash,
  MapPin,
  CreditCard,
  Landmark,
  ExternalLink,
} from "lucide-react"
import { useApplication, usePartnerActions } from "@/hooks/use-applications"
import { toast } from "sonner"
import { ApplicationChat } from "./application-chat"
import { cn } from "@/lib/utils"
import { getPrimaryAmountValue, getProductTypeLabel } from "@/lib/application-display"

interface PartnerApplicationDetailProps {
  applicationId: string
  onBack: () => void
}

// Helper component for displaying product info items
function ProductInfoItem({
  label,
  value,
  mono,
  fullWidth
}: {
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean
}) {
  return (
    <div className={cn("p-4 rounded-lg bg-muted/50 border", fullWidth && "md:col-span-2")}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-medium", mono && "font-mono")}>{value}</p>
    </div>
  )
}

const TENDER_LAW_LABELS: Record<string, string> = {
  "44_fz": "44-ФЗ",
  "223_fz": "223-ФЗ",
  "615_pp": "615-ПП",
  "185_fz": "185-ФЗ",
  "275_fz": "275-ФЗ",
  kbg: "КБГ (Коммерческая)",
  commercial: "Коммерческий",
}

export function PartnerApplicationDetail({ applicationId, onBack }: PartnerApplicationDetailProps) {
  const [decisionModal, setDecisionModal] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")
  const [offeredRate, setOfferedRate] = useState("")

  // API Hooks
  const { application, isLoading, error, refetch } = useApplication(parseInt(applicationId))
  const { submitDecision, isLoading: submitting } = usePartnerActions()

  // Format currency
  const formatCurrency = (amount: string | number | null) => {
    if (amount === null || amount === undefined || amount === "") return "—"
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    if (Number.isNaN(num)) return "—"
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(num)
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
  const handleDecision = async (type: "approve" | "reject") => {
    const payload: {
      decision: "approved" | "rejected" | "info_requested";
      comment?: string;
      offered_rate?: number;
    } = {
      decision: type === "approve" ? "approved" : "rejected",
      comment: comment,
    }

    // Add offered_rate when approving
    if (type === "approve" && offeredRate) {
      payload.offered_rate = parseFloat(offeredRate)
    }

    const result = await submitDecision(parseInt(applicationId), payload)

    if (result) {
      const messages = {
        approve: "Заявка одобрена",
        reject: "Заявка отклонена",
      }
      toast.success(messages[type])
      setDecisionModal(null)
      setComment("")
      setOfferedRate("")
      onBack()
    } else {
      toast.error("Ошибка при отправке решения")
    }
  }

  const handleRequestInfo = async () => {
    const result = await submitDecision(parseInt(applicationId), {
      decision: "info_requested",
      comment: "",
    })

    if (result) {
      toast.success("Возвращено на доработку")
      setComment("")
      setOfferedRate("")
      onBack()
    } else {
      toast.error("Ошибка при смене статуса")
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: "Черновик", className: "bg-slate-500/10 text-slate-400" },
      pending: { label: "Скоринг", className: "bg-[#F59E0B]/10 text-[#F59E0B]" },
      in_review: { label: "На рассмотрении", className: "bg-[#4F7DF3]/10 text-[#4F7DF3]" },
      approved: { label: "Одобрена", className: "bg-emerald-500/10 text-emerald-400" },
      rejected: { label: "Отклонена", className: "bg-[#E03E9D]/10 text-[#E03E9D]" },
      info_requested: { label: "На доработке", className: "bg-[#FFD93D]/10 text-[#FFD93D]" },
      won: { label: "Выдан", className: "bg-[#3CE8D1]/10 text-[#3CE8D1]" },
      lost: { label: "Не выдан", className: "bg-[#FF521D]/10 text-[#FF521D]" },
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
  const productLabel = getProductTypeLabel(application.product_type, application.product_type_display)
  const primaryAmount = getPrimaryAmountValue(application)

  // Generate composite application ID (TZ requirement)
  const getCompositeId = () => {
    const year = new Date(application.created_at).getFullYear()
    const paddedId = application.id.toString().padStart(5, '0')

    const prefixMap: Record<string, string> = {
      bank_guarantee: 'БГ',
      tender_loan: 'ТК',
      contract_loan: 'КИК',
      corporate_credit: 'КК',
      factoring: 'ФК',
      leasing: 'ЛЗ',
    }
    const prefix = prefixMap[application.product_type] || 'ЗА'

    return `${prefix}-${year}-${paddedId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Заявка <span className="font-mono text-[#3CE8D1]">{getCompositeId()}</span>
            </h1>
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

      {/* Summary Card - Quick Overview */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <Building2 className="h-5 w-5 text-[#3CE8D1]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Клиент</p>
                <p className="font-medium">{application.company_name || "Не указано"}</p>
                <p className="text-xs text-muted-foreground">ИНН: {application.company_inn || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <FileText className="h-5 w-5 text-[#3CE8D1]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Продукт</p>
                <p className="font-medium">{productLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const law = application.tender_law || (application as any).goscontract_data?.law
                    return law ? (TENDER_LAW_LABELS[law] || law) : "-"
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <Banknote className="h-5 w-5 text-[#3CE8D1]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Сумма</p>
                <p className="font-medium">{formatCurrency(primaryAmount)}</p>
                <p className="text-xs text-muted-foreground">{application.term_months} мес.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                <Calendar className="h-5 w-5 text-[#3CE8D1]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Дата создания</p>
                <p className="font-medium">{new Date(application.created_at).toLocaleDateString('ru-RU')}</p>
                <p className="text-xs text-muted-foreground">{application.target_bank_name || "Банк не выбран"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="bg-muted/50 grid w-full grid-cols-5">
          <TabsTrigger value="company">Компания</TabsTrigger>
          <TabsTrigger value="product">Параметры</TabsTrigger>
          <TabsTrigger value="client">Контакты</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="chat">Чат</TabsTrigger>
        </TabsList>

        {/* Company Tab - Full company information with tabs */}
        <TabsContent value="company">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                Информация о компании
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="general">Общие данные</TabsTrigger>
                  <TabsTrigger value="registration">Регистрация</TabsTrigger>
                  <TabsTrigger value="bank">Банковские реквизиты</TabsTrigger>
                  <TabsTrigger value="founders">Учредители</TabsTrigger>
                </TabsList>

                {/* General Information Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Наименование</span>
                      </div>
                      <p className="font-medium">{(application as any).company_data?.name || application.company_name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{(application as any).company_data?.short_name || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Реквизиты</span>
                      </div>
                      <div className="space-y-1">
                        <p>ИНН: <span className="font-medium font-mono">{(application as any).company_data?.inn || application.company_inn}</span></p>
                        <p>КПП: <span className="font-medium font-mono">{(application as any).company_data?.kpp || '-'}</span></p>
                        <p>ОГРН: <span className="font-medium font-mono">{(application as any).company_data?.ogrn || '-'}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Юридический адрес</span>
                      </div>
                      <p className="text-sm">{(application as any).company_data?.legal_address || 'Не указан'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Фактический адрес</span>
                      </div>
                      <p className="text-sm">{(application as any).company_data?.actual_address || 'Совпадает с юридическим'}</p>
                    </div>
                  </div>
                  {/* Additional company info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(application as any).company_data?.okved && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">ОКВЭД</p>
                        <p className="font-mono font-medium">{(application as any).company_data.okved}</p>
                      </div>
                    )}
                    {(application as any).company_data?.registration_date && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Дата регистрации</p>
                        <p className="font-medium">{new Date((application as any).company_data.registration_date).toLocaleDateString('ru-RU')}</p>
                      </div>
                    )}
                    {(application as any).company_data?.authorized_capital && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Уставный капитал</p>
                        <p className="font-medium">{formatCurrency((application as any).company_data.authorized_capital)}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Registration Tab */}
                <TabsContent value="registration" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Руководитель</span>
                      </div>
                      <p className="font-medium">{(application as any).company_data?.director_name || 'Не указан'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{(application as any).company_data?.director_position || 'Генеральный директор'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Организационно-правовая форма</span>
                      </div>
                      <p className="font-medium">{(application as any).company_data?.legal_form || 'ООО'}</p>
                    </div>
                  </div>
                  {/* Tax system and other details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(application as any).company_data?.tax_system && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Система налогообложения</p>
                        <p className="font-medium">{(application as any).company_data.tax_system}</p>
                      </div>
                    )}
                    {(application as any).company_data?.employees_count && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-muted-foreground">Среднесписочная численность</p>
                        <p className="font-medium">{(application as any).company_data.employees_count} чел.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Bank Requisites Tab */}
                <TabsContent value="bank" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Банк</span>
                      </div>
                      <p className="font-medium">{(application as any).company_data?.bank_name || 'Не указан'}</p>
                      <p className="text-sm text-muted-foreground mt-1">БИК: {(application as any).company_data?.bank_bic || '-'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Счета</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">Р/с: <span className="font-mono">{(application as any).company_data?.bank_account || '-'}</span></p>
                        <p className="text-sm">К/с: <span className="font-mono">{(application as any).company_data?.bank_corr_account || '-'}</span></p>
                      </div>
                    </div>
                  </div>
                  {(application as any).company_data?.bank_accounts_data && (application as any).company_data.bank_accounts_data.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-3">
                        <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                        <span className="text-sm font-medium text-muted-foreground">Дополнительные счета</span>
                      </div>
                      <div className="space-y-3">
                        {(application as any).company_data.bank_accounts_data.map((acc: any, idx: number) => (
                          <div key={idx} className="p-3 rounded bg-background border">
                            <p className="font-medium">{acc.bank_name}</p>
                            <p className="text-sm text-muted-foreground">БИК: {acc.bic} | Счет: {acc.account}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Founders Tab */}
                <TabsContent value="founders" className="space-y-4">
                  {(application as any).company_data?.founders_data && (application as any).company_data.founders_data.length > 0 ? (
                    <div className="space-y-3">
                      {(application as any).company_data.founders_data.map((founder: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="font-medium">{founder.name}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {founder.inn && <p className="text-muted-foreground">ИНН: <span className="font-mono">{founder.inn}</span></p>}
                            {founder.share && <p className="text-muted-foreground">Доля: <span className="font-medium">{founder.share}%</span></p>}
                            {founder.type && <p className="text-muted-foreground">Тип: {founder.type}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Данные об учредителях не заполнены</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Parameters Tab */}
        <TabsContent value="product">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#3CE8D1]" />
                Параметры продукта
              </CardTitle>
              <CardDescription>{productLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic product info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProductInfoItem label="Тип продукта" value={productLabel} />
                <ProductInfoItem label="Сумма" value={formatCurrency(primaryAmount)} />
                <ProductInfoItem label="Срок" value={`${application.term_months} месяцев`} />
                {application.tender_law && (
                  <ProductInfoItem label="Закон о закупках" value={
                    TENDER_LAW_LABELS[application.tender_law] || application.tender_law
                  } />
                )}
              </div>

              {/* Bank Guarantee specific fields */}
              {application.product_type === 'bank_guarantee' && (
                <>
                  {(application as any).guarantee_type && (
                    <ProductInfoItem
                      label="Тип гарантии"
                      value={
                        (application as any).guarantee_type === 'application_security' ? 'На участие' :
                          (application as any).guarantee_type === 'contract_execution' ? 'На обеспечение исполнения контракта' :
                            (application as any).guarantee_type === 'advance_return' ? 'На возврат аванса' :
                              (application as any).guarantee_type === 'warranty_obligations' ? 'На гарантийный период' :
                                (application as any).guarantee_type === 'payment_guarantee' ? 'На гарантию оплаты товара' :
                                  (application as any).guarantee_type === 'customs_guarantee' ? 'Таможенные гарантии' :
                                    (application as any).guarantee_type === 'vat_refund' ? 'На возвращение НДС' :
                                      (application as any).guarantee_type
                      }
                    />
                  )}

                  {/* Tender data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(application as any).goscontract_data?.purchase_number && (
                      <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">№ извещения</p>
                          <p className="font-mono font-medium">{(application as any).goscontract_data.purchase_number}</p>
                        </div>
                        <a
                          href={`https://zakupki.gov.ru/epz/order/notice/ea44/view/common-info.html?regNumber=${(application as any).goscontract_data.purchase_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3CE8D1] hover:underline flex items-center gap-1 text-sm"
                        >
                          ЕИС <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {(application as any).goscontract_data?.lot_number && (
                      <ProductInfoItem label="№ лота" value={(application as any).goscontract_data.lot_number} mono />
                    )}
                  </div>

                  {/* Guarantee dates */}
                  {((application as any).goscontract_data?.guarantee_start_date || (application as any).goscontract_data?.guarantee_end_date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(application as any).goscontract_data?.guarantee_start_date && (
                        <ProductInfoItem label="Срок БГ с" value={new Date((application as any).goscontract_data.guarantee_start_date).toLocaleDateString('ru-RU')} />
                      )}
                      {(application as any).goscontract_data?.guarantee_end_date && (
                        <ProductInfoItem label="Срок БГ по" value={new Date((application as any).goscontract_data.guarantee_end_date).toLocaleDateString('ru-RU')} />
                      )}
                    </div>
                  )}

                  {/* Flags as tags */}
                  {((application as any).goscontract_data?.is_close_auction ||
                    (application as any).goscontract_data?.has_prepayment ||
                    (application as any).goscontract_data?.has_customer_template) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(application as any).goscontract_data?.is_close_auction && <Badge variant="outline">✓ Закрытые торги</Badge>}
                        {(application as any).goscontract_data?.has_prepayment && (
                          <Badge variant="outline">
                            ✓ Авансирование {(application as any).goscontract_data?.advance_percent ? `(${(application as any).goscontract_data.advance_percent}%)` : ''}
                          </Badge>
                        )}
                        {(application as any).goscontract_data?.has_customer_template && <Badge variant="outline">✓ Шаблон заказчика</Badge>}
                      </div>
                    )}

                  {/* Contract counts */}
                  {((application as any).goscontract_data?.contracts_44fz_count > 0 || (application as any).goscontract_data?.contracts_223fz_count > 0) && (
                    <ProductInfoItem
                      label="Исполненных контрактов"
                      value={`44-ФЗ: ${(application as any).goscontract_data.contracts_44fz_count || 0}, 223-ФЗ: ${(application as any).goscontract_data.contracts_223fz_count || 0}`}
                    />
                  )}
                </>
              )}

              {/* Contract Loan (КИК) Fields */}
              {application.product_type === 'contract_loan' && (
                <>
                  {(application as any).goscontract_data?.contract_loan_type && (
                    <ProductInfoItem
                      label="Тип продукта"
                      value={
                        (application as any).goscontract_data.contract_loan_type === 'credit_execution' ? 'Кредит на исполнение контракта' :
                          (application as any).goscontract_data.contract_loan_type === 'loan' ? 'Займ' :
                            (application as any).goscontract_data.contract_loan_type
                      }
                    />
                  )}

                  {/* Contract info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(application as any).goscontract_data?.purchase_number && (
                      <ProductInfoItem label="№ извещения/контракта" value={(application as any).goscontract_data.purchase_number} mono />
                    )}
                    {(application as any).goscontract_data?.lot_number && (
                      <ProductInfoItem label="№ лота" value={(application as any).goscontract_data.lot_number} mono />
                    )}
                  </div>

                  {(application as any).goscontract_data?.contract_price && (
                    <ProductInfoItem label="Цена контракта" value={formatCurrency((application as any).goscontract_data.contract_price)} />
                  )}

                  {/* Contract dates */}
                  {((application as any).goscontract_data?.contract_start_date || (application as any).goscontract_data?.contract_end_date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(application as any).goscontract_data?.contract_start_date && (
                        <ProductInfoItem label="Срок контракта с" value={new Date((application as any).goscontract_data.contract_start_date).toLocaleDateString('ru-RU')} />
                      )}
                      {(application as any).goscontract_data?.contract_end_date && (
                        <ProductInfoItem label="Срок контракта по" value={new Date((application as any).goscontract_data.contract_end_date).toLocaleDateString('ru-RU')} />
                      )}
                    </div>
                  )}

                  {(application as any).goscontract_data?.credit_amount && (
                    <ProductInfoItem label="Сумма кредита" value={formatCurrency((application as any).goscontract_data.credit_amount)} />
                  )}

                  {/* Credit dates */}
                  {((application as any).goscontract_data?.credit_start_date || (application as any).goscontract_data?.credit_end_date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(application as any).goscontract_data?.credit_start_date && (
                        <ProductInfoItem label="Срок кредита с" value={new Date((application as any).goscontract_data.credit_start_date).toLocaleDateString('ru-RU')} />
                      )}
                      {(application as any).goscontract_data?.credit_end_date && (
                        <ProductInfoItem label="Срок кредита по" value={new Date((application as any).goscontract_data.credit_end_date).toLocaleDateString('ru-RU')} />
                      )}
                    </div>
                  )}

                  {/* Flags as tags */}
                  {(application as any).goscontract_data?.has_prepayment && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline">
                        ✓ Авансирование {(application as any).goscontract_data?.advance_percent ? `(${(application as any).goscontract_data.advance_percent}%)` : ''}
                      </Badge>
                    </div>
                  )}

                  {/* Contract counts */}
                  {((application as any).goscontract_data?.contracts_44fz_count > 0 || (application as any).goscontract_data?.contracts_223fz_count > 0) && (
                    <ProductInfoItem
                      label="Исполненных контрактов"
                      value={`44-ФЗ: ${(application as any).goscontract_data.contracts_44fz_count || 0}, 223-ФЗ: ${(application as any).goscontract_data.contracts_223fz_count || 0}`}
                    />
                  )}

                  {/* Execution percent */}
                  {(application as any).goscontract_data?.contract_execution_percent !== null && !(application as any).goscontract_data?.ignore_execution_percent && (
                    <ProductInfoItem label="Выполнение контракта" value={`${(application as any).goscontract_data.contract_execution_percent}%`} />
                  )}
                </>
              )}

              {/* Corporate Credit Fields */}
              {application.product_type === 'corporate_credit' && (
                <>
                  {(application as any).credit_sub_type && (
                    <ProductInfoItem
                      label="Тип кредита"
                      value={
                        (application as any).credit_sub_type === 'express' ? 'Экспресс-кредит' :
                          (application as any).credit_sub_type === 'working_capital' ? 'Кредит на пополнение оборотных средств' :
                            (application as any).credit_sub_type === 'corporate' ? 'Корпоративный кредит' :
                              (application as any).credit_sub_type === 'one_time_credit' ? 'Разовый кредит' :
                                (application as any).credit_sub_type === 'non_revolving_line' ? 'Невозобновляемая КЛ' :
                                  (application as any).credit_sub_type === 'revolving_line' ? 'Возобновляемая КЛ' :
                                    (application as any).credit_sub_type === 'overdraft' ? 'Овердрафт' :
                                      (application as any).credit_sub_type
                      }
                    />
                  )}
                  {(application as any).financing_term_days && (
                    <ProductInfoItem label="Срок финансирования" value={`${(application as any).financing_term_days} дн.`} />
                  )}
                  {(application as any).pledge_description && (
                    <ProductInfoItem label="Обеспечение / залог" value={(application as any).pledge_description} fullWidth />
                  )}
                </>
              )}

              {/* Factoring Fields */}
              {application.product_type === 'factoring' && (
                <>
                  {(application as any).factoring_type && (
                    <ProductInfoItem
                      label="Тип факторинга"
                      value={
                        (application as any).factoring_type === 'classic' ? 'Классический факторинг' :
                          (application as any).factoring_type === 'closed' ? 'Закрытый факторинг' :
                            (application as any).factoring_type === 'procurement' ? 'Закупочный факторинг' :
                              (application as any).factoring_type
                      }
                    />
                  )}
                  {((application as any).contractor_inn || (application as any).goscontract_data?.contractor_inn) && (
                    <ProductInfoItem label="ИНН Контрагента (Дебитора)" value={(application as any).contractor_inn || (application as any).goscontract_data?.contractor_inn} mono />
                  )}
                </>
              )}

              {/* VED Fields */}
              {application.product_type === 'ved' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {((application as any).ved_currency || (application as any).goscontract_data?.currency) && (
                    <ProductInfoItem label="Валюта" value={(application as any).ved_currency || (application as any).goscontract_data?.currency} />
                  )}
                  {((application as any).ved_country || (application as any).goscontract_data?.country) && (
                    <ProductInfoItem label="Страна платежа" value={(application as any).ved_country || (application as any).goscontract_data?.country} />
                  )}
                </div>
              )}

              {/* Leasing Fields */}
              {application.product_type === 'leasing' && (
                (application as any).goscontract_data?.equipment_type && (
                  <ProductInfoItem label="Предмет лизинга" value={(application as any).goscontract_data.equipment_type} fullWidth />
                )
              )}

              {/* Notes */}
              {application.notes && (
                <div className="pt-2 border-t">
                  <ProductInfoItem label="Примечания" value={application.notes} fullWidth />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Contacts Tab */}
        <TabsContent value="client">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#3CE8D1]" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Applicant info */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3CE8D1]/10">
                    <User className="h-5 w-5 text-[#3CE8D1]" />
                  </div>
                  <div>
                    <p className="font-medium">{application.created_by_name || "Не указано"}</p>
                    <p className="text-sm text-muted-foreground">Заявитель</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{application.created_by_email || "Не указан"}</span>
                  </div>
                  {(application as any).created_by_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{(application as any).created_by_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Company contact person */}
              {((application as any).company_data?.contact_person || (application as any).company_data?.contact_phone || (application as any).company_data?.contact_email) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3">Контактное лицо компании</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(application as any).company_data?.contact_person && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="text-sm text-muted-foreground">Контактное лицо</span>
                          </div>
                          <p className="font-medium">{(application as any).company_data.contact_person}</p>
                        </div>
                      )}
                      {(application as any).company_data?.contact_phone && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="text-sm text-muted-foreground">Телефон</span>
                          </div>
                          <p className="font-medium">{(application as any).company_data.contact_phone}</p>
                        </div>
                      )}
                      {(application as any).company_data?.contact_email && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="text-sm text-muted-foreground">Email</span>
                          </div>
                          <p className="font-medium">{(application as any).company_data.contact_email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Agent info if available */}
              {(application as any).agent_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3">Агент</p>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                          <User className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{(application as any).agent_name}</p>
                          <p className="text-sm text-muted-foreground">{(application as any).agent_email || "Агент"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#3CE8D1]" />
                Прикрепленные документы
              </CardTitle>
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

        {/* Chat Tab */}
        <TabsContent value="chat" className="overflow-hidden">
          <div className="overflow-hidden">
            <ApplicationChat applicationId={applicationId} />
          </div>
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
                className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] gap-2"
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
                onClick={handleRequestInfo}
                disabled={submitting}
              >
                <HelpCircle className="h-5 w-5" />
                Вернуть на доработку
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
              <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
              Одобрить заявку
            </DialogTitle>
            <DialogDescription>
              Подтвердите одобрение заявки. Клиент получит уведомление о положительном решении.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Предложенная ставка (% годовых) *</Label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Например: 2.5"
                value={offeredRate}
                onChange={(e) => setOfferedRate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
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
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
              onClick={() => handleDecision("approve")}
              disabled={!offeredRate || submitting}
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

    </div>
  )
}

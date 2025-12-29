"use client"

import type React from "react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertCircle, Upload, FileText, Building2, Users, CreditCard, Shield, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMyCompany } from "@/hooks/use-companies"
import { useDocuments } from "@/hooks/use-documents"

interface AccreditationStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  status: "completed" | "in-progress" | "pending"
  documents?: { name: string; status: "uploaded" | "pending" | "rejected" }[]
}

export function AccreditationView() {
  const { company, isLoading: companyLoading, error: companyError } = useMyCompany()
  const { documents, isLoading: docsLoading, error: docsError } = useDocuments()

  // Compute accreditation steps dynamically based on company profile and documents
  const steps = useMemo<AccreditationStep[]>(() => {
    // Helper to check if a string field is filled (not empty/whitespace)
    const isFilled = (value: string | null | undefined): boolean => {
      return Boolean(value && value.trim())
    }

    // Step 1: Company Data
    const hasCompanyBasic = company && isFilled(company.inn) && isFilled(company.name)
    const companyStatus: AccreditationStep["status"] = hasCompanyBasic
      ? "completed"
      : company ? "in-progress" : "pending"

    // Step 2: Management (Director info)
    const hasDirector = company && isFilled(company.director_name)
    const managementStatus: AccreditationStep["status"] = hasDirector
      ? "completed"
      : hasCompanyBasic ? "in-progress" : "pending"

    // Step 3: Bank Details
    const hasBankDetails = company &&
      isFilled(company.bank_account) &&
      isFilled(company.bank_bic) &&
      isFilled(company.bank_name)
    const bankStatus: AccreditationStep["status"] = hasBankDetails
      ? "completed"
      : hasDirector ? "in-progress" : "pending"

    // Step 4: Documents
    const verifiedDocs = documents.filter(d => d.status === "verified")
    const pendingDocs = documents.filter(d => d.status === "pending")
    const hasVerifiedDocs = verifiedDocs.length > 0
    const documentsStatus: AccreditationStep["status"] = hasVerifiedDocs
      ? "completed"
      : (hasBankDetails && documents.length > 0) ? "in-progress" : "pending"

    // Build document list for in-progress bank/documents step
    const documentsList = [
      {
        name: "Паспорт (все страницы)",
        status: documents.some(d => d.document_type === "passport_all_pages" && d.status === "verified")
          ? "uploaded" as const
          : "pending" as const
      },
      {
        name: "Устав компании",
        status: documents.some(d => d.document_type === "statute" && d.status === "verified")
          ? "uploaded" as const
          : "pending" as const
      },
      {
        name: "Бухгалтерский баланс Ф1",
        status: documents.some(d => d.document_type === "balance_sheet_f1" && d.status === "verified")
          ? "uploaded" as const
          : "pending" as const
      },
    ]

    // Step 5: Verification (requires all previous + admin approval)
    const allPreviousComplete = hasCompanyBasic && hasDirector && hasBankDetails && hasVerifiedDocs
    const verificationStatus: AccreditationStep["status"] = "pending" // Always pending until admin verifies

    return [
      {
        id: "company",
        title: "Данные компании",
        description: "Заполните информацию о компании",
        icon: Building2,
        status: companyStatus,
      },
      {
        id: "management",
        title: "Руководство",
        description: "Добавьте информацию о руководителях",
        icon: Users,
        status: managementStatus,
      },
      {
        id: "bank",
        title: "Банковские реквизиты",
        description: "Укажите банковские данные",
        icon: CreditCard,
        status: bankStatus,
        documents: bankStatus === "in-progress" ? documentsList : undefined,
      },
      {
        id: "documents",
        title: "Документы",
        description: "Загрузите необходимые документы",
        icon: FileText,
        status: documentsStatus,
        documents: documentsStatus === "in-progress" ? documentsList : undefined,
      },
      {
        id: "verification",
        title: "Верификация",
        description: "Проверка данных модератором",
        icon: Shield,
        status: allPreviousComplete ? "in-progress" : verificationStatus,
      },
    ]
  }, [company, documents])

  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progress = (completedSteps / steps.length) * 100

  const getStatusIcon = (status: AccreditationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-[#f97316]" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: AccreditationStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1] hover:bg-[#3CE8D1]/20">Завершено</Badge>
      case "in-progress":
        return <Badge className="bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20">В процессе</Badge>
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>
    }
  }

  // Loading state
  if (companyLoading || docsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
          <p className="text-muted-foreground">Загрузка данных аккредитации...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Аккредитация</h1>
        <p className="text-muted-foreground">Пройдите все этапы для получения аккредитации</p>
      </div>

      {/* Accreditation Status Banner */}
      {completedSteps === steps.length - 1 && (
        <Card className="shadow-sm border-[#f97316] bg-[#f97316]/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#f97316]" />
              <div>
                <p className="font-medium text-[#f97316]">Ожидает проверки модератором</p>
                <p className="text-sm text-muted-foreground">Все данные заполнены. Аккредитация на рассмотрении.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedSteps === steps.length && (
        <Card className="shadow-sm border-[#3CE8D1] bg-[#3CE8D1]/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#3CE8D1]" />
              <div>
                <p className="font-medium text-[#3CE8D1]">Аккредитация активна</p>
                <p className="text-sm text-muted-foreground">Вы можете создавать заявки на финансовые продукты.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {completedSteps === 0 && (
        <Card className="shadow-sm border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Не аккредитован</p>
                <p className="text-sm text-muted-foreground">Заполните профиль компании для получения аккредитации.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Прогресс аккредитации</p>
              <p className="text-2xl font-bold">
                {completedSteps} из {steps.length} этапов
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#3CE8D1]">{Math.round(progress)}%</p>
            </div>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={cn("shadow-sm transition-all", step.status === "in-progress" && "ring-2 ring-[#f97316]")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      step.status === "completed" && "bg-[#3CE8D1]/10",
                      step.status === "in-progress" && "bg-[#f97316]/10",
                      step.status === "pending" && "bg-muted",
                    )}
                  >
                    <step.icon
                      className={cn(
                        "h-5 w-5",
                        step.status === "completed" && "text-[#3CE8D1]",
                        step.status === "in-progress" && "text-[#f97316]",
                        step.status === "pending" && "text-muted-foreground",
                      )}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-muted-foreground">Шаг {index + 1}.</span>
                      {step.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(step.status)}
                  {getStatusIcon(step.status)}
                </div>
              </div>
            </CardHeader>

            {step.status === "in-progress" && step.documents && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Требуемые документы:</p>
                  <div className="space-y-2">
                    {step.documents.map((doc) => (
                      <div key={doc.name} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        {doc.status === "uploaded" ? (
                          <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1]">Загружен</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <Upload className="h-3 w-3" />
                            Загрузить
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertCircle, Upload, FileText, Building2, Users, CreditCard, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccreditationStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  status: "completed" | "in-progress" | "pending"
  documents?: { name: string; status: "uploaded" | "pending" | "rejected" }[]
}

const accreditationSteps: AccreditationStep[] = [
  {
    id: "company",
    title: "Данные компании",
    description: "Заполните информацию о компании",
    icon: Building2,
    status: "completed",
  },
  {
    id: "management",
    title: "Руководство",
    description: "Добавьте информацию о руководителях",
    icon: Users,
    status: "completed",
  },
  {
    id: "bank",
    title: "Банковские реквизиты",
    description: "Укажите банковские данные",
    icon: CreditCard,
    status: "in-progress",
    documents: [
      { name: "Выписка из ЕГРЮЛ", status: "uploaded" },
      { name: "Устав компании", status: "pending" },
      { name: "Карточка предприятия", status: "pending" },
    ],
  },
  {
    id: "documents",
    title: "Документы",
    description: "Загрузите необходимые документы",
    icon: FileText,
    status: "pending",
  },
  {
    id: "verification",
    title: "Верификация",
    description: "Проверка данных модератором",
    icon: Shield,
    status: "pending",
  },
]

export function AccreditationView() {
  const [steps] = useState(accreditationSteps)

  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progress = (completedSteps / steps.length) * 100

  const getStatusIcon = (status: AccreditationStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-[#00d4aa]" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-[#f97316]" />
      case "pending":
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: AccreditationStep["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#00d4aa]/10 text-[#00d4aa] hover:bg-[#00d4aa]/20">Завершено</Badge>
      case "in-progress":
        return <Badge className="bg-[#f97316]/10 text-[#f97316] hover:bg-[#f97316]/20">В процессе</Badge>
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Аккредитация</h1>
        <p className="text-muted-foreground">Пройдите все этапы для получения аккредитации</p>
      </div>

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
              <p className="text-3xl font-bold text-[#00d4aa]">{Math.round(progress)}%</p>
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
                      step.status === "completed" && "bg-[#00d4aa]/10",
                      step.status === "in-progress" && "bg-[#f97316]/10",
                      step.status === "pending" && "bg-muted",
                    )}
                  >
                    <step.icon
                      className={cn(
                        "h-5 w-5",
                        step.status === "completed" && "text-[#00d4aa]",
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
                          <Badge className="bg-[#00d4aa]/10 text-[#00d4aa]">Загружен</Badge>
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

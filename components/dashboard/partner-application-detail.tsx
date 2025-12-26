"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"

interface PartnerApplicationDetailProps {
  applicationId: string
  onBack: () => void
}

// Mock application data
const mockApplicationData = {
  id: "1",
  status: "new" as const,
  receivedAt: "2024-01-25 14:30",
  deadline: "2024-01-28",
  product: {
    type: "Банковская гарантия",
    amount: 5000000,
    term: "12 месяцев",
    purpose: "Обеспечение исполнения контракта",
  },
  client: {
    companyName: 'ООО "Технологии Будущего"',
    inn: "7707083893",
    ogrn: "1027700132195",
    legalAddress: "г. Москва, ул. Примерная, д. 1, офис 100",
    actualAddress: "г. Москва, ул. Примерная, д. 1, офис 100",
    contactPerson: "Иванов Иван Иванович",
    contactPosition: "Генеральный директор",
    contactPhone: "+7 (999) 123-45-67",
    contactEmail: "ivanov@techbud.ru",
  },
  purchase: {
    number: "0148300005424000001",
    customer: "ПАО Газпром",
    subject: "Поставка оборудования для газоперерабатывающего завода",
    contractAmount: 50000000,
    startDate: "2024-02-01",
    endDate: "2024-12-31",
  },
  documents: [
    { id: "1", name: "Выписка из ЕГРЮЛ.pdf", size: "245 KB" },
    { id: "2", name: "Устав компании.pdf", size: "1.2 MB" },
    { id: "3", name: "Бухгалтерский баланс 2023.pdf", size: "890 KB" },
    { id: "4", name: "Контракт.pdf", size: "2.1 MB" },
    { id: "5", name: "Техническое задание.pdf", size: "456 KB" },
  ],
}

export function PartnerApplicationDetail({ applicationId, onBack }: PartnerApplicationDetailProps) {
  const [application] = useState(mockApplicationData)
  const [decisionModal, setDecisionModal] = useState<"approve" | "reject" | "request-info" | null>(null)
  const [comment, setComment] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDecision = (type: "approve" | "reject" | "request-info") => {
    // Here would be the API call to submit decision
    console.log(`Decision: ${type}`, { comment })
    setDecisionModal(null)
    setComment("")
    onBack()
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
            <h1 className="text-2xl font-bold text-foreground">Заявка #{applicationId}</h1>
            <p className="text-muted-foreground">
              Получена: {application.receivedAt} | Срок: {application.deadline}
            </p>
          </div>
        </div>
        <Badge className="bg-[#00d4aa]/10 text-[#00d4aa] text-sm px-3 py-1">Новая</Badge>
      </div>

      {/* Deadline Warning */}
      <Card className="border-[#f97316] bg-[#f97316]/5 shadow-sm">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f97316]/10">
            <AlertTriangle className="h-5 w-5 text-[#f97316]" />
          </div>
          <div>
            <p className="font-medium text-[#f97316]">Срок рассмотрения: {application.deadline}</p>
            <p className="text-sm text-muted-foreground">Осталось менее 3 дней для принятия решения</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="client">Клиент</TabsTrigger>
          <TabsTrigger value="purchase">Закупка</TabsTrigger>
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
                      <p className="font-medium">{application.product.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                      <DollarSign className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Сумма</p>
                      <p className="font-medium text-lg">{formatCurrency(application.product.amount)}</p>
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
                      <p className="font-medium">{application.product.term}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00d4aa]/10">
                      <FileText className="h-5 w-5 text-[#00d4aa]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Назначение</p>
                      <p className="font-medium">{application.product.purpose}</p>
                    </div>
                  </div>
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
                  <p className="text-sm text-muted-foreground">Наименование</p>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {application.client.companyName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ИНН / ОГРН</p>
                  <p className="font-medium font-mono">
                    {application.client.inn} / {application.client.ogrn}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground">Юридический адрес</p>
                  <p className="font-medium">{application.client.legalAddress}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Контактное лицо</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{application.client.contactPerson}</p>
                      <p className="text-sm text-muted-foreground">{application.client.contactPosition}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{application.client.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{application.client.contactEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Tab */}
        <TabsContent value="purchase">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Информация о закупке</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Номер закупки</p>
                <p className="font-medium font-mono">{application.purchase.number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Заказчик</p>
                <p className="font-medium">{application.purchase.customer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Предмет закупки</p>
                <p className="font-medium">{application.purchase.subject}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Сумма контракта</p>
                  <p className="font-medium">{formatCurrency(application.purchase.contractAmount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Начало</p>
                  <p className="font-medium">{application.purchase.startDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Окончание</p>
                  <p className="font-medium">{application.purchase.endDate}</p>
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
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Скачать
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision Block */}
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
            >
              <CheckCircle2 className="h-5 w-5" />
              Одобрить заявку
            </Button>
            <Button size="lg" variant="destructive" className="gap-2" onClick={() => setDecisionModal("reject")}>
              <XCircle className="h-5 w-5" />
              Отклонить заявку
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white bg-transparent"
              onClick={() => setDecisionModal("request-info")}
            >
              <HelpCircle className="h-5 w-5" />
              Запросить информацию
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <Button variant="outline" onClick={() => setDecisionModal(null)}>
              Отмена
            </Button>
            <Button className="bg-[#00d4aa] text-white hover:bg-[#00b894]" onClick={() => handleDecision("approve")}>
              Подтвердить одобрение
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
            <Button variant="outline" onClick={() => setDecisionModal(null)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={() => handleDecision("reject")} disabled={!comment}>
              Подтвердить отклонение
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
            <Button variant="outline" onClick={() => setDecisionModal(null)}>
              Отмена
            </Button>
            <Button
              className="bg-[#f97316] text-white hover:bg-[#ea580c]"
              onClick={() => handleDecision("request-info")}
              disabled={!comment}
            >
              Отправить запрос
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

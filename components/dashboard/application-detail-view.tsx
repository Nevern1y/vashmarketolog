"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ArrowLeft, FileText, CheckCircle2, XCircle, Clock, Paperclip, Send, Upload, RefreshCw } from "lucide-react"

interface ApplicationDetailViewProps {
  applicationId: string
  onBack: () => void
}

const timelineSteps = [
  { id: "draft", label: "Черновик" },
  { id: "checking", label: "На проверке" },
  { id: "bank", label: "В банке" },
  { id: "approved", label: "Одобрено" },
]

const documents = [
  { id: 1, name: "Устав.pdf", status: "approved" as const },
  { id: 2, name: "Паспорт директора.jpg", status: "reviewing" as const },
  { id: 3, name: "Бухгалтерский баланс.xlsx", status: "rejected" as const },
]

const initialMessages = [
  { id: 1, sender: "manager", text: "Добрый день! Пожалуйста, загрузите Устав компании.", time: "10:15" },
  { id: 2, sender: "user", text: "Готово, документ загружен.", time: "10:32" },
  { id: 3, sender: "manager", text: "Спасибо! Прошу также переподписать баланс, скан нечеткий.", time: "10:47" },
  { id: 4, sender: "user", text: "Хорошо, сейчас исправлю.", time: "10:52" },
]

const docStatusConfig = {
  approved: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Принят" },
  reviewing: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "На проверке" },
  rejected: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Отклонен" },
}

export function ApplicationDetailView({ applicationId, onBack }: ApplicationDetailViewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(initialMessages)
  const currentStep = 1

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: "user",
          text: newMessage.trim(),
          time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        },
      ])
      setNewMessage("")
    }
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
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">Заявка №{applicationId}</h1>
              <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700">
                НА РАССМОТРЕНИИ
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 lg:gap-4 text-sm text-muted-foreground">
              <span>Создана: 15.12.2024</span>
              <span className="hidden lg:inline">•</span>
              <span>Банк: Сбербанк</span>
              <span className="hidden lg:inline">•</span>
              <span>Клиент: ООО Рога и Копыта</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 65/35 split as specified */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65%_35%]">
        {/* Left Column - Main Info & Docs */}
        <div className="space-y-6">
          {/* Progress Timeline */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Статус заявки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {timelineSteps.map((step, index) => (
                  <div key={step.id} className="flex flex-1 items-center min-w-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                          index < currentStep
                            ? "border-[#00d4aa] bg-[#00d4aa] text-white"
                            : index === currentStep
                              ? "border-[#00d4aa] bg-white text-[#00d4aa]"
                              : "border-gray-200 bg-white text-gray-400",
                        )}
                      >
                        {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-medium text-center whitespace-nowrap",
                          index <= currentStep ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < timelineSteps.length - 1 && (
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
              <div className="space-y-2">
                {documents.map((doc) => {
                  const config = docStatusConfig[doc.status]
                  const StatusIcon = config.icon
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3",
                        config.bg,
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-8 sm:ml-0">
                        <StatusIcon className={cn("h-5 w-5 shrink-0", config.color)} />
                        <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                        {doc.status === "rejected" && (
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

              <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-[#00d4aa] hover:bg-[#00d4aa]/5">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-foreground">Загрузить дополнительные файлы</p>
                <p className="text-xs text-muted-foreground">Перетащите файлы сюда или нажмите для выбора</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Chat */}
        <Card className="flex h-[500px] lg:h-[600px] flex-col shadow-sm lg:sticky lg:top-6">
          <CardHeader className="border-b pb-3 shrink-0">
            <CardTitle className="text-base">Чат с менеджером</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {/* Messages Area */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5",
                      msg.sender === "user"
                        ? "rounded-br-md bg-[#00d4aa] text-white"
                        : "rounded-bl-md bg-gray-100 text-foreground",
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={cn("mt-1 text-xs", msg.sender === "user" ? "text-white/70" : "text-muted-foreground")}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t p-3 shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Напишите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  className="shrink-0 bg-[#00d4aa] text-white hover:bg-[#00b894]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

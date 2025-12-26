"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { X, Gavel, Banknote, Truck, Upload, CheckCircle2, FileText } from "lucide-react"

interface CreateApplicationWizardProps {
  isOpen: boolean
  onClose: () => void
}

const steps = [
  { id: 1, label: "Продукт" },
  { id: 2, label: "Данные" },
  { id: 3, label: "Документы" },
  { id: 4, label: "Итог" },
]

const productTypes = [
  { id: "tenders", label: "Госзакупки / БГ", icon: Gavel, description: "Банковские гарантии для участия в тендерах" },
  { id: "credit", label: "Кредит / Овердрафт", icon: Banknote, description: "Кредитование и кредитные линии" },
  { id: "leasing", label: "Лизинг", icon: Truck, description: "Лизинг оборудования и транспорта" },
]

const requiredDocs = [
  { id: 1, name: "Паспорт руководителя", required: true },
  { id: 2, name: "Устав компании", required: true },
  { id: 3, name: "Бухгалтерский баланс", required: true },
  { id: 4, name: "Выписка из ЕГРЮЛ", required: false },
]

const clients = [
  { id: "1", name: "ООО Рога и Копыта", inn: "7701234567" },
  { id: "2", name: "ИП Сидоров", inn: "770987654321" },
  { id: "3", name: "АО СтройТех", inn: "7702345678" },
]

export function CreateApplicationWizard({ isOpen, onClose }: CreateApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [term, setTerm] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  if (!isOpen) return null

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    onClose()
    setCurrentStep(1)
    setSelectedProduct(null)
    setSelectedClient("")
    setAmount("")
    setTerm("")
    setUploadedFiles([])
  }

  const selectedClientData = clients.find((c) => c.id === selectedClient)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>

        {/* Progress Bar */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      currentStep > step.id
                        ? "bg-[#00d4aa] text-white"
                        : currentStep === step.id
                          ? "bg-[#00d4aa] text-white"
                          : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "mt-1 text-xs font-medium",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn("mx-3 h-0.5 flex-1", currentStep > step.id ? "bg-[#00d4aa]" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Product Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Выберите тип продукта</h2>
              <div className="grid grid-cols-3 gap-4">
                {productTypes.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all hover:border-[#00d4aa]/50",
                      selectedProduct === product.id ? "border-[#00d4aa] bg-[#00d4aa]/5" : "border-gray-200",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                        selectedProduct === product.id ? "bg-[#00d4aa] text-white" : "bg-gray-100 text-gray-500",
                      )}
                    >
                      <product.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{product.label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{product.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Basic Data */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Основные параметры</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Сумма, ₽</Label>
                  <Input
                    type="text"
                    placeholder="1 000 000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Срок, мес.</Label>
                  <Input type="text" placeholder="12" value={term} onChange={(e) => setTerm(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Клиент</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите клиента" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ИНН</Label>
                  <Input
                    type="text"
                    placeholder="Автозаполнение"
                    value={selectedClientData?.inn || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Загрузка документов</h2>

              {/* Dropzone */}
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center transition-colors hover:border-[#00d4aa] hover:bg-[#00d4aa]/5">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Перетащите файлы сюда или выберите на компьютере</p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, XLSX до 10 МБ</p>
              </div>

              {/* Required Documents Checklist */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Необходимые документы:</p>
                {requiredDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{doc.name}</span>
                    {doc.required && <span className="text-xs text-red-500">Обязательно</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Summary */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Проверьте данные заявки</h2>
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Продукт:</span>
                  <span className="text-sm font-medium">
                    {productTypes.find((p) => p.id === selectedProduct)?.label || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Клиент:</span>
                  <span className="text-sm font-medium">{selectedClientData?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ИНН:</span>
                  <span className="text-sm font-medium">{selectedClientData?.inn || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Сумма:</span>
                  <span className="text-sm font-medium">{amount || "—"} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Срок:</span>
                  <span className="text-sm font-medium">{term || "—"} мес.</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                После отправки заявка будет направлена менеджеру для проверки.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-gray-200 bg-transparent"
          >
            Назад
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedProduct}
              className="bg-[#00d4aa] text-white hover:bg-[#00b894]"
            >
              Далее
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-[#00d4aa] text-white hover:bg-[#00b894]">
              ОТПРАВИТЬ ЗАЯВКУ
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { X, Gavel, Banknote, Truck, Upload, CheckCircle2, FileText, Loader2, AlertCircle, Building2, Hash, FileCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCRMClients, useMyCompany } from "@/hooks/use-companies"
import { useVerifiedDocuments, useDocumentMutations } from "@/hooks/use-documents"
import { useApplicationMutations } from "@/hooks/use-applications"
import { toast } from "sonner"

interface CreateApplicationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialClientId?: number | null
}

const steps = [
  { id: 1, label: "Продукт" },
  { id: 2, label: "Данные" },
  { id: 3, label: "Документы" },
  { id: 4, label: "Итог" },
]

const productTypes = [
  { id: "bank_guarantee", label: "Госзакупки / БГ", icon: Gavel, description: "Банковские гарантии для участия в тендерах" },
  { id: "contract_loan", label: "Кредит на контракт", icon: Banknote, description: "Кредит на исполнение контракта" },
  { id: "corporate_credit", label: "Корп. кредит", icon: Banknote, description: "Кредитование бизнеса" },
  { id: "leasing", label: "Лизинг", icon: Truck, description: "Лизинг оборудования и транспорта" },
]

// Target banks for routing
const targetBanks = [
  { id: "sberbank", label: "Сбербанк" },
  { id: "vtb", label: "ВТБ" },
  { id: "alfa", label: "Альфа-Банк" },
  { id: "gazprombank", label: "Газпромбанк" },
  { id: "raiffeisen", label: "Райффайзенбанк" },
  { id: "rosbank", label: "Росбанк" },
  { id: "otkritie", label: "Открытие" },
  { id: "promsvyaz", label: "Промсвязьбанк" },
  { id: "other", label: "Другой банк" },
]

// Guarantee types (ТЗ requirements)
const guaranteeTypes = [
  { id: "application_security", label: "Обеспечение заявки" },
  { id: "contract_execution", label: "Исполнение контракта" },
  { id: "advance_return", label: "Возврат аванса" },
  { id: "warranty_obligations", label: "Гарантийные обязательства" },
  { id: "payment_guarantee", label: "Гарантии оплаты товара" },
  { id: "customs_guarantee", label: "Таможенные гарантии" },
  { id: "vat_refund", label: "Возмещение НДС" },
]

// Tender law types (ТЗ requirements)
const tenderLaws = [
  { id: "44_fz", label: "44-ФЗ" },
  { id: "223_fz", label: "223-ФЗ" },
  { id: "615_pp", label: "615-ПП" },
  { id: "185_fz", label: "185-ФЗ" },
  { id: "kbg", label: "КБГ (Коммерческая)" },
  { id: "commercial", label: "Коммерческий" },
]

// Credit sub-types for corporate_credit
const creditSubTypes = [
  { id: "one_time_credit", label: "Разовый кредит" },
  { id: "non_revolving_line", label: "Невозобновляемая КЛ" },
  { id: "revolving_line", label: "Возобновляемая КЛ" },
  { id: "overdraft", label: "Овердрафт" },
]

export function CreateApplicationWizard({ isOpen, onClose, initialClientId }: CreateApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [targetBank, setTargetBank] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [term, setTerm] = useState("")
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([])
  const [uploadedDocIds, setUploadedDocIds] = useState<number[]>([])
  const [notes, setNotes] = useState("")
  // Goscontract data fields for Bank API compliance
  const [purchaseNumber, setPurchaseNumber] = useState("")
  const [tenderSubject, setTenderSubject] = useState("")
  const [contractNumber, setContractNumber] = useState("")
  const [isCloseAuction, setIsCloseAuction] = useState(false)

  // NEW: Bank Guarantee specific fields (ТЗ requirements)
  const [guaranteeType, setGuaranteeType] = useState("")
  const [tenderLaw, setTenderLaw] = useState("")
  const [hasPrepayment, setHasPrepayment] = useState(false)
  const [isRecollateralization, setIsRecollateralization] = useState(false)
  const [isSoleSupplier, setIsSoleSupplier] = useState(false)
  const [withoutEis, setWithoutEis] = useState(false)
  const [auctionNotHeld, setAuctionNotHeld] = useState(false)
  const [initialPrice, setInitialPrice] = useState("")
  const [offeredPrice, setOfferedPrice] = useState("")
  const [beneficiaryInn, setBeneficiaryInn] = useState("")
  const [needWorkingCapitalCredit, setNeedWorkingCapitalCredit] = useState(false)

  // NEW: Credit-specific fields (Phase 2)
  const [creditSubType, setCreditSubType] = useState("")
  const [termDays, setTermDays] = useState("")
  const [pledgeDescription, setPledgeDescription] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth context to check role
  const { user } = useAuth()
  const isAgent = user?.role === "agent"

  // API Hooks
  const { clients, isLoading: clientsLoading } = useCRMClients()
  const { company: myCompany, isLoading: companyLoading } = useMyCompany()
  const { documents: verifiedDocs, isLoading: docsLoading } = useVerifiedDocuments()
  const { uploadDocument, isLoading: uploading } = useDocumentMutations()
  const { createApplication, submitApplication, isLoading: submitting, error } = useApplicationMutations()

  // Set initial client when provided (e.g., from CRM "Create Application" action)
  // Using useRef to track if we've already set the initial client
  const initialClientSet = useRef(false)

  // Effect to set initial client when wizard opens with a pre-selected client
  if (isOpen && initialClientId && !initialClientSet.current) {
    setSelectedCompanyId(initialClientId.toString())
    initialClientSet.current = true
  }

  // Reset the flag when wizard closes
  if (!isOpen && initialClientSet.current) {
    initialClientSet.current = false
  }

  if (!isOpen) return null

  // 🛡️ Defense in Depth: Show empty state if CLIENT has no company
  // This catches edge cases where someone bypasses the sidebar guard
  const clientHasNoCompany = !isAgent && !companyLoading && (!myCompany || !myCompany.id)

  // Get selected company data
  const getSelectedCompany = () => {
    if (isAgent && selectedCompanyId) {
      return clients.find(c => c.id.toString() === selectedCompanyId)
    }
    return myCompany
  }

  const selectedCompany = getSelectedCompany()

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const doc = await uploadDocument({
        name: file.name,
        file: file,
        document_type: "other",
      })

      // Debug: log what we got from upload
      console.log("[Wizard] uploadDocument response:", doc)

      if (doc && doc.id) {
        setUploadedDocIds(prev => [...prev, doc.id])
        toast.success(`Документ "${file.name}" загружен (ID: ${doc.id})`)
      } else {
        console.error("[Wizard] Upload failed or no ID returned:", doc)
        toast.error(`Ошибка загрузки "${file.name}"`)
      }
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const toggleDocumentSelection = (docId: number) => {
    setSelectedDocumentIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const handleSubmit = async () => {
    if (!selectedProduct || !amount || !term) {
      toast.error("Заполните все обязательные поля")
      return
    }

    const companyId = isAgent
      ? parseInt(selectedCompanyId)
      : myCompany?.id

    if (!companyId) {
      toast.error("Выберите компанию")
      return
    }

    // Combine selected and uploaded docs, filter out any falsy values
    const allDocIds = [...selectedDocumentIds, ...uploadedDocIds].filter(id => id && typeof id === 'number')

    // Debug: log document IDs
    console.log("[Wizard] selectedDocumentIds:", selectedDocumentIds)
    console.log("[Wizard] uploadedDocIds:", uploadedDocIds)
    console.log("[Wizard] allDocIds (filtered):", allDocIds)

    // Get target bank label for display
    const targetBankLabel = targetBanks.find(b => b.id === targetBank)?.label || targetBank

    // Build payload - only include document_ids if there are any
    const payload: {
      company: number
      product_type: string
      amount: string
      term_months: number
      notes: string
      target_bank_name: string
      guarantee_type?: string
      tender_law?: string
      credit_sub_type?: string
      financing_term_days?: number
      pledge_description?: string
      document_ids?: number[]
    } = {
      company: companyId,
      product_type: selectedProduct,
      amount: amount.replace(/\s/g, ""),
      term_months: parseInt(term),
      notes: notes,
      target_bank_name: targetBankLabel,
    }

    // Add BG specific fields if BG product
    if (selectedProduct === "bank_guarantee") {
      if (guaranteeType) payload.guarantee_type = guaranteeType
      if (tenderLaw) payload.tender_law = tenderLaw
    }

    // Add credit-specific fields
    if (selectedProduct === "contract_loan" || selectedProduct === "corporate_credit") {
      if (creditSubType) payload.credit_sub_type = creditSubType
      if (termDays) payload.financing_term_days = parseInt(termDays)
      if (pledgeDescription) payload.pledge_description = pledgeDescription
    }

    // Only add document_ids if we have valid IDs
    if (allDocIds.length > 0) {
      payload.document_ids = allDocIds
    }

    // Build goscontract_data for Bank Guarantee
    if (selectedProduct === "bank_guarantee") {
      ; (payload as any).goscontract_data = {
        // Tender info
        purchase_number: purchaseNumber || "",
        subject: tenderSubject || "",
        contract_number: contractNumber || "",

        // Booleans
        is_close_auction: isCloseAuction,
        is_sole_supplier: isSoleSupplier,
        without_eis: withoutEis,
        has_prepayment: hasPrepayment,
        is_recollateralization: isRecollateralization,
        auction_not_held: auctionNotHeld,

        // Financials
        initial_price: initialPrice ? initialPrice.replace(/\s/g, "") : null,
        offered_price: !auctionNotHeld && offeredPrice ? offeredPrice.replace(/\s/g, "") : null,

        // Beneficiary
        beneficiary_inn: beneficiaryInn || "",

        // Upsell
        need_credit: needWorkingCapitalCredit
      }
    }

    // Build goscontract_data for Contract Loan (reuses tender fields)
    if (selectedProduct === "contract_loan") {
      ; (payload as any).goscontract_data = {
        purchase_number: purchaseNumber || "",
        subject: tenderSubject || "",
        contract_number: contractNumber || "",
        beneficiary_inn: beneficiaryInn || "",
      }
    }

    // Debug: log full payload
    console.log("[Wizard] Final payload:", JSON.stringify(payload, null, 2))

    // Create application
    const app = await createApplication(payload)

    // Debug: log what we got back
    console.log("[Wizard] createApplication response:", app)

    if (app && app.id) {
      // Submit application
      const submitted = await submitApplication(app.id)

      if (submitted) {
        toast.success("Заявка успешно создана и отправлена!")
        resetAndClose()
      } else {
        toast.success("Заявка создана как черновик")
        resetAndClose()
      }
    } else if (app) {
      // Created but no id - still a draft
      console.warn("[Wizard] Application created but no ID returned:", app)
      toast.success("Заявка создана как черновик")
      resetAndClose()
    } else {
      toast.error(error || "Ошибка создания заявки")
    }
  }

  const resetAndClose = () => {
    onClose()
    setCurrentStep(1)
    setSelectedProduct(null)
    setSelectedCompanyId("")
    setTargetBank("")
    setAmount("")
    setTerm("")
    setSelectedDocumentIds([])
    setUploadedDocIds([])
    setNotes("")
    // Reset goscontract fields
    setPurchaseNumber("")
    setTenderSubject("")
    setContractNumber("")
    setIsCloseAuction(false)
    // Reset new BG fields
    setGuaranteeType("")
    setTenderLaw("")
    setHasPrepayment(false)
    setIsRecollateralization(false)
    setIsSoleSupplier(false)
    setWithoutEis(false)
    setAuctionNotHeld(false)
    setInitialPrice("")
    setOfferedPrice("")
    setBeneficiaryInn("")
    setNeedWorkingCapitalCredit(false)
    // Reset credit-specific fields
    setCreditSubType("")
    setTermDays("")
    setPledgeDescription("")
  }

  // Format amount with spaces
  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }

  // 🛡️ Defense in Depth: Empty State for CLIENT without company
  if (clientHasNoCompany) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="relative w-full max-w-md rounded-xl bg-card shadow-2xl border border-border p-8">
          {/* Close Button */}
          <button onClick={resetAndClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
            <X className="h-5 w-5" />
          </button>

          {/* Empty State Content */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E03E9D]/10 mb-4">
              <AlertCircle className="h-8 w-8 text-[#E03E9D]" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Требуется аккредитация
            </h2>
            <p className="text-muted-foreground mb-6">
              Для создания заявки необходимо заполнить профиль компании.
              Укажите ИНН и основные данные вашей организации в разделе «Моя компания».
            </p>
            <Button
              onClick={resetAndClose}
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
            >
              Понятно
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-xl bg-card shadow-2xl max-h-[90vh] overflow-y-auto border border-border">
        {/* Close Button */}
        <button onClick={resetAndClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10">
          <X className="h-5 w-5" />
        </button>

        {/* Progress Bar */}
        <div className="border-b border-border px-6 py-4 sticky top-0 bg-card">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      currentStep > step.id
                        ? "bg-[#3CE8D1] text-[#0a1628]"
                        : currentStep === step.id
                          ? "bg-[#3CE8D1] text-[#0a1628]"
                          : "bg-accent text-muted-foreground",
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
                  <div className={cn("mx-3 h-0.5 flex-1", currentStep > step.id ? "bg-[#3CE8D1]" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-[#E03E9D]/10 text-[#E03E9D] flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

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
                      "flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all hover:border-[#3CE8D1]/50",
                      selectedProduct === product.id ? "border-[#3CE8D1] bg-[#3CE8D1]/5" : "border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                        selectedProduct === product.id ? "bg-[#3CE8D1] text-[#0a1628]" : "bg-accent text-muted-foreground",
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
                {/* Client Selection - Only for Agents */}
                {isAgent && (
                  <div className="space-y-2">
                    <Label>Клиент *</Label>
                    {clientsLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </div>
                    ) : initialClientId ? (
                      // Pre-selected client from CRM - show as read-only
                      <div className="space-y-1">
                        <Input
                          type="text"
                          value={clients.find(c => c.id.toString() === selectedCompanyId)?.name ||
                            clients.find(c => c.id.toString() === selectedCompanyId)?.short_name ||
                            "Клиент выбран"}
                          readOnly
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Клиент выбран из CRM
                        </p>
                      </div>
                    ) : (
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name || client.short_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Own company for Clients */}
                {!isAgent && (
                  <div className="space-y-2">
                    <Label>Компания</Label>
                    {companyLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </div>
                    ) : (
                      <Input
                        type="text"
                        value={myCompany?.name || myCompany?.short_name || "Компания не создана"}
                        readOnly
                        className="bg-muted"
                      />
                    )}
                  </div>
                )}

                {/* Target Bank Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Целевой банк
                  </Label>
                  <Select value={targetBank} onValueChange={setTargetBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите банк" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetBanks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Сумма, ₽ *</Label>
                  <Input
                    type="text"
                    placeholder="1 000 000"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Срок, мес. *</Label>
                  <Input
                    type="number"
                    placeholder="12"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ИНН</Label>
                  <Input
                    type="text"
                    placeholder="Автозаполнение"
                    value={selectedCompany?.inn || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Примечания</Label>
                <Input
                  type="text"
                  placeholder="Дополнительная информация"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Tender/Goscontract Details - for Bank API */}
              {selectedProduct === "bank_guarantee" && (
                <div className="space-y-4 mt-6 pt-4 border-t border-border">
                  {/* Section 1: Guarantee Type & Tender Law */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Параметры гарантии
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Тип гарантии *</Label>
                      <Select value={guaranteeType} onValueChange={setGuaranteeType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип БГ" />
                        </SelectTrigger>
                        <SelectContent>
                          {guaranteeTypes.map((gt) => (
                            <SelectItem key={gt.id} value={gt.id}>
                              {gt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Закон о закупках</Label>
                      <Select value={tenderLaw} onValueChange={setTenderLaw}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите закон" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenderLaws.map((law) => (
                            <SelectItem key={law.id} value={law.id}>
                              {law.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Section 2: Tender Data */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                    <Hash className="h-4 w-4" />
                    Данные тендера
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Номер закупки</Label>
                      <Input
                        type="text"
                        placeholder="0123456789012345"
                        value={purchaseNumber}
                        onChange={(e) => setPurchaseNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Номер контракта</Label>
                      <Input
                        type="text"
                        placeholder="Номер контракта (если есть)"
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Предмет закупки</Label>
                    <Input
                      type="text"
                      placeholder="Описание предмета контракта"
                      value={tenderSubject}
                      onChange={(e) => setTenderSubject(e.target.value)}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isCloseAuction"
                        checked={isCloseAuction}
                        onChange={(e) => setIsCloseAuction(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="isCloseAuction" className="cursor-pointer text-sm">
                        Закрытый аукцион
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isSoleSupplier"
                        checked={isSoleSupplier}
                        onChange={(e) => setIsSoleSupplier(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="isSoleSupplier" className="cursor-pointer text-sm">
                        Единственный поставщик
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="withoutEis"
                        checked={withoutEis}
                        onChange={(e) => setWithoutEis(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="withoutEis" className="cursor-pointer text-sm">
                        Без размещения в ЕИС
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="hasPrepayment"
                        checked={hasPrepayment}
                        onChange={(e) => setHasPrepayment(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="hasPrepayment" className="cursor-pointer text-sm">
                        Наличие аванса
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isRecollateralization"
                        checked={isRecollateralization}
                        onChange={(e) => setIsRecollateralization(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="isRecollateralization" className="cursor-pointer text-sm">
                        Является переобеспечением
                      </Label>
                    </div>
                  </div>

                  {/* Section 3: Financials */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                    <Banknote className="h-4 w-4" />
                    Параметры сделки
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Начальная цена контракта</Label>
                      <Input
                        type="text"
                        placeholder="1 000 000"
                        value={initialPrice}
                        onChange={(e) => setInitialPrice(formatAmount(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className={auctionNotHeld ? "text-muted-foreground" : ""}>
                          Предложенная цена контракта
                        </Label>
                      </div>
                      <Input
                        type="text"
                        placeholder="950 000"
                        value={offeredPrice}
                        onChange={(e) => setOfferedPrice(formatAmount(e.target.value))}
                        disabled={auctionNotHeld}
                        className={auctionNotHeld ? "bg-muted opacity-50" : ""}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auctionNotHeld"
                      checked={auctionNotHeld}
                      onChange={(e) => setAuctionNotHeld(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                    />
                    <Label htmlFor="auctionNotHeld" className="cursor-pointer text-sm">
                      Торги еще не проведены
                    </Label>
                  </div>

                  {/* Section 4: Beneficiary */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                    <Building2 className="h-4 w-4" />
                    Бенефициар (Заказчик)
                  </h3>
                  <div className="space-y-2">
                    <Label>ИНН Заказчика</Label>
                    <Input
                      type="text"
                      placeholder="10 или 12 цифр"
                      value={beneficiaryInn}
                      onChange={(e) => setBeneficiaryInn(e.target.value)}
                      maxLength={12}
                    />
                  </div>

                  {/* Section 5: Upsell */}
                  <div className="mt-4 p-4 rounded-lg bg-[#3CE8D1]/5 border border-[#3CE8D1]/20">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="needWorkingCapitalCredit"
                        checked={needWorkingCapitalCredit}
                        onChange={(e) => setNeedWorkingCapitalCredit(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="needWorkingCapitalCredit" className="cursor-pointer text-sm">
                        💡 Клиенту нужен кредит на пополнение оборотных средств
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTRACT LOAN: Similar to BG but with different fields */}
              {selectedProduct === "contract_loan" && (
                <div className="space-y-4 mt-6 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Данные контракта
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Номер закупки</Label>
                      <Input
                        type="text"
                        placeholder="0123456789012345"
                        value={purchaseNumber}
                        onChange={(e) => setPurchaseNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Номер контракта</Label>
                      <Input
                        type="text"
                        placeholder="Номер контракта"
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Предмет контракта</Label>
                    <Input
                      type="text"
                      placeholder="Описание предмета контракта"
                      value={tenderSubject}
                      onChange={(e) => setTenderSubject(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ИНН Заказчика</Label>
                      <Input
                        type="text"
                        placeholder="10 или 12 цифр"
                        value={beneficiaryInn}
                        onChange={(e) => setBeneficiaryInn(e.target.value)}
                        maxLength={12}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Срок финансирования (дней)</Label>
                      <Input
                        type="number"
                        placeholder="180"
                        value={termDays}
                        onChange={(e) => setTermDays(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание залога / обеспечения</Label>
                    <Input
                      type="text"
                      placeholder="Недвижимость, транспорт, депозит и т.д."
                      value={pledgeDescription}
                      onChange={(e) => setPledgeDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* CORPORATE CREDIT: No tender, has sub-type */}
              {selectedProduct === "corporate_credit" && (
                <div className="space-y-4 mt-6 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Параметры кредита
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Тип кредита *</Label>
                      <Select value={creditSubType} onValueChange={setCreditSubType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          {creditSubTypes.map((ct) => (
                            <SelectItem key={ct.id} value={ct.id}>
                              {ct.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Срок финансирования (дней)</Label>
                      <Input
                        type="number"
                        placeholder="365"
                        value={termDays}
                        onChange={(e) => setTermDays(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание залога / обеспечения</Label>
                    <Input
                      type="text"
                      placeholder="Недвижимость, транспорт, депозит и т.д."
                      value={pledgeDescription}
                      onChange={(e) => setPledgeDescription(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Документы</h2>

              {/* Dropzone */}
              <div
                className="rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-[#3CE8D1] hover:bg-[#3CE8D1]/5 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mx-auto h-10 w-10 text-[#3CE8D1] animate-spin" />
                ) : (
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                )}
                <p className="mt-3 text-sm font-medium">
                  {uploading ? "Загрузка..." : "Перетащите файлы сюда или выберите на компьютере"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG, XLSX до 10 МБ</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Uploaded in this session */}
              {uploadedDocIds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[#3CE8D1]">
                    Загружено ({uploadedDocIds.length}):
                  </p>
                  <div className="text-sm text-muted-foreground">
                    Документы будут прикреплены к заявке
                  </div>
                </div>
              )}

              {/* Select from Library */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Или выберите из библиотеки:</p>
                {docsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка документов...
                  </div>
                ) : verifiedDocs.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                    Нет проверенных документов в библиотеке
                  </div>
                ) : (
                  verifiedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedDocumentIds.includes(doc.id)
                          ? "border-[#3CE8D1] bg-[#3CE8D1]/5"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleDocumentSelection(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocumentIds.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="h-4 w-4"
                      />
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">{doc.type_display}</span>
                    </div>
                  ))
                )}
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
                  <span className="text-sm text-muted-foreground">Компания:</span>
                  <span className="text-sm font-medium">
                    {selectedCompany?.name || selectedCompany?.short_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ИНН:</span>
                  <span className="text-sm font-medium">{selectedCompany?.inn || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Целевой банк:</span>
                  <span className="text-sm font-medium">
                    {targetBanks.find((b) => b.id === targetBank)?.label || "Не выбран"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Сумма:</span>
                  <span className="text-sm font-medium">{amount || "—"} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Срок:</span>
                  <span className="text-sm font-medium">{term || "—"} мес.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Документы:</span>
                  <span className="text-sm font-medium">
                    {selectedDocumentIds.length + uploadedDocIds.length} шт.
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                После отправки заявка будет направлена менеджеру для проверки.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 sticky bottom-0 bg-card">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="border-border bg-transparent"
          >
            Назад
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedProduct) ||
                (currentStep === 2 && (!amount || !term || (isAgent && !selectedCompanyId) || (!isAgent && !myCompany?.id)))
              }
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
            >
              Далее
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                "ОТПРАВИТЬ ЗАЯВКУ"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

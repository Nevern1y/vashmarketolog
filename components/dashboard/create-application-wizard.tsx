"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { X, Gavel, Banknote, Truck, Upload, CheckCircle2, FileText, Loader2, AlertCircle, Building2, Hash, FileCheck, Globe, Shield, CreditCard, Briefcase, ChevronDown, ChevronUp, Star, Clock, Percent, XCircle, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useCRMClients, useMyCompany } from "@/hooks/use-companies"
import { useVerifiedDocuments, useDocumentMutations } from "@/hooks/use-documents"
import { useApplicationMutations } from "@/hooks/use-applications"
import { toast } from "sonner"
import { AddClientModal } from "./add-client-modal"
import { useCRMClientMutations } from "@/hooks/use-companies"

interface CreateApplicationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialClientId?: number | null
}

const steps = [
  { id: 1, label: "Продукт" },
  { id: 2, label: "Данные" },
  { id: 3, label: "Предложения" },
  { id: 4, label: "Документы" },
  { id: 5, label: "Итог" },
]

// ============= WAVE 1: MOCK BANK OFFERS =============
// Hardcoded bank offers per ТЗ requirements
// Structure: approved banks first, rejected banks second, Lider-Garant always at bottom

interface BankOffer {
  id: string
  name: string
  logo?: string
  rate: number           // Ставка %
  commission: number     // Комиссия в рублях
  speed: 'high' | 'medium' | 'low'
  isApproved: boolean
  rejectReason?: string
  isSpecial?: boolean    // Лидер-Гарант special flag
}

const MOCK_BANK_OFFERS: BankOffer[] = [
  // Approved banks
  { id: "sber", name: "Сбербанк", rate: 2.5, commission: 15000, speed: "high", isApproved: true },
  { id: "vtb", name: "ВТБ", rate: 2.8, commission: 12000, speed: "high", isApproved: true },
  { id: "alfa", name: "Альфа-Банк", rate: 3.0, commission: 10000, speed: "medium", isApproved: true },
  { id: "gazprom", name: "Газпромбанк", rate: 2.9, commission: 18000, speed: "medium", isApproved: true },
  { id: "sovkom", name: "Совкомбанк", rate: 3.2, commission: 8000, speed: "high", isApproved: true },
  { id: "rosbank", name: "Росбанк", rate: 3.5, commission: 9000, speed: "low", isApproved: true },
  // Rejected banks
  { id: "otkritie", name: "Открытие", rate: 4.0, commission: 20000, speed: "low", isApproved: false, rejectReason: "Сумма гарантии ниже минимального порога банка (500 000 руб.)" },
  { id: "raiff", name: "Райффайзенбанк", rate: 2.3, commission: 25000, speed: "high", isApproved: false, rejectReason: "Недостаточный срок деятельности компании (менее 12 мес.)" },
  { id: "psb", name: "Промсвязьбанк", rate: 3.1, commission: 11000, speed: "medium", isApproved: false, rejectReason: "Регион деятельности не входит в покрытие банка" },
  // Lider-Garant ALWAYS at bottom (special)
  { id: "lider_garant", name: "Лидер-Гарант", rate: 0, commission: 0, speed: "high", isApproved: true, isSpecial: true },
]

const getSpeedLabel = (speed: 'high' | 'medium' | 'low') => {
  switch (speed) {
    case 'high': return { label: 'Высокая', color: 'text-green-500' }
    case 'medium': return { label: 'Средняя', color: 'text-yellow-500' }
    case 'low': return { label: 'Низкая', color: 'text-red-500' }
  }
}

const productTypes = [
  { id: "bank_guarantee", label: "Банковская гарантия", icon: Gavel, description: "Гарантии для тендеров" },
  { id: "kik", label: "КИК", icon: CreditCard, description: "Кредит исполнения контракта" },
  { id: "credit", label: "Кредит", icon: Banknote, description: "Кредитование бизнеса" },
  { id: "factoring", label: "Факторинг", icon: Truck, description: "Факторинговое финансирование" },
  { id: "leasing", label: "Лизинг", icon: Building2, description: "Лизинг оборудования и транспорта" },
  { id: "insurance", label: "Страхование", icon: Shield, description: "Страхование бизнеса" },
  { id: "international", label: "Междунар. платежи", icon: Globe, description: "Международные платежи" },
  { id: "rko", label: "РКО и спецсчёт", icon: Briefcase, description: "Расчётно-кассовое обслуживание" },
  { id: "deposits", label: "Депозиты", icon: Banknote, description: "Размещение депозитов" },
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

// Guarantee types (ТЗ requirements - exact match)
const guaranteeTypes = [
  { id: "participation", label: "На участие" },
  { id: "contract_execution", label: "На обеспечение исполнения контракта" },
  { id: "advance_return", label: "На возврат аванса" },
  { id: "warranty_period", label: "На гарантийный период" },
  { id: "payment_guarantee", label: "На гарантию оплаты товара" },
  { id: "vat_refund", label: "На возвращение НДС" },
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

// Credit sub-types for corporate_credit (ТЗ section 3)
const creditSubTypes = [
  { id: "express_credit", label: "Экспресс-кредит" },
  { id: "working_capital", label: "Кредит на пополнение оборотных средств" },
  { id: "corporate_credit", label: "Корпоративный кредит" },
]

// Import document types from shared module (Appendix B numeric IDs)
import {
  getAgentUploadableTypes,
  getDocumentTypesForProduct,
  getDocumentTypeName,
  type DocumentTypeOption
} from "@/lib/document-types"

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

  // WAVE 1: Bank selection state
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([])
  const [showRejectedBanks, setShowRejectedBanks] = useState(false)

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

  // NEW: CSV-specified fields for BG
  const [hasCustomerTemplate, setHasCustomerTemplate] = useState(false)  // Шаблон заказчика
  const [contracts44Count, setContracts44Count] = useState("")  // Количество контрактов 44-ФЗ
  const [contracts223Count, setContracts223Count] = useState("")  // Количество контрактов 223-ФЗ
  const [advancePercent, setAdvancePercent] = useState("")  // % аванса
  const [guaranteeDateFrom, setGuaranteeDateFrom] = useState("")  // Срок БГ с
  const [guaranteeDateTo, setGuaranteeDateTo] = useState("")  // Срок БГ по
  const [lotNumber, setLotNumber] = useState("")  // Номер лота

  // NEW: Credit-specific fields (Phase 2)
  const [creditSubType, setCreditSubType] = useState("")
  const [termDays, setTermDays] = useState("")
  const [pledgeDescription, setPledgeDescription] = useState("")

  // КИК-specific fields (ТЗ spec)
  const [contractLoanType, setContractLoanType] = useState("")  // Кредит на исполнение / Займ
  const [contractPrice, setContractPrice] = useState("")  // Цена контракта
  const [contractDateFrom, setContractDateFrom] = useState("")  // Срок контракта с
  const [contractDateTo, setContractDateTo] = useState("")  // Срок контракта по
  const [creditAmount, setCreditAmount] = useState("")  // Сумма кредита
  const [creditDateFrom, setCreditDateFrom] = useState("")  // Срок кредита с
  const [creditDateTo, setCreditDateTo] = useState("")  // Срок кредита по
  const [contractExecutionPercent, setContractExecutionPercent] = useState<number>(0)  // % выполнения контракта
  const [ignoreExecutionPercent, setIgnoreExecutionPercent] = useState(false)  // Не учитывать % выполнения

  // Product-specific fields (Pre-deploy audit)
  const [contractorInn, setContractorInn] = useState("")    // Factoring
  const [vedCountry, setVedCountry] = useState("")          // VED
  const [vedCurrency, setVedCurrency] = useState("")        // VED: Currency (USD/EUR/CNY)
  const [equipmentType, setEquipmentType] = useState("")    // Leasing

  // Factoring-specific fields (ТЗ section 4)
  const [factoringType, setFactoringType] = useState("")  // С регрессом/Без регресса
  const [factoringContractType, setFactoringContractType] = useState("")  // Госторги/Иные договоры
  const [factoringNmc, setFactoringNmc] = useState("")  // НМЦ
  const [factoringContractDateFrom, setFactoringContractDateFrom] = useState("")
  const [factoringContractDateTo, setFactoringContractDateTo] = useState("")
  const [factoringShipmentAmount, setFactoringShipmentAmount] = useState("")
  const [factoringPaymentDelay, setFactoringPaymentDelay] = useState("")  // Отсрочка платежа, дней
  const [factoringCustomerInn, setFactoringCustomerInn] = useState("")  // ИНН заказчика

  // Leasing-specific fields (ТЗ section 5)
  const [leasingPropertyDescription, setLeasingPropertyDescription] = useState("")
  const [leasingHasAdvance, setLeasingHasAdvance] = useState(false)
  const [leasingAdvancePercent, setLeasingAdvancePercent] = useState("")

  // NEW: Fields for remaining 4 products (ТЗ spec)
  const [insuranceCategory, setInsuranceCategory] = useState("")    // Insurance: Персонал/Транспорт/Имущество/Ответственность
  const [insuranceProduct, setInsuranceProduct] = useState("")      // Insurance: specific product based on category
  const [accountType, setAccountType] = useState("")        // SpецСчет/РКО type
  const [tenderSupportType, setTenderSupportType] = useState("")  // Tender support variant
  const [purchaseType, setPurchaseType] = useState("")      // Тип закупки
  const [industry, setIndustry] = useState("")              // Отрасль

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Document type for upload - now uses numeric ID (Appendix B)
  const [uploadDocTypeId, setUploadDocTypeId] = useState<number>(0)  // 0 = "Дополнительный документ"

  // Auth context to check role
  const { user } = useAuth()
  const isAgent = user?.role === "agent"

  // API Hooks
  const { clients, isLoading: clientsLoading, refetch: refetchClients } = useCRMClients()
  const { company: myCompany, isLoading: companyLoading } = useMyCompany()
  const { documents: verifiedDocs, isLoading: docsLoading } = useVerifiedDocuments()
  const { uploadDocument, isLoading: uploading } = useDocumentMutations()
  const { createApplication, submitApplication, isLoading: submitting, error } = useApplicationMutations()
  const { createClient } = useCRMClientMutations()

  // State for Add Client Modal
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
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
    if (isAgent) {
      // Agent: return selected CRM client, or null if none selected
      if (selectedCompanyId) {
        return clients.find(c => c.id.toString() === selectedCompanyId) || null
      }
      return null  // No client selected yet
    }
    // Client: return their own company
    return myCompany
  }

  const selectedCompany = getSelectedCompany()

  const handleNext = () => {
    // Step 1 validation: Agent must select client, all must select product
    if (currentStep === 1) {
      if (isAgent && !selectedCompanyId) {
        toast.error("Выберите клиента для создания заявки")
        return
      }
      if (!selectedProduct) {
        toast.error("Выберите тип продукта")
        return
      }
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  // WAVE 1: Bank selection handlers
  const toggleBankSelection = (bankId: string) => {
    const bank = MOCK_BANK_OFFERS.find(b => b.id === bankId)
    if (!bank || !bank.isApproved) return

    // If selecting Lider-Garant, it has radio behavior (deselect others)
    if (bank.isSpecial) {
      setSelectedBankIds([bankId])
      return
    }

    // If regular bank, toggle multi-select but remove Lider-Garant if present
    setSelectedBankIds(prev => {
      const withoutLider = prev.filter(id => id !== 'lider_garant')
      if (prev.includes(bankId)) {
        return withoutLider.filter(id => id !== bankId)
      }
      return [...withoutLider, bankId]
    })
  }

  // Get approved vs rejected banks
  const approvedBanks = MOCK_BANK_OFFERS.filter(b => b.isApproved && !b.isSpecial)
  const rejectedBanks = MOCK_BANK_OFFERS.filter(b => !b.isApproved)
  const liderGarant = MOCK_BANK_OFFERS.find(b => b.isSpecial)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    console.log('[Wizard] Starting file upload')

    // Store scroll position
    const dialogContent = document.querySelector('[role="dialog"]') as HTMLElement
    const scrollParent = dialogContent?.querySelector('.overflow-y-auto') as HTMLElement
    const scrollPosition = scrollParent ? scrollParent.scrollTop : (window.pageYOffset || 0)

    console.log(`[Wizard] Saved scroll position: ${scrollPosition}`)

    for (const file of Array.from(files)) {
      console.log(`[Wizard] Uploading file: ${file.name}`)
      const doc = await uploadDocument({
        name: file.name,
        file: file,
        document_type_id: uploadDocTypeId,
        product_type: selectedProduct || 'general',
      })

      console.log("[Wizard] uploadDocument response:", doc)

      if (doc && doc.id) {
        setUploadedDocIds(prev => [...prev, doc.id])
        const typeName = getDocumentTypeName(uploadDocTypeId, selectedProduct || 'general')
        toast.success(`Документ "${file.name}" загружен (${typeName})`)
      } else {
        console.error("[Wizard] Upload failed or no ID returned:", doc)
        toast.error(`Ошибка загрузки "${file.name}"`)
      }
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""

    // Restore scroll position after React re-render
    setTimeout(() => {
      if (scrollParent) {
        scrollParent.scrollTop = scrollPosition
        console.log(`[Wizard] Restored scroll to: ${scrollPosition}`)
      } else {
        window.scrollTo(0, scrollPosition)
      }
    }, 100)
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

    // === VALIDATION: Amount field - max 15 digits ===
    const cleanAmount = amount.replace(/\s/g, "").replace(/\D/g, "")
    if (cleanAmount.length > 15) {
      toast.error("Сумма слишком большая. Максимум 15 цифр.")
      return
    }
    if (!cleanAmount || cleanAmount === "0") {
      toast.error("Введите корректную сумму")
      return
    }

    const companyId = isAgent
      ? parseInt(selectedCompanyId)
      : myCompany?.id

    if (!companyId) {
      toast.error("Выберите компанию")
      return
    }

    // === VALIDATION: Check company exists in current data ===
    if (isAgent) {
      const companyExists = clients.some(c => c.id === companyId)
      if (!companyExists) {
        toast.error("Выбранный клиент не найден. Обновите страницу и выберите клиента заново.")
        return
      }
    } else if (!myCompany || myCompany.id !== companyId) {
      toast.error("Профиль компании не найден. Обновите страницу.")
      return
    }

    // === VALIDATION: Client (Borrower) INN ===
    const clientInn = selectedCompany?.inn || ""
    const cleanClientInn = clientInn.replace(/\D/g, "")
    if (cleanClientInn.length !== 10 && cleanClientInn.length !== 12) {
      toast.error("Ошибка в карточке клиента: ИНН должен быть 10 или 12 цифр")
      return
    }

    // === VALIDATION: Product-specific fields ===
    if (selectedProduct === "factoring") {
      // Validate contractor INN (debtor) - user-entered field
      const debitorInnClean = contractorInn.replace(/\D/g, "")
      if (debitorInnClean.length !== 10 && debitorInnClean.length !== 12) {
        toast.error("ИНН Контрагента (Дебитора) должен содержать 10 или 12 цифр")
        return
      }
    }

    if (selectedProduct === "ved") {
      if (!vedCountry || vedCountry.trim().length < 2) {
        toast.error("Укажите страну контрагента для ВЭД")
        return
      }
    }

    if (selectedProduct === "leasing") {
      if (!equipmentType || equipmentType.trim().length < 2) {
        toast.error("Укажите предмет лизинга")
        return
      }
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
        lot_number: lotNumber || "",

        // Booleans
        is_close_auction: isCloseAuction,
        has_prepayment: hasPrepayment,
        advance_percent: hasPrepayment && advancePercent ? parseInt(advancePercent) : null,
        has_customer_template: hasCustomerTemplate,

        // Guarantee dates
        guarantee_start_date: guaranteeDateFrom || null,
        guarantee_end_date: guaranteeDateTo || null,

        // Contract counts (per ТЗ: separate 44-ФЗ and 223-ФЗ)
        contracts_44fz_count: contracts44Count ? parseInt(contracts44Count) : 0,
        contracts_223fz_count: contracts223Count ? parseInt(contracts223Count) : 0,
      }
    }

    // Build goscontract_data for Contract Loan (КИК) - per ТЗ section 2
    if (selectedProduct === "contract_loan") {
      ; (payload as any).goscontract_data = {
        // Product type
        contract_loan_type: contractLoanType || "",

        // Tender info
        purchase_number: purchaseNumber || "",
        lot_number: lotNumber || "",

        // Contract terms
        contract_price: contractPrice ? contractPrice.replace(/\s/g, "") : null,
        contract_start_date: contractDateFrom || null,
        contract_end_date: contractDateTo || null,

        // Advance
        has_prepayment: hasPrepayment,
        advance_percent: hasPrepayment && advancePercent ? parseInt(advancePercent) : null,

        // Credit terms
        credit_amount: creditAmount ? creditAmount.replace(/\s/g, "") : null,
        credit_start_date: creditDateFrom || null,
        credit_end_date: creditDateTo || null,

        // Contract counts (per ТЗ: separate 44-ФЗ and 223-ФЗ)
        contracts_44fz_count: contracts44Count ? parseInt(contracts44Count) : 0,
        contracts_223fz_count: contracts223Count ? parseInt(contracts223Count) : 0,

        // Execution percent
        contract_execution_percent: ignoreExecutionPercent ? null : contractExecutionPercent,
        ignore_execution_percent: ignoreExecutionPercent,
      }
    }

    // Build goscontract_data for Factoring
    if (selectedProduct === "factoring") {
      ; (payload as any).goscontract_data = {
        contractor_inn: contractorInn || "",
      }
    }

    // Build goscontract_data for VED
    if (selectedProduct === "ved") {
      ; (payload as any).goscontract_data = {
        currency: "RUB",  // Hardcoded for Russia
        country: vedCountry || "",
      }
    }

    // Build goscontract_data for Leasing
    if (selectedProduct === "leasing") {
      ; (payload as any).goscontract_data = {
        equipment_type: equipmentType || "",
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
    // Reset product-specific fields
    setContractorInn("")
    setVedCountry("")
    setVedCurrency("")  // VED currency reset
    setEquipmentType("")
    // Reset CSV-specified fields
    setHasCustomerTemplate(false)
    setContracts44Count("")
    setContracts223Count("")
    setAdvancePercent("")
    setGuaranteeDateFrom("")
    setGuaranteeDateTo("")
    setLotNumber("")
    // Reset new product fields (ТЗ spec)
    setInsuranceCategory("")
    setInsuranceProduct("")
    setAccountType("")
    setTenderSupportType("")
    setPurchaseType("")
    setIndustry("")
    // Reset КИК-specific fields
    setContractLoanType("")
    setContractPrice("")
    setContractDateFrom("")
    setContractDateTo("")
    setCreditAmount("")
    setCreditDateFrom("")
    setCreditDateTo("")
    setContractExecutionPercent(0)
    setIgnoreExecutionPercent(false)
    setIgnoreExecutionPercent(false)
  }

  const handleCreateClient = async (data: any) => {
    try {
      const newClient = await createClient(data)
      if (newClient) {
        await refetchClients()
        setSelectedCompanyId(newClient.id.toString())
        setIsAddClientOpen(false)
        toast.success("Клиент успешно добавлен")
        // Don't close wizard, user continues creating app
      }
    } catch (err) {
      console.error("Failed to create client", err)
      toast.error("Не удалось создать клиента")
    }
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
              Для создания заявки заполните базовые данные компании: название, ИНН, email и телефон в разделе «Моя компания».
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
            <div className="space-y-6">
              {/* Agent Client Selector with Info Panel */}
              {isAgent && (
                <div className="grid grid-cols-3 gap-4">
                  {/* Client Dropdown - 2 columns */}
                  <div className="col-span-2 space-y-2">
                    <Label className="text-base font-semibold">Выберите клиента *</Label>
                    {clientsLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка клиентов...
                      </div>
                    ) : (
                      <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите клиента" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Only show confirmed clients for applications */}
                          {clients
                            .filter(client => client.client_status === 'confirmed')
                            .map((client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.short_name || client.name} (ИНН: {client.inn})
                              </SelectItem>
                            ))}
                          {clients.filter(c => c.client_status === 'confirmed').length === 0 && (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                              Нет клиентов со статусом "Закреплен"
                            </div>
                          )}
                          {/* Add new client option */}
                          <div className="border-t mt-1 pt-1">
                            <div className="border-t mt-1 pt-1">
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-[#3CE8D1] hover:bg-accent rounded-sm flex items-center gap-2"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setIsAddClientOpen(true)
                                }}
                              >
                                <Plus className="h-4 w-4" />
                                Добавить нового клиента
                              </button>
                            </div>
                          </div>
                        </SelectContent>
                      </Select>
                    )}
                    {!selectedCompanyId && !clientsLoading && (
                      <p className="text-xs text-muted-foreground">
                        Только клиенты со статусом «Закреплен» доступны для создания заявки
                      </p>
                    )}
                  </div>

                  {/* Client Info Panel - 1 column */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Информация о клиенте</Label>
                    {selectedCompany ? (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ИНН:</span>
                          <span className="font-mono font-medium">{selectedCompany.inn || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">КПП:</span>
                          <span className="font-mono">{selectedCompany.kpp || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Регион:</span>
                          <span>{selectedCompany.region || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Контакт:</span>
                          <span>{selectedCompany.contact_person || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3 text-center text-sm text-muted-foreground">
                        Выберите клиента
                      </div>
                    )}
                  </div>

                  {/* Accreditation Warning - Full width */}
                  {selectedCompany && !(selectedCompany as any).is_accredited && (
                    <div className="col-span-3 mt-2">
                      <div className="rounded-lg border border-[#f97316] bg-[#f97316]/10 p-3 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-[#f97316] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#f97316]">Клиент не аккредитован</p>
                          <p className="text-sm text-muted-foreground">
                            Данный клиент ещё не прошёл аккредитацию. Заявка будет создана, но может потребоваться дополнительная проверка.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-lg font-semibold">Выберите тип продукта</h2>
              <div className="grid grid-cols-3 gap-4">
                {productTypes.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product.id)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all hover:border-[#3CE8D1]/50 min-h-[120px]",
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
                {/* Client Display - Read-only for Agents (selected on Step 1) */}
                {isAgent && (
                  <div className="space-y-2">
                    <Label>Клиент</Label>
                    <Input
                      type="text"
                      value={
                        clients.find(c => c.id.toString() === selectedCompanyId)?.short_name ||
                        clients.find(c => c.id.toString() === selectedCompanyId)?.name ||
                        "Не выбран"
                      }
                      readOnly
                      className="bg-muted"
                    />
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
                  <div className="space-y-2">
                    <Label>Тип банковской гарантии *</Label>
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
                    <Label>Федеральный закон *</Label>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { id: "44_fz", label: "44-ФЗ" },
                        { id: "223_fz", label: "223-ФЗ" },
                        { id: "615_pp", label: "615 ПП" },
                        { id: "kbg", label: "КБГ" },
                      ].map((law) => (
                        <div key={law.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`law-${law.id}`}
                            name="tenderLaw"
                            checked={tenderLaw === law.id}
                            onChange={() => setTenderLaw(law.id)}
                            className="h-4 w-4 accent-[#3CE8D1]"
                          />
                          <Label htmlFor={`law-${law.id}`} className="cursor-pointer text-sm">
                            {law.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Notice & Lot Numbers */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                    <Hash className="h-4 w-4" />
                    Данные закупки
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>№ извещения</Label>
                      <Input
                        type="text"
                        placeholder="0123456789012345"
                        value={purchaseNumber}
                        onChange={(e) => setPurchaseNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>№ лота</Label>
                      <Input
                        type="text"
                        placeholder="1"
                        value={lotNumber}
                        onChange={(e) => setLotNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCloseAuction(!isCloseAuction)}
                    className="text-xs text-[#3CE8D1] hover:underline"
                  >
                    {isCloseAuction ? "✓ Закрытые торги" : "Закрытые торги"}
                  </button>

                  {/* Section 3: Amount & Term */}
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                    <Banknote className="h-4 w-4" />
                    Сумма и срок
                  </h3>
                  <div className="space-y-2">
                    <Label>Сумма банковской гарантии, ₽ *</Label>
                    <Input
                      type="text"
                      placeholder="1 000 000"
                      value={amount}
                      onChange={(e) => setAmount(formatAmount(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Срок гарантии</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">с</span>
                        <Input
                          type="date"
                          value={guaranteeDateFrom}
                          onChange={(e) => setGuaranteeDateFrom(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">по</span>
                        <Input
                          type="date"
                          value={guaranteeDateTo}
                          onChange={(e) => setGuaranteeDateTo(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">дней</span>
                        <Input
                          type="text"
                          readOnly
                          className="bg-muted"
                          value={
                            guaranteeDateFrom && guaranteeDateTo
                              ? Math.max(0, Math.ceil((new Date(guaranteeDateTo).getTime() - new Date(guaranteeDateFrom).getTime()) / (1000 * 60 * 60 * 24)))
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Advance & Template */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="hasPrepayment"
                          checked={hasPrepayment}
                          onChange={(e) => setHasPrepayment(e.target.checked)}
                          className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                        />
                        <Label htmlFor="hasPrepayment" className="cursor-pointer text-sm">
                          Наличие авансирования
                        </Label>
                      </div>
                      {hasPrepayment && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="30"
                            value={advancePercent}
                            onChange={(e) => setAdvancePercent(e.target.value)}
                            className="w-20"
                            min={0}
                            max={100}
                          />
                          <span className="text-sm text-muted-foreground">% от цены контракта</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="hasCustomerTemplate"
                        checked={hasCustomerTemplate}
                        onChange={(e) => setHasCustomerTemplate(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                      />
                      <Label htmlFor="hasCustomerTemplate" className="cursor-pointer text-sm">
                        Шаблон заказчика
                      </Label>
                    </div>
                  </div>

                  {/* Section 5: Executed Contracts */}
                  <div className="space-y-2">
                    <Label>Количество исполненных контрактов в т.ч.:</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">44-ФЗ</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={contracts44Count}
                          onChange={(e) => setContracts44Count(e.target.value)}
                          min={0}
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">223-ФЗ</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={contracts223Count}
                          onChange={(e) => setContracts223Count(e.target.value)}
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTRACT LOAN (КИК): Per ТЗ section 2 */}
              {
                selectedProduct === "contract_loan" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    {/* Product Type */}
                    <div className="space-y-2">
                      <Label>Тип продукта *</Label>
                      <Select value={contractLoanType} onValueChange={setContractLoanType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit_execution">Кредит на исполнение контракта</SelectItem>
                          <SelectItem value="loan">Займ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notice & Lot Numbers */}
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                      <Hash className="h-4 w-4" />
                      Данные контракта
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>№ извещения или контракта</Label>
                        <Input
                          type="text"
                          placeholder="0123456789012345"
                          value={purchaseNumber}
                          onChange={(e) => setPurchaseNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>№ лота</Label>
                        <Input
                          type="text"
                          placeholder="1"
                          value={lotNumber}
                          onChange={(e) => setLotNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Contract Price */}
                    <div className="space-y-2">
                      <Label>Цена контракта, ₽ *</Label>
                      <Input
                        type="text"
                        placeholder="10 000 000"
                        value={contractPrice}
                        onChange={(e) => setContractPrice(formatAmount(e.target.value))}
                      />
                    </div>

                    {/* Contract Term */}
                    <div className="space-y-2">
                      <Label>Срок контракта</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">с</span>
                          <Input
                            type="date"
                            value={contractDateFrom}
                            onChange={(e) => setContractDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">по</span>
                          <Input
                            type="date"
                            value={contractDateTo}
                            onChange={(e) => setContractDateTo(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">дней</span>
                          <Input
                            type="text"
                            readOnly
                            className="bg-muted"
                            value={
                              contractDateFrom && contractDateTo
                                ? Math.max(0, Math.ceil((new Date(contractDateTo).getTime() - new Date(contractDateFrom).getTime()) / (1000 * 60 * 60 * 24)))
                                : ""
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advance */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="kikHasPrepayment"
                            checked={hasPrepayment}
                            onChange={(e) => setHasPrepayment(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                          />
                          <Label htmlFor="kikHasPrepayment" className="cursor-pointer text-sm">
                            Наличие авансирования
                          </Label>
                        </div>
                        {hasPrepayment && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="30"
                              value={advancePercent}
                              onChange={(e) => setAdvancePercent(e.target.value)}
                              className="w-20"
                              min={0}
                              max={100}
                            />
                            <span className="text-sm text-muted-foreground">% от цены контракта</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Credit Amount & Term */}
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mt-4">
                      <Banknote className="h-4 w-4" />
                      Параметры кредита
                    </h3>
                    <div className="space-y-2">
                      <Label>Сумма кредита, ₽ *</Label>
                      <Input
                        type="text"
                        placeholder="5 000 000"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(formatAmount(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Срок кредита</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">с</span>
                          <Input
                            type="date"
                            value={creditDateFrom}
                            onChange={(e) => setCreditDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">по</span>
                          <Input
                            type="date"
                            value={creditDateTo}
                            onChange={(e) => setCreditDateTo(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">дней</span>
                          <Input
                            type="text"
                            readOnly
                            className="bg-muted"
                            value={
                              creditDateFrom && creditDateTo
                                ? Math.max(0, Math.ceil((new Date(creditDateTo).getTime() - new Date(creditDateFrom).getTime()) / (1000 * 60 * 60 * 24)))
                                : ""
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Executed Contracts */}
                    <div className="space-y-2">
                      <Label>Количество исполненных контрактов в т.ч.:</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">44-ФЗ</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={contracts44Count}
                            onChange={(e) => setContracts44Count(e.target.value)}
                            min={0}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">223-ФЗ</span>
                          <Input
                            type="number"
                            placeholder="0"
                            value={contracts223Count}
                            onChange={(e) => setContracts223Count(e.target.value)}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Execution Percent */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Процент выполнения по контракту</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ignorePercent"
                            checked={ignoreExecutionPercent}
                            onChange={(e) => setIgnoreExecutionPercent(e.target.checked)}
                            className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                          />
                          <Label htmlFor="ignorePercent" className="cursor-pointer text-xs text-muted-foreground">
                            Не учитывать
                          </Label>
                        </div>
                      </div>
                      {!ignoreExecutionPercent && (
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={contractExecutionPercent}
                            onChange={(e) => setContractExecutionPercent(parseInt(e.target.value))}
                            className="flex-1 accent-[#3CE8D1]"
                          />
                          <span className="text-sm font-medium w-12 text-right">{contractExecutionPercent}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              {/* CORPORATE CREDIT: No tender, has sub-type */}
              {
                selectedProduct === "corporate_credit" && (
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
                )
              }

              {/* FACTORING: ИНН контрагента */}
              {
                selectedProduct === "factoring" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Параметры факторинга
                    </h3>
                    <div className="space-y-2">
                      <Label>ИНН Контрагента (Дебитора) *</Label>
                      <Input
                        type="text"
                        placeholder="10 или 12 цифр"
                        value={contractorInn}
                        onChange={(e) => setContractorInn(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        maxLength={12}
                      />
                      <p className="text-xs text-muted-foreground">
                        ИНН компании-должника, чью задолженность вы хотите продать
                      </p>
                    </div>
                  </div>
                )
              }

              {/* VED: Внешнеэкономическая деятельность (CSV: 3 поля) */}
              {
                selectedProduct === "ved" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Параметры ВЭД
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Сумма платежа *</Label>
                        <Input
                          type="text"
                          placeholder="1 000 000"
                          value={amount}
                          onChange={(e) => setAmount(formatAmount(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Валюта *</Label>
                        <Select value={vedCurrency} onValueChange={setVedCurrency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите валюту" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RUB">RUB — Российский рубль</SelectItem>
                            <SelectItem value="USD">USD — Доллар США</SelectItem>
                            <SelectItem value="EUR">EUR — Евро</SelectItem>
                            <SelectItem value="CNY">CNY — Китайский юань</SelectItem>
                            <SelectItem value="TRY">TRY — Турецкая лира</SelectItem>
                            <SelectItem value="AED">AED — Дирхам ОАЭ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Страна платежа *</Label>
                      <Input
                        type="text"
                        placeholder="Например: Китай, Турция, Казахстан"
                        value={vedCountry}
                        onChange={(e) => setVedCountry(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Страна иностранного партнёра по внешнеэкономической сделке
                      </p>
                    </div>
                  </div>
                )
              }

              {/* LEASING: Лизинг (CSV: Предмет, Сумма, Срок) */}
              {
                selectedProduct === "leasing" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Параметры лизинга
                    </h3>
                    <div className="space-y-2">
                      <Label>Предмет лизинга *</Label>
                      <Input
                        type="text"
                        placeholder="Например: Грузовой автомобиль, Производственное оборудование"
                        value={equipmentType}
                        onChange={(e) => setEquipmentType(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Укажите тип имущества, которое планируете взять в лизинг
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Сумма лизинга *</Label>
                        <Input
                          type="text"
                          placeholder="1 000 000"
                          value={amount}
                          onChange={(e) => setAmount(formatAmount(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Срок (месяцев) *</Label>
                        <Input
                          type="number"
                          placeholder="36"
                          value={term}
                          onChange={(e) => setTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              }

              {/* INSURANCE: Страхование (per ТЗ spec) */}
              {
                selectedProduct === "insurance" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Параметры страхования
                    </h3>
                    <div className="space-y-2">
                      <Label>Вид страхования *</Label>
                      <Select
                        value={insuranceCategory}
                        onValueChange={(val) => {
                          setInsuranceCategory(val)
                          setInsuranceProduct("") // Reset product when category changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите вид страхования" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personnel">Персонал</SelectItem>
                          <SelectItem value="transport">Транспорт</SelectItem>
                          <SelectItem value="property">Имущество</SelectItem>
                          <SelectItem value="liability">Ответственность</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional product subtypes per ТЗ */}
                    {insuranceCategory === "personnel" && (
                      <div className="space-y-2">
                        <Label>Страховой продукт *</Label>
                        <Select value={insuranceProduct} onValueChange={setInsuranceProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите продукт" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dms">Добровольное медицинское страхование (ДМС)</SelectItem>
                            <SelectItem value="critical_illness">Страхование критических заболеваний</SelectItem>
                            <SelectItem value="accidents">Страхование несчастных случаев</SelectItem>
                            <SelectItem value="travel">Комплексное страхование в поездках</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {insuranceCategory === "transport" && (
                      <div className="space-y-2">
                        <Label>Страховой продукт *</Label>
                        <Select value={insuranceProduct} onValueChange={setInsuranceProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите продукт" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="osago">ОСАГО юридических лиц</SelectItem>
                            <SelectItem value="fleet">Комплексное страхование автопарков</SelectItem>
                            <SelectItem value="special_equipment">Страхование специальной техники</SelectItem>
                            <SelectItem value="carrier_liability">Страхование ответственности перевозчика</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {insuranceCategory === "property" && (
                      <div className="space-y-2">
                        <Label>Страховой продукт *</Label>
                        <Select value={insuranceProduct} onValueChange={setInsuranceProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите продукт" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="construction">Страхование объектов строительства</SelectItem>
                            <SelectItem value="cargo">Страхование грузов и перевозок</SelectItem>
                            <SelectItem value="company_property">Страхование имущества компаний</SelectItem>
                            <SelectItem value="business_interruption">Страхование перерывов деятельности</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {insuranceCategory === "liability" && (
                      <div className="space-y-2">
                        <Label>Страховой продукт *</Label>
                        <Select value={insuranceProduct} onValueChange={setInsuranceProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите продукт" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="civil">Страхование гражданской ответственности</SelectItem>
                            <SelectItem value="hazardous">Страхование опасных объектов</SelectItem>
                            <SelectItem value="professional">Страхование профессиональных рисков</SelectItem>
                            <SelectItem value="quality">Страхование ответственности за качество</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Сумма страхования, руб</Label>
                        <Input
                          type="text"
                          placeholder="1 000 000"
                          value={amount}
                          onChange={(e) => setAmount(formatAmount(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Срок договора, мес. (1-16)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="16"
                          placeholder="12"
                          value={term}
                          onChange={(e) => setTerm(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )
              }

              {/* SPECIAL ACCOUNT: Спецсчета (CSV spec) */}
              {
                selectedProduct === "special_account" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Параметры спецсчета
                    </h3>
                    <div className="space-y-2">
                      <Label>Тип счета *</Label>
                      <Select value={accountType} onValueChange={setAccountType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип счета" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="44fz">Спецсчет 44-ФЗ</SelectItem>
                          <SelectItem value="223fz">Спецсчет 223-ФЗ</SelectItem>
                          <SelectItem value="615pp">Спецсчет 615-ПП</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Специальный счет для обеспечения участия в госзакупках
                      </p>
                    </div>
                  </div>
                )
              }

              {/* RKO: Расчетно-кассовое обслуживание (CSV spec) */}
              {
                selectedProduct === "rko" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Параметры РКО
                    </h3>
                    <div className="space-y-2">
                      <Label>Тип обслуживания *</Label>
                      <Select value={accountType} onValueChange={setAccountType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rko_basic">РКО Базовый</SelectItem>
                          <SelectItem value="rko_premium">РКО Премиум</SelectItem>
                          <SelectItem value="rko_business">РКО Бизнес</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Открытие расчетного счета и банковское обслуживание
                    </p>
                  </div>
                )
              }

              {/* TENDER SUPPORT: Тендерное сопровождение (per ТЗ spec) */}
              {
                selectedProduct === "tender_support" && (
                  <div className="space-y-4 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Параметры тендерного сопровождения
                    </h3>
                    <div className="space-y-2">
                      <Label>Вариант сопровождения *</Label>
                      <Select value={tenderSupportType} onValueChange={setTenderSupportType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите вариант" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one_time">Разовое сопровождение</SelectItem>
                          <SelectItem value="full_service">Тендерное сопровождение под ключ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Тип закупки *</Label>
                      <Select value={purchaseType} onValueChange={setPurchaseType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип закупки" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="44fz">Госзакупки по 44-ФЗ</SelectItem>
                          <SelectItem value="223fz">Закупки по 223-ФЗ</SelectItem>
                          <SelectItem value="property_auctions">Имущественные торги</SelectItem>
                          <SelectItem value="commercial">Коммерческие закупки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Закупки в отрасли</Label>
                      <Input
                        type="text"
                        placeholder="Введите интересующую отрасль закупок"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                      />
                    </div>
                  </div>
                )
              }
            </div >
          )}

          {/* Step 3: Bank Selection (WAVE 1 - NEW) */}
          {
            currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Выберите банк</h2>
                    <p className="text-sm text-muted-foreground">
                      Выберите один или несколько банков для отправки заявки
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#3CE8D1]">
                      Доступно: {approvedBanks.length} банков
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Отказов: {rejectedBanks.length}
                    </p>
                  </div>
                </div>

                {/* Approved Banks Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 border-b border-border">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Доступные предложения
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {approvedBanks.map((bank) => {
                      const speedInfo = getSpeedLabel(bank.speed)
                      const isSelected = selectedBankIds.includes(bank.id)
                      return (
                        <div
                          key={bank.id}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors",
                            isSelected ? "bg-[#3CE8D1]/10" : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleBankSelection(bank.id)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBankSelection(bank.id)}
                              className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                            />
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white text-xs font-bold">
                              {bank.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{bank.name}</p>
                              <p className="text-xs text-muted-foreground">ID: {bank.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#3CE8D1]">{bank.rate}%</p>
                              <p className="text-xs text-muted-foreground">Ставка</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{bank.commission.toLocaleString()} ₽</p>
                              <p className="text-xs text-muted-foreground">Комиссия</p>
                            </div>
                            <div className="text-right w-24">
                              <p className={cn("text-sm font-medium", speedInfo.color)}>{speedInfo.label}</p>
                              <p className="text-xs text-muted-foreground">Скорость</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Lider-Garant Special Row - Always at bottom */}
                    {liderGarant && (
                      <div
                        className={cn(
                          "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-t-2 border-[#3CE8D1]/30",
                          selectedBankIds.includes(liderGarant.id) ? "bg-[#3CE8D1]/20" : "hover:bg-[#3CE8D1]/5"
                        )}
                        onClick={() => toggleBankSelection(liderGarant.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedBankIds.includes(liderGarant.id)}
                            onChange={() => toggleBankSelection(liderGarant.id)}
                            className="h-4 w-4 rounded border-border accent-[#3CE8D1]"
                          />
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628]">
                            <Star className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#3CE8D1]">{liderGarant.name}</p>
                            <p className="text-xs text-muted-foreground">Индивидуальные условия</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#3CE8D1]/20 text-[#3CE8D1] text-xs font-medium">
                            Персональное предложение
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejected Banks Collapsible */}
                {rejectedBanks.length > 0 && (
                  <Collapsible open={showRejectedBanks} onOpenChange={setShowRejectedBanks}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Показать {rejectedBanks.length} отказов</span>
                      </div>
                      {showRejectedBanks ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-lg border border-red-200/30 overflow-hidden">
                        <div className="divide-y divide-border">
                          {rejectedBanks.map((bank) => (
                            <div key={bank.id} className="px-4 py-3 bg-red-500/5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 text-xs font-bold">
                                    {bank.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-muted-foreground">{bank.name}</p>
                                    <p className="text-xs text-red-500">{bank.rejectReason}</p>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {bank.rate}% / {bank.commission.toLocaleString()} ₽
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Selection Summary */}
                {selectedBankIds.length > 0 && (
                  <div className="rounded-lg bg-[#3CE8D1]/10 border border-[#3CE8D1]/30 p-4">
                    <p className="text-sm font-medium text-[#3CE8D1]">
                      Выбрано банков: {selectedBankIds.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedBankIds.map(id => MOCK_BANK_OFFERS.find(b => b.id === id)?.name).join(', ')}
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-xs text-muted-foreground">
                  Приведённые расчеты стоимости являются предварительными и не являются публичной офертой.
                </p>
              </div>
            )
          }

          {/* Step 4: Documents */}
          {
            currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Документы</h2>

                {/* Document Type Selection (Appendix B numeric IDs) */}
                <div className="space-y-2">
                  <Label>Тип загружаемого документа</Label>
                  <Select
                    value={String(uploadDocTypeId)}
                    onValueChange={(val) => setUploadDocTypeId(parseInt(val, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип документа" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {/* Show product-specific document types */}
                      {getAgentUploadableTypes(selectedProduct || 'general').map((docType) => (
                        <SelectItem key={docType.id} value={String(docType.id)}>
                          {docType.name}
                        </SelectItem>
                      ))}
                      {/* Always show "Additional Document" option */}
                      <SelectItem value="0">Дополнительный документ</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Показаны типы документов для: {selectedProduct === 'bank_guarantee' ? 'Банковские гарантии' :
                      selectedProduct === 'contract_loan' ? 'Кредиты на исполнение' : 'Общие документы'}
                  </p>
                </div>


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
              </div>
            )
          }

          {/* Step 5: Summary */}
          {
            currentStep === 5 && (
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
                    <span className="text-sm text-muted-foreground">Выбранные банки:</span>
                    <span className="text-sm font-medium text-[#3CE8D1]">
                      {selectedBankIds.length > 0
                        ? selectedBankIds.map(id => MOCK_BANK_OFFERS.find(b => b.id === id)?.name).join(', ')
                        : "Не выбраны"
                      }
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
            )
          }
        </div >

        {/* Footer Navigation */}
        < div className="flex items-center justify-between border-t border-border px-6 py-4 sticky bottom-0 bg-card" >
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitting}
            className="border-border bg-transparent"
          >
            Назад
          </Button>
          {
            currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedProduct) ||
                  (currentStep === 2 && (!amount || !term || (isAgent && !selectedCompanyId) || (!isAgent && !myCompany?.id))) ||
                  (currentStep === 3 && selectedBankIds.length === 0)
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
            )
          }
        </div >
      </div >
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  )
}

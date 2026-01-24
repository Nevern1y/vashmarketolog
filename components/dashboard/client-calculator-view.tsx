"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Calculator, FileText, Landmark, CreditCard, TrendingUp, Building2,
    Wallet, HandCoins, Upload, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft,
    Search, Calendar, Settings
} from "lucide-react"
import { toast } from "sonner"
import { ApplicationChat } from "./application-chat"
import { useApplicationMutations, useCalculationSessionMutations } from "@/hooks/use-applications"
import { useMyCompany } from "@/hooks/use-companies"

// =============================================================================
// BANK DATABASE (Real data used for calculations)
// =============================================================================

// BG Types - value is backend enum, label is display text
const BG_TYPES = [
    { value: "application_security", label: "На участие" },
    { value: "contract_execution", label: "На обеспечение исполнения контракта" },
    { value: "advance_return", label: "На возврат аванса" },
    { value: "warranty_obligations", label: "На гарантийный период" },
    { value: "payment_guarantee", label: "На гарантию оплаты товара" },
    { value: "vat_refund", label: "На возвращение НДС" }
]

const LAWS = ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)", "275-ФЗ"]

// Credit types per ТЗ
const CREDIT_TYPES = [
    "Экспресс-кредит",
    "Кредит на пополнение оборотных средств",
    "Корпоративный кредит"
]

// КИК types per ТЗ
const KIK_TYPES = [
    "Кредит на исполнение контракта",
    "Займ"
]

// Leasing types per employer requirements
const LEASING_TYPES = [
    "Оборудование",
    "Спецтехника",
    "Автотранспорт",
    "Другое"
]

const FACTORING_TYPES = ["Классический факторинг", "Закрытый факторинг", "Закупочный факторинг"]

// Insurance categories and products per ТЗ + employer requirements
// Backend enum values with Russian labels
const INSURANCE_CATEGORIES_BACKEND: { value: string; label: string }[] = [
    { value: "personnel", label: "Персонал" },
    { value: "transport", label: "Транспорт" },
    { value: "property", label: "Имущество" },
    { value: "liability", label: "Ответственность" },
]
// Legacy display array for UI (will be replaced)
const INSURANCE_CATEGORIES = ["Строительно-монтажные риски", "Контракта", "Персонал", "Транспорт", "Имущество", "Ответственность"]
const INSURANCE_COMPANIES = [
    "ЭНЕРГОГАРАНТ",
    "АльфаСтрахование",
    "СОГАЗ",
    "Ингосстрах",
    "РЕСО",
    "БСД",
    "Пари",
]
// Backend enum values with Russian labels for insurance products
const INSURANCE_PRODUCTS_BACKEND: Record<string, { value: string; label: string }[]> = {
    personnel: [
        { value: "dms", label: "Добровольное медицинское страхование (ДМС)" },
        { value: "critical_illness", label: "Страхование критических заболеваний" },
        { value: "accident", label: "Страхование несчастных случаев" },
        { value: "travel", label: "Комплексное страхование в поездках" },
    ],
    transport: [
        { value: "osago", label: "ОСАГО юридических лиц" },
        { value: "fleet", label: "Комплексное страхование автопарков" },
        { value: "special_tech", label: "Страхование специальной техники" },
        { value: "carrier_liability", label: "Страхование ответственности перевозчика" },
    ],
    property: [
        { value: "construction", label: "Страхование объектов строительства" },
        { value: "cargo", label: "Страхование грузов и перевозок" },
        { value: "company_property", label: "Страхование имущества компаний" },
        { value: "business_interruption", label: "Страхование перерывов деятельности" },
    ],
    liability: [
        { value: "civil_liability", label: "Страхование гражданской ответственности" },
        { value: "hazardous_objects", label: "Страхование опасных объектов" },
        { value: "professional_risks", label: "Страхование профессиональных рисков" },
        { value: "quality_liability", label: "Страхование ответственности за качество" },
    ],
}
// Legacy display mapping for UI (will be replaced)
const INSURANCE_PRODUCTS: Record<string, string[]> = {
    "Персонал": ["ДМС", "Страхование критических заболеваний", "Страхование несчастных случаев", "Комплексное страхование в поездках"],
    "Транспорт": ["ОСАГО юридических лиц", "Комплексное страхование автопарков", "Страхование специальной техники", "Страхование ответственности перевозчика"],
    "Имущество": ["Страхование объектов строительства", "Страхование грузов и перевозок", "Страхование имущества компаний", "Страхование перерывов деятельности"],
    "Ответственность": ["Страхование гражданской ответственности", "Страхование опасных объектов", "Страхование профессиональных рисков", "Страхование ответственности за качество"],
    "Строительно-монтажные риски": ["СМР полный пакет", "СМР базовый", "Страхование строительных рисков"],
    "Контракта": ["Страхование исполнения контракта", "Страхование ответственности по контракту"]
}
// Mapping from Russian labels to backend values
const INSURANCE_CATEGORY_TO_BACKEND: Record<string, string> = {
    "Персонал": "personnel",
    "Транспорт": "transport",
    "Имущество": "property",
    "Ответственность": "liability",
}
const INSURANCE_PRODUCT_TO_BACKEND: Record<string, string> = {
    "ДМС": "dms",
    "Страхование критических заболеваний": "critical_illness",
    "Страхование несчастных случаев": "accident",
    "Комплексное страхование в поездках": "travel",
    "ОСАГО юридических лиц": "osago",
    "Комплексное страхование автопарков": "fleet",
    "Страхование специальной техники": "special_tech",
    "Страхование ответственности перевозчика": "carrier_liability",
    "Страхование объектов строительства": "construction",
    "Страхование грузов и перевозок": "cargo",
    "Страхование имущества компаний": "company_property",
    "Страхование перерывов деятельности": "business_interruption",
    "Страхование гражданской ответственности": "civil_liability",
    "Страхование опасных объектов": "hazardous_objects",
    "Страхование профессиональных рисков": "professional_risks",
    "Страхование ответственности за качество": "quality_liability",
}

const TENDER_TYPES = ["Разовое сопровождение", "Тендерное сопровождение под ключ"]

const COUNTRIES = ["Россия", "Австрия", "Германия", "Казахстан", "Китай", "ОАЭ", "США", "Турция", "Узбекистан"]

// Bank Interface
interface Bank {
    name: string
    minAmount: number
    maxAmount: number
    bgRate: number
    creditRate: number
    speed: string
    laws: string[]
    individual?: boolean
    type?: string
}

// Bank database with conditions
const BANKS_DB: Bank[] = [
    { name: "Сбербанк", minAmount: 100000, maxAmount: 500000000, bgRate: 2.5, creditRate: 15, speed: "Низкая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "ВТБ", minAmount: 500000, maxAmount: 300000000, bgRate: 2.8, creditRate: 14.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Альфа-Банк", minAmount: 300000, maxAmount: 200000000, bgRate: 3.0, creditRate: 16, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)"] },
    { name: "Промсвязьбанк", minAmount: 100000, maxAmount: 400000000, bgRate: 2.7, creditRate: 15.5, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Совкомбанк", minAmount: 200000, maxAmount: 150000000, bgRate: 3.2, creditRate: 17, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Газпромбанк", minAmount: 1000000, maxAmount: 1000000000, bgRate: 2.3, creditRate: 13, speed: "Низкая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Тинькофф", minAmount: 50000, maxAmount: 50000000, bgRate: 4.0, creditRate: 18, speed: "Высокая", laws: ["КБГ (Коммерческие)"] },
    { name: "Открытие", minAmount: 500000, maxAmount: 200000000, bgRate: 2.9, creditRate: 15, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Райффайзен", minAmount: 1000000, maxAmount: 300000000, bgRate: 2.6, creditRate: 14, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Локо-Банк", minAmount: 100000, maxAmount: 100000000, bgRate: 3.5, creditRate: 19, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)"] },
    { name: "МКБ", minAmount: 300000, maxAmount: 250000000, bgRate: 2.8, creditRate: 15.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Уралсиб", minAmount: 200000, maxAmount: 100000000, bgRate: 3.1, creditRate: 16.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Индивидуальное рассмотрение", minAmount: 10000, maxAmount: 999999999, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)", "275-ФЗ"], individual: true, type: "bank" },
    { name: "Эволюция (Лизинг)", minAmount: 500000, maxAmount: 100000000, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["leasing"], type: "leasing" },
    { name: "Carcade (Лизинг)", minAmount: 500000, maxAmount: 500000000, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["leasing"], type: "leasing" },
    { name: "Европлан (Лизинг)", minAmount: 500000, maxAmount: 1000000000, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["leasing"], type: "leasing" },
    { name: "ВТБ Лизинг", minAmount: 1000000, maxAmount: 5000000000, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["leasing"], type: "leasing" },
]

// Calculate bank offers based on form data
const calculateOffers = (amount: number, law: string, days: number, productType: string = "bg") => {
    const approved: typeof BANKS_DB = []
    const rejected: { bank: string; reason: string }[] = []

    BANKS_DB.forEach(bank => {
        // Individual consideration is always available
        if (bank.individual) {
            approved.push(bank)
            return
        }

        // Filter by product type
        if (productType === "leasing") {
            if (bank.type !== "leasing") return // Skip non-leasing companies
        } else {
            if (bank.type === "leasing") return // Skip leasing companies for other products
        }

        if (amount < bank.minAmount) {
            rejected.push({ bank: bank.name, reason: `Минимальная сумма ${bank.minAmount.toLocaleString("ru-RU")} ₽` })
        } else if (amount > bank.maxAmount) {
            rejected.push({ bank: bank.name, reason: `Максимальная сумма ${bank.maxAmount.toLocaleString("ru-RU")} ₽` })
        } else if (productType !== "leasing" && !bank.laws.includes(law)) {
            // Only check law if strictly required (not leasing)
            rejected.push({ bank: bank.name, reason: `Банк не работает с ${law}` })
        } else {
            approved.push(bank)
        }
    })

    // Сортировка по приоритету скорости: Высокая → Средняя → Низкая
    const speedPriority: Record<string, number> = {
        "Высокая": 0,
        "Средняя": 1,
        "Низкая": 2
    }
    approved.sort((a, b) => {
        const priorityA = speedPriority[a.speed] ?? 3
        const priorityB = speedPriority[b.speed] ?? 3
        return priorityA - priorityB
    })

    return { approved, rejected }
}

// RKO Banks
const RKO_BANKS = [
    { name: "Альфа Банк", rating: 5, sanctions: "Частично", cost: "БЕСПЛАТНО" },
    { name: "Банк «Санкт-Петербург»", rating: 18, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Локо", rating: 52, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Модуль", rating: 114, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Открытие", rating: 8, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Промсвязьбанк", rating: 7, sanctions: "Да", cost: "БЕСПЛАТНО" },
    { name: "Райффайзен Банк", rating: 10, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Сбербанк", rating: 1, sanctions: "Да", cost: "БЕСПЛАТНО" },
    { name: "Тинькофф", rating: 12, sanctions: "Нет", cost: "БЕСПЛАТНО" },
    { name: "Точка", rating: 95, sanctions: "Нет", cost: "БЕСПЛАТНО" },
]

const formatNumber = (num: number): string => num.toLocaleString("ru-RU")

const SpeedBadge = ({ speed }: { speed: string }) => {
    const colors: Record<string, string> = {
        "Высокая": "bg-green-500/20 text-green-500",
        "Средняя": "bg-yellow-500/20 text-yellow-500",
        "Низкая": "bg-gray-500/20 text-gray-400"
    }
    return <span className={cn("px-2 py-0.5 rounded text-xs", colors[speed] || colors["Низкая"])}>{speed}</span>
}

// RKO/Specaccount/VED Application interface
interface RkoApplication {
    id: number
    bank: string
    createdAt: string
    status: "creating" | "sent" | "approved" | "rejected"
    tariff: string
    type: "rko" | "specaccount" | "ved"
    messages: { sender: string; text: string; time: string }[]
    // VED specific fields
    amount?: number
    currency?: string
    country?: string
    purpose?: string
}

// VED Banks database
const VED_BANKS = [
    { name: "Райффайзен", rating: "A+", sanctions: "Да", currencies: ["USD", "EUR", "CNY"], countries: ["Китай", "ОАЭ", "Турция", "Казахстан"] },
    { name: "Газпромбанк", rating: "A", sanctions: "Частично", currencies: ["CNY", "TRY", "AED"], countries: ["Китай", "Турция", "ОАЭ", "Казахстан", "Узбекистан"] },
    { name: "Тинькофф", rating: "B+", sanctions: "Нет", currencies: ["USD", "EUR", "CNY", "TRY", "AED"], countries: ["Китай", "ОАЭ", "Турция", "Казахстан"] },
    { name: "Альфа-Банк", rating: "A", sanctions: "Да", currencies: ["CNY", "TRY"], countries: ["Китай", "Турция", "ОАЭ"] },
    { name: "ВТБ", rating: "A+", sanctions: "Да", currencies: ["CNY", "AED"], countries: ["Китай", "ОАЭ", "Казахстан"] },
]

// Initial applications (empty - will be populated from API)
const INITIAL_APPLICATIONS: RkoApplication[] = []

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClientCalculatorView() {
    const [activeTab, setActiveTab] = useState<string | null>(null) // null = show product cards
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResults, setShowResults] = useState<string | null>(null)
    const [selectedOffers, setSelectedOffers] = useState<Set<number>>(new Set())
    const router = useRouter()

    // API hooks for real backend integration
    const { createApplication, isLoading: isCreatingApplication } = useApplicationMutations()
    const { createSession, updateSubmittedBanks } = useCalculationSessionMutations()
    const { company, isLoading: isLoadingCompany } = useMyCompany()

    // RKO/Specaccount applications state
    const [applications, setApplications] = useState<RkoApplication[]>(INITIAL_APPLICATIONS)
    const [selectedApplication, setSelectedApplication] = useState<RkoApplication | null>(null)

    // Shared form state
    const [federalLaw, setFederalLaw] = useState("44")
    const [noticeNumber, setNoticeNumber] = useState("")
    const [lotNumber, setLotNumber] = useState("")
    const [amount, setAmount] = useState<number | undefined>(undefined)
    const [platform, setPlatform] = useState("")
    const [contracts44, setContracts44] = useState<number | undefined>(undefined)
    const [contracts223, setContracts223] = useState<number | undefined>(undefined)

    // BG specific
    const [bgType, setBgType] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [termDays, setTermDays] = useState<number | undefined>(undefined)
    const [hasAdvance, setHasAdvance] = useState(false)
    const [advancePercent, setAdvancePercent] = useState<number | undefined>(undefined)
    const [hasCustomerTemplate, setHasCustomerTemplate] = useState(false)

    // KIK specific
    const [kikType, setKikType] = useState("credit")
    const [contractPrice, setContractPrice] = useState<number | undefined>(undefined)
    const [creditAmount, setCreditAmount] = useState<number | undefined>(undefined)
    const [completionPercent, setCompletionPercent] = useState<number | undefined>(undefined)
    const [ignoreCompletion, setIgnoreCompletion] = useState(false)
    const [contractDateFrom, setContractDateFrom] = useState("")
    const [contractDateTo, setContractDateTo] = useState("")

    // Factoring specific
    const [contractType, setContractType] = useState("gov")
    const [factoringType, setFactoringType] = useState("")
    const [financingAmount, setFinancingAmount] = useState<number | undefined>(undefined)
    const [financingDate, setFinancingDate] = useState("")
    const [nmc, setNmc] = useState<number | undefined>(undefined)
    const [shipmentVolume, setShipmentVolume] = useState<number | undefined>(undefined)
    const [paymentDelay, setPaymentDelay] = useState<number | undefined>(undefined)
    const [customerInn, setCustomerInn] = useState("")

    // Credit specific
    const [creditType, setCreditType] = useState("")

    // Leasing specific
    const [leasingCreditType, setLeasingCreditType] = useState("")
    const [leasingAmount, setLeasingAmount] = useState<number | undefined>(undefined)
    const [leasingEndDate, setLeasingEndDate] = useState("")

    // Insurance specific
    const [insuranceCategory, setInsuranceCategory] = useState("")
    const [insuranceProduct, setInsuranceProduct] = useState("")
    const [insuranceAmount, setInsuranceAmount] = useState<number | undefined>(undefined)
    const [insuranceTerm, setInsuranceTerm] = useState<number | undefined>(undefined)

    // RKO specific
    const [rkoType, setRkoType] = useState<"rko" | "specaccount">("rko")

    // Unsecured loan specific
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("+7")
    const [email, setEmail] = useState("")
    const [comment, setComment] = useState("")

    useEffect(() => {
        if (dateFrom && termDays && termDays > 0) {
            const startDate = new Date(dateFrom)
            if (Number.isNaN(startDate.getTime())) return
            startDate.setDate(startDate.getDate() + termDays)
            const calculatedDateTo = startDate.toISOString().split('T')[0]
            setDateTo(calculatedDateTo)
        }
    }, [dateFrom, termDays])

    useEffect(() => {
        if (!dateFrom || !dateTo) return
        const startDate = new Date(dateFrom)
        const endDate = new Date(dateTo)
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return
        const diffDays = Math.max(0, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
        if (diffDays > 0 && diffDays !== termDays) {
            setTermDays(diffDays)
        }
    }, [dateFrom, dateTo, termDays])

    // VED (International Payments) specific
    const [vedCurrency, setVedCurrency] = useState("")
    const [vedCountry, setVedCountry] = useState("")
    const [vedPurpose, setVedPurpose] = useState("")

    // Calculated offers result
    const [calculatedOffers, setCalculatedOffers] = useState<{ approved: typeof BANKS_DB; rejected: { bank: string; reason: string }[] }>({ approved: [], rejected: [] })

    // Current calculation session ID (for linking applications to root application)
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)

    // =========================================================================
    // CLEAR FORM FUNCTIONS
    // =========================================================================

    const clearBgForm = () => {
        setBgType("")
        setFederalLaw("44")
        setNoticeNumber("")
        setLotNumber("")
        setAmount(undefined)
        setDateFrom("")
        setDateTo("")
        setTermDays(undefined)
        setHasAdvance(false)
        setAdvancePercent(undefined)
        setHasCustomerTemplate(false)
        setContracts44(undefined)
        setContracts223(undefined)
    }

    const clearKikForm = () => {
        setKikType("credit")
        setNoticeNumber("")
        setLotNumber("")
        setContractPrice(undefined)
        setDateFrom("")
        setDateTo("")
        setTermDays(undefined)
        setHasAdvance(false)
        setAdvancePercent(undefined)
        setCreditAmount(undefined)
        setContracts44(undefined)
        setContracts223(undefined)
        setCompletionPercent(undefined)
        setIgnoreCompletion(false)
    }

    const clearCreditForm = () => {
        setCreditType("")
        setAmount(undefined)
        setDateFrom("")
        setDateTo("")
        setTermDays(undefined)
    }

    const clearFactoringForm = () => {
        setFactoringType("")
        setFinancingAmount(undefined)
        setFinancingDate("")
        setContractType("gov")
        setNoticeNumber("")
        setLotNumber("")
        setNmc(undefined)
        setDateFrom("")
        setDateTo("")
        setShipmentVolume(undefined)
        setPaymentDelay(undefined)
        setCustomerInn("")
    }

    const clearLeasingForm = () => {
        setLeasingCreditType("")
        setLeasingAmount(undefined)
        setLeasingEndDate("")
    }

    const clearInsuranceForm = () => {
        setInsuranceCategory("")
        setInsuranceProduct("")
        setInsuranceAmount(undefined)
        setInsuranceTerm(undefined)
    }

    // =========================================================================
    // FORMATTED NUMBER INPUT HELPER
    // =========================================================================

    // Format number with thousand separators (supports decimals: 1000000.5 -> "1 000 000,5")
    const formatInputNumber = (value: number | string | undefined): string => {
        if (!value && value !== 0) return ""

        // Convert to string
        let str = typeof value === 'number' ? value.toString() : value

        // Remove all spaces for processing
        str = str.replace(/\s/g, '')

        // Split into integer and decimal parts
        const parts = str.split(/[.,]/)
        const integerPart = parts[0]
        const decimalPart = parts[1]

        // Format integer part with spaces
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

        // Reassemble
        if (decimalPart !== undefined) {
            return `${formattedInteger},${decimalPart}`
        }

        // If user just typed comma/dot
        if (str.endsWith(',') || str.endsWith('.')) {
            return `${formattedInteger},`
        }

        return formattedInteger
    }

    // Parse formatted string back to number ("1 000 000,50" -> 1000000.5)
    const parseInputNumber = (value: string): number | undefined => {
        if (!value) return undefined

        // Allow only digits, spaces, comma and dot
        const sanitized = value.replace(/[^\d\s,.]/g, '')

        // Remove spaces and replace comma with dot
        const cleaned = sanitized.replace(/\s/g, '').replace(',', '.')

        const num = parseFloat(cleaned)
        return isNaN(num) ? undefined : num
    }

    // =========================================================================
    // VALIDATION FUNCTIONS
    // =========================================================================

    // Validate TZ (Tender Loan) form
    const validateTZ = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!amount || amount <= 0) errors.push("Сумма займа")
        if (!federalLaw) errors.push("Федеральный закон")
        return { valid: errors.length === 0, errors }
    }

    // Validate BG (Bank Guarantee) form
    const validateBG = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!bgType) errors.push("Тип гарантии")
        if (!federalLaw) errors.push("Федеральный закон")
        if (!amount || amount <= 0) errors.push("Сумма БГ")
        if (!dateFrom) errors.push("Дата начала")
        if (!dateTo) errors.push("Дата окончания")
        return { valid: errors.length === 0, errors }
    }

    // Validate KIK (Contract Credit) form
    const validateKIK = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!contractPrice || contractPrice <= 0) errors.push("Цена контракта")
        if (!creditAmount || creditAmount <= 0) errors.push("Сумма кредита")
        return { valid: errors.length === 0, errors }
    }

    // Validate Express form
    const validateExpress = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!amount || amount <= 0) errors.push("Сумма кредита")
        return { valid: errors.length === 0, errors }
    }

    // Validate Factoring form
    const validateFactoring = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!shipmentVolume || shipmentVolume <= 0) errors.push("Объём отгрузки")
        if (!paymentDelay || paymentDelay <= 0) errors.push("Отсрочка платежа")
        return { valid: errors.length === 0, errors }
    }

    // Validate Unsecured Loan form
    const validateUnsecured = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!fullName.trim()) errors.push("ФИО")
        if (!phone || phone.length < 11) errors.push("Телефон")
        if (!email || !email.includes("@")) errors.push("Email")
        if (!amount || amount <= 0) errors.push("Сумма займа")
        return { valid: errors.length === 0, errors }
    }

    // Validate Insurance form
    const validateInsurance = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!insuranceCategory) errors.push("Вид страхования")
        if (insuranceCategory && !insuranceProduct) errors.push("Страховой продукт")
        if (!insuranceAmount || insuranceAmount <= 0) errors.push("Сумма страхования")
        if (!insuranceTerm || insuranceTerm <= 0) errors.push("Срок договора")
        return { valid: errors.length === 0, errors }
    }

    // Validate Leasing form
    const validateLeasing = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!leasingCreditType) errors.push("Тип предмета лизинга")
        if (!leasingAmount || leasingAmount <= 0) errors.push("Сумма лизинга")
        return { valid: errors.length === 0, errors }
    }

    // Validate International Payments form
    const validateInternational = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = []
        if (!amount || amount <= 0) errors.push("Сумма платежа")
        if (!vedCurrency) errors.push("Валюта")
        if (!vedCountry) errors.push("Страна назначения")
        return { valid: errors.length === 0, errors }
    }

    // Format phone number as +7 XXX XXX XX XX
    const formatPhoneNumber = (value: string): string => {
        // Remove all non-digit characters
        const digits = value.replace(/\D/g, "")

        // Handle Russian phone numbers
        let normalized = digits
        if (digits.startsWith("8") && digits.length > 1) {
            normalized = "7" + digits.slice(1)
        } else if (!digits.startsWith("7") && digits.length > 0) {
            normalized = "7" + digits
        }

        // Format: +7 XXX XXX XX XX
        if (normalized.length === 0) return ""
        if (normalized.length <= 1) return `+${normalized}`
        if (normalized.length <= 4) return `+${normalized.slice(0, 1)} ${normalized.slice(1)}`
        if (normalized.length <= 7) return `+${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4)}`
        if (normalized.length <= 9) return `+${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`
        return `+${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`
    }

    // Get validation result for current product
    const getValidation = (productType: string) => {
        switch (productType) {
            case "tz": return validateTZ()
            case "bg": return validateBG()
            case "kik": return validateKIK()
            case "express": return validateExpress()
            case "factoring": return validateFactoring()
            case "unsecured": return validateUnsecured()
            case "insurance": return validateInsurance()
            case "leasing": return validateLeasing()
            case "ved": return validateInternational()
            default: return { valid: true, errors: [] }
        }
    }

    // Handle calculate with validation
    const handleCalculateWithValidation = async (productType: string) => {
        const validation = getValidation(productType)
        if (!validation.valid) {
            toast.error(`Заполните обязательные поля: ${validation.errors.join(", ")}`)
            return
        }
        await handleCalculate(productType)
    }


    // Handle calculate - uses real calculation logic
    const handleCalculate = async (productType: string) => {
        setIsSubmitting(true)
        await new Promise(r => setTimeout(r, 800)) // Simulate API call

        // Calculate based on form data
        const law = federalLaw === "44" ? "44-ФЗ" : federalLaw === "223" ? "223-ФЗ" : federalLaw === "615" ? "185-ФЗ (615-ПП)" : federalLaw === "275" ? "275-ФЗ" : "КБГ (Коммерческие)"
        const days = dateFrom && dateTo ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)) : 30

        let calculatedAmount = amount
        if (productType === "kik") calculatedAmount = creditAmount
        if (productType === "leasing") calculatedAmount = leasingAmount
        if (productType === "factoring") calculatedAmount = financingAmount
        if (productType === "insurance") calculatedAmount = insuranceAmount

        const offers = calculateOffers(calculatedAmount ?? 0, law, days, productType)

        setCalculatedOffers(offers)
        setIsSubmitting(false)
        setShowResults(productType)
        setSelectedOffers(new Set())
    }

    // Handle create application - REAL API INTEGRATION
    const handleCreateApplication = async () => {
        if (selectedOffers.size === 0) {
            toast.error("Выберите хотя бы одно предложение")
            return
        }

        // Check if client has a company
        if (!company) {
            toast.error("Сначала создайте компанию в профиле")
            return
        }

        // Map federal law to backend TenderLaw enum values
        // Backend choices: 44_fz, 223_fz, 615_pp, 185_fz, kbg, commercial
        const lawMapping: Record<string, string> = {
            "44": "44_fz",
            "223": "223_fz",
            "615": "615_pp",
            "kbg": "kbg"
        }

        // Get product type based on current tab/results
        const getProductType = (): string => {
            switch (showResults) {
                case "tz": return "tender_loan"
                case "bg": return "bank_guarantee"
                case "kik": return "contract_loan"
                case "express": return "corporate_credit"
                case "factoring": return "factoring"
                case "leasing": return "leasing"
                case "insurance": return "insurance"
                default: return "bank_guarantee"
            }
        }

        // Build goscontract_data based on product type
        const buildGoscontractData = () => {
            const baseData: Record<string, unknown> = {
                law: lawMapping[federalLaw] || "44-ФЗ",
                purchase_number: noticeNumber || undefined,
                lot_number: lotNumber || undefined,
            }

            if (showResults === "bg") {
                return {
                    ...baseData,
                    bg_type: bgType || undefined,
                    guarantee_start_date: dateFrom || undefined,
                    guarantee_end_date: dateTo || undefined,
                    has_prepayment: hasAdvance,
                    advance_percent: hasAdvance ? advancePercent : undefined,
                    has_customer_template: hasCustomerTemplate,
                    contracts_44fz_count: contracts44 || 0,
                    contracts_223fz_count: contracts223 || 0,
                }
            }

            if (showResults === "kik") {
                return {
                    ...baseData,
                    contract_loan_type: kikType || undefined,
                    contract_price: contractPrice?.toString(),
                    credit_amount: creditAmount?.toString(),
                    contract_start_date: contractDateFrom || undefined,
                    contract_end_date: contractDateTo || undefined,
                    credit_start_date: dateFrom || undefined,
                    credit_end_date: dateTo || undefined,
                    contract_execution_percent: !ignoreCompletion ? completionPercent : undefined,
                    ignore_execution_percent: ignoreCompletion,
                    has_prepayment: hasAdvance,
                    advance_percent: hasAdvance ? advancePercent : undefined,
                    contracts_44fz_count: contracts44 || 0,
                    contracts_223fz_count: contracts223 || 0,
                }
            }

            if (showResults === "express") {
                return {
                    credit_type: creditType || undefined,
                    credit_start_date: dateFrom || undefined,
                    credit_end_date: dateTo || undefined,
                }
            }

            if (showResults === "factoring") {
                return {
                    ...baseData,
                    factoring_type: factoringType || undefined,
                    financing_amount: financingAmount?.toString() || undefined,
                    financing_date: financingDate || undefined,
                    contract_type: contractType || undefined,
                    nmc: nmc?.toString() || undefined,
                    shipment_volume: shipmentVolume?.toString() || undefined,
                    payment_delay: paymentDelay || undefined,
                    customer_inn: customerInn || undefined,
                }
            }

            if (showResults === "leasing") {
                return {
                    leasing_credit_type: leasingCreditType || undefined,
                    leasing_amount: leasingAmount?.toString() || undefined,
                    leasing_end_date: leasingEndDate || undefined,
                }
            }

            if (showResults === "insurance") {
                return {
                    // Convert Russian labels to backend enum values
                    insurance_category: INSURANCE_CATEGORY_TO_BACKEND[insuranceCategory] || insuranceCategory || undefined,
                    insurance_product_type: INSURANCE_PRODUCT_TO_BACKEND[insuranceProduct] || insuranceProduct || undefined,
                    insurance_amount: insuranceAmount?.toString() || undefined,
                    insurance_term_months: insuranceTerm || undefined,
                }
            }

            return baseData
        }

        // Create applications for each selected bank
        const selectedBanks = Array.from(selectedOffers).map(idx => calculatedOffers.approved[idx])
        let successCount = 0
        let errorCount = 0
        const successfulBankNames: string[] = []

        // First, create a CalculationSession to store the calculation results (root application)
        let sessionId = currentSessionId
        if (!sessionId && company) {
            try {
                const productType = getProductType()
                // Build form data for session storage
                const formData = {
                    federalLaw,
                    noticeNumber,
                    lotNumber,
                    amount: amount ?? 0,
                    dateFrom,
                    dateTo,
                    bgType,
                    hasAdvance,
                    advancePercent,
                    kikType,
                    contractPrice,
                    creditAmount,
                    factoringType,
                    financingAmount,
                    creditType,
                    leasingCreditType,
                    leasingAmount,
                    insuranceCategory,
                    insuranceProduct,
                    insuranceAmount,
                    vedCurrency,
                    vedCountry,
                    vedPurpose,
                }

                // Build display title
                const amountDisplay = formatInputNumber(amount ?? 0)
                const title = `${productType === 'bank_guarantee' ? 'БГ' : productType === 'tender_loan' ? 'ТЗ' : productType} ${amountDisplay} ₽`

                const session = await createSession({
                    company: company.id,
                    product_type: productType,
                    form_data: formData,
                    approved_banks: calculatedOffers.approved.map(b => ({
                        name: b.name,
                        bgRate: b.bgRate,
                        creditRate: b.creditRate,
                        speed: b.speed,
                        individual: b.individual
                    })),
                    rejected_banks: calculatedOffers.rejected,
                    title
                })

                if (session) {
                    sessionId = session.id
                    setCurrentSessionId(session.id)
                }
            } catch (err) {
                console.error('Error creating calculation session:', err)
                // Continue without session - applications will still be created
            }
        }

        for (const bank of selectedBanks) {
            try {
                const payload = {
                    company: company.id,
                    product_type: getProductType(),
                    amount: (amount ?? 0).toString(),
                    term_months: dateFrom && dateTo
                        ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24 * 30))
                        : 1,
                    target_bank_name: bank.name,
                    tender_number: noticeNumber || undefined,
                    tender_platform: platform || undefined,
                    goscontract_data: buildGoscontractData(),
                    guarantee_type: showResults === "bg" ? bgType : undefined,
                    tender_law: lawMapping[federalLaw],
                    calculation_session: sessionId || undefined,  // Link to root application
                }

                const result = await createApplication(payload as Parameters<typeof createApplication>[0])
                if (result) {
                    successCount++
                    successfulBankNames.push(bank.name)
                } else {
                    errorCount++
                }
            } catch (err) {
                console.error('Error creating application:', err)
                errorCount++
            }
        }

        // Update submitted banks in the session
        if (sessionId && successfulBankNames.length > 0) {
            try {
                await updateSubmittedBanks(sessionId, successfulBankNames)
            } catch (err) {
                console.error('Error updating submitted banks:', err)
            }
        }

        if (successCount > 0) {
            toast.success(`Создано заявок: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
            setTimeout(() => {
                router.push("/?view=applications")
            }, 400)
        } else {
            toast.error("Не удалось создать заявки")
        }

        setShowResults(null)
        setSelectedOffers(new Set())
        setCurrentSessionId(null)  // Reset session for next calculation
    }

    // Toggle offer selection
    const toggleOffer = (index: number) => {
        const selectedBank = calculatedOffers.approved[index]
        const isIndividual = selectedBank.individual

        if (isIndividual) {
            // Exclusive selection for "Individual Consideration"
            if (selectedOffers.has(index)) {
                setSelectedOffers(new Set())
            } else {
                setSelectedOffers(new Set([index]))
            }
        } else {
            const newSet = new Set(selectedOffers)

            // Remove "Individual Consideration" if selecting normal bank
            calculatedOffers.approved.forEach((b, i) => {
                if (b.individual && newSet.has(i)) {
                    newSet.delete(i)
                }
            })

            if (newSet.has(index)) newSet.delete(index)
            else newSet.add(index)

            setSelectedOffers(newSet)
        }
    }

    // Back to form
    const backToForm = () => setShowResults(null)

    // Create RKO/Specaccount application - REAL API INTEGRATION
    const createRkoApplication = async (bank: string, type: "rko" | "specaccount") => {
        // Check if client has a company
        if (!company) {
            toast.error("Сначала создайте компанию в профиле")
            return
        }

        const payload = {
            company: company.id,
            product_type: type === "rko" ? "rko" : "special_account",
            amount: "0",
            term_months: 12,
            target_bank_name: bank,
            account_type: type,
        }

        try {
            const result = await createApplication(payload as Parameters<typeof createApplication>[0])
            if (result) {
                // Update local state for UI display
                const newApp: RkoApplication = {
                    id: result.id,
                    bank,
                    createdAt: result.created_at || new Date().toISOString().replace("T", " ").slice(0, 19),
                    status: "creating",
                    tariff: "-",
                    type,
                    messages: []
                }
                setApplications(prev => [newApp, ...prev])
                setSelectedApplication(newApp)
                toast.success(`Заявка №${result.id} в ${bank} создана`)
            } else {
                toast.error("Не удалось создать заявку")
            }
        } catch (err) {
            console.error('Error creating RKO application:', err)
            toast.error("Ошибка при создании заявки")
        }
    }

    // Send application
    const sendApplication = (app: RkoApplication) => {
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "sent" as const } : a))
        setSelectedApplication(prev => prev?.id === app.id ? { ...prev, status: "sent" } : prev)
        toast.success(`Заявка №${app.id} отправлена`)
    }

    // Delete application
    const deleteApplication = (app: RkoApplication) => {
        setApplications(prev => prev.filter(a => a.id !== app.id))
        setSelectedApplication(null)
        toast.success(`Заявка №${app.id} удалена`)
    }

    // Create VED (International Payments) application - REAL API INTEGRATION
    const createVedApplication = async (bankName?: string) => {
        // Check if client has a company
        if (!company) {
            toast.error("Сначала создайте компанию в профиле")
            return
        }

        // Validation
        if (!amount || amount <= 0) {
            toast.error("Укажите сумму платежа")
            return
        }
        if (!vedCurrency) {
            toast.error("Выберите валюту")
            return
        }
        if (!vedCountry) {
            toast.error("Выберите страну назначения")
            return
        }

        setIsSubmitting(true)

        const payload = {
            company: company.id,
            product_type: "ved",
            amount: String(amount),
            term_months: 12,
            ved_currency: vedCurrency,
            ved_country: vedCountry,
            ved_purpose: vedPurpose || undefined,
            target_bank_name: bankName || "Индивидуальный подбор",
            goscontract_data: {
                currency: vedCurrency,
                country: vedCountry,
                purpose: vedPurpose || undefined,
            },
        }

        try {
            const result = await createApplication(payload as Parameters<typeof createApplication>[0])
            if (result) {
                // Create local application for UI
                const newApp: RkoApplication = {
                    id: result.id,
                    bank: bankName || "Индивидуальный подбор",
                    createdAt: result.created_at || new Date().toISOString().replace("T", " ").slice(0, 19),
                    status: "creating",
                    tariff: "-",
                    type: "ved",
                    messages: [],
                    amount: amount,
                    currency: vedCurrency,
                    country: vedCountry,
                    purpose: vedPurpose,
                }
                setApplications(prev => [newApp, ...prev])
                setSelectedApplication(newApp)
                toast.success(`Заявка на международный платёж №${result.id} создана!`)
                setTimeout(() => {
                    router.push("/?view=applications")
                }, 400)
            } else {
                toast.error("Не удалось создать заявку")
            }
        } catch (err) {
            console.error('Error creating VED application:', err)
            toast.error("Ошибка при создании заявки")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get status label and color
    const getStatusInfo = (status: RkoApplication["status"]) => {
        const info: Record<typeof status, { label: string; color: string }> = {
            creating: { label: "СОЗДАНИЕ ЗАЯВКИ", color: "bg-yellow-500" },
            sent: { label: "ОТПРАВЛЕНА", color: "bg-blue-500" },
            approved: { label: "ОДОБРЕНА", color: "bg-green-500" },
            rejected: { label: "ОТКЛОНЕНА", color: "bg-red-500" }
        }
        return info[status]
    }
    // Product cards data - with descriptions for professional card UI
    const productCards = [
        { id: "bg", label: "Банковская гарантия", icon: FileText, description: "Гарантии для тендеров по 44-ФЗ, 223-ФЗ, КБГ" },
        { id: "kik", label: "КИК", icon: CreditCard, description: "Кредит на исполнение контракта" },
        { id: "express", label: "Кредит", icon: TrendingUp, description: "Экспресс-кредит, ПОС, Корпоративный" },
        { id: "factoring", label: "Факторинг", icon: HandCoins, description: "Финансирование дебиторской задолженности" },
        { id: "leasing", label: "Лизинг", icon: Building2, description: "Лизинг оборудования и транспорта" },
        { id: "insurance", label: "Страхование", icon: Landmark, description: "Страхование СМР, имущества, ответственности" },
        { id: "ved", label: "Междунар. платежи", icon: Wallet, description: "Международные платежи и ВЭД" },
        { id: "rko", label: "РКО и спецсчет", icon: Building2, description: "Расчётно-кассовое обслуживание" },
    ]

    // Legacy productTabs for tab-based navigation (when product is selected)
    const productTabs = [
        { id: "tz", label: "Тендерный займ", icon: FileText },
        { id: "bg", label: "Банк. гарантия", icon: FileText },
        { id: "kik", label: "КИК", icon: CreditCard },
        { id: "express", label: "Кредит", icon: TrendingUp },
        { id: "factoring", label: "Факторинг", icon: HandCoins },
        { id: "leasing", label: "Лизинг", icon: Building2 },
        { id: "insurance", label: "Страхование", icon: Landmark },
        { id: "ved", label: "Междунар. платежи", icon: Wallet },
        { id: "rko", label: "РКО и спецсчет", icon: Building2 },
        { id: "deposits", label: "Депозиты", icon: Calculator },
    ]

    // =============================================================================
    // RESULTS VIEWS
    // =============================================================================

    // TZ Results (now uses calculatedOffers)
    const TZResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <h2 className="text-xl font-bold">Результат отбора</h2>
                <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-600">Одобренные: {calculatedOffers.approved.length}</Badge>
                    <Badge variant="outline">Отказные: {calculatedOffers.rejected.length}</Badge>
                </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <span className="text-muted-foreground">Параметры расчёта:</span>
                <span className="ml-2">Сумма: <strong className="text-[#3CE8D1]">{(amount ?? 0).toLocaleString("ru-RU")} ₽</strong></span>
                <span className="ml-4">Закон: <strong>{federalLaw}-ФЗ</strong></span>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                    <div><span className="text-green-500 font-bold">ОДОБРЕННЫЕ ПРЕДЛОЖЕНИЯ: {calculatedOffers.approved.length}</span><p className="text-xs text-muted-foreground">(соответствует заданным параметрам)</p></div>
                    <span className="text-xs">вероятность: <span className="text-green-500">высокая</span></span>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs">
                            <tr>
                                <th className="text-left p-2">Наименование Банка/МФО</th>
                                <th className="text-center p-2">Мин. сумма</th>
                                <th className="text-center p-2">Макс. сумма</th>
                                <th className="text-center p-2">Тариф %</th>
                                <th className="text-center p-2">Тариф руб.</th>
                                <th className="text-center p-2">Скорость</th>
                                <th className="text-center p-2">Выбрать</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2 font-medium">{bank.name}{bank.individual && <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд. условия</Badge>}</td>
                                    <td className="p-2 text-center">{bank.minAmount.toLocaleString("ru-RU")} ₽</td>
                                    <td className="p-2 text-center">{bank.maxAmount.toLocaleString("ru-RU")} ₽</td>
                                    <td className="p-2 text-center">{bank.bgRate.toFixed(1)}%</td>
                                    <td className="p-2 text-center text-[#3CE8D1]">{((amount ?? 0) * bank.bgRate / 100).toLocaleString("ru-RU")} ₽</td>
                                    <td className="p-2 text-center"><SpeedBadge speed={bank.speed} /></td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {calculatedOffers.rejected.length > 0 && (
                <Card>
                    <CardHeader className="py-3"><span className="text-red-500 font-bold">ОТКАЗНЫЕ: {calculatedOffers.rejected.length}</span><p className="text-xs text-muted-foreground">(не соответствует заданным параметрам)</p></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Банк</th><th className="text-left p-2">Причина отказа</th></tr></thead>
                            <tbody>
                                {calculatedOffers.rejected.map((item, i) => (
                                    <tr key={i} className="border-t"><td className="p-2">{item.bank}</td><td className="p-2 text-red-400">{item.reason}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-muted-foreground text-center">Приведенные расчеты стоимости являются предварительными и не являются публичной офертой.</p>
            <div className="flex justify-end"><Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">СОЗДАТЬ ЗАЯВКУ</Button></div>
        </div>
    )

    // BG Results (uses calculatedOffers)
    const BGResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <h2 className="text-xl font-bold">Результат отбора</h2>
                <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-600">Одобренные: {calculatedOffers.approved.length}</Badge>
                    <Badge variant="outline">Отказные: {calculatedOffers.rejected.length}</Badge>
                </div>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <span className="text-muted-foreground">Параметры:</span>
                <span className="ml-2">Сумма БГ: <strong className="text-[#3CE8D1]">{(amount ?? 0).toLocaleString("ru-RU")} ₽</strong></span>
                <span className="ml-4">Тип: <strong>{bgType || "Обеспечение заявки"}</strong></span>
            </div>

            <Card>
                <CardHeader className="py-3"><span className="text-green-500 font-bold">ОДОБРЕННЫЕ: {calculatedOffers.approved.length}</span></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs">
                            <tr><th className="text-left p-2">Банк</th><th className="text-center p-2">Тариф %</th><th className="text-center p-2">Тариф руб.</th><th className="text-center p-2">Скорость</th><th className="text-center p-2">Выбрать</th></tr>
                        </thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2 font-medium">{bank.name}{bank.individual && <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд.</Badge>}</td>
                                    <td className="p-2 text-center">{bank.bgRate.toFixed(1)}%</td>
                                    <td className="p-2 text-center text-[#3CE8D1]">{((amount ?? 0) * bank.bgRate / 100).toLocaleString("ru-RU")} ₽</td>
                                    <td className="p-2 text-center"><SpeedBadge speed={bank.speed} /></td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {calculatedOffers.rejected.length > 0 && (
                <Card>
                    <CardHeader className="py-3"><span className="text-red-500 font-bold">ОТКАЗНЫЕ: {calculatedOffers.rejected.length}</span></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Банк</th><th className="text-left p-2">Причина</th></tr></thead>
                            <tbody>{calculatedOffers.rejected.map((item, i) => (<tr key={i} className="border-t"><td className="p-2">{item.bank}</td><td className="p-2 text-red-400">{item.reason}</td></tr>))}</tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-muted-foreground text-center">Приведенные расчеты являются предварительными и не являются публичной офертой.</p>
            <div className="flex justify-end"><Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">СОЗДАТЬ ЗАЯВКУ</Button></div>
        </div>
    )

    // KIK Results (uses calculatedOffers)
    const KIKResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#3CE8D1]" /><span className="font-bold">Кредитных организаций: {calculatedOffers.approved.length}</span></div>
                <Badge variant="outline">Отказные: {calculatedOffers.rejected.length}</Badge>
            </div>

            <Card>
                <CardHeader className="py-3"><span className="text-green-500 font-bold">ОДОБРЕННЫЕ: {calculatedOffers.approved.length}</span></CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Банк</th><th className="text-center p-2">Ставка %</th><th className="text-center p-2">Выбрать</th></tr></thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2"><div className="flex items-center gap-2"><div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs", bank.individual ? "bg-[#3CE8D1] text-[#0a1628]" : "bg-blue-600")}>{bank.name[0]}</div><span className="font-medium">{bank.name}</span></div></td>
                                    <td className="p-2 text-center">{bank.creditRate > 0 ? `от ${bank.creditRate}%` : "Индивидуально"}</td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {calculatedOffers.rejected.length > 0 && (
                <Card>
                    <CardHeader className="py-3"><span className="text-red-500 font-bold">ОТКАЗНЫЕ (стоп-факторы): {calculatedOffers.rejected.length}</span></CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Банк</th><th className="text-left p-2">Причина</th></tr></thead>
                            <tbody>{calculatedOffers.rejected.map((item, i) => (<tr key={i} className="border-t"><td className="p-2"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{item.bank}</div></td><td className="p-2 text-red-400 text-xs">- {item.reason}</td></tr>))}</tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-muted-foreground">Приведённые расчёты являются предварительными.</p>
            <div className="flex justify-end"><Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">СОЗДАТЬ ЗАЯВКУ</Button></div>
        </div>
    )

    // Express Results (uses calculatedOffers)
    const ExpressResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#3CE8D1]" /><span className="font-bold">Кредитных организаций: {calculatedOffers.approved.length}</span></div>
                <Badge variant="outline">Отказные: {calculatedOffers.rejected.length}</Badge>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Банк</th><th className="text-center p-2">Ставка</th><th className="text-center p-2">Выбрать</th></tr></thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">{bank.name[0]}</div><span className="font-medium">{bank.name}</span></div></td>
                                    <td className="p-2 text-center">{bank.creditRate > 0 ? `от ${bank.creditRate}% годовых` : "Индивидуально"}</td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">Приведённые расчёты являются предварительными.</p>
            <div className="flex justify-end"><Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">СОЗДАТЬ ЗАЯВКУ</Button></div>
        </div>
    )

    // Factoring Results (uses calculatedOffers)
    const FactoringResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#3CE8D1]" /><span className="font-bold">Факторинговых компаний: {calculatedOffers.approved.length}</span></div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs"><tr><th className="text-left p-2">Компания</th><th className="text-center p-2">Условия</th><th className="text-center p-2">Выбрать</th></tr></thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2 font-medium">{bank.name}{bank.individual && <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд.</Badge>}</td>
                                    <td className="p-2 text-center">{bank.individual ? "Индивидуальные условия" : "Стандартные условия"}</td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">Приведённые расчёты стоимости являются предварительными и не являются публичной офертой.</p>
            <div className="flex justify-end"><Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">СОЗДАТЬ ЗАЯВКУ</Button></div>
        </div>
    )

    // Insurance Results (uses calculatedOffers)
    const InsuranceResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <h2 className="text-xl font-bold">Результат расчета страхования</h2>
                <Badge variant="default" className="bg-green-600">Предложений: {calculatedOffers.approved.length}</Badge>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <span className="text-muted-foreground">Параметры:</span>
                <span className="ml-2">Вид: <strong className="text-[#3CE8D1]">{insuranceCategory}</strong></span>
                <span className="ml-4">Продукт: <strong>{insuranceProduct}</strong></span>
                <span className="ml-4">Сумма: <strong>{(insuranceAmount ?? 0).toLocaleString("ru-RU")} ₽</strong></span>
                <span className="ml-4">Срок: <strong>{insuranceTerm} мес.</strong></span>
            </div>

            <Card>
                <CardHeader className="py-3">
                    <span className="text-green-500 font-bold">СТРАХОВЫЕ КОМПАНИИ: {calculatedOffers.approved.length}</span>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs">
                            <tr>
                                <th className="text-left p-2">Компания</th>
                                <th className="text-center p-2">Ставка</th>
                                <th className="text-center p-2">Премия</th>
                                <th className="text-center p-2">Скорость</th>
                                <th className="text-center p-2">Выбрать</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => {
                                // Calculate insurance premium (estimate 1-5% of amount)
                                const premiumRate = bank.individual ? 0 : (bank.bgRate || 2.5)
                                const premium = (insuranceAmount ?? 0) * premiumRate / 100
                                return (
                                    <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                        <td className="p-2">
                                            <span className="font-medium">{bank.name}</span>
                                            {bank.individual && <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд. условия</Badge>}
                                        </td>
                                        <td className="p-2 text-center">{bank.individual ? "Индив." : `${premiumRate.toFixed(1)}%`}</td>
                                        <td className="p-2 text-center text-[#3CE8D1]">{bank.individual ? "По запросу" : `${premium.toLocaleString("ru-RU")} ₽`}</td>
                                        <td className="p-2 text-center"><SpeedBadge speed={bank.speed} /></td>
                                        <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">Приведенные расчеты являются предварительными и не являются публичной офертой.</p>
            <div className="flex justify-end">
                <Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                    СОЗДАТЬ ЗАЯВКУ
                </Button>
            </div>
        </div>
    )

    // Leasing Results (uses calculatedOffers)
    const LeasingResultsView = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={backToForm}><ArrowLeft className="h-4 w-4 mr-2" />Назад</Button>
                <h2 className="text-xl font-bold">Результат расчета лизинга</h2>
                <Badge variant="default" className="bg-green-600">Предложений: {calculatedOffers.approved.length}</Badge>
            </div>

            <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <span className="text-muted-foreground">Параметры:</span>
                <span className="ml-2">Тип: <strong className="text-[#3CE8D1]">{leasingCreditType || "Не указан"}</strong></span>
                <span className="ml-4">Сумма: <strong>{(leasingAmount ?? 0).toLocaleString("ru-RU")} ₽</strong></span>
                {leasingEndDate && <span className="ml-4">Дата окончания: <strong>{leasingEndDate}</strong></span>}
            </div>

            <Card>
                <CardHeader className="py-3">
                    <span className="text-green-500 font-bold">ЛИЗИНГОВЫЕ КОМПАНИИ: {calculatedOffers.approved.length}</span>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs">
                            <tr>
                                <th className="text-left p-2">Компания</th>
                                <th className="text-center p-2">Условия</th>
                                <th className="text-center p-2">Скорость</th>
                                <th className="text-center p-2">Выбрать</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculatedOffers.approved.map((bank, i) => (
                                <tr key={i} className={cn("border-t", bank.individual && "bg-[#3CE8D1]/10")}>
                                    <td className="p-2">
                                        <span className="font-medium">{bank.name}</span>
                                        {bank.individual && <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд. условия</Badge>}
                                    </td>
                                    <td className="p-2 text-center">{bank.individual ? "Индивидуальные условия" : "Стандартные условия"}</td>
                                    <td className="p-2 text-center"><SpeedBadge speed={bank.speed} /></td>
                                    <td className="p-2 text-center"><Checkbox checked={selectedOffers.has(i)} onCheckedChange={() => toggleOffer(i)} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">Приведенные расчеты являются предварительными и не являются публичной офертой.</p>
            <div className="flex justify-end">
                <Button onClick={handleCreateApplication} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                    СОЗДАТЬ ЗАЯВКУ
                </Button>
            </div>
        </div>
    )

    // Show results if calculated
    if (showResults === "tz") return <TZResultsView />
    if (showResults === "bg") return <BGResultsView />
    if (showResults === "kik") return <KIKResultsView />
    if (showResults === "express") return <ExpressResultsView />
    if (showResults === "factoring") return <FactoringResultsView />
    if (showResults === "leasing") return <LeasingResultsView />
    if (showResults === "insurance") return <InsuranceResultsView />

    // =============================================================================
    // MAIN FORM VIEW
    // =============================================================================

    // Handle product card click
    const handleProductSelect = (productId: string) => {
        setActiveTab(productId)
    }

    // Back to product selection
    const backToProducts = () => {
        setActiveTab(null)
        setShowResults(null)
    }

    // =============================================================================
    // PRODUCT CARDS VIEW (Initial selection)
    // =============================================================================
    if (!activeTab && !showResults) {
        return (
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-[#3CE8D1]">
                        Калькулятор продуктов
                    </h1>
                    <p className="text-muted-foreground">
                        Выберите продукт для создания заявки
                    </p>
                </div>

                {/* Product Cards Grid - Professional dark theme */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {productCards.map((product) => (
                        <Card
                            key={product.id}
                            className="group cursor-pointer bg-[#0f1d32] border border-[#2a3a5c] hover:border-[#3CE8D1] transition-all duration-200"
                            onClick={() => handleProductSelect(product.id)}
                        >
                            <CardContent className="p-5 text-center space-y-3">
                                {/* Icon container - professional dark style */}
                                <div className="w-12 h-12 mx-auto rounded-lg bg-[#1a2942] border border-[#2a3a5c] flex items-center justify-center group-hover:border-[#3CE8D1]/50 group-hover:bg-[#3CE8D1]/10 transition-all">
                                    <product.icon className="h-6 w-6 text-[#3CE8D1]" />
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-sm text-white group-hover:text-[#3CE8D1] transition-colors">
                                    {product.label}
                                </h3>

                                {/* Description */}
                                <p className="text-xs text-[#94a3b8] leading-relaxed">
                                    {product.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-muted-foreground">
                    Приведенные расчеты стоимости являются предварительными и не являются публичной офертой.
                </p>
            </div>
        )
    }

    // =============================================================================
    // PRODUCT FORM VIEW (After selecting a product)
    // =============================================================================

    return (
        <div className="space-y-6">
            {/* Back button + Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={backToProducts} className="h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-[#3CE8D1]">
                        {productCards.find(p => p.id === activeTab)?.label || 'Калькулятор'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {productCards.find(p => p.id === activeTab)?.description || 'Заполните форму'}
                    </p>
                </div>
            </div>

            <Tabs value={activeTab || 'bg'} onValueChange={setActiveTab} className="w-full">
                {/* Hidden tabs - navigation via cards instead */}
                <TabsList className="hidden">
                    {productTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                    ))}
                </TabsList>

                {/* TAB 1: TENDER LOAN */}
                <TabsContent value="tz" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Тендерный займ (ТЗ)</CardTitle>
                            <p className="text-sm text-muted-foreground">Заполните параметры для расчёта</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* Federal Law */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Федеральный закон *</Label>
                                <div className="flex flex-wrap gap-3">
                                    {[["44", "44-ФЗ"], ["223", "223-ФЗ"], ["615", "615 ПП"]].map(([val, label]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setFederalLaw(val)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                                federalLaw === val
                                                    ? "bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] shadow-lg shadow-[#3CE8D1]/20"
                                                    : "bg-[#1a2942] text-white border border-[#3CE8D1]/40 hover:border-[#3CE8D1] hover:bg-[#1a2942]/80"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notice and Lot Numbers */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">№ извещения</Label>
                                    <Input value={noticeNumber} onChange={e => setNoticeNumber(e.target.value)} placeholder="Введите номер" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">№ лота</Label>
                                    <Input value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="Введите номер" />
                                </div>
                            </div>

                            {/* Supplier Method */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Способ определения поставщика</Label>
                                <RadioGroup defaultValue="auction" className="flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2"><RadioGroupItem value="auction" id="auction" /><Label htmlFor="auction" className="cursor-pointer">Электронный аукцион</Label></div>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other" className="cursor-pointer">Иное</Label></div>
                                </RadioGroup>
                            </div>

                            {/* Amount */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Сумма запрашиваемого займа *</Label>
                                <Input type="text" inputMode="decimal" value={formatInputNumber(amount)} onChange={e => setAmount(parseInputNumber(e.target.value))} placeholder="1 000 000" className="text-lg" />
                            </div>

                            {/* Platform and Deadline */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Электронная площадка</Label>
                                    <Select value={platform} onValueChange={setPlatform}>
                                        <SelectTrigger><SelectValue placeholder="Выберите площадку" /></SelectTrigger>
                                        <SelectContent>{["ЕЭТП", "РТС-тендер", "Сбербанк-АСТ", "ЭТП НЭП", "Газпром", "Другая"].map((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Крайний срок подачи заявки</Label>
                                    <Input type="datetime-local" />
                                </div>
                            </div>

                            {/* Contracts */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Контракты 44-ФЗ</Label>
                                    <Input type="text" inputMode="numeric" value={formatInputNumber(contracts44)} onChange={e => setContracts44(parseInputNumber(e.target.value))} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Контракты 223-ФЗ</Label>
                                    <Input type="text" inputMode="numeric" value={formatInputNumber(contracts223)} onChange={e => setContracts223(parseInputNumber(e.target.value))} placeholder="0" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#2a3a5c]">
                                {!getValidation("tz").valid && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Заполните обязательные поля: {getValidation("tz").errors.join(", ")}
                                    </p>
                                )}
                                <div className="flex gap-4">
                                    <Button
                                        onClick={() => handleCalculateWithValidation("tz")}
                                        disabled={isSubmitting || !getValidation("tz").valid}
                                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        РАССЧИТАТЬ
                                    </Button>
                                    <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: BG - Premium Redesign */}
                <TabsContent value="bg" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        {/* Premium Header with Gradient */}
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <FileText className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Банковская гарантия
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Заполните параметры для расчёта стоимости гарантии</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Section 1: Тип гарантии */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Тип гарантии</Label>
                                </div>
                                <Select value={bgType} onValueChange={setBgType}>
                                    <SelectTrigger className="h-12 bg-[#1a2942]/50 border-[#2a3a5c]/50 hover:border-[#3CE8D1]/50 transition-colors">
                                        <SelectValue placeholder="Выберите тип гарантии" />
                                    </SelectTrigger>
                                    <SelectContent>{BG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>

                            {/* Section 2: Федеральный закон - Modern Pills */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Федеральный закон</Label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {[["44", "44-ФЗ"], ["223", "223-ФЗ"], ["615", "615-ПП"], ["kbg", "КБГ"], ["275", "275-ФЗ"]].map(([val, label]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setFederalLaw(val)}
                                            className={cn(
                                                "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                                                federalLaw === val
                                                    ? "bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] shadow-lg shadow-[#3CE8D1]/20"
                                                    : "bg-[#1a2942] text-white border border-[#3CE8D1]/40 hover:border-[#3CE8D1] hover:bg-[#1a2942]/80"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Данные закупки */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Search className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Данные закупки</span>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">№ извещения / № лота</Label>
                                        <Input
                                            placeholder="Введите номер закупки"
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50"
                                        />
                                        <button className="text-xs text-[#3CE8D1] hover:text-[#2fd4c0] transition-colors">
                                            Закрытые торги →
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Сумма БГ, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={formatInputNumber(amount)}
                                            onChange={e => setAmount(parseInputNumber(e.target.value))}
                                            placeholder="1 000 000"
                                            className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Сроки */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Calendar className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Сроки гарантии</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Дата начала</Label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Дата окончания</Label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок (дней)</Label>
                                        <Input
                                            type="number"
                                            placeholder="88"
                                            value={termDays ?? ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, "")
                                                setTermDays(val ? parseInt(val) : undefined)
                                            }}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Дополнительные опции */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-4 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-3">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Settings className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Дополнительные параметры</span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1d32]/50 border border-[#2a3a5c]/30">
                                        <div className="flex items-center gap-3">
                                            <Switch checked={hasAdvance} onCheckedChange={setHasAdvance} />
                                            <Label className="cursor-pointer text-sm text-[#94a3b8]">Наличие авансирования</Label>
                                        </div>
                                        {hasAdvance && (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="w-20 h-9 text-center bg-[#1a2942]/50 border-[#3CE8D1]/30"
                                                    placeholder="%"
                                                    value={formatInputNumber(advancePercent)}
                                                    onChange={e => setAdvancePercent(parseInputNumber(e.target.value))}
                                                />
                                                <span className="text-sm text-[#94a3b8]">%</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1d32]/50 border border-[#2a3a5c]/30">
                                        <div className="flex items-center gap-3">
                                            <Switch checked={hasCustomerTemplate} onCheckedChange={setHasCustomerTemplate} />
                                            <Label className="cursor-pointer text-sm text-[#94a3b8]">Шаблон заказчика</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: Опыт работы */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <TrendingUp className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Опыт исполнения контрактов</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Контракты 44-ФЗ</Label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatInputNumber(contracts44)}
                                            onChange={e => setContracts44(parseInputNumber(e.target.value))}
                                            placeholder="Количество"
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Контракты 223-ФЗ</Label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatInputNumber(contracts223)}
                                            onChange={e => setContracts223(parseInputNumber(e.target.value))}
                                            placeholder="Количество"
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions - Premium Style */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                {!getValidation("bg").valid && (
                                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">
                                            Заполните обязательные поля: {getValidation("bg").errors.join(", ")}
                                        </p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <Button
                                        onClick={() => handleCalculateWithValidation("bg")}
                                        disabled={isSubmitting || !getValidation("bg").valid}
                                        className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:shadow-none disabled:cursor-not-allowed transition-all"
                                    >
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        РАССЧИТАТЬ СТОИМОСТЬ
                                    </Button>
                                    <Button variant="outline" onClick={clearBgForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: KIK - Premium Redesign */}
                <TabsContent value="kik" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <Landmark className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Кредит на исполнение контракта
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Заполните параметры для расчёта кредита</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Тип продукта */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Тип продукта</Label>
                                </div>
                                <Select value={kikType} onValueChange={setKikType}>
                                    <SelectTrigger className="h-12 bg-[#1a2942]/50 border-[#2a3a5c]/50 hover:border-[#3CE8D1]/50 transition-colors">
                                        <SelectValue placeholder="Выберите тип" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Кредит на исполнение контракта</SelectItem>
                                        <SelectItem value="loan">Займ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Данные контракта */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <FileText className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Данные контракта</span>
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">№ извещения/контракта</Label>
                                        <Input placeholder="Введите номер" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">№ лота</Label>
                                        <Input placeholder="Введите номер" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Цена контракта, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(contractPrice)} onChange={e => setContractPrice(parseInputNumber(e.target.value))} placeholder="1 000 000" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок контракта с</Label>
                                        <Input
                                            type="date"
                                            value={contractDateFrom}
                                            onChange={e => setContractDateFrom(e.target.value)}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">по</Label>
                                        <Input
                                            type="date"
                                            value={contractDateTo}
                                            onChange={e => setContractDateTo(e.target.value)}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок (дней)</Label>
                                        <div className="h-11 px-4 rounded-lg bg-gradient-to-r from-[#3CE8D1]/10 to-transparent border border-[#3CE8D1]/20 flex items-center">
                                            <span className="text-lg font-bold text-[#3CE8D1]">
                                                {contractDateFrom && contractDateTo
                                                    ? Math.max(0, Math.ceil((new Date(contractDateTo).getTime() - new Date(contractDateFrom).getTime()) / (1000 * 60 * 60 * 24)))
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Параметры кредита */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <CreditCard className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Параметры кредита</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f1d32]/50 border border-[#2a3a5c]/30">
                                    <div className="flex items-center gap-3">
                                        <Switch checked={hasAdvance} onCheckedChange={setHasAdvance} />
                                        <Label className="cursor-pointer text-sm text-[#94a3b8]">Наличие авансирования</Label>
                                    </div>
                                    {hasAdvance && (
                                        <div className="flex items-center gap-2">
                                            <Input type="text" inputMode="numeric" className="w-20 h-9 text-center bg-[#1a2942]/50 border-[#3CE8D1]/30" placeholder="%" value={formatInputNumber(advancePercent)} onChange={e => setAdvancePercent(parseInputNumber(e.target.value))} />
                                            <span className="text-sm text-[#94a3b8]">%</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Сумма кредита, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(creditAmount)} onChange={e => setCreditAmount(parseInputNumber(e.target.value))} placeholder="500 000" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок кредита с</Label>
                                        <Input type="date" value={contractDateFrom} onChange={e => setContractDateFrom(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">по</Label>
                                        <Input type="date" value={contractDateTo} onChange={e => setContractDateTo(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок (дней)</Label>
                                        <div className="h-11 px-4 rounded-lg bg-gradient-to-r from-[#3CE8D1]/10 to-transparent border border-[#3CE8D1]/20 flex items-center">
                                            <span className="text-lg font-bold text-[#3CE8D1]">
                                                {contractDateFrom && contractDateTo ? Math.max(0, Math.ceil((new Date(contractDateTo).getTime() - new Date(contractDateFrom).getTime()) / 86400000)) : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Опыт и выполнение */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <TrendingUp className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Опыт и выполнение</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Контракты 44-ФЗ</Label>
                                        <Input type="text" inputMode="numeric" placeholder="Количество" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Контракты 223-ФЗ</Label>
                                        <Input type="text" inputMode="numeric" placeholder="Количество" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-[#0f1d32]/50 border border-[#2a3a5c]/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm text-[#94a3b8]">Процент выполнения: <span className="text-[#3CE8D1] font-bold">{completionPercent}%</span></Label>
                                        <div className="flex items-center gap-2">
                                            <Checkbox checked={ignoreCompletion} onCheckedChange={c => setIgnoreCompletion(c as boolean)} />
                                            <span className="text-sm text-[#94a3b8]">Не учитывать</span>
                                        </div>
                                    </div>
                                    {!ignoreCompletion && <Slider value={[completionPercent ?? 0]} onValueChange={v => setCompletionPercent(v[0])} max={100} step={1} className="py-2" />}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                {!getValidation("kik").valid && (
                                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">Заполните: {getValidation("kik").errors.join(", ")}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("kik")} disabled={isSubmitting || !getValidation("kik").valid} className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:shadow-none disabled:cursor-not-allowed transition-all">
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        РАССЧИТАТЬ СТОИМОСТЬ
                                    </Button>
                                    <Button variant="outline" onClick={clearKikForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: CREDIT - Premium Redesign */}
                <TabsContent value="express" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <CreditCard className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Кредит
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Заполните параметры для расчёта кредита</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Тип кредита */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Тип кредита</Label>
                                </div>
                                <Select value={creditType} onValueChange={setCreditType}>
                                    <SelectTrigger className="h-12 bg-[#1a2942]/50 border-[#2a3a5c]/50 hover:border-[#3CE8D1]/50 transition-colors">
                                        <SelectValue placeholder="Выберите тип кредита" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CREDIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Параметры кредита */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Wallet className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Параметры кредита</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Сумма кредита, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(amount)} onChange={e => setAmount(parseInputNumber(e.target.value))} placeholder="500 000" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок кредита с</Label>
                                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">по</Label>
                                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок (дней)</Label>
                                        <Input
                                            type="number"
                                            placeholder="90"
                                            value={termDays ?? ""}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, "")
                                                setTermDays(val ? parseInt(val) : undefined)
                                            }}
                                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                {!getValidation("express").valid && (
                                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">Заполните: {getValidation("express").errors.join(", ")}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("express")} disabled={isSubmitting || !getValidation("express").valid} className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:shadow-none disabled:cursor-not-allowed transition-all">
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        РАССЧИТАТЬ СТОИМОСТЬ
                                    </Button>
                                    <Button variant="outline" onClick={clearCreditForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: FACTORING - Premium Redesign */}
                <TabsContent value="factoring" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <HandCoins className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Факторинг
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Финансирование под уступку денежного требования</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Контрагент */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Контрагент</Label>
                                </div>
                                <p className="text-sm text-[#94a3b8]">
                                    Данные по дебитору будут уточнены менеджером после отправки заявки.
                                </p>
                            </div>

                            {/* Параметры финансирования */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Wallet className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Параметры финансирования</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Тип факторинга <span className="text-[#3CE8D1]">*</span></Label>
                                    <Select value={factoringType} onValueChange={setFactoringType}>
                                        <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                            <SelectValue placeholder="Выберите тип факторинга" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FACTORING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Сумма финансирования, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                        <Input type="text" inputMode="decimal" value={formatInputNumber(financingAmount)} onChange={e => setFinancingAmount(parseInputNumber(e.target.value))} placeholder="0,00" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок финансирования</Label>
                                        <Input type="date" value={financingDate} onChange={e => setFinancingDate(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                </div>
                            </div>

                            {/* Вид контракта */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Вид контракта</Label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {[["gov", "Госторги"], ["other", "Иные контракты"]].map(([val, label]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setContractType(val)}
                                            className={cn(
                                                "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                                                contractType === val
                                                    ? "bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] shadow-lg shadow-[#3CE8D1]/20"
                                                    : "bg-[#1a2942]/50 text-[#94a3b8] border border-[#2a3a5c]/50 hover:border-[#3CE8D1]/30 hover:text-white"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Данные контракта */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <FileText className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Данные контракта</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">№ извещения</Label>
                                        <Input value={noticeNumber} onChange={e => setNoticeNumber(e.target.value)} placeholder="Введите номер" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">№ лота</Label>
                                        <Input value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="Введите номер" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">НМЦ</Label>
                                        <Input type="text" inputMode="decimal" value={formatInputNumber(nmc)} onChange={e => setNmc(parseInputNumber(e.target.value))} placeholder="Введите сумму" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Валюта</Label>
                                        <div className="h-11 px-4 rounded-lg bg-[#0f1d32]/50 border border-[#2a3a5c]/30 flex items-center text-[#94a3b8]">руб.</div>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок контракта с</Label>
                                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">по</Label>
                                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Срок (дней)</Label>
                                        <div className="h-11 px-4 rounded-lg bg-gradient-to-r from-[#3CE8D1]/10 to-transparent border border-[#3CE8D1]/20 flex items-center">
                                            <span className="text-lg font-bold text-[#3CE8D1]">
                                                {dateFrom && dateTo ? Math.max(0, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000)) : "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Объём и условия */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <TrendingUp className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Объём и условия</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Объём отгрузки, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(shipmentVolume)} onChange={e => setShipmentVolume(parseInputNumber(e.target.value))} placeholder="1 000 000" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Отсрочка платежа (дней) <span className="text-[#3CE8D1]">*</span></Label>
                                        <Input type="text" inputMode="numeric" value={formatInputNumber(paymentDelay)} onChange={e => setPaymentDelay(parseInputNumber(e.target.value))} placeholder="30" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">ИНН Заказчика</Label>
                                        <Input maxLength={12} value={customerInn} onChange={e => setCustomerInn(e.target.value)} placeholder="Введите ИНН" className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                {!getValidation("factoring").valid && (
                                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">Заполните: {getValidation("factoring").errors.join(", ")}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("factoring")} disabled={isSubmitting || !getValidation("factoring").valid} className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:shadow-none disabled:cursor-not-allowed transition-all">
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ
                                    </Button>
                                    <Button variant="outline" onClick={clearFactoringForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: LEASING - Premium Redesign */}
                <TabsContent value="leasing" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <Building2 className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Лизинг
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Финансовая аренда оборудования и транспорта</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Параметры лизинга */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <CreditCard className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Параметры лизинга</span>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Тип предмета лизинга <span className="text-[#3CE8D1]">*</span></Label>
                                    <Select value={leasingCreditType} onValueChange={setLeasingCreditType}>
                                        <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                            <SelectValue placeholder="Выберите тип" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LEASING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Сумма лизинга, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(leasingAmount)} onChange={e => setLeasingAmount(parseInputNumber(e.target.value))} placeholder="Введите сумму" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Дата окончания</Label>
                                    <Input type="date" value={leasingEndDate} onChange={e => setLeasingEndDate(e.target.value)} className="h-11 max-w-[200px] bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50 text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                <div className="flex items-center gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("leasing")} disabled={isSubmitting} className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 transition-all disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:cursor-not-allowed">
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ
                                    </Button>
                                    <Button variant="outline" onClick={clearLeasingForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                                <p className="text-xs text-[#64748b] mt-4">Приведенные расчеты стоимости являются предварительными и не являются публичной офертой.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: INSURANCE - Premium Redesign */}
                <TabsContent value="insurance" className="mt-6">
                    <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                        <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                            <div className="relative flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                    <FileText className="h-7 w-7 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                        Страхование
                                    </CardTitle>
                                    <p className="text-sm text-[#94a3b8] mt-1">Страхование СМР, имущества, персонала</p>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                            {/* Вид страхования */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-6 rounded-full bg-[#3CE8D1]" />
                                    <Label className="text-base font-semibold text-white">Вид страхования</Label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {INSURANCE_CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => { setInsuranceCategory(cat); setInsuranceProduct(""); }}
                                            className={cn(
                                                "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
                                                insuranceCategory === cat
                                                    ? "bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] shadow-lg shadow-[#3CE8D1]/20"
                                                    : "bg-[#1e3a5f] text-white border border-[#3CE8D1]/30 hover:border-[#3CE8D1]/50 hover:bg-[#1e3a5f]/80"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Параметры страхования */}
                            <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                    <Settings className="h-4 w-4 text-[#3CE8D1]" />
                                    <span className="text-sm font-medium text-white">Параметры страхования</span>
                                </div>
                                {insuranceCategory && (
                                    <div className="space-y-2">
                                        <Label className="text-sm text-[#94a3b8]">Страховой продукт <span className="text-[#3CE8D1]">*</span></Label>
                                        <Select value={insuranceProduct} onValueChange={setInsuranceProduct}>
                                            <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                                <SelectValue placeholder="Выберите продукт" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INSURANCE_PRODUCTS[insuranceCategory as keyof typeof INSURANCE_PRODUCTS]?.map(p =>
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Сумма страхования, ₽ <span className="text-[#3CE8D1]">*</span></Label>
                                    <Input type="text" inputMode="decimal" value={formatInputNumber(insuranceAmount)} onChange={e => setInsuranceAmount(parseInputNumber(e.target.value))} placeholder="0,00" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-[#94a3b8]">Срок договора (месяцев) <span className="text-[#3CE8D1]">*</span></Label>
                                    <Select value={insuranceTerm ? String(insuranceTerm) : ""} onValueChange={v => setInsuranceTerm(+v)}>
                                        <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                            <SelectValue placeholder="Выберите срок" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(m =>
                                                <SelectItem key={m} value={String(m)}>{m} мес.</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm text-[#94a3b8]">Страховые компании</Label>
                                <div className="flex flex-wrap gap-2">
                                    {INSURANCE_COMPANIES.map((company) => (
                                        <span key={company} className="text-xs px-2.5 py-1 rounded-full bg-[#3CE8D1]/10 text-[#3CE8D1] border border-[#3CE8D1]/30">
                                            {company}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-[#2a3a5c]/30">
                                {!getValidation("insurance").valid && (
                                    <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                        <p className="text-sm text-amber-400">Заполните: {getValidation("insurance").errors.join(", ")}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("insurance")} disabled={isSubmitting || !getValidation("insurance").valid} className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:shadow-none disabled:cursor-not-allowed transition-all">
                                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calculator className="h-5 w-5 mr-2" />}
                                        РАСЧЕТ СТРАХОВАНИЯ
                                    </Button>
                                    <Button variant="outline" onClick={clearInsuranceForm} className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all">
                                        Очистить форму
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB: INTERNATIONAL PAYMENTS - Premium Redesign */}
                <TabsContent value="ved" className="mt-6">
                    {selectedApplication && selectedApplication.type === "ved" ? (
                        /* Application Detail View with Breadcrumbs */
                        <div className="space-y-4">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm">
                                <Button variant="link" className="p-0 h-auto text-[#3CE8D1] font-medium" onClick={() => setSelectedApplication(null)}>
                                    ← Международные платежи
                                </Button>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">ВЭД</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-medium">Заявка #{selectedApplication.id}</span>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Left Column - Application Info */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Header Card with Status */}
                                    <Card className="border-l-4 border-l-[#3CE8D1]">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h2 className="text-lg font-bold text-foreground">Заявка #{selectedApplication.id}</h2>
                                                    <p className="text-sm text-muted-foreground">Международный платёж</p>
                                                </div>
                                                <Badge className={cn("text-white", getStatusInfo(selectedApplication.status).color)}>
                                                    {getStatusInfo(selectedApplication.status).label}
                                                </Badge>
                                            </div>

                                            {/* Key Info Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Сумма</p>
                                                    <p className="font-medium text-[#3CE8D1]">{formatNumber(selectedApplication.amount || 0)} {selectedApplication.currency}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Страна</p>
                                                    <p className="font-medium">{selectedApplication.country}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Банк</p>
                                                    <p className="font-medium">{selectedApplication.bank}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Дата создания</p>
                                                    <p className="font-medium text-[#3CE8D1]">{selectedApplication.createdAt.split(" ")[0]}</p>
                                                </div>
                                                {selectedApplication.purpose && (
                                                    <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                                                        <p className="text-xs text-muted-foreground mb-1">Цель платежа</p>
                                                        <p className="font-medium">{selectedApplication.purpose}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Status Message Card */}
                                    <Card className="bg-muted/20">
                                        <CardContent className="p-4 text-center">
                                            <CheckCircle2 className="h-10 w-10 mx-auto text-[#3CE8D1]/50 mb-2" />
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Заявка готова к отправке
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Менеджер свяжется с вами для уточнения деталей
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Actions Card */}
                                    <Card>
                                        <CardContent className="p-4 space-y-3">
                                            <Button
                                                onClick={() => sendApplication(selectedApplication)}
                                                className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-medium"
                                            >
                                                ОТПРАВИТЬ ЗАЯВКУ
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => deleteApplication(selectedApplication)}
                                            >
                                                Удалить заявку
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column - Chat */}
                                <div className="lg:col-span-3">
                                    <ApplicationChat
                                        applicationId={selectedApplication.id}
                                        className="h-[500px] lg:h-[600px]"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Form + Banks List */
                        <div className="space-y-6">
                            <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                                <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                                    <div className="relative flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                                            <TrendingUp className="h-7 w-7 text-[#3CE8D1]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                                Международные платежи
                                            </CardTitle>
                                            <p className="text-sm text-[#94a3b8] mt-1">ВЭД и международные переводы</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6 space-y-8 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-5">
                                    {/* Параметры платежа */}
                                    <div className="p-5 rounded-2xl bg-[#1a2942]/30 border border-[#2a3a5c]/30 space-y-5 [@media(max-height:820px)]:p-4 [@media(max-height:820px)]:space-y-4">
                                        <div className="flex items-center gap-2 pb-3 border-b border-[#2a3a5c]/30">
                                            <Wallet className="h-4 w-4 text-[#3CE8D1]" />
                                            <span className="text-sm font-medium text-white">Параметры платежа</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm text-[#94a3b8]">Сумма платежа <span className="text-[#3CE8D1]">*</span></Label>
                                                <Input type="text" inputMode="decimal" value={formatInputNumber(amount)} onChange={e => setAmount(parseInputNumber(e.target.value))} placeholder="100 000" className="h-11 text-lg font-medium bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm text-[#94a3b8]">Валюта <span className="text-[#3CE8D1]">*</span></Label>
                                                <Select value={vedCurrency} onValueChange={setVedCurrency}>
                                                    <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                                        <SelectValue placeholder="Выберите валюту" />
                                                    </SelectTrigger>
                                                    <SelectContent>
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
                                            <Label className="text-sm text-[#94a3b8]">Страна назначения <span className="text-[#3CE8D1]">*</span></Label>
                                            <Select value={vedCountry} onValueChange={setVedCountry}>
                                                <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                                    <SelectValue placeholder="Выберите страну" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm text-[#94a3b8]">Цель платежа</Label>
                                            <Textarea value={vedPurpose} onChange={e => setVedPurpose(e.target.value)} placeholder="Описание назначения платежа" className="min-h-[100px] bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50" />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-6 border-t border-[#2a3a5c]/30">
                                        <div className="flex items-center gap-4">
                                            <Button 
                                                onClick={() => createVedApplication()}
                                                disabled={isSubmitting}
                                                className="h-12 px-8 border-2 border-[#3CE8D1] bg-transparent text-[#3CE8D1] font-semibold hover:bg-[#3CE8D1] hover:text-[#0a1628] transition-all disabled:bg-[#2a3a5c] disabled:text-[#64748b] disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                        Отправка...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-5 w-5 mr-2" />
                                                        ОТПРАВИТЬ ЗАЯВКУ
                                                    </>
                                                )}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                onClick={() => {
                                                    setAmount(undefined)
                                                    setVedCurrency("")
                                                    setVedCountry("")
                                                    setVedPurpose("")
                                                }}
                                                className="h-12 px-6 border-[#2a3a5c]/50 text-[#94a3b8] hover:text-white hover:border-[#3CE8D1]/30 transition-all"
                                            >
                                                Очистить форму
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Banks List for VED */}
                            <Card>
                                <CardHeader><CardTitle>Банки для международных платежей</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">Выберите банк или оставьте заявку на индивидуальный подбор. Всего: {VED_BANKS.length} банков</p>
                                    <div className="rounded-lg border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3">Банк</th>
                                                    <th className="text-left p-3">Рейтинг</th>
                                                    <th className="text-left p-3">Санкции</th>
                                                    <th className="text-left p-3">Валюты</th>
                                                    <th className="text-left p-3">Страны</th>
                                                    <th className="text-left p-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {VED_BANKS.filter(bank => 
                                                    (!vedCurrency || bank.currencies.includes(vedCurrency)) &&
                                                    (!vedCountry || bank.countries.includes(vedCountry))
                                                ).map((bank, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="p-3 font-medium">{bank.name}</td>
                                                        <td className="p-3"><Badge variant="outline">{bank.rating}</Badge></td>
                                                        <td className="p-3"><Badge variant={bank.sanctions === "Да" ? "destructive" : bank.sanctions === "Частично" ? "secondary" : "outline"}>{bank.sanctions}</Badge></td>
                                                        <td className="p-3 text-xs">{bank.currencies.join(", ")}</td>
                                                        <td className="p-3 text-xs">{bank.countries.slice(0, 3).join(", ")}{bank.countries.length > 3 ? "..." : ""}</td>
                                                        <td className="p-3">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="text-[#3CE8D1] border-[#3CE8D1]" 
                                                                onClick={() => createVedApplication(bank.name)}
                                                                disabled={isSubmitting || !amount || !vedCurrency || !vedCountry}
                                                            >
                                                                Выбрать
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* TAB: DEPOSITS */}
                <TabsContent value="deposits" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Депозиты</CardTitle>
                            <p className="text-sm text-muted-foreground">Размещение средств на депозите</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Сумма размещения, ₽ *</Label>
                                <Input type="text" inputMode="decimal" placeholder="10 000 000" className="text-lg" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Срок размещения (дней)</Label>
                                    <Input type="text" inputMode="numeric" placeholder="90" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Тип депозита</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="term">Срочный депозит</SelectItem>
                                            <SelectItem value="demand">До востребования</SelectItem>
                                            <SelectItem value="accumulative">Накопительный</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-[#2a3a5c]">
                                <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8">РАССЧИТАТЬ</Button>
                                <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 6: RKO */}
                <TabsContent value="rko">
                    {selectedApplication && selectedApplication.type === "rko" ? (
                        /* Application Detail View - Clean 2-Column Layout */
                        <div className="space-y-4">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm">
                                <Button variant="link" className="p-0 h-auto text-[#3CE8D1] font-medium" onClick={() => setSelectedApplication(null)}>
                                    ← Мои заявки
                                </Button>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">РКО</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-medium">Заявка #{selectedApplication.id}</span>
                            </div>

                            {/* Main Content Grid - Info + Chat Side by Side */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Left Column - Application Info (2/5 width on large screens) */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Header Card with Status */}
                                    <Card className="border-l-4 border-l-[#3CE8D1]">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h2 className="text-lg font-bold text-foreground">Заявка #{selectedApplication.id}</h2>
                                                    <p className="text-sm text-muted-foreground">Открытие расчётного счёта</p>
                                                </div>
                                                <Badge className={cn("text-white", getStatusInfo(selectedApplication.status).color)}>
                                                    {getStatusInfo(selectedApplication.status).label}
                                                </Badge>
                                            </div>

                                            {/* Key Info Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Банк</p>
                                                    <p className="font-medium">{selectedApplication.bank}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Дата создания</p>
                                                    <p className="font-medium text-[#3CE8D1]">{selectedApplication.createdAt.split(" ")[0]}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                                                    <p className="text-xs text-muted-foreground mb-1">Тариф</p>
                                                    <p className="font-medium">{selectedApplication.tariff || "Стандартный"}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Status Message Card */}
                                    <Card className="bg-muted/20">
                                        <CardContent className="p-4 text-center">
                                            <CheckCircle2 className="h-10 w-10 mx-auto text-[#3CE8D1]/50 mb-2" />
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Заявка готова к отправке
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Документы не требуются
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Actions Card */}
                                    <Card>
                                        <CardContent className="p-4 space-y-3">
                                            <Button
                                                onClick={() => sendApplication(selectedApplication)}
                                                className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-medium"
                                            >
                                                ОТПРАВИТЬ ЗАЯВКУ
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => deleteApplication(selectedApplication)}
                                            >
                                                Удалить заявку
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column - Chat (3/5 width on large screens) */}
                                <div className="lg:col-span-3">
                                    <ApplicationChat
                                        applicationId={selectedApplication.id}
                                        className="h-[500px] lg:h-[600px]"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Banks List */
                        <Card>
                            <CardHeader><CardTitle>РКО (Расчётно-кассовое обслуживание)</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">Всего: {RKO_BANKS.length} банков</p>
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50"><tr><th className="text-left p-3">Банк</th><th className="text-left p-3">Рейтинг</th><th className="text-left p-3">Санкции</th><th className="text-left p-3">Стоимость</th><th className="text-left p-3"></th></tr></thead>
                                        <tbody>
                                            {RKO_BANKS.map((bank, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="p-3 font-medium">{bank.name}</td>
                                                    <td className="p-3"><Badge variant="outline">{bank.rating}</Badge></td>
                                                    <td className="p-3"><Badge variant={bank.sanctions === "Да" ? "destructive" : bank.sanctions === "Частично" ? "secondary" : "outline"}>{bank.sanctions}</Badge></td>
                                                    <td className="p-3 text-green-500 font-medium">{bank.cost}</td>
                                                    <td className="p-3"><Button size="sm" variant="outline" className="text-[#3CE8D1] border-[#3CE8D1]" onClick={() => createRkoApplication(bank.name, "rko")}>Создать заявку</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )
                    }
                </TabsContent>

                {/* TAB 7: SPECACCOUNT */}
                <TabsContent value="specaccount">
                    {selectedApplication && selectedApplication.type === "specaccount" ? (
                        /* Application Detail View - Clean 2-Column Layout */
                        <div className="space-y-4">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm">
                                <Button variant="link" className="p-0 h-auto text-[#3CE8D1] font-medium" onClick={() => setSelectedApplication(null)}>
                                    ← Мои заявки
                                </Button>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">Спецсчёт</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-medium">Заявка #{selectedApplication.id}</span>
                            </div>

                            {/* Main Content Grid - Info + Chat Side by Side */}
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                                {/* Left Column - Application Info (2/5 width on large screens) */}
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Header Card with Status */}
                                    <Card className="border-l-4 border-l-[#4F7DF3]">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h2 className="text-lg font-bold text-foreground">Заявка #{selectedApplication.id}</h2>
                                                    <p className="text-sm text-muted-foreground">Открытие спецсчёта</p>
                                                </div>
                                                <Badge className={cn("text-white", getStatusInfo(selectedApplication.status).color)}>
                                                    {getStatusInfo(selectedApplication.status).label}
                                                </Badge>
                                            </div>

                                            {/* Key Info Grid */}
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Банк</p>
                                                    <p className="font-medium">{selectedApplication.bank}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Дата создания</p>
                                                    <p className="font-medium text-[#4F7DF3]">{selectedApplication.createdAt.split(" ")[0]}</p>
                                                </div>
                                                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                                                    <p className="text-xs text-muted-foreground mb-1">Тариф</p>
                                                    <p className="font-medium">{selectedApplication.tariff || "Стандартный"}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Status Message Card */}
                                    <Card className="bg-muted/20">
                                        <CardContent className="p-4 text-center">
                                            <CheckCircle2 className="h-10 w-10 mx-auto text-[#4F7DF3]/50 mb-2" />
                                            <p className="text-sm font-medium text-foreground mb-1">
                                                Заявка готова к отправке
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Документы не требуются
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Actions Card */}
                                    <Card>
                                        <CardContent className="p-4 space-y-3">
                                            <Button
                                                onClick={() => sendApplication(selectedApplication)}
                                                className="w-full bg-[#4F7DF3] text-white hover:bg-[#3d6ce0] font-medium"
                                            >
                                                ОТПРАВИТЬ ЗАЯВКУ
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() => deleteApplication(selectedApplication)}
                                            >
                                                Удалить заявку
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column - Chat (3/5 width on large screens) */}
                                <div className="lg:col-span-3">
                                    <ApplicationChat
                                        applicationId={selectedApplication.id}
                                        className="h-[500px] lg:h-[600px]"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Applications List */
                        <Card>
                            <CardHeader><CardTitle>Спецсчет</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-medium">Всего заявок: {applications.filter(a => a.type === "specaccount").length}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">Вид страницы:</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8">☰</Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8">▦</Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Сводная таблица по созданным Вами заявкам:</h3>
                                    <div className="flex items-center gap-4 mb-2">
                                        <Input placeholder="Поиск" className="max-w-xs" />
                                        <div className="flex items-center gap-2 ml-auto text-sm">
                                            <span>Выводить на странице:</span>
                                            {[10, 25, 50].map(n => (<Button key={n} variant={n === 10 ? "default" : "outline"} size="sm" className={n === 10 ? "bg-green-500" : ""}>{n}</Button>))}
                                        </div>
                                    </div>
                                    {applications.filter(a => a.type === "specaccount").length === 0 ? (
                                        <div className="rounded-lg border p-4 text-center text-muted-foreground">Заявки не найдены</div>
                                    ) : (
                                        <div className="rounded-lg border overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50">
                                                    <tr>
                                                        <th className="text-left p-3">№ заявки</th>
                                                        <th className="text-left p-3">Дата создания</th>
                                                        <th className="text-left p-3">Банк</th>
                                                        <th className="text-left p-3">Статус заявки</th>
                                                        <th className="text-left p-3"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {applications.filter(a => a.type === "specaccount").map(app => (
                                                        <tr key={app.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedApplication(app)}>
                                                            <td className="p-3 text-[#3CE8D1]">{app.id}</td>
                                                            <td className="p-3">{app.createdAt}</td>
                                                            <td className="p-3">{app.bank}</td>
                                                            <td className="p-3">{getStatusInfo(app.status).label}</td>
                                                            <td className="p-3"><Badge variant="outline">💬</Badge></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-medium mb-2">Сводная таблица банков, в которых Вы можете создать заявку:</h3>
                                    <div className="rounded-lg border overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/50"><tr><th className="text-left p-3">Банк</th><th className="text-left p-3">Создать заявку</th></tr></thead>
                                            <tbody>
                                                {["Альфа-Банк", "Сбербанк", "ВТБ", "Точка", "Промсвязьбанк"].map((bank, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="p-3">{bank}</td>
                                                        <td className="p-3"><Button size="sm" variant="link" className="text-[#3CE8D1] p-0" onClick={() => createRkoApplication(bank, "specaccount")}>Создать заявку</Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                    }
                </TabsContent>

                {/* TAB 8: UNSECURED */}
                <TabsContent value="unsecured">
                    <Card>
                        <CardHeader><CardTitle>Займы без залога</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">* - поля, обязательные для заполнения</p>
                            <div><Label>Сумма займа *</Label><Input type="text" inputMode="decimal" value={formatInputNumber(amount)} onChange={e => setAmount(parseInputNumber(e.target.value))} placeholder="1000,00" /></div>
                            <div className="grid gap-4 md:grid-cols-3"><div><Label>Срок займа с *</Label><Input type="date" /></div><div><Label>по *</Label><Input type="date" /></div><div><Label>дней</Label><Input readOnly /></div></div>
                            <div><Label>ФИО *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" /></div>
                            <div><Label>Телефон *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (123) 456-78-91" /></div>
                            <div><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@mail.com" /></div>
                            <div><Label>Комментарий</Label><Textarea value={comment} onChange={e => setComment(e.target.value)} /></div>
                            <div className="space-y-3"><h4 className="font-medium">Документы</h4>
                                {[
                                    "Карточка компании *",
                                    "Бухбаланс Ф1 и ФР Ф2 на 30.06.2025 *",
                                    "Бухбаланс Ф1 и ФР Ф2 на 30.09.2025 *",
                                    "Бухбаланс Ф1 и ФР Ф2 на 31.12.2023 с квитанцией ИФНС *",
                                    "Бухбаланс Ф1 и ФР Ф2 на 31.12.2024 с квитанцией ИФНС *",
                                    "Бухбаланс Ф1 и ФР Ф2 на 31.12.2025 с квитанцией ИФНС *",
                                    "Реестр контрактов *",
                                    "Паспорт руководителя (все страницы) *",
                                    "Паспорта всех учредителей (все страницы) *",
                                    "Устав *",
                                    "Решение/протокол о назначении руководителя *",
                                    "Договор аренды с актом приема-передачи / свидетельство о праве собственности *",
                                    "Доп. документы"
                                ].map((doc, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg"><span className="text-sm">{doc}</span><div className="flex items-center gap-4"><Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />ЗАГРУЗИТЬ</Button><span className="text-xs text-muted-foreground">Всего файлов: 0</span></div></div>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">ПОДПИСАТЬ</Button>
                                <Button variant="outline">ОЧИСТИТЬ ФОРМУ</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent >
            </Tabs >
        </div >
    )
}

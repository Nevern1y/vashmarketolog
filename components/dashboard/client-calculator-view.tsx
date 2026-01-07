"use client"

import { useState } from "react"
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
    Wallet, HandCoins, Upload, Loader2, CheckCircle2, XCircle, AlertCircle, ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import { ApplicationChat } from "./application-chat"
import { useApplicationMutations } from "@/hooks/use-applications"
import { useMyCompany } from "@/hooks/use-companies"

// =============================================================================
// BANK DATABASE (Real data used for calculations)
// =============================================================================

const BG_TYPES = [
    "Обеспечение заявки", "Обеспечение исполнения контракта", "Возврат аванса",
    "Гарантийные обязательства", "Гарантии оплаты товара", "Таможенные гарантии", "На возмещение НДС"
]

const LAWS = ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)"]

const CREDIT_TYPES = [
    "Разовый кредит", "Невозобновляемая КЛ (НКЛ)", "Возобновляемая КЛ (ВКЛ)", "Кредит на исполнение контракта"
]

const FACTORING_TYPES = ["Классический факторинг", "Закрытый факторинг", "Закупочный факторинг"]

const INSURANCE_TYPES = {
    personnel: ["Добровольное медицинское страхование (ДМС)", "Страхование критических заболеваний", "Страхование несчастных случаев", "Комплексное страхование в поездках"],
    transport: ["ОСАГО юридических лиц", "Комплексное страхование автопарков", "Страхование специальной техники", "Страхование ответственности перевозчика"],
    property: ["Страхование объектов строительства", "Страхование грузов и перевозок", "Страхование имущества компаний", "Страхование перерывов деятельности"],
    liability: ["Страхование гражданской ответственности", "Страхование опасных объектов", "Страхование профессиональных рисков", "Страхование ответственности за качество"]
}

const TENDER_TYPES = ["Разовое сопровождение", "Тендерное сопровождение под ключ"]

const COUNTRIES = ["Россия", "Австрия", "Германия", "Казахстан", "Китай", "ОАЭ", "США", "Турция", "Узбекистан"]

// Bank database with conditions
const BANKS_DB = [
    { name: "Сбербанк", minAmount: 100000, maxAmount: 500000000, bgRate: 2.5, creditRate: 15, speed: "Низкая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "ВТБ", minAmount: 500000, maxAmount: 300000000, bgRate: 2.8, creditRate: 14.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Альфа-Банк", minAmount: 300000, maxAmount: 200000000, bgRate: 3.0, creditRate: 16, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)"] },
    { name: "Промсвязьбанк", minAmount: 100000, maxAmount: 400000000, bgRate: 2.7, creditRate: 15.5, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Совкомбанк", minAmount: 200000, maxAmount: 150000000, bgRate: 3.2, creditRate: 17, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Газпромбанк", minAmount: 1000000, maxAmount: 1000000000, bgRate: 2.3, creditRate: 13, speed: "Низкая", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Тинькофф", minAmount: 50000, maxAmount: 50000000, bgRate: 4.0, creditRate: 18, speed: "Высокая", laws: ["КБГ (Коммерческие)"] },
    { name: "Открытие", minAmount: 500000, maxAmount: 200000000, bgRate: 2.9, creditRate: 15, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Райффайзен", minAmount: 1000000, maxAmount: 300000000, bgRate: 2.6, creditRate: 14, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Локо-Банк", minAmount: 100000, maxAmount: 100000000, bgRate: 3.5, creditRate: 19, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)"] },
    { name: "МКБ", minAmount: 300000, maxAmount: 250000000, bgRate: 2.8, creditRate: 15.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ"] },
    { name: "Уралсиб", minAmount: 200000, maxAmount: 100000000, bgRate: 3.1, creditRate: 16.5, speed: "Средняя", laws: ["44-ФЗ", "223-ФЗ", "КБГ (Коммерческие)"] },
    { name: "Лидер-Гарант", minAmount: 10000, maxAmount: 999999999, bgRate: 0, creditRate: 0, speed: "Высокая", laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ (615-ПП)", "КБГ (Коммерческие)"], individual: true },
]

// Calculate bank offers based on form data
const calculateOffers = (amount: number, law: string, days: number) => {
    const approved: typeof BANKS_DB = []
    const rejected: { bank: string; reason: string }[] = []

    BANKS_DB.forEach(bank => {
        if (bank.individual) {
            approved.push(bank)
            return
        }

        if (amount < bank.minAmount) {
            rejected.push({ bank: bank.name, reason: `Минимальная сумма ${bank.minAmount.toLocaleString("ru-RU")} ₽` })
        } else if (amount > bank.maxAmount) {
            rejected.push({ bank: bank.name, reason: `Максимальная сумма ${bank.maxAmount.toLocaleString("ru-RU")} ₽` })
        } else if (!bank.laws.includes(law)) {
            rejected.push({ bank: bank.name, reason: `Банк не работает с ${law}` })
        } else {
            approved.push(bank)
        }
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

// RKO/Specaccount Application interface
interface RkoApplication {
    id: number
    bank: string
    createdAt: string
    status: "creating" | "sent" | "approved" | "rejected"
    tariff: string
    type: "rko" | "specaccount"
    messages: { sender: string; text: string; time: string }[]
}

// Initial applications (empty - will be populated from API)
const INITIAL_APPLICATIONS: RkoApplication[] = []

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClientCalculatorView() {
    const [activeTab, setActiveTab] = useState("tz")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResults, setShowResults] = useState<string | null>(null)
    const [selectedOffers, setSelectedOffers] = useState<Set<number>>(new Set())

    // API hooks for real backend integration
    const { createApplication, isLoading: isCreatingApplication } = useApplicationMutations()
    const { company, isLoading: isLoadingCompany } = useMyCompany()

    // RKO/Specaccount applications state
    const [applications, setApplications] = useState<RkoApplication[]>(INITIAL_APPLICATIONS)
    const [selectedApplication, setSelectedApplication] = useState<RkoApplication | null>(null)

    // Shared form state
    const [federalLaw, setFederalLaw] = useState("44")
    const [noticeNumber, setNoticeNumber] = useState("")
    const [lotNumber, setLotNumber] = useState("")
    const [amount, setAmount] = useState(1000000)
    const [platform, setPlatform] = useState("")
    const [contracts44, setContracts44] = useState(0)
    const [contracts223, setContracts223] = useState(0)

    // BG specific
    const [bgType, setBgType] = useState("")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [hasAdvance, setHasAdvance] = useState(false)
    const [advancePercent, setAdvancePercent] = useState(0)
    const [hasCustomerTemplate, setHasCustomerTemplate] = useState(false)

    // KIK specific
    const [kikType, setKikType] = useState("credit")
    const [contractPrice, setContractPrice] = useState(0)
    const [creditAmount, setCreditAmount] = useState(0)
    const [completionPercent, setCompletionPercent] = useState(0)
    const [ignoreCompletion, setIgnoreCompletion] = useState(false)

    // Factoring specific
    const [contractType, setContractType] = useState("gov")
    const [nmc, setNmc] = useState(0)
    const [shipmentVolume, setShipmentVolume] = useState(0)
    const [paymentDelay, setPaymentDelay] = useState(0)
    const [customerInn, setCustomerInn] = useState("")

    // Unsecured loan specific
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("+7")
    const [email, setEmail] = useState("")
    const [comment, setComment] = useState("")

    // Calculated offers result
    const [calculatedOffers, setCalculatedOffers] = useState<{ approved: typeof BANKS_DB; rejected: { bank: string; reason: string }[] }>({ approved: [], rejected: [] })

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

    // Get validation result for current product
    const getValidation = (productType: string) => {
        switch (productType) {
            case "tz": return validateTZ()
            case "bg": return validateBG()
            case "kik": return validateKIK()
            case "express": return validateExpress()
            case "factoring": return validateFactoring()
            case "unsecured": return validateUnsecured()
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
        const law = federalLaw === "44" ? "44-ФЗ" : federalLaw === "223" ? "223-ФЗ" : federalLaw === "615" ? "185-ФЗ (615-ПП)" : "КБГ (Коммерческие)"
        const days = dateFrom && dateTo ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)) : 30
        const offers = calculateOffers(amount, law, days)

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
                default: return "bank_guarantee"
            }
        }

        // Build goscontract_data based on product type
        const buildGoscontractData = () => {
            const baseData: Record<string, unknown> = {
                law: lawMapping[federalLaw] || "44-ФЗ",
                purchase_number: noticeNumber || undefined,
            }

            if (showResults === "bg") {
                return {
                    ...baseData,
                    guarantee_start_date: dateFrom || undefined,
                    guarantee_end_date: dateTo || undefined,
                    has_advance: hasAdvance,
                    has_customer_template: hasCustomerTemplate,
                }
            }

            if (showResults === "kik") {
                return {
                    ...baseData,
                    initial_price: contractPrice?.toString(),
                }
            }

            if (showResults === "factoring") {
                return {
                    ...baseData,
                    contractor_inn: customerInn || undefined,
                }
            }

            return baseData
        }

        // Create applications for each selected bank
        const selectedBanks = Array.from(selectedOffers).map(idx => calculatedOffers.approved[idx])
        let successCount = 0
        let errorCount = 0

        for (const bank of selectedBanks) {
            try {
                const payload = {
                    company: company.id,
                    product_type: getProductType(),
                    amount: amount.toString(),
                    term_months: dateFrom && dateTo
                        ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24 * 30))
                        : 1,
                    target_bank_name: bank.name,
                    tender_number: noticeNumber || undefined,
                    tender_platform: platform || undefined,
                    goscontract_data: buildGoscontractData(),
                    guarantee_type: showResults === "bg" ? bgType : undefined,
                    tender_law: lawMapping[federalLaw],
                }

                const result = await createApplication(payload as Parameters<typeof createApplication>[0])
                if (result) {
                    successCount++
                } else {
                    errorCount++
                }
            } catch (err) {
                console.error('Error creating application:', err)
                errorCount++
            }
        }

        if (successCount > 0) {
            toast.success(`Создано заявок: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
        } else {
            toast.error("Не удалось создать заявки")
        }

        setShowResults(null)
        setSelectedOffers(new Set())
    }

    // Toggle offer selection
    const toggleOffer = (index: number) => {
        const newSet = new Set(selectedOffers)
        if (newSet.has(index)) newSet.delete(index)
        else newSet.add(index)
        setSelectedOffers(newSet)
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
    // Product tabs
    const productTabs = [
        { id: "tz", label: "Тенд. займ", icon: Wallet },
        { id: "bg", label: "БГ", icon: FileText },
        { id: "kik", label: "КИК", icon: CreditCard },
        { id: "express", label: "Экспресс", icon: TrendingUp },
        { id: "factoring", label: "Факторинг", icon: HandCoins },
        { id: "rko", label: "РКО", icon: Building2 },
        { id: "specaccount", label: "Спецсчет", icon: Landmark },
        { id: "unsecured", label: "Займы", icon: Calculator },
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
                <span className="ml-2">Сумма: <strong className="text-[#3CE8D1]">{amount.toLocaleString("ru-RU")} ₽</strong></span>
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
                                    <td className="p-2 text-center text-[#3CE8D1]">{(amount * bank.bgRate / 100).toLocaleString("ru-RU")} ₽</td>
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
                <span className="ml-2">Сумма БГ: <strong className="text-[#3CE8D1]">{amount.toLocaleString("ru-RU")} ₽</strong></span>
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
                                    <td className="p-2 text-center text-[#3CE8D1]">{(amount * bank.bgRate / 100).toLocaleString("ru-RU")} ₽</td>
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

    // Show results if calculated
    if (showResults === "tz") return <TZResultsView />
    if (showResults === "bg") return <BGResultsView />
    if (showResults === "kik") return <KIKResultsView />
    if (showResults === "express") return <ExpressResultsView />
    if (showResults === "factoring") return <FactoringResultsView />

    // =============================================================================
    // MAIN FORM VIEW
    // =============================================================================

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-[#3CE8D1]">Калькулятор продуктов</h1>
                <p className="text-muted-foreground">Выберите тип продукта и заполните форму</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
                    {productTabs.map(tab => (
                        <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 text-xs px-3 py-2">
                            <tab.icon className="h-4 w-4" /><span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
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
                                <RadioGroup value={federalLaw} onValueChange={setFederalLaw} className="flex flex-wrap gap-6">
                                    {[["44", "44-ФЗ"], ["223", "223-ФЗ"], ["615", "615 ПП"]].map(([val, label]) => (
                                        <div key={val} className="flex items-center gap-2">
                                            <RadioGroupItem value={val} id={`tz-${val}`} />
                                            <Label htmlFor={`tz-${val}`} className="cursor-pointer">{label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
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
                                <Input type="number" value={amount} onChange={e => setAmount(+e.target.value)} placeholder="1 000 000" className="text-lg" />
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
                                    <Input type="number" value={contracts44} onChange={e => setContracts44(+e.target.value)} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Контракты 223-ФЗ</Label>
                                    <Input type="number" value={contracts223} onChange={e => setContracts223(+e.target.value)} placeholder="0" />
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
                                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:opacity-50"
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

                {/* TAB 2: BG */}
                <TabsContent value="bg" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Банковская гарантия (БГ)</CardTitle>
                            <p className="text-sm text-muted-foreground">Заполните параметры для расчёта стоимости гарантии</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* BG Type */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Тип банковской гарантии *</Label>
                                <Select value={bgType} onValueChange={setBgType}>
                                    <SelectTrigger><SelectValue placeholder="Выберите тип гарантии" /></SelectTrigger>
                                    <SelectContent>{BG_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>

                            {/* Federal Law */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Федеральный закон *</Label>
                                <RadioGroup value={federalLaw} onValueChange={setFederalLaw} className="flex flex-wrap gap-6">
                                    {[["44", "44-ФЗ"], ["223", "223-ФЗ"], ["615", "615 ПП"], ["kbg", "КБГ"]].map(([val, label]) => (
                                        <div key={val} className="flex items-center gap-2">
                                            <RadioGroupItem value={val} id={`bg-${val}`} />
                                            <Label htmlFor={`bg-${val}`} className="cursor-pointer">{label}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            {/* Notice and Amount */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">№ извещения и № лота</Label>
                                    <Input placeholder="Введите номер" />
                                    <Button variant="link" size="sm" className="text-xs p-0 h-auto text-[#3CE8D1]">Закрытые торги</Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Сумма БГ, ₽ *</Label>
                                    <Input type="number" value={amount} onChange={e => setAmount(+e.target.value)} placeholder="1 000 000" className="text-lg" />
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Срок с</Label>
                                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">по</Label>
                                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">дней</Label>
                                    <Input readOnly value={dateFrom && dateTo ? Math.max(0, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000)) : ""} className="bg-muted/30" />
                                </div>
                            </div>

                            {/* Switches */}
                            <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Switch checked={hasAdvance} onCheckedChange={setHasAdvance} />
                                    <Label className="cursor-pointer">Наличие авансирования</Label>
                                    {hasAdvance && <Input type="number" className="w-24" placeholder="%" value={advancePercent || ""} onChange={e => setAdvancePercent(+e.target.value)} />}
                                </div>
                                <div className="flex items-center gap-4">
                                    <Switch checked={hasCustomerTemplate} onCheckedChange={setHasCustomerTemplate} />
                                    <Label className="cursor-pointer">Шаблон заказчика</Label>
                                </div>
                            </div>

                            {/* Contracts */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Контракты 44-ФЗ</Label>
                                    <Input type="number" value={contracts44} onChange={e => setContracts44(+e.target.value)} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Контракты 223-ФЗ</Label>
                                    <Input type="number" value={contracts223} onChange={e => setContracts223(+e.target.value)} placeholder="0" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#2a3a5c]">
                                {!getValidation("bg").valid && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Заполните: {getValidation("bg").errors.join(", ")}
                                    </p>
                                )}
                                <div className="flex gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("bg")} disabled={isSubmitting || !getValidation("bg").valid} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        РАССЧИТАТЬ
                                    </Button>
                                    <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 3: KIK */}
                <TabsContent value="kik" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Кредит на исполнение контракта (КИК)</CardTitle>
                            <p className="text-sm text-muted-foreground">Заполните параметры кредита</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Тип продукта *</Label>
                                <Select value={kikType} onValueChange={setKikType}>
                                    <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="credit">Кредит на исполнение контракта</SelectItem>
                                        <SelectItem value="loan">Займ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2"><Label className="text-sm font-medium">№ извещения/контракта</Label><Input placeholder="Введите номер" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">№ лота</Label><Input placeholder="Введите номер" /></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Цена контракта, ₽ *</Label>
                                <Input type="number" value={contractPrice || ""} onChange={e => setContractPrice(+e.target.value)} placeholder="1 000 000" className="text-lg" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2"><Label className="text-sm font-medium">Срок контракта с</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">по</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">дней</Label><Input readOnly className="bg-muted/30" /></div>
                            </div>
                            <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <Switch checked={hasAdvance} onCheckedChange={setHasAdvance} />
                                    <Label className="cursor-pointer">Наличие авансирования</Label>
                                    {hasAdvance && <><Input type="number" className="w-24" placeholder="%" /><span className="text-xs text-muted-foreground">% от цены контракта</span></>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Сумма кредита, ₽ *</Label>
                                <Input type="number" value={creditAmount || ""} onChange={e => setCreditAmount(+e.target.value)} placeholder="500 000" className="text-lg" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2"><Label className="text-sm font-medium">Срок кредита с</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">по</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">дней</Label><Input readOnly className="bg-muted/30" /></div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2"><Label className="text-sm font-medium">Контракты 44-ФЗ</Label><Input type="number" placeholder="0" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">Контракты 223-ФЗ</Label><Input type="number" placeholder="0" /></div>
                            </div>
                            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Процент выполнения: {completionPercent}%</Label>
                                    <div className="flex items-center gap-2">
                                        <Checkbox checked={ignoreCompletion} onCheckedChange={c => setIgnoreCompletion(c as boolean)} />
                                        <span className="text-sm">Не учитывать</span>
                                    </div>
                                </div>
                                {!ignoreCompletion && <Slider value={[completionPercent]} onValueChange={v => setCompletionPercent(v[0])} max={100} step={1} />}
                            </div>
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#2a3a5c]">
                                {!getValidation("kik").valid && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Заполните: {getValidation("kik").errors.join(", ")}
                                    </p>
                                )}
                                <div className="flex gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("kik")} disabled={isSubmitting || !getValidation("kik").valid} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        РАССЧИТАТЬ
                                    </Button>
                                    <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: EXPRESS */}
                <TabsContent value="express" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Экспресс кредит</CardTitle>
                            <p className="text-sm text-muted-foreground">Быстрое кредитование для бизнеса</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Тип продукта</Label>
                                <Input readOnly value="Экспресс-кредит" className="bg-muted/30" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Сумма кредита *</Label>
                                <Input type="number" value={amount || ""} onChange={e => setAmount(+e.target.value)} placeholder="500 000" className="text-lg" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2"><Label className="text-sm font-medium">Срок кредита с</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">по</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">дней</Label><Input readOnly className="bg-muted/30" /></div>
                            </div>
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#2a3a5c]">
                                {!getValidation("express").valid && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Заполните: {getValidation("express").errors.join(", ")}
                                    </p>
                                )}
                                <div className="flex gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("express")} disabled={isSubmitting || !getValidation("express").valid} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        РАССЧИТАТЬ
                                    </Button>
                                    <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: FACTORING */}
                <TabsContent value="factoring" className="mt-6">
                    <Card className="border-2 border-[#2a3a5c]">
                        <CardHeader className="border-b border-[#2a3a5c] pb-4">
                            <CardTitle className="text-xl">Факторинг</CardTitle>
                            <p className="text-sm text-muted-foreground">Финансирование под уступку денежного требования</p>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Вид контракта *</Label>
                                <RadioGroup value={contractType} onValueChange={setContractType} className="flex flex-wrap gap-6">
                                    <div className="flex items-center gap-2"><RadioGroupItem value="gov" id="gov" /><Label htmlFor="gov" className="cursor-pointer">Госторги</Label></div>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="other" id="other-contract" /><Label htmlFor="other-contract" className="cursor-pointer">Иные контракты</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2"><Label className="text-sm font-medium">№ извещения</Label><Input placeholder="Введите номер" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">№ лота</Label><Input placeholder="Введите номер" /></div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2"><Label className="text-sm font-medium">НМЦ</Label><Input type="number" placeholder="0" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">Валюта</Label><Input readOnly value="руб." className="bg-muted/30" /></div>
                            </div>
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2"><Label className="text-sm font-medium">Срок контракта с</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">по</Label><Input type="date" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">дней</Label><Input readOnly className="bg-muted/30" /></div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Объём отгрузки, руб. *</Label>
                                <Input type="number" value={shipmentVolume || ""} onChange={e => setShipmentVolume(+e.target.value)} placeholder="1 000 000" className="text-lg" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2"><Label className="text-sm font-medium">Отсрочка платежа *</Label><Input type="number" value={paymentDelay || ""} onChange={e => setPaymentDelay(+e.target.value)} placeholder="30" /></div>
                                <div className="space-y-2"><Label className="text-sm font-medium">ИНН Заказчика</Label><Input maxLength={12} value={customerInn} onChange={e => setCustomerInn(e.target.value)} placeholder="Введите ИНН" /></div>
                            </div>
                            <div className="flex flex-col gap-2 pt-4 border-t border-[#2a3a5c]">
                                {!getValidation("factoring").valid && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Заполните: {getValidation("factoring").errors.join(", ")}
                                    </p>
                                )}
                                <div className="flex gap-4">
                                    <Button onClick={() => handleCalculateWithValidation("factoring")} disabled={isSubmitting || !getValidation("factoring").valid} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] px-8 disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        РАССЧИТАТЬ
                                    </Button>
                                    <Button variant="outline" className="border-[#3a4a6c]">ОЧИСТИТЬ ФОРМУ</Button>
                                </div>
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
                    )}
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
                </TabsContent >

                {/* TAB 8: UNSECURED */}
                < TabsContent value="unsecured" >
                    <Card>
                        <CardHeader><CardTitle>Займы без залога</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">* - поля, обязательные для заполнения</p>
                            <div><Label>Сумма займа *</Label><Input type="number" placeholder="1000,00" /></div>
                            <div className="grid gap-4 md:grid-cols-3"><div><Label>Срок займа с *</Label><Input type="date" /></div><div><Label>по *</Label><Input type="date" /></div><div><Label>дней</Label><Input readOnly /></div></div>
                            <div><Label>ФИО *</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" /></div>
                            <div><Label>Телефон *</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (123) 456-78-91" /></div>
                            <div><Label>Email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@mail.com" /></div>
                            <div><Label>Комментарий</Label><Textarea value={comment} onChange={e => setComment(e.target.value)} /></div>
                            <div className="space-y-3"><h4 className="font-medium">Документы</h4>
                                {["Паспорт руководителя *", "Бух. отчётность (2кв 2020) *", "Бух. отчётность (4кв 2019) *", "Решение о назначении руководителя *", "Устав *", "Доп. документы"].map((doc, i) => (
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

"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Briefcase, Calculator, Loader2, CheckCircle2, AlertCircle, ArrowLeft,
    ArrowUp, Building2
} from "lucide-react"
import { toast } from "sonner"
import { useApplicationMutations } from "@/hooks/use-applications"
import { useMyCompany } from "@/hooks/use-companies"
import { getCompanyBasicsError } from "@/lib/company-basics"

// =============================================================================
// BANK DATABASE (Real data from Условия банков)
// =============================================================================

interface BankOffer {
    name: string
    product: string
    minAmount: number
    maxAmount: number
    maxTermMonths: number
    rate: string
    serviceCommission: string
    conditions: string
    laws: string[]
    speed: "Высокая" | "Средняя" | "Низкая"
}

const BANKS_DB: BankOffer[] = [
    {
        name: "Сбербанк",
        product: "БГ 44-ФЗ, 223-ФЗ",
        minAmount: 10000,
        maxAmount: 50000000,
        maxTermMonths: 36,
        rate: "от 2,5%",
        serviceCommission: "20%",
        conditions: "Наличие р/с не обязательно. Отсутствие блокировок по счетам.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "ВТБ",
        product: "БГ 44-ФЗ",
        minAmount: 50000,
        maxAmount: 100000000,
        maxTermMonths: 60,
        rate: "от 2,2%",
        serviceCommission: "15-25%",
        conditions: "Опыт исполнения контрактов. Положительная кредитная история.",
        laws: ["44-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "Альфа-Банк",
        product: "БГ Экспресс",
        minAmount: 10000,
        maxAmount: 30000000,
        maxTermMonths: 24,
        rate: "Индив.",
        serviceCommission: "25%",
        conditions: "Без залога и поручительства. Быстрое рассмотрение (от 1 часа).",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Высокая"
    },
    {
        name: "Промсвязьбанк",
        product: "БГ",
        minAmount: 100000,
        maxAmount: 150000000,
        maxTermMonths: 36,
        rate: "от 3%",
        serviceCommission: "20%",
        conditions: "Требуется открытие спецсчета для крупных сумм.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "Совкомбанк",
        product: "БГ, Кредит",
        minAmount: 50000,
        maxAmount: 200000000,
        maxTermMonths: 60,
        rate: "от 12% (Кредит)",
        serviceCommission: "20%",
        conditions: "Возможно дистанционное открытие счета.",
        laws: ["44-ФЗ", "223-ФЗ", "185-ФЗ"],
        speed: "Высокая"
    },
    {
        name: "МТС Банк",
        product: "Экспресс Гарантии",
        minAmount: 10000,
        maxAmount: 50000000,
        maxTermMonths: 36,
        rate: "от 2,8%",
        serviceCommission: "30%",
        conditions: "Только для субъектов МСП.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Высокая"
    },
    {
        name: "Абсолют Банк",
        product: "БГ",
        minAmount: 0,
        maxAmount: 200000000,
        maxTermMonths: 40,
        rate: "от 2%",
        serviceCommission: "20-30%",
        conditions: "Минимальный пакет документов.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "Киви Банк (Rowi)",
        product: "БГ",
        minAmount: 10000,
        maxAmount: 100000000,
        maxTermMonths: 36,
        rate: "от 3%",
        serviceCommission: "25%",
        conditions: "Полностью онлайн. Без открытия счета.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Высокая"
    },
    {
        name: "МСП Банк",
        product: "Кредит на исполнение",
        minAmount: 1000000,
        maxAmount: 50000000,
        maxTermMonths: 12,
        rate: "от 10%",
        serviceCommission: "10%",
        conditions: "Требуется залог или поручительство Корпорации МСП.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Низкая"
    },
    {
        name: "Металлинвест",
        product: "БГ",
        minAmount: 100000,
        maxAmount: 40000000,
        maxTermMonths: 24,
        rate: "от 3,5%",
        serviceCommission: "20%",
        conditions: "Региональные ограничения могут применяться.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "Банк ДОМ.РФ",
        product: "БГ",
        minAmount: 100000,
        maxAmount: 100000000,
        maxTermMonths: 36,
        rate: "Индив.",
        serviceCommission: "20%",
        conditions: "Для застройщиков и участников госзакупок.",
        laws: ["44-ФЗ", "223-ФЗ"],
        speed: "Средняя"
    },
    {
        name: "Лидер-Гарант",
        product: "Индивидуальные условия",
        minAmount: 0,
        maxAmount: 999999999,
        maxTermMonths: 60,
        rate: "Индив.",
        serviceCommission: "По договоренности",
        conditions: "Персональное рассмотрение любых заявок. Работа со сложными случаями.",
        laws: ["44-ФЗ", "223-ФЗ", "Имущественные торги", "Коммерческие"],
        speed: "Высокая"
    },
]

// Purchase types per specification
const PURCHASE_TYPES = [
    { id: "44fz", label: "Госзакупки по 44-ФЗ", apiValue: "gov_44" },
    { id: "223fz", label: "Закупки по 223-ФЗ", apiValue: "gov_223" },
    { id: "property", label: "Имущественные торги", apiValue: "property" },
    { id: "commercial", label: "Коммерческие закупки", apiValue: "commercial" },
]

// Support types
const SUPPORT_TYPES = [
    { id: "one_time", label: "Разовое сопровождение" },
    { id: "full_cycle", label: "Тендерное сопровождение под ключ" },
]

// Speed badge component
const SpeedBadge = ({ speed }: { speed: string }) => {
    const colors: Record<string, string> = {
        "Высокая": "bg-green-500/20 text-green-500",
        "Средняя": "bg-yellow-500/20 text-yellow-500",
        "Низкая": "bg-gray-500/20 text-gray-400"
    }
    return <span className={cn("px-2 py-0.5 rounded text-xs", colors[speed] || colors["Низкая"])}>{speed}</span>
}

// Format number with spaces
const formatNumber = (num: number): string => num.toLocaleString("ru-RU")

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClientTenderSupportView() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [selectedOffers, setSelectedOffers] = useState<Set<number>>(new Set())

    // API hooks
    const { createApplication, isLoading: isCreatingApplication } = useApplicationMutations()
    const { company, isLoading: isLoadingCompany } = useMyCompany()

    // Form state
    const [supportType, setSupportType] = useState("")
    const [purchaseType, setPurchaseType] = useState("")
    const [industry, setIndustry] = useState("")

    // Calculated offers
    const [approvedBanks, setApprovedBanks] = useState<BankOffer[]>([])
    const [rejectedBanks, setRejectedBanks] = useState<{ bank: BankOffer; reason: string }[]>([])

    // Validate form
    const isFormValid = supportType && purchaseType

    // Get offer for selected purchase type
    const handleGetOffer = async () => {
        if (!isFormValid) {
            toast.error("Заполните обязательные поля: Вариант сопровождения, Тип закупки")
            return
        }

        setIsSubmitting(true)
        await new Promise(r => setTimeout(r, 800)) // Simulate processing

        // Filter banks based on purchase type
        const lawFilter = purchaseType === "44fz" ? "44-ФЗ" :
            purchaseType === "223fz" ? "223-ФЗ" :
                purchaseType === "property" ? "Имущественные торги" : "Коммерческие"

        const approved: BankOffer[] = []
        const rejected: { bank: BankOffer; reason: string }[] = []

        BANKS_DB.forEach(bank => {
            // Лидер-Гарант always approved
            if (bank.name === "Лидер-Гарант") {
                approved.push(bank)
                return
            }

            // Check law compatibility
            if (!bank.laws.includes(lawFilter) && !bank.laws.includes("44-ФЗ") && !bank.laws.includes("223-ФЗ")) {
                rejected.push({ bank, reason: `Не работает с ${lawFilter}` })
            } else {
                approved.push(bank)
            }
        })

        // Sort: Лидер-Гарант at bottom
        const sortedApproved = approved.sort((a, b) => {
            if (a.name === "Лидер-Гарант") return 1
            if (b.name === "Лидер-Гарант") return -1
            return 0
        })

        setApprovedBanks(sortedApproved)
        setRejectedBanks(rejected)
        setIsSubmitting(false)
        setShowResults(true)
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
    const backToForm = () => {
        setShowResults(false)
        setSelectedOffers(new Set())
    }

    // Create application
    const handleCreateApplication = async () => {
        if (selectedOffers.size === 0) {
            toast.error("Выберите хотя бы одно предложение")
            return
        }

        const companyError = getCompanyBasicsError(company)
        if (!company || companyError) {
            toast.error(companyError || "Для создания заявки заполните ИНН и полное наименование.")
            return
        }

        const selectedBanks = Array.from(selectedOffers).map(idx => approvedBanks[idx])
        let successCount = 0
        let errorCount = 0

        for (const bank of selectedBanks) {
            try {
                const purchaseApiValue = PURCHASE_TYPES.find(p => p.id === purchaseType)?.apiValue || "gov_44"

                const payload = {
                    company: company.id,
                    product_type: "tender_support" as const,
                    amount: "0",
                    term_months: 12,
                    target_bank_name: bank.name,
                    tender_support_type: supportType,
                    purchase_category: purchaseApiValue,
                    industry: industry || undefined,
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

        setShowResults(false)
        setSelectedOffers(new Set())
    }

    // ==========================================================================
    // RESULTS VIEW
    // ==========================================================================
    if (showResults) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={backToForm}>
                        <ArrowLeft className="h-4 w-4 mr-2" />Назад
                    </Button>
                    <h2 className="text-xl font-bold">Результат отбора банков</h2>
                    <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-600">Одобренные: {approvedBanks.length}</Badge>
                        <Badge variant="outline">Отказные: {rejectedBanks.length}</Badge>
                    </div>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg text-sm">
                    <span className="text-muted-foreground">Параметры:</span>
                    <span className="ml-2">Вариант: <strong className="text-[#3CE8D1]">{SUPPORT_TYPES.find(s => s.id === supportType)?.label}</strong></span>
                    <span className="ml-4">Тип закупки: <strong>{PURCHASE_TYPES.find(p => p.id === purchaseType)?.label}</strong></span>
                    {industry && <span className="ml-4">Отрасль: <strong>{industry}</strong></span>}
                </div>

                {/* Approved Banks */}
                <Card>
                    <CardHeader className="py-3">
                        <span className="text-green-500 font-bold">ОДОБРЕННЫЕ: {approvedBanks.length}</span>
                        <p className="text-xs text-muted-foreground">(готовы работать с выбранным типом закупок)</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs">
                                <tr>
                                    <th className="text-left p-2">Банк</th>
                                    <th className="text-center p-2">Мин. сумма</th>
                                    <th className="text-center p-2">Макс. сумма</th>
                                    <th className="text-center p-2">Ставка</th>
                                    <th className="text-center p-2">Комиссия</th>
                                    <th className="text-center p-2">Скорость</th>
                                    <th className="text-center p-2">Выбрать</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvedBanks.map((bank, i) => (
                                    <tr key={i} className={cn("border-t", bank.name === "Лидер-Гарант" && "bg-[#3CE8D1]/10")}>
                                        <td className="p-2">
                                            <div>
                                                <span className="font-medium">{bank.name}</span>
                                                {bank.name === "Лидер-Гарант" && (
                                                    <Badge className="ml-2 bg-[#3CE8D1] text-[#0a1628]">Инд. условия</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{bank.product}</p>
                                        </td>
                                        <td className="p-2 text-center">{formatNumber(bank.minAmount)} ₽</td>
                                        <td className="p-2 text-center">{formatNumber(bank.maxAmount)} ₽</td>
                                        <td className="p-2 text-center text-[#3CE8D1]">{bank.rate}</td>
                                        <td className="p-2 text-center">{bank.serviceCommission}</td>
                                        <td className="p-2 text-center"><SpeedBadge speed={bank.speed} /></td>
                                        <td className="p-2 text-center">
                                            <Checkbox
                                                checked={selectedOffers.has(i)}
                                                onCheckedChange={() => toggleOffer(i)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Rejected Banks */}
                {rejectedBanks.length > 0 && (
                    <Card>
                        <CardHeader className="py-3">
                            <span className="text-red-500 font-bold">ОТКАЗНЫЕ: {rejectedBanks.length}</span>
                            <p className="text-xs text-muted-foreground">(не работают с выбранным типом закупок)</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs">
                                    <tr>
                                        <th className="text-left p-2">Банк</th>
                                        <th className="text-left p-2">Причина отказа</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rejectedBanks.map((item, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2">{item.bank.name}</td>
                                            <td className="p-2 text-red-400">{item.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                <p className="text-xs text-muted-foreground text-center">
                    Приведенные расчеты стоимости являются предварительными и не являются публичной офертой.
                </p>

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowUp className="h-4 w-4" />
                        Справа внизу - стрелочка "На вверх"
                    </div>
                    <Button
                        onClick={handleCreateApplication}
                        disabled={selectedOffers.size === 0 || isCreatingApplication}
                        className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                    >
                        {isCreatingApplication ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Создание...
                            </>
                        ) : (
                            "СОЗДАТЬ ЗАЯВКУ"
                        )}
                    </Button>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // FORM VIEW
    // ==========================================================================
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3CE8D1]/20 to-[#3CE8D1]/5 border border-[#3CE8D1]/30 flex items-center justify-center">
                    <Briefcase className="h-7 w-7 text-[#3CE8D1]" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                        Тендерное сопровождение
                    </h1>
                    <p className="text-sm text-[#94a3b8] mt-1">
                        Комплексное сопровождение участия в торгах
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden">
                <CardHeader className="relative pb-6 border-b border-[#2a3a5c]/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                    <CardTitle className="relative text-lg">Условия заявки</CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* Company Info */}
                    <div className="p-4 rounded-xl bg-[#1a2942]/30 border border-[#2a3a5c]/30">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-4 w-4 text-[#3CE8D1]" />
                            <span className="text-sm font-medium">ИНН организации-заявителя</span>
                        </div>
                        {isLoadingCompany ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Загрузка данных компании...
                            </div>
                        ) : company?.inn ? (
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-lg font-mono text-[#3CE8D1]">{company.inn}</p>
                                    <p className="text-sm text-muted-foreground">{company.name || company.short_name}</p>
                                </div>
                                <Badge variant="outline" className="border-green-500/50 text-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Данные из ЕГРЮЛ
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-500">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Заполните профиль компании для продолжения</span>
                            </div>
                        )}
                    </div>

                    {/* Support Type */}
                    <div className="space-y-2">
                        <Label className="text-sm text-[#94a3b8]">
                            Вариант сопровождения <span className="text-[#3CE8D1]">*</span>
                        </Label>
                        <Select value={supportType} onValueChange={setSupportType}>
                            <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                <SelectValue placeholder="Выбрать пункт: Разовое сопровождение, Тендерное сопровождение под ключ" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUPPORT_TYPES.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Purchase Type */}
                    <div className="space-y-2">
                        <Label className="text-sm text-[#94a3b8]">
                            Тип закупки <span className="text-[#3CE8D1]">*</span>
                        </Label>
                        <Select value={purchaseType} onValueChange={setPurchaseType}>
                            <SelectTrigger className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50">
                                <SelectValue placeholder="Госзакупки по 44-ФЗ, Закупки по 223-ФЗ, Имущественные торги, Коммерческие закупки" />
                            </SelectTrigger>
                            <SelectContent>
                                {PURCHASE_TYPES.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                        <Label className="text-sm text-[#94a3b8]">
                            Закупки в отрасли
                        </Label>
                        <Input
                            type="text"
                            value={industry}
                            onChange={e => setIndustry(e.target.value)}
                            placeholder="Введите интересующую отрасль закупок"
                            className="h-11 bg-[#0f1d32]/50 border-[#2a3a5c]/30 focus:border-[#3CE8D1]/50"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-[#2a3a5c]/30">
                        {!isFormValid && (
                            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <p className="text-sm text-amber-400">
                                    Заполните обязательные поля: {!supportType && "Вариант сопровождения"}{!supportType && !purchaseType && ", "}{!purchaseType && "Тип закупки"}
                                </p>
                            </div>
                        )}

                        <Button
                            onClick={handleGetOffer}
                            disabled={!isFormValid || isSubmitting || !company?.inn}
                            className="h-12 px-8 bg-gradient-to-r from-[#3CE8D1] to-[#2fd4c0] text-[#0a1628] font-semibold hover:opacity-90 shadow-lg shadow-[#3CE8D1]/20 disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <Calculator className="h-5 w-5 mr-2" />
                            )}
                            ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ
                        </Button>

                        <p className="text-xs text-[#64748b] mt-4">
                            (Снизу текст) Приведенные расчеты стоимости являются предварительными и не являются публичной офертой.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-[#2a3a5c]/50 bg-[#0f1d32]/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-[#3CE8D1]">Разовое сопровождение</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                            <li>Подготовка документации для одной закупки</li>
                            <li>Анализ тендерной документации</li>
                            <li>Формирование заявки на участие</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-[#2a3a5c]/50 bg-[#0f1d32]/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-[#3CE8D1]">Тендерное сопровождение под ключ</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                            <li>Полный цикл сопровождения всех закупок</li>
                            <li>Мониторинг тендеров по вашей отрасли</li>
                            <li>Подготовка и подача заявок</li>
                            <li>Получение банковских гарантий</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

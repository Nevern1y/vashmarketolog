"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, Building2, Calculator, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useApplicationMutations } from "@/hooks/use-applications"
import { useMyCompany } from "@/hooks/use-companies"
import { getCompanyBasicsError } from "@/lib/company-basics"

// =============================================================================
// TENDER SUPPORT CONFIG
// =============================================================================

const PURCHASE_TYPES = [
    { id: "44fz", label: "Госзакупки по 44-ФЗ", apiValue: "gov_44" },
    { id: "223fz", label: "Закупки по 223-ФЗ", apiValue: "gov_223" },
    { id: "property", label: "Имущественные торги", apiValue: "property" },
    { id: "commercial", label: "Коммерческие закупки", apiValue: "commercial" },
]

const SUPPORT_TYPES = [
    { id: "one_time", label: "Разовое сопровождение" },
    { id: "full_cycle", label: "Тендерное сопровождение под ключ" },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClientTenderSupportView() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { createApplication, isLoading: isCreatingApplication } = useApplicationMutations()
    const { company } = useMyCompany()

    const [supportType, setSupportType] = useState("")
    const [purchaseType, setPurchaseType] = useState("")
    const [industry, setIndustry] = useState("")

    const isFormValid = supportType && purchaseType

    const handleCreateApplication = async () => {
        if (!isFormValid) {
            toast.error("Заполните обязательные поля: Вариант сопровождения, Тип закупки")
            return
        }

        const companyError = getCompanyBasicsError(company)
        if (!company || companyError) {
            toast.error(companyError || "Для создания заявки заполните ИНН и полное наименование.")
            return
        }

        const purchaseApiValue = PURCHASE_TYPES.find(p => p.id === purchaseType)?.apiValue || "gov_44"

        try {
            setIsSubmitting(true)
            const payload = {
                company: company.id,
                product_type: "tender_support" as const,
                amount: "0",
                term_months: 12,
                target_bank_name: "Индивидуальное рассмотрение",
                tender_support_type: supportType,
                purchase_category: purchaseApiValue,
                industry: industry || undefined,
            }

            const result = await createApplication(payload as Parameters<typeof createApplication>[0])
            if (result) {
                toast.success(`Заявка №${result.id} создана`)
            } else {
                toast.error("Не удалось создать заявку")
            }
        } catch (err) {
            console.error("Error creating tender support application:", err)
            toast.error("Ошибка при создании заявки")
        } finally {
            setIsSubmitting(false)
        }
    }

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
            <Card className="border border-[#2a3a5c]/50 bg-gradient-to-br from-[#0f1d32] to-[#0a1425] shadow-2xl overflow-hidden gap-4 py-4">
                <CardHeader className="relative border-b border-[#2a3a5c]/30 py-5 pb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3CE8D1]/5 via-transparent to-[#3CE8D1]/5" />
                    <CardTitle className="relative text-lg">Условия заявки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-5 pb-6">
                    <div className="rounded-xl border border-[#1e3a5f] bg-[#0f1d32]/60 p-5">
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                            <Building2 className="h-4 w-4" />
                            <span>ИНН организации-заявителя</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <p className="text-lg font-semibold text-[#3CE8D1]">{company?.inn || "—"}</p>
                            {company?.name && (
                                <span className="rounded-full border border-[#1e3a5f] bg-[#0f2a2f] px-2.5 py-0.5 text-xs text-[#3CE8D1]">
                                    Данные из ЕГРЮЛ
                                </span>
                            )}
                        </div>
                        {company?.name && (
                            <p className="mt-1 text-sm text-[#94a3b8]">{company.name}</p>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Вариант сопровождения *</Label>
                            <Select value={supportType} onValueChange={setSupportType}>
                                <SelectTrigger className="bg-[#0f1d32]/50 border-[#2a3a5c]/30 text-white">
                                    <SelectValue placeholder="Выберите вариант" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f2042] border-[#1e3a5f]">
                                    {SUPPORT_TYPES.map((item) => (
                                        <SelectItem key={item.id} value={item.id} className="text-white hover:bg-[#1e3a5f]">
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Тип закупки *</Label>
                            <Select value={purchaseType} onValueChange={setPurchaseType}>
                                <SelectTrigger className="bg-[#0f1d32]/50 border-[#2a3a5c]/30 text-white">
                                    <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f2042] border-[#1e3a5f]">
                                    {PURCHASE_TYPES.map((item) => (
                                        <SelectItem key={item.id} value={item.id} className="text-white hover:bg-[#1e3a5f]">
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Закупки в отрасли</Label>
                        <Input
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="Введите интересующую отрасль закупок"
                            className="bg-[#0f1d32]/50 border-[#2a3a5c]/30 text-white focus:ring-0 focus:ring-offset-0"
                        />
                    </div>

                    {!isFormValid && (
                        <div className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#f59e0b]">
                            Заполните обязательные поля: Вариант сопровождения, Тип закупки
                        </div>
                    )}

                    <div className="flex justify-start">
                        <Button
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                            onClick={handleCreateApplication}
                            disabled={isSubmitting || isCreatingApplication}
                        >
                            {isSubmitting || isCreatingApplication ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Calculator className="h-4 w-4 mr-2" />
                            )}
                            ПОЛУЧИТЬ ПРЕДЛОЖЕНИЕ
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

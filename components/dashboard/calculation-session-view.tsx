"use client"

/**
 * CalculationSessionView - "Результат отбора" page
 * 
 * Displays bank calculation results from a saved CalculationSession.
 * Allows users to select additional banks and create new applications.
 * This is the "root application" that groups multiple applications created
 * from the same calculation.
 */

import { useCalculationSession, useApplicationMutations, useCalculationSessionMutations, type CalculationSession } from "@/hooks/use-applications"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Plus
} from "lucide-react"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CalculationSessionViewProps {
    sessionId: number
    onBack: () => void
    onOpenApplicationDetail?: (applicationId: string) => void
    onNavigateToApplications?: () => void
}

export function CalculationSessionView({
    sessionId,
    onBack,
    onOpenApplicationDetail,
    onNavigateToApplications
}: CalculationSessionViewProps) {
    const { session, isLoading, error, refetch: refetchSession } = useCalculationSession(sessionId)
    const { createApplication } = useApplicationMutations()
    const { updateSubmittedBanks } = useCalculationSessionMutations()
    const [selectedBanks, setSelectedBanks] = useState<string[]>([])
    const [isCreating, setIsCreating] = useState(false)

    const handleBankToggle = useCallback((bankName: string) => {
        setSelectedBanks(prev =>
            prev.includes(bankName)
                ? prev.filter(b => b !== bankName)
                : [...prev, bankName]
        )
    }, [])

    const handleSelectAllAvailable = useCallback(() => {
        if (!session) return
        const availableBanks = session.approved_banks
            .filter(bank => !session.submitted_banks.includes(bank.name))
            .map(bank => bank.name)
        setSelectedBanks(availableBanks)
    }, [session])

    const handleClearSelection = useCallback(() => {
        setSelectedBanks([])
    }, [])

    const handleCreateApplications = async () => {
        if (selectedBanks.length === 0 || !session) return

        setIsCreating(true)
        const successfulBankNames: string[] = []
        let successCount = 0
        let errorCount = 0

        // Helper to reconstruct goscontract_data based on product type
        const buildGoscontractData = (formData: any, productType: string) => {
            const lawMapping: Record<string, string> = {
                "44": "44_fz",
                "223": "223_fz",
                "615": "615_pp",
                "kbg": "kbg"
            }

            const baseData: Record<string, unknown> = {
                law: lawMapping[formData.federalLaw] || "44-ФЗ",
                purchase_number: formData.noticeNumber || undefined,
                lot_number: formData.lotNumber || undefined,
            }

            if (productType === "bank_guarantee") {
                return {
                    ...baseData,
                    bg_type: formData.bgType || undefined,
                    guarantee_start_date: formData.dateFrom || undefined,
                    guarantee_end_date: formData.dateTo || undefined,
                    has_prepayment: formData.hasAdvance,
                    advance_percent: formData.hasAdvance ? formData.advancePercent : undefined,
                }
            }

            if (productType === "contract_loan" || productType === "tender_loan") { // tender_loan sometimes uses similar structure
                return {
                    ...baseData,
                    contract_loan_type: formData.kikType || undefined,
                    contract_price: formData.contractPrice?.toString(),
                    credit_amount: formData.creditAmount?.toString(),
                    contracts_44fz_count: 0,
                    contracts_223fz_count: 0,
                }
            }

            if (productType === "corporate_credit") {
                return {
                    credit_type: formData.creditType || undefined,
                    credit_start_date: formData.dateFrom || undefined,
                    credit_end_date: formData.dateTo || undefined,
                }
            }

            if (productType === "factoring") {
                return {
                    ...baseData,
                    contractor_inn: formData.contractorInn || undefined,
                    factoring_type: formData.factoringType || undefined,
                    financing_amount: formData.financingAmount?.toString() || undefined,
                }
            }

            if (productType === "leasing") {
                return {
                    leasing_credit_type: formData.leasingCreditType || undefined,
                    leasing_amount: formData.leasingAmount?.toString() || undefined,
                }
            }

            if (productType === "insurance") {
                return {
                    insurance_category: formData.insuranceCategory || undefined,
                    insurance_product: formData.insuranceProduct || undefined,
                    insurance_amount: formData.insuranceAmount?.toString() || undefined,
                }
            }

            return baseData
        }

        const formData = session.form_data

        for (const bankName of selectedBanks) {
            try {
                // Determine tender law from mapping
                const lawMapping: Record<string, string> = {
                    "44": "44_fz",
                    "223": "223_fz",
                    "615": "615_pp",
                    "kbg": "kbg"
                }

                // Calculate term months
                const dateFrom = formData.dateFrom as string
                const dateTo = formData.dateTo as string
                const termMonths = dateFrom && dateTo
                    ? Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    : 1

                const payload = {
                    company: session.company, // session.company is the ID (number)
                    product_type: session.product_type,
                    amount: ((formData.amount as number) ?? 0).toString(),
                    term_months: termMonths,
                    target_bank_name: bankName,
                    tender_number: (formData.noticeNumber as string) || undefined,
                    tender_platform: undefined, // Platform not always stored in form data, okay to be undefined
                    goscontract_data: buildGoscontractData(formData, session.product_type),
                    guarantee_type: session.product_type === "bank_guarantee" ? (formData.bgType as string) : undefined,
                    tender_law: lawMapping[formData.federalLaw as string] || "44_fz",
                    calculation_session: session.id,
                }

                const result = await createApplication(payload as any)
                if (result) {
                    successCount++
                    successfulBankNames.push(bankName)
                } else {
                    errorCount++
                }
            } catch (err) {
                console.error('Error creating application for bank', bankName, err)
                errorCount++
            }
        }

        // Update submitted banks in the session
        if (successfulBankNames.length > 0) {
            try {
                await updateSubmittedBanks(session.id, successfulBankNames)
                // Refetch session to update the UI (move banks from available to submitted)
                await refetchSession()
            } catch (err) {
                console.error('Error updating submitted banks:', err)
            }
        }

        if (successCount > 0) {
            toast.success(`Создано заявок: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
            setSelectedBanks([])

            // Navigate to applications page after successful creation
            if (onNavigateToApplications) {
                setTimeout(() => {
                    onNavigateToApplications()
                }, 500) // Small delay to show toast
            }
        } else {
            toast.error("Не удалось создать заявки")
        }

        setIsCreating(false)
    }

    const getProductTypeLabel = (productType: string) => {
        const labels: Record<string, string> = {
            'bank_guarantee': 'Банковская гарантия',
            'tender_loan': 'Тендерный кредит',
            'contract_loan': 'Кредит на исполнение контракта',
            'corporate_credit': 'Корпоративный кредит',
            'factoring': 'Факторинг',
            'leasing': 'Лизинг',
            'ved': 'ВЭД',
            'insurance': 'Страхование',
            'rko': 'РКО',
            'special_account': 'Спецсчет',
            'tender_support': 'Тендерное сопровождение'
        }
        return labels[productType] || productType
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">{error || 'Сессия не найдена'}</p>
                <Button onClick={onBack} variant="outline">
                    ← Назад
                </Button>
            </div>
        )
    }

    const availableBanks = session.approved_banks.filter(
        bank => !session.submitted_banks.includes(bank.name)
    )
    const submittedBanks = session.approved_banks.filter(
        bank => session.submitted_banks.includes(bank.name)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f] shrink-0"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                    <nav className="flex items-center gap-2 text-xs md:text-sm text-[#94a3b8] mb-1">
                        <button onClick={onBack} className="hover:text-[#3CE8D1] transition-colors flex items-center gap-1">
                            <span>←</span>
                            <span>Мои заявки</span>
                        </button>
                        <span>/</span>
                        <span className="text-[#3CE8D1]">Результат отбора</span>
                    </nav>
                    <h1 className="text-lg md:text-2xl font-bold text-white flex flex-wrap items-center gap-2 md:gap-3">
                        <span>{session.title || getProductTypeLabel(session.product_type)}</span>
                        <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] border-[#3CE8D1]/30">
                            {getProductTypeLabel(session.product_type)}
                        </Badge>
                        <span className="text-xs md:text-sm font-normal text-[#94a3b8]">
                            от {new Date(session.created_at).toLocaleDateString('ru-RU')}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        Результат отбора банков
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-[#94a3b8]">Компания:</span>
                            <p className="text-white font-medium">{session.company_name}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Одобрено банков:</span>
                            <p className="text-emerald-400 font-medium">{session.approved_banks.length}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Отправлено заявок:</span>
                            <p className="text-blue-400 font-medium">{submittedBanks.length}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Доступно для отправки:</span>
                            <p className="text-[#3CE8D1] font-medium">{availableBanks.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Available Banks Section */}
            {availableBanks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Plus className="h-5 w-5 text-[#3CE8D1]" />
                                Доступные банки ({availableBanks.length})
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAllAvailable}
                                    className="text-[#3CE8D1] hover:text-[#3CE8D1]/80"
                                >
                                    Выбрать все
                                </Button>
                                {selectedBanks.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSelection}
                                        className="text-[#94a3b8] hover:text-white"
                                    >
                                        Очистить
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {availableBanks.map((bank, index) => {
                                const isSelected = selectedBanks.includes(bank.name)
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleBankToggle(bank.name)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "bg-[#3CE8D1]/10 border-[#3CE8D1]/50"
                                                : "bg-[#1e3a5f]/50 border-[#1e3a5f] hover:border-[#3CE8D1]/30"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleBankToggle(bank.name)}
                                            className="border-[#3CE8D1] data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:text-[#0f2042]"
                                        />
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{bank.name}</p>
                                            <div className="flex gap-4 text-sm text-[#94a3b8] mt-1">
                                                <span>Ставка БГ: <span className="text-[#3CE8D1]">{bank.bgRate}%</span></span>
                                                <span>Срок: <span className="text-[#3CE8D1]">{bank.speed}</span></span>
                                                {bank.individual && (
                                                    <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                                                        Индивидуально
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {selectedBanks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
                                <Button
                                    onClick={handleCreateApplications}
                                    disabled={isCreating}
                                    className="w-full bg-[#3CE8D1] text-[#0f2042] hover:bg-[#3CE8D1]/90"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Создание...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Создать заявки ({selectedBanks.length} банков)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Already Submitted Banks */}
            {submittedBanks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            Заявки отправлены ({submittedBanks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {submittedBanks.map((bank, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                                >
                                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{bank.name}</p>
                                        <div className="flex gap-4 text-sm text-[#94a3b8] mt-1">
                                            <span>Ставка БГ: <span className="text-emerald-400">{bank.bgRate}%</span></span>
                                            <span>Срок: <span className="text-emerald-400">{bank.speed}</span></span>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                        Заявка создана
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rejected Banks */}
            {session.rejected_banks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-400" />
                            Отклонено ({session.rejected_banks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {session.rejected_banks.map((rejection, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                                >
                                    <span className="text-white">{rejection.bank}</span>
                                    <span className="text-sm text-red-400">{rejection.reason}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Calculator, Save, X } from "lucide-react"
import { toast } from "sonner"
import type { Application } from "@/hooks/use-applications"
import { getProductTypeLabel } from "@/lib/application-display"

// Import product-specific field components
import { BgEditFields } from "./edit-fields/bg-edit-fields"
import { KikEditFields } from "./edit-fields/kik-edit-fields"
import { CreditEditFields } from "./edit-fields/credit-edit-fields"
import { FactoringEditFields } from "./edit-fields/factoring-edit-fields"
import { LeasingEditFields } from "./edit-fields/leasing-edit-fields"
import { InsuranceEditFields } from "./edit-fields/insurance-edit-fields"
import { VedEditFields } from "./edit-fields/ved-edit-fields"
import { RkoEditFields } from "./edit-fields/rko-edit-fields"
import { TenderSupportEditFields } from "./edit-fields/tender-support-edit-fields"
import { DepositsEditFields } from "./edit-fields/deposits-edit-fields"

// =============================================================================
// ZOD SCHEMAS FOR EACH PRODUCT TYPE
// =============================================================================

// INN validation regex: 10 digits (legal entity) or 12 digits (individual)
const innSchema = z.string()
    .regex(/^(\d{10}|\d{12})$/, "ИНН должен содержать 10 или 12 цифр")
    .or(z.literal(""))
    .optional()

// Date validation helper
const validateDateRange = (startField: string, endField: string) =>
    (data: Record<string, unknown>) => {
        const start = data[startField] as string | undefined
        const end = data[endField] as string | undefined
        if (!start || !end) return true
        const startDate = new Date(start)
        const endDate = new Date(end)
        return endDate > startDate
    }

// Base schema with common fields
const baseSchema = z.object({
    amount: z.string().optional(),
    notes: z.string().optional(),
})

// Bank Guarantee schema with date validation
const bgSchema = baseSchema.extend({
    purchase_number: z.string().optional(),
    lot_number: z.string().optional(),
    guarantee_type: z.string().optional(),
    law: z.string().optional(),
    guarantee_start_date: z.string().optional(),
    guarantee_end_date: z.string().optional(),
    has_prepayment: z.boolean().optional(),
    advance_percent: z.coerce.number().min(0).max(100).optional(),
    has_customer_template: z.boolean().optional(),
    beneficiary_name: z.string().optional(),
    beneficiary_inn: innSchema,
}).refine(
    validateDateRange("guarantee_start_date", "guarantee_end_date"),
    { message: "Дата окончания гарантии должна быть позже даты начала", path: ["guarantee_end_date"] }
)

// KIK (Contract Loan) schema with date validation
const kikSchema = baseSchema.extend({
    contract_loan_type: z.string().optional(),
    law: z.string().optional(),
    purchase_number: z.string().optional(),
    lot_number: z.string().optional(),
    contract_price: z.string().optional(),
    contract_start_date: z.string().optional(),
    contract_end_date: z.string().optional(),
    credit_amount: z.string().optional(),
    credit_start_date: z.string().optional(),
    credit_end_date: z.string().optional(),
    contract_execution_percent: z.coerce.number().min(0).max(100).optional(),
    ignore_execution_percent: z.boolean().optional(),
    has_prepayment: z.boolean().optional(),
    advance_percent: z.coerce.number().min(0).max(100).optional(),
}).refine(
    validateDateRange("contract_start_date", "contract_end_date"),
    { message: "Дата окончания контракта должна быть позже даты начала", path: ["contract_end_date"] }
).refine(
    validateDateRange("credit_start_date", "credit_end_date"),
    { message: "Дата погашения кредита должна быть позже даты выдачи", path: ["credit_end_date"] }
)

// Corporate Credit schema with date validation
const creditSchema = baseSchema.extend({
    credit_sub_type: z.string().optional(),
    credit_start_date: z.string().optional(),
    credit_end_date: z.string().optional(),
    pledge_description: z.string().optional(),
}).refine(
    validateDateRange("credit_start_date", "credit_end_date"),
    { message: "Дата погашения должна быть позже даты выдачи", path: ["credit_end_date"] }
)

// Factoring schema with INN validation and financing_term_days
const factoringSchema = baseSchema.extend({
    factoring_type: z.string().optional(),
    contract_type: z.string().optional(),
    law: z.string().optional(),
    purchase_number: z.string().optional(),
    lot_number: z.string().optional(),
    contractor_inn: innSchema,
    financing_amount: z.string().optional(),
    financing_date: z.string().optional(),
    financing_term_days: z.coerce.number().min(1).max(365).optional(),
    nmc: z.string().optional(),
    shipment_volume: z.string().optional(),
    payment_delay: z.coerce.number().optional(),
})

// Leasing schema
const leasingSchema = baseSchema.extend({
    leasing_credit_type: z.string().optional(),
    leasing_amount: z.string().optional(),
    leasing_end_date: z.string().optional(),
})

// Insurance schema with term_months mapped to root
const insuranceSchema = baseSchema.extend({
    insurance_category: z.string().optional(),
    insurance_product_type: z.string().optional(),
    insurance_amount: z.string().optional(),
    insurance_term_months: z.coerce.number().min(1).max(120).optional(),
})

// VED schema
const vedSchema = baseSchema.extend({
    ved_currency: z.string().optional(),
    ved_country: z.string().optional(),
})

// RKO schema
const rkoSchema = baseSchema.extend({
    account_type: z.string().optional(),
})

// Tender support schema
const tenderSupportSchema = baseSchema.extend({
    tender_support_type: z.string().optional(),
    purchase_category: z.string().optional(),
    industry: z.string().optional(),
    term_months: z.coerce.number().min(1).max(60).optional(),
})

// Deposits schema
const depositsSchema = baseSchema.extend({
    term_months: z.coerce.number().min(1).max(120).optional(),
})

// Union type for all form data
type EditFormData = z.infer<typeof bgSchema> | 
    z.infer<typeof kikSchema> | 
    z.infer<typeof creditSchema> | 
    z.infer<typeof factoringSchema> |
    z.infer<typeof leasingSchema> |
    z.infer<typeof insuranceSchema> |
    z.infer<typeof vedSchema> |
    z.infer<typeof rkoSchema> |
    z.infer<typeof tenderSupportSchema> |
    z.infer<typeof depositsSchema>

// =============================================================================
// PRODUCT TYPE LABELS
// =============================================================================

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    bank_guarantee: "Банковская гарантия",
    tender_loan: "Тендерный займ",
    contract_loan: "Кредит на исполнение контракта (КИК)",
    corporate_credit: "Корпоративный кредит",
    factoring: "Факторинг",
    leasing: "Лизинг",
    insurance: "Страхование",
    ved: "Международные платежи (ВЭД)",
    rko: "РКО",
    special_account: "Спецсчёт",
    tender_support: "Тендерное сопровождение",
    deposits: "Депозиты",
}

// =============================================================================
// HELPER: GET SCHEMA BY PRODUCT TYPE
// =============================================================================

function getSchemaForProduct(productType: string) {
    switch (productType) {
        case "bank_guarantee":
        case "tender_loan":
            return bgSchema
        case "contract_loan":
            return kikSchema
        case "corporate_credit":
            return creditSchema
        case "factoring":
            return factoringSchema
        case "leasing":
            return leasingSchema
        case "insurance":
            return insuranceSchema
        case "ved":
            return vedSchema
        case "rko":
        case "special_account":
            return rkoSchema
        case "tender_support":
            return tenderSupportSchema
        case "deposits":
            return depositsSchema
        default:
            return baseSchema
    }
}

// =============================================================================
// HELPER: GET DEFAULT VALUES FROM APPLICATION
// =============================================================================

function getDefaultValues(application: Application): EditFormData {
    const gd = application.goscontract_data || {}
    const productType = application.product_type

    // Common base values
    const base = {
        amount: application.amount || "",
        notes: application.notes || "",
    }

    switch (productType) {
        case "bank_guarantee":
        case "tender_loan":
            return {
                ...base,
                purchase_number: gd.purchase_number || application.tender_number || "",
                lot_number: gd.lot_number || "",
                guarantee_type: application.guarantee_type || gd.bg_type || "",
                law: application.tender_law || gd.law || "",
                guarantee_start_date: gd.guarantee_start_date || "",
                guarantee_end_date: gd.guarantee_end_date || "",
                has_prepayment: gd.has_prepayment ?? false,
                advance_percent: gd.advance_percent || 0,
                has_customer_template: gd.has_customer_template ?? false,
                beneficiary_name: gd.beneficiary_name || "",
                beneficiary_inn: gd.beneficiary_inn || "",
            }

        case "contract_loan":
            return {
                ...base,
                contract_loan_type: gd.contract_loan_type || "",
                law: application.tender_law || gd.law || "",
                purchase_number: gd.purchase_number || application.tender_number || "",
                lot_number: gd.lot_number || "",
                contract_price: gd.contract_price || "",
                contract_start_date: gd.contract_start_date || "",
                contract_end_date: gd.contract_end_date || "",
                credit_amount: gd.credit_amount || application.amount || "",
                credit_start_date: gd.credit_start_date || "",
                credit_end_date: gd.credit_end_date || "",
                contract_execution_percent: gd.contract_execution_percent || 0,
                ignore_execution_percent: gd.ignore_execution_percent ?? false,
                has_prepayment: gd.has_prepayment ?? false,
                advance_percent: gd.advance_percent || 0,
            }

        case "corporate_credit":
            return {
                ...base,
                credit_sub_type: application.credit_sub_type || (gd as Record<string, unknown>).credit_sub_type as string || "",
                credit_start_date: gd.credit_start_date || "",
                credit_end_date: gd.credit_end_date || "",
                pledge_description: application.pledge_description || (gd as Record<string, unknown>).pledge_description as string || "",
            }

        case "factoring":
            return {
                ...base,
                factoring_type: application.factoring_type || gd.factoring_type || "",
                contract_type: gd.contract_type || "",
                law: application.tender_law || gd.law || "",
                purchase_number: gd.purchase_number || application.tender_number || "",
                lot_number: gd.lot_number || "",
                contractor_inn: application.contractor_inn || gd.contractor_inn || gd.customer_inn || "",
                financing_amount: gd.financing_amount || application.amount || "",
                financing_date: gd.financing_date || "",
                financing_term_days: application.financing_term_days || (gd as Record<string, unknown>).financing_term_days as number || undefined,
                nmc: gd.nmc || "",
                shipment_volume: gd.shipment_volume || "",
                payment_delay: gd.payment_delay || 0,
            }

        case "leasing":
            return {
                ...base,
                leasing_credit_type: gd.leasing_credit_type || "",
                leasing_amount: gd.leasing_amount || application.amount || "",
                leasing_end_date: gd.leasing_end_date || "",
            }

        case "insurance":
            return {
                ...base,
                insurance_category: application.insurance_category || gd.insurance_category || "",
                insurance_product_type: application.insurance_product_type || gd.insurance_product_type || "",
                insurance_amount: gd.insurance_amount || application.amount || "",
                insurance_term_months: gd.insurance_term_months || application.term_months || 12,
            }

        case "ved":
            return {
                ...base,
                ved_currency: application.ved_currency || gd.currency || "",
                ved_country: application.ved_country || gd.country || "",
            }

        case "rko":
        case "special_account":
            return {
                ...base,
                account_type: application.account_type || (gd as Record<string, unknown>).account_type as string || "",
            }

        case "tender_support":
            return {
                ...base,
                tender_support_type: application.tender_support_type || "",
                purchase_category: application.purchase_category || "",
                industry: application.industry || "",
                term_months: application.term_months || undefined,
            }

        case "deposits":
            return {
                ...base,
                term_months: application.term_months || undefined,
            }

        default:
            return base
    }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ApplicationEditModalProps {
    isOpen: boolean
    onClose: () => void
    application: Application
    onSave: (data: Partial<EditFormData>) => Promise<boolean>
    onRecalculate?: () => void
}

/**
 * ApplicationEditModal - Polymorphic modal for editing applications of any product type
 * Based on BankOn24 design pattern with Tiffany color scheme
 */
export function ApplicationEditModal({
    isOpen,
    onClose,
    application,
    onSave,
    onRecalculate,
}: ApplicationEditModalProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [isRecalculating, setIsRecalculating] = useState(false)

    const productType = application.product_type
    const productLabel = getProductTypeLabel(productType, PRODUCT_TYPE_LABELS[productType])

    // Get schema and default values based on product type
    const schema = getSchemaForProduct(productType)
    const defaultValues = getDefaultValues(application)

    // Initialize form
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    })

    // Reset form when opening or switching application
    useEffect(() => {
        if (!isOpen || !application) return
        if (form.formState.isDirty) return
        form.reset(getDefaultValues(application))
    }, [application, form, isOpen])

    // Handle form submission
    const handleSubmit = async (data: EditFormData) => {
        setIsSaving(true)
        try {
            const success = await onSave(data)
            if (success) {
                toast.success("Данные заявки обновлены")
                onClose()
            }
        } catch {
            toast.error("Ошибка сохранения данных")
        } finally {
            setIsSaving(false)
        }
    }

    // Handle recalculation
    const handleRecalculate = async () => {
        setIsRecalculating(true)
        try {
            const data = form.getValues()
            const success = await onSave(data as EditFormData)
            if (success && onRecalculate) {
                onRecalculate()
                toast.success("Условия пересчитаны")
            }
        } catch {
            toast.error("Ошибка пересчёта")
        } finally {
            setIsRecalculating(false)
        }
    }

    // Render product-specific fields
    const renderProductFields = () => {
        switch (productType) {
            case "bank_guarantee":
            case "tender_loan":
                return <BgEditFields form={form} />
            case "contract_loan":
                return <KikEditFields form={form} />
            case "corporate_credit":
                return <CreditEditFields form={form} />
            case "factoring":
                return <FactoringEditFields form={form} />
            case "leasing":
                return <LeasingEditFields form={form} />
            case "insurance":
                return <InsuranceEditFields form={form} />
            case "ved":
                return <VedEditFields form={form} />
            case "rko":
            case "special_account":
                return <RkoEditFields form={form} />
            case "tender_support":
                return <TenderSupportEditFields form={form} />
            case "deposits":
                return <DepositsEditFields form={form} />
            default:
                return (
                    <div className="text-center py-8 text-[#94a3b8]">
                        Редактирование недоступно для этого типа продукта
                    </div>
                )
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0f2042] border-[#1e3a5f] text-white w-full max-w-2xl max-h-[calc(100vh-0.5rem)] max-h-[calc(100dvh-0.5rem)] sm:max-h-[calc(100vh-1rem)] sm:max-h-[calc(100dvh-1rem)] overflow-hidden p-0 flex min-h-0 flex-col">
                <DialogHeader className="shrink-0 border-b border-[#1e3a5f] px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        Редактирование заявки #{application.id}
                    </DialogTitle>
                    <DialogDescription className="text-[#94a3b8]">
                        {productLabel}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <div className="space-y-6">
                            {renderProductFields()}
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 border-t border-[#1e3a5f] px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f]"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Отмена
                        </Button>
                        
                        {onRecalculate && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleRecalculate}
                                disabled={isRecalculating || isSaving}
                                className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                            >
                                {isRecalculating ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Calculator className="h-4 w-4 mr-2" />
                                )}
                                РАССЧИТАТЬ
                            </Button>
                        )}
                        
                        <Button
                            type="submit"
                            disabled={isSaving || isRecalculating}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            СОХРАНИТЬ
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

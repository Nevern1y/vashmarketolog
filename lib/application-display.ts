export const PRODUCT_TYPE_LABELS: Record<string, string> = {
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

export const getProductTypeLabel = (
    productType?: string | null,
    productTypeDisplay?: string | null
): string => {
    const normalizedDisplay = productTypeDisplay?.trim()
    if (normalizedDisplay && !PRODUCT_TYPE_LABELS[normalizedDisplay]) {
        return normalizedDisplay
    }
    return PRODUCT_TYPE_LABELS[productType || normalizedDisplay || ""] || "Заявка"
}

export type AmountSource = {
    product_type?: string | null
    amount?: string | number | null
    goscontract_data?: Record<string, unknown> | null
}

export const getPrimaryAmountValue = (app: AmountSource): number | null => {
    const data = (app.goscontract_data || {}) as Record<string, unknown>
    const toNumber = (value: unknown): number | null => {
        if (value === null || value === undefined || value === "") return null
        const num = Number(String(value).replace(/\s/g, ""))
        return Number.isFinite(num) ? num : null
    }

    switch (app.product_type) {
        case "rko":
        case "special_account":
            return null
        case "contract_loan":
            return toNumber(data.credit_amount ?? app.amount)
        case "factoring":
            return toNumber(data.financing_amount ?? app.amount)
        case "leasing":
            return toNumber(data.leasing_amount ?? app.amount)
        case "insurance":
            return toNumber(data.insurance_coverage_amount ?? data.insurance_amount ?? app.amount)
        case "deposits":
            return toNumber(data.deposit_amount ?? app.amount)
        default:
            return toNumber(app.amount)
    }
}

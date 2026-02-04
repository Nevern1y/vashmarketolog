import type { Application } from "@/hooks/use-applications"

export interface ApplicationEditSource {
    product_type: Application["product_type"]
    goscontract_data?: Application["goscontract_data"] | null
}

export function buildApplicationUpdatePayload(
    application: ApplicationEditSource,
    data: Record<string, unknown>
) {
    const productType = application.product_type

    let goscontractUpdate: Record<string, unknown> = {
        ...(application.goscontract_data || {}),
    }

    if (data.purchase_number !== undefined) goscontractUpdate.purchase_number = data.purchase_number
    if (data.lot_number !== undefined) goscontractUpdate.lot_number = data.lot_number
    if (data.law !== undefined) goscontractUpdate.law = data.law

    switch (productType) {
        case "bank_guarantee":
        case "tender_loan":
            goscontractUpdate = {
                ...goscontractUpdate,
                bg_type: data.guarantee_type as string,
                guarantee_start_date: data.guarantee_start_date as string,
                guarantee_end_date: data.guarantee_end_date as string,
                has_prepayment: data.has_prepayment as boolean,
                advance_percent: data.advance_percent as number,
                has_customer_template: data.has_customer_template as boolean,
                beneficiary_name: data.beneficiary_name as string,
                beneficiary_inn: data.beneficiary_inn as string,
            }
            break

        case "contract_loan":
            goscontractUpdate = {
                ...goscontractUpdate,
                contract_loan_type: data.contract_loan_type as string,
                contract_price: data.contract_price as string,
                contract_start_date: data.contract_start_date as string,
                contract_end_date: data.contract_end_date as string,
                credit_amount: data.credit_amount as string,
                credit_start_date: data.credit_start_date as string,
                credit_end_date: data.credit_end_date as string,
                contract_execution_percent: data.contract_execution_percent as number,
                ignore_execution_percent: data.ignore_execution_percent as boolean,
                has_prepayment: data.has_prepayment as boolean,
                advance_percent: data.advance_percent as number,
            }
            break

        case "corporate_credit":
            goscontractUpdate = {
                ...goscontractUpdate,
                credit_sub_type: data.credit_sub_type as string,
                credit_start_date: data.credit_start_date as string,
                credit_end_date: data.credit_end_date as string,
                pledge_description: data.pledge_description as string,
            }
            break

        case "factoring":
            goscontractUpdate = {
                ...goscontractUpdate,
                factoring_type: data.factoring_type as string,
                contract_type: data.contract_type as string,
                contractor_inn: data.contractor_inn as string,
                financing_amount: data.financing_amount as string,
                financing_date: data.financing_date as string,
                financing_term_days: data.financing_term_days as number,
                nmc: data.nmc as string,
                shipment_volume: data.shipment_volume as string,
                payment_delay: data.payment_delay as number,
            }
            break

        case "leasing":
            goscontractUpdate = {
                ...goscontractUpdate,
                leasing_credit_type: data.leasing_credit_type as string,
                leasing_amount: data.leasing_amount as string,
                leasing_end_date: data.leasing_end_date as string,
            }
            break

        case "insurance":
            goscontractUpdate = {
                ...goscontractUpdate,
                insurance_category: data.insurance_category as string,
                insurance_product_type: data.insurance_product_type as string,
                insurance_amount: data.insurance_amount as string,
                insurance_term_months: data.insurance_term_months as number,
            }
            break

        case "ved":
            goscontractUpdate = {
                ...goscontractUpdate,
                currency: data.ved_currency as string,
                country: data.ved_country as string,
            }
            break

        case "rko":
        case "special_account":
            goscontractUpdate = {
                ...goscontractUpdate,
                account_type: data.account_type as string,
            }
            break
    }

    const updatePayload: Record<string, unknown> = {
        amount: data.amount as string,
        goscontract_data: goscontractUpdate,
    }

    if (productType === "bank_guarantee" || productType === "tender_loan") {
        updatePayload.guarantee_type = data.guarantee_type as string
        updatePayload.tender_law = data.law as string
        updatePayload.tender_number = data.purchase_number as string
    }
    if (productType === "corporate_credit") {
        updatePayload.credit_sub_type = data.credit_sub_type as string
        updatePayload.pledge_description = data.pledge_description as string
    }
    if (productType === "factoring") {
        updatePayload.factoring_type = data.factoring_type as string
        updatePayload.contractor_inn = data.contractor_inn as string
        if (data.financing_term_days !== undefined) {
            updatePayload.financing_term_days = data.financing_term_days as number
        }
    }
    if (productType === "insurance") {
        updatePayload.insurance_category = data.insurance_category as string
        updatePayload.insurance_product_type = data.insurance_product_type as string
        if (data.insurance_term_months !== undefined) {
            updatePayload.term_months = data.insurance_term_months as number
        }
    }
    if (productType === "tender_support") {
        updatePayload.tender_support_type = data.tender_support_type as string
        updatePayload.purchase_category = data.purchase_category as string
        updatePayload.industry = data.industry as string
        if (data.term_months !== undefined) {
            updatePayload.term_months = data.term_months as number
        }
    }
    if (productType === "deposits") {
        if (data.term_months !== undefined) {
            updatePayload.term_months = data.term_months as number
        }
    }
    if (productType === "ved") {
        updatePayload.ved_currency = data.ved_currency as string
        updatePayload.ved_country = data.ved_country as string
    }
    if (productType === "rko" || productType === "special_account") {
        updatePayload.account_type = data.account_type as string
    }

    return { updatePayload, goscontractUpdate }
}

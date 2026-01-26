"use client"

import {
    SectionHeader,
    AmountInput,
    SelectField,
    NumberInput,
    INSURANCE_CATEGORIES,
    INSURANCE_PRODUCTS,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * InsuranceEditFields - Insurance specific fields
 */
export function InsuranceEditFields({ form }: EditFieldsProps) {
    const selectedCategory = form.watch("insurance_category") || ""
    const availableProducts = selectedCategory ? (INSURANCE_PRODUCTS[selectedCategory] || []) : []

    return (
        <>
            {/* Section: Insurance Type */}
            <div className="space-y-4">
                <SectionHeader title="Вид страхования" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={selectedCategory}
                        onValueChange={(v) => {
                            form.setValue("insurance_category", v)
                            form.setValue("insurance_product_type", "") // Reset product when category changes
                        }}
                        options={INSURANCE_CATEGORIES}
                        placeholder="Выберите категорию"
                        label="Категория страхования"
                    />
                    <SelectField
                        value={form.watch("insurance_product_type") || ""}
                        onValueChange={(v) => form.setValue("insurance_product_type", v)}
                        options={availableProducts}
                        placeholder={selectedCategory ? "Выберите продукт" : "Сначала выберите категорию"}
                        label="Страховой продукт"
                    />
                </div>
            </div>

            {/* Section: Insurance Parameters */}
            <div className="space-y-4">
                <SectionHeader title="Параметры страхования" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AmountInput
                        value={form.watch("insurance_amount") || ""}
                        onChange={(v) => form.setValue("insurance_amount", v)}
                        label="Страховая сумма, руб."
                        error={form.formState.errors.insurance_amount?.message as string | undefined}
                    />
                    <NumberInput
                        value={form.watch("insurance_term_months")}
                        onChange={(v) => form.setValue("insurance_term_months", v)}
                        label="Срок страхования"
                        min={1}
                        max={120}
                        suffix="мес."
                        placeholder="12"
                    />
                </div>
            </div>
        </>
    )
}

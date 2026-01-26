"use client"

import {
    SectionHeader,
    AmountInput,
    NumberInput,
    SelectField,
    TextInput,
    TENDER_SUPPORT_TYPES,
    PURCHASE_CATEGORIES,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * TenderSupportEditFields - Tender Support specific fields
 */
export function TenderSupportEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Support Type */}
            <div className="space-y-4">
                <SectionHeader title="Параметры сопровождения" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={form.watch("tender_support_type") || ""}
                        onValueChange={(v) => form.setValue("tender_support_type", v)}
                        options={TENDER_SUPPORT_TYPES}
                        placeholder="Выберите тип"
                        label="Вариант сопровождения"
                    />
                    <SelectField
                        value={form.watch("purchase_category") || ""}
                        onValueChange={(v) => form.setValue("purchase_category", v)}
                        options={PURCHASE_CATEGORIES}
                        placeholder="Выберите категорию"
                        label="Тип закупки"
                    />
                </div>
            </div>

            {/* Section: Industry */}
            <div className="space-y-4">
                <SectionHeader title="Отрасль" />
                <TextInput
                    value={form.watch("industry") || ""}
                    onChange={(v) => form.setValue("industry", v)}
                    placeholder="Строительство, IT, логистика..."
                    label="Закупки в отрасли"
                />
            </div>

            {/* Section: Terms */}
            <div className="space-y-4">
                <SectionHeader title="Условия" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AmountInput
                        value={form.watch("amount") || ""}
                        onChange={(v) => form.setValue("amount", v)}
                        label="Бюджет сопровождения, руб."
                        error={form.formState.errors.amount?.message as string | undefined}
                    />
                    <NumberInput
                        value={form.watch("term_months")}
                        onChange={(v) => form.setValue("term_months", v)}
                        label="Срок сопровождения"
                        min={1}
                        max={60}
                        suffix="мес."
                        placeholder="6"
                    />
                </div>
            </div>
        </>
    )
}

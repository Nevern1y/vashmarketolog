"use client"

import {
    SectionHeader,
    AmountInput,
    SelectField,
    VED_CURRENCIES,
    VED_COUNTRIES,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * VedEditFields - Foreign Trade (ВЭД) specific fields
 */
export function VedEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Payment Details */}
            <div className="space-y-4">
                <SectionHeader title="Параметры платежа" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={form.watch("ved_currency") || ""}
                        onValueChange={(v) => form.setValue("ved_currency", v)}
                        options={VED_CURRENCIES}
                        placeholder="Выберите валюту"
                        label="Валюта платежа"
                    />
                    <SelectField
                        value={form.watch("ved_country") || ""}
                        onValueChange={(v) => form.setValue("ved_country", v)}
                        options={VED_COUNTRIES}
                        placeholder="Выберите страну"
                        label="Страна назначения"
                    />
                </div>
                <AmountInput
                    value={form.watch("amount") || ""}
                    onChange={(v) => form.setValue("amount", v)}
                    label="Сумма платежа"
                    error={form.formState.errors.amount?.message as string | undefined}
                />
            </div>
        </>
    )
}

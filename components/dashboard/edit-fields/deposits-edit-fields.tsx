"use client"

import {
    SectionHeader,
    AmountInput,
    NumberInput,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * DepositsEditFields - Deposits specific fields
 */
export function DepositsEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Deposit Terms */}
            <div className="space-y-4">
                <SectionHeader title="Параметры депозита" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AmountInput
                        value={form.watch("amount") || ""}
                        onChange={(v) => form.setValue("amount", v)}
                        label="Сумма размещения, руб."
                        error={form.formState.errors.amount?.message as string | undefined}
                    />
                    <NumberInput
                        value={form.watch("term_months")}
                        onChange={(v) => form.setValue("term_months", v)}
                        label="Срок размещения"
                        min={1}
                        max={120}
                        suffix="мес."
                        placeholder="3"
                    />
                </div>
            </div>
        </>
    )
}

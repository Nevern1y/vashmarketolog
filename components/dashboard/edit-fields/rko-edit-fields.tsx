"use client"

import {
    SectionHeader,
    SelectField,
    RKO_TYPES,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * RkoEditFields - RKO/Special Account specific fields
 */
export function RkoEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Account Type */}
            <div className="space-y-4">
                <SectionHeader title="Тип счёта" />
                <SelectField
                    value={form.watch("account_type") || ""}
                    onValueChange={(v) => form.setValue("account_type", v)}
                    options={RKO_TYPES}
                    placeholder="Выберите тип счёта"
                    label="Вид расчётного счёта"
                />
            </div>
        </>
    )
}

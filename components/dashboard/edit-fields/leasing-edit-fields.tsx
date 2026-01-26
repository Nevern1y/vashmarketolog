"use client"

import { Input } from "@/components/ui/input"
import {
    SectionHeader,
    FormField,
    AmountInput,
    SelectField,
    LEASING_TYPES,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * LeasingEditFields - Leasing specific fields
 */
export function LeasingEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Leasing Type */}
            <div className="space-y-4">
                <SectionHeader title="Предмет лизинга" />
                <SelectField
                    value={form.watch("leasing_credit_type") || ""}
                    onValueChange={(v) => form.setValue("leasing_credit_type", v)}
                    options={LEASING_TYPES}
                    placeholder="Выберите тип"
                    label="Тип предмета лизинга"
                />
            </div>

            {/* Section: Amount and Term */}
            <div className="space-y-4">
                <SectionHeader title="Параметры лизинга" />
                <AmountInput
                    value={form.watch("leasing_amount") || ""}
                    onChange={(v) => form.setValue("leasing_amount", v)}
                    label="Сумма лизинга, руб."
                    error={form.formState.errors.leasing_amount?.message as string | undefined}
                />
                <FormField label="Дата окончания лизинга">
                    <Input
                        type="date"
                        value={form.watch("leasing_end_date") || ""}
                        onChange={(e) => form.setValue("leasing_end_date", e.target.value)}
                        className="bg-[#0a1628] border-[#1e3a5f] text-white"
                    />
                </FormField>
            </div>
        </>
    )
}

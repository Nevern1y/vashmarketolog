"use client"

import { Textarea } from "@/components/ui/textarea"
import {
    SectionHeader,
    FormField,
    AmountInput,
    DateRangeInput,
    SelectField,
    CREDIT_TYPES,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * CreditEditFields - Corporate Credit specific fields
 */
export function CreditEditFields({ form }: EditFieldsProps) {
    return (
        <>
            {/* Section: Credit Type */}
            <div className="space-y-4">
                <SectionHeader title="Тип кредита" />
                <SelectField
                    value={form.watch("credit_sub_type") || ""}
                    onValueChange={(v) => form.setValue("credit_sub_type", v)}
                    options={CREDIT_TYPES}
                    placeholder="Выберите тип кредита"
                    label="Вид кредита"
                />
            </div>

            {/* Section: Amount and Term */}
            <div className="space-y-4">
                <SectionHeader title="Параметры кредита" />
                <AmountInput
                    value={form.watch("amount") || ""}
                    onChange={(v) => form.setValue("amount", v)}
                    label="Сумма кредита, руб."
                    error={form.formState.errors.amount?.message as string | undefined}
                />
                <DateRangeInput
                    startDate={form.watch("credit_start_date") || ""}
                    endDate={form.watch("credit_end_date") || ""}
                    onStartChange={(v) => form.setValue("credit_start_date", v)}
                    onEndChange={(v) => form.setValue("credit_end_date", v)}
                    startLabel="Дата выдачи"
                    endLabel="Дата погашения"
                    startError={form.formState.errors.credit_start_date?.message as string | undefined}
                    endError={form.formState.errors.credit_end_date?.message as string | undefined}
                />
            </div>

            {/* Section: Pledge */}
            <div className="space-y-4">
                <SectionHeader title="Обеспечение" />
                <FormField label="Описание залога">
                    <Textarea
                        value={form.watch("pledge_description") || ""}
                        onChange={(e) => form.setValue("pledge_description", e.target.value)}
                        placeholder="Опишите предмет залога (недвижимость, оборудование, товары в обороте и т.д.)"
                        className="bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#475569] min-h-[100px]"
                    />
                </FormField>
            </div>
        </>
    )
}

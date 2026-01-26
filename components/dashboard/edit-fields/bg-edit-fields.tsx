"use client"

import { Input } from "@/components/ui/input"
import {
    SectionHeader,
    FormField,
    AmountInput,
    DateRangeInput,
    SelectField,
    ButtonGroup,
    SwitchField,
    TextInput,
    GUARANTEE_TYPES,
    FEDERAL_LAWS,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * BgEditFields - Bank Guarantee specific fields
 */
export function BgEditFields({ form }: EditFieldsProps) {
    const hasPrepayment = form.watch("has_prepayment")

    return (
        <>
            {/* Section: Tender Info */}
            <div className="space-y-4">
                <SectionHeader title="Информация о закупке" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        value={form.watch("purchase_number") || ""}
                        onChange={(v) => form.setValue("purchase_number", v)}
                        placeholder="0123456789012345678"
                        label="№ извещения"
                    />
                    <TextInput
                        value={form.watch("lot_number") || ""}
                        onChange={(v) => form.setValue("lot_number", v)}
                        placeholder="1"
                        label="№ лота"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        value={form.watch("beneficiary_name") || ""}
                        onChange={(v) => form.setValue("beneficiary_name", v)}
                        placeholder="ООО 'Заказчик'"
                        label="Наименование заказчика"
                    />
                    <TextInput
                        value={form.watch("beneficiary_inn") || ""}
                        onChange={(v) => form.setValue("beneficiary_inn", v)}
                        placeholder="7712345678"
                        label="ИНН заказчика"
                        error={form.formState.errors.beneficiary_inn?.message as string | undefined}
                    />
                </div>
            </div>

            {/* Section: Guarantee Type */}
            <div className="space-y-4">
                <SectionHeader title="Параметры гарантии" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={form.watch("guarantee_type") || ""}
                        onValueChange={(v) => form.setValue("guarantee_type", v)}
                        options={GUARANTEE_TYPES}
                        placeholder="Выберите тип"
                        label="Тип банковской гарантии"
                    />
                    <ButtonGroup
                        value={form.watch("law") || ""}
                        onChange={(v) => form.setValue("law", v)}
                        options={FEDERAL_LAWS}
                        label="Федеральный закон"
                    />
                </div>
                <AmountInput
                    value={form.watch("amount") || ""}
                    onChange={(v) => form.setValue("amount", v)}
                    label="Сумма БГ, руб."
                    error={form.formState.errors.amount?.message as string | undefined}
                />
            </div>

            {/* Section: Dates */}
            <div className="space-y-4">
                <SectionHeader title="Срок гарантии" />
                <DateRangeInput
                    startDate={form.watch("guarantee_start_date") || ""}
                    endDate={form.watch("guarantee_end_date") || ""}
                    onStartChange={(v) => form.setValue("guarantee_start_date", v)}
                    onEndChange={(v) => form.setValue("guarantee_end_date", v)}
                    startLabel="Срок БГ с"
                    endLabel="Срок БГ по"
                    startError={form.formState.errors.guarantee_start_date?.message as string | undefined}
                    endError={form.formState.errors.guarantee_end_date?.message as string | undefined}
                />
            </div>

            {/* Section: Additional Options */}
            <div className="space-y-4">
                <SectionHeader title="Дополнительные параметры" />
                <SwitchField
                    checked={hasPrepayment ?? false}
                    onCheckedChange={(v) => form.setValue("has_prepayment", v)}
                    label="Наличие авансирования"
                    description="Заказчик выплачивает аванс подрядчику"
                >
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min={0}
                            max={100}
                            value={form.watch("advance_percent") || ""}
                            onChange={(e) => form.setValue("advance_percent", Number(e.target.value))}
                            className="w-20 bg-[#0f2042] border-[#1e3a5f] text-white text-center"
                        />
                        <span className="text-[#94a3b8]">%</span>
                    </div>
                </SwitchField>
                <SwitchField
                    checked={form.watch("has_customer_template") ?? false}
                    onCheckedChange={(v) => form.setValue("has_customer_template", v)}
                    label="Шаблон заказчика"
                    description="Заказчик требует использование своего шаблона БГ"
                />
            </div>
        </>
    )
}

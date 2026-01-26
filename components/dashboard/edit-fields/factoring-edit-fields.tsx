"use client"

import {
    SectionHeader,
    AmountInput,
    SelectField,
    TextInput,
    NumberInput,
    ButtonGroup,
    FACTORING_TYPES,
    FEDERAL_LAWS,
    type EditFieldsProps,
} from "./shared-edit-components"
import { Input } from "@/components/ui/input"
import { FormField } from "./shared-edit-components"

/**
 * FactoringEditFields - Factoring specific fields
 */
export function FactoringEditFields({ form }: EditFieldsProps) {
    const CONTRACT_TYPES = [
        { value: "gov", label: "Госконтракт" },
        { value: "commercial", label: "Коммерческий" },
    ]

    return (
        <>
            {/* Section: Factoring Type */}
            <div className="space-y-4">
                <SectionHeader title="Тип факторинга" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={form.watch("factoring_type") || ""}
                        onValueChange={(v) => form.setValue("factoring_type", v)}
                        options={FACTORING_TYPES}
                        placeholder="Выберите тип"
                        label="Вид факторинга"
                    />
                    <ButtonGroup
                        value={form.watch("contract_type") || ""}
                        onChange={(v) => form.setValue("contract_type", v)}
                        options={CONTRACT_TYPES}
                        label="Тип контракта"
                    />
                </div>
            </div>

            {/* Section: Contract Info (for gov contracts) */}
            {form.watch("contract_type") === "gov" && (
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
                    <ButtonGroup
                        value={form.watch("law") || ""}
                        onChange={(v) => form.setValue("law", v)}
                        options={FEDERAL_LAWS}
                        label="Федеральный закон"
                    />
                </div>
            )}

            {/* Section: Debtor */}
            <div className="space-y-4">
                <SectionHeader title="Дебитор" />
                <TextInput
                    value={form.watch("contractor_inn") || ""}
                    onChange={(v) => form.setValue("contractor_inn", v)}
                    placeholder="7712345678"
                    label="ИНН дебитора (контрагента)"
                    error={form.formState.errors.contractor_inn?.message as string | undefined}
                />
            </div>

            {/* Section: Financing */}
            <div className="space-y-4">
                <SectionHeader title="Параметры финансирования" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AmountInput
                        value={form.watch("financing_amount") || ""}
                        onChange={(v) => form.setValue("financing_amount", v)}
                        label="Сумма финансирования, руб."
                    />
                    <AmountInput
                        value={form.watch("nmc") || ""}
                        onChange={(v) => form.setValue("nmc", v)}
                        label="НМЦ (начальная макс. цена), руб."
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AmountInput
                        value={form.watch("shipment_volume") || ""}
                        onChange={(v) => form.setValue("shipment_volume", v)}
                        label="Объём отгрузки в месяц, руб."
                    />
                    <NumberInput
                        value={form.watch("payment_delay")}
                        onChange={(v) => form.setValue("payment_delay", v)}
                        label="Отсрочка платежа"
                        min={1}
                        max={365}
                        suffix="дней"
                        placeholder="30"
                    />
                    <NumberInput
                        value={form.watch("financing_term_days")}
                        onChange={(v) => form.setValue("financing_term_days", v)}
                        label="Срок финансирования"
                        min={1}
                        max={365}
                        suffix="дней"
                        placeholder="30"
                    />
                </div>
                <FormField label="Дата финансирования">
                    <Input
                        type="date"
                        value={form.watch("financing_date") || ""}
                        onChange={(e) => form.setValue("financing_date", e.target.value)}
                        className="bg-[#0a1628] border-[#1e3a5f] text-white"
                    />
                </FormField>
            </div>
        </>
    )
}

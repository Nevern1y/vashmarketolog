"use client"

import { Input } from "@/components/ui/input"
import {
    SectionHeader,
    AmountInput,
    DateRangeInput,
    SelectField,
    ButtonGroup,
    SwitchField,
    TextInput,
    NumberInput,
    KIK_TYPES,
    FEDERAL_LAWS,
    type EditFieldsProps,
} from "./shared-edit-components"

/**
 * KikEditFields - Contract Loan (КИК) specific fields
 */
export function KikEditFields({ form }: EditFieldsProps) {
    const hasPrepayment = form.watch("has_prepayment")
    const ignoreExecution = form.watch("ignore_execution_percent")

    return (
        <>
            {/* Section: Loan Type */}
            <div className="space-y-4">
                <SectionHeader title="Тип кредита" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        value={form.watch("contract_loan_type") || ""}
                        onValueChange={(v) => form.setValue("contract_loan_type", v)}
                        options={KIK_TYPES}
                        placeholder="Выберите тип"
                        label="Тип кредита/займа"
                    />
                    <ButtonGroup
                        value={form.watch("law") || ""}
                        onChange={(v) => form.setValue("law", v)}
                        options={FEDERAL_LAWS}
                        label="Федеральный закон"
                    />
                </div>
            </div>

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
            </div>

            {/* Section: Contract */}
            <div className="space-y-4">
                <SectionHeader title="Параметры контракта" />
                <AmountInput
                    value={form.watch("contract_price") || ""}
                    onChange={(v) => form.setValue("contract_price", v)}
                    label="Цена контракта, руб."
                />
                <DateRangeInput
                    startDate={form.watch("contract_start_date") || ""}
                    endDate={form.watch("contract_end_date") || ""}
                    onStartChange={(v) => form.setValue("contract_start_date", v)}
                    onEndChange={(v) => form.setValue("contract_end_date", v)}
                    startLabel="Дата начала контракта"
                    endLabel="Дата окончания контракта"
                    startError={form.formState.errors.contract_start_date?.message as string | undefined}
                    endError={form.formState.errors.contract_end_date?.message as string | undefined}
                />
            </div>

            {/* Section: Credit */}
            <div className="space-y-4">
                <SectionHeader title="Параметры кредита" />
                <AmountInput
                    value={form.watch("credit_amount") || ""}
                    onChange={(v) => form.setValue("credit_amount", v)}
                    label="Сумма кредита, руб."
                    error={form.formState.errors.credit_amount?.message as string | undefined}
                />
                <DateRangeInput
                    startDate={form.watch("credit_start_date") || ""}
                    endDate={form.watch("credit_end_date") || ""}
                    onStartChange={(v) => form.setValue("credit_start_date", v)}
                    onEndChange={(v) => form.setValue("credit_end_date", v)}
                    startLabel="Дата выдачи кредита"
                    endLabel="Дата погашения"
                    startError={form.formState.errors.credit_start_date?.message as string | undefined}
                    endError={form.formState.errors.credit_end_date?.message as string | undefined}
                />
            </div>

            {/* Section: Execution */}
            <div className="space-y-4">
                <SectionHeader title="Исполнение контракта" />
                <SwitchField
                    checked={ignoreExecution ?? false}
                    onCheckedChange={(v) => form.setValue("ignore_execution_percent", v)}
                    label="Игнорировать % исполнения"
                    description="Не учитывать процент выполнения контракта"
                />
                {!ignoreExecution && (
                    <NumberInput
                        value={form.watch("contract_execution_percent")}
                        onChange={(v) => form.setValue("contract_execution_percent", v)}
                        label="Процент исполнения контракта"
                        min={0}
                        max={100}
                        suffix="%"
                        placeholder="0"
                    />
                )}
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
            </div>
        </>
    )
}

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { UseFormReturn } from "react-hook-form"

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface EditFieldsProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>
}

// =============================================================================
// SHARED CONSTANTS
// =============================================================================

// Federal law options
export const FEDERAL_LAWS = [
    { value: "44_fz", label: "44-ФЗ" },
    { value: "223_fz", label: "223-ФЗ" },
    { value: "615_pp", label: "615-ПП" },
    { value: "kbg", label: "КБГ" },
    { value: "275_fz", label: "275-ФЗ" },
] as const

// BG Types
export const GUARANTEE_TYPES = [
    { value: "application_security", label: "На участие" },
    { value: "contract_execution", label: "На обеспечение исполнения контракта" },
    { value: "advance_return", label: "На возврат аванса" },
    { value: "warranty_obligations", label: "На гарантийный период" },
    { value: "payment_guarantee", label: "На гарантию оплаты товара" },
    { value: "vat_refund", label: "На возвращение НДС" },
] as const

// KIK Types
export const KIK_TYPES = [
    { value: "credit_execution", label: "Кредит на исполнение контракта" },
    { value: "loan", label: "Займ" },
] as const

// Credit Types
export const CREDIT_TYPES = [
    { value: "express", label: "Экспресс-кредит" },
    { value: "working_capital", label: "Кредит на пополнение оборотных средств" },
    { value: "corporate", label: "Корпоративный кредит" },
] as const

// Factoring Types
export const FACTORING_TYPES = [
    { value: "classic", label: "Классический факторинг" },
    { value: "closed", label: "Закрытый факторинг" },
    { value: "procurement", label: "Закупочный факторинг" },
] as const

// Leasing Types
export const LEASING_TYPES = [
    { value: "equipment", label: "Оборудование" },
    { value: "special_tech", label: "Спецтехника" },
    { value: "auto", label: "Автотранспорт" },
    { value: "other", label: "Другое" },
] as const

// Insurance Categories
export const INSURANCE_CATEGORIES = [
    { value: "smr", label: "Строительно-монтажные риски" },
    { value: "contract", label: "Контракта" },
    { value: "personnel", label: "Персонал" },
    { value: "transport", label: "Транспорт" },
    { value: "property", label: "Имущество" },
    { value: "liability", label: "Ответственность" },
] as const

// Insurance Products by Category
export const INSURANCE_PRODUCTS: Record<string, { value: string; label: string }[]> = {
    smr: [
        { value: "smr_full", label: "СМР полный пакет" },
        { value: "smr_basic", label: "СМР базовый" },
        { value: "smr_risks", label: "Страхование строительных рисков" },
    ],
    contract: [
        { value: "contract_execution", label: "Страхование исполнения контракта" },
        { value: "contract_liability", label: "Страхование ответственности по контракту" },
    ],
    personnel: [
        { value: "dms", label: "ДМС" },
        { value: "critical_illness", label: "Страхование критических заболеваний" },
        { value: "accident", label: "Страхование несчастных случаев" },
        { value: "travel", label: "Комплексное страхование в поездках" },
    ],
    transport: [
        { value: "osago", label: "ОСАГО юридических лиц" },
        { value: "fleet", label: "Комплексное страхование автопарков" },
        { value: "special_tech", label: "Страхование специальной техники" },
        { value: "carrier_liability", label: "Страхование ответственности перевозчика" },
    ],
    property: [
        { value: "construction", label: "Страхование объектов строительства" },
        { value: "cargo", label: "Страхование грузов и перевозок" },
        { value: "company_property", label: "Страхование имущества компаний" },
        { value: "business_interruption", label: "Страхование перерывов деятельности" },
    ],
    liability: [
        { value: "civil_liability", label: "Страхование гражданской ответственности" },
        { value: "hazardous_objects", label: "Страхование опасных объектов" },
        { value: "professional_risks", label: "Страхование профессиональных рисков" },
        { value: "quality_liability", label: "Страхование ответственности за качество" },
    ],
}

// VED Currencies
export const VED_CURRENCIES = [
    { value: "USD", label: "USD - Доллар США" },
    { value: "EUR", label: "EUR - Евро" },
    { value: "CNY", label: "CNY - Юань" },
    { value: "TRY", label: "TRY - Турецкая лира" },
    { value: "AED", label: "AED - Дирхам ОАЭ" },
    { value: "RUB", label: "RUB - Рубль" },
] as const

// VED Countries
export const VED_COUNTRIES = [
    { value: "china", label: "Китай" },
    { value: "turkey", label: "Турция" },
    { value: "uae", label: "ОАЭ" },
    { value: "kazakhstan", label: "Казахстан" },
    { value: "uzbekistan", label: "Узбекистан" },
    { value: "india", label: "Индия" },
] as const

// RKO Account Types
export const RKO_TYPES = [
    { value: "rko", label: "РКО" },
    { value: "special_account", label: "Спецсчёт" },
] as const

// Tender support types
export const TENDER_SUPPORT_TYPES = [
    { value: "one_time", label: "Разовое сопровождение" },
    { value: "full_cycle", label: "Сопровождение под ключ" },
] as const

// Purchase categories (tender support)
export const PURCHASE_CATEGORIES = [
    { value: "gov_44", label: "Госзакупки по 44-ФЗ" },
    { value: "gov_223", label: "Закупки по 223-ФЗ" },
    { value: "property", label: "Имущественные торги" },
    { value: "commercial", label: "Коммерческие закупки" },
] as const

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

interface SectionHeaderProps {
    title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
    return (
        <h3 className="text-sm font-medium text-[#3CE8D1] uppercase tracking-wide">
            {title}
        </h3>
    )
}

interface FormFieldProps {
    label: string
    htmlFor?: string
    description?: string
    error?: string
    children: React.ReactNode
}

export function FormField({ label, htmlFor, description, error, children }: FormFieldProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor} className="text-[#94a3b8]">
                {label}
            </Label>
            {children}
            {description && (
                <p className="text-xs text-[#475569]">{description}</p>
            )}
            {error && (
                <p className="text-red-400 text-xs">{error}</p>
            )}
        </div>
    )
}

interface AmountInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    error?: string
}

export function AmountInput({ value, onChange, placeholder = "1 000 000", label = "Сумма, руб.", error }: AmountInputProps) {
    const formatAmount = (val: string): string => {
        const num = val.replace(/\D/g, "")
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    }

    return (
        <FormField label={label} error={error}>
            <Input
                value={formatAmount(value || "")}
                onChange={(e) => {
                    const raw = e.target.value.replace(/\s/g, "")
                    onChange(raw)
                }}
                placeholder={placeholder}
                className="bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#475569] text-lg font-medium"
            />
        </FormField>
    )
}

interface DateRangeInputProps {
    startDate: string
    endDate: string
    onStartChange: (value: string) => void
    onEndChange: (value: string) => void
    startLabel?: string
    endLabel?: string
    startError?: string
    endError?: string
    showDays?: boolean
}

export function DateRangeInput({
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    startLabel = "Дата начала",
    endLabel = "Дата окончания",
    startError,
    endError,
    showDays = true,
}: DateRangeInputProps) {
    const calculateDays = (): number => {
        if (!startDate || !endDate) return 0
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = end.getTime() - start.getTime()
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    const days = calculateDays()

    return (
        <div className={cn("grid gap-4", showDays ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
            <FormField label={startLabel} error={startError}>
                <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartChange(e.target.value)}
                    className="bg-[#0a1628] border-[#1e3a5f] text-white"
                />
            </FormField>
            <FormField label={endLabel} error={endError}>
                <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndChange(e.target.value)}
                    className="bg-[#0a1628] border-[#1e3a5f] text-white"
                />
            </FormField>
            {showDays && (
                <FormField label="Количество дней">
                    <div className="flex items-center h-10 px-3 bg-[#0a1628] border border-[#1e3a5f] rounded-md">
                        <span className={cn(
                            "font-medium",
                            days > 0 ? "text-[#3CE8D1]" : "text-[#475569]"
                        )}>
                            {days > 0 ? `${days} дней` : "—"}
                        </span>
                    </div>
                </FormField>
            )}
        </div>
    )
}

interface SelectFieldProps {
    value: string
    onValueChange: (value: string) => void
    options: readonly { value: string; label: string }[] | { value: string; label: string }[]
    placeholder?: string
    label: string
}

export function SelectField({ value, onValueChange, options, placeholder = "Выберите", label }: SelectFieldProps) {
    return (
        <FormField label={label}>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="bg-[#0a1628] border-[#1e3a5f] text-white">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-[#0f2042] border-[#1e3a5f]">
                    {options.map((opt) => (
                        <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-white hover:bg-[#1e3a5f] focus:bg-[#1e3a5f]"
                        >
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    )
}

interface ButtonGroupProps {
    value: string
    onChange: (value: string) => void
    options: readonly { value: string; label: string }[] | { value: string; label: string }[]
    label: string
}

export function ButtonGroup({ value, onChange, options, label }: ButtonGroupProps) {
    return (
        <FormField label={label}>
            <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                            value === opt.value
                                ? "bg-[#3CE8D1] text-[#0a1628]"
                                : "bg-[#0a1628] text-[#94a3b8] border border-[#1e3a5f] hover:border-[#3CE8D1]/50"
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </FormField>
    )
}

interface SwitchFieldProps {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label: string
    description?: string
    children?: React.ReactNode
}

export function SwitchField({ checked, onCheckedChange, label, description, children }: SwitchFieldProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
            <div>
                <Label className="text-white font-medium">{label}</Label>
                {description && (
                    <p className="text-xs text-[#94a3b8]">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-4">
                <Switch
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    className="data-[state=checked]:bg-[#3CE8D1]"
                />
                {checked && children}
            </div>
        </div>
    )
}

interface TextInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label: string
    type?: "text" | "number"
    error?: string
}

export function TextInput({ value, onChange, placeholder, label, type = "text", error }: TextInputProps) {
    return (
        <FormField label={label} error={error}>
            <Input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#475569]"
            />
        </FormField>
    )
}

interface NumberInputProps {
    value: number | undefined
    onChange: (value: number | undefined) => void
    placeholder?: string
    label: string
    min?: number
    max?: number
    suffix?: string
}

export function NumberInput({ value, onChange, placeholder, label, min, max, suffix }: NumberInputProps) {
    return (
        <FormField label={label}>
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    value={value ?? ""}
                    onChange={(e) => {
                        const val = e.target.value
                        onChange(val ? Number(val) : undefined)
                    }}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    className="bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#475569]"
                />
                {suffix && <span className="text-[#94a3b8]">{suffix}</span>}
            </div>
        </FormField>
    )
}

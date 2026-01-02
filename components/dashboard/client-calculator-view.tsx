"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Calculator, Phone, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

// =================================================================================
// CALCULATOR VIEW FOR CLIENTS
// Based on user-provided screenshot design
// =================================================================================

// Guarantee types
const guaranteeTypes = [
    { id: "tender", label: "Участие в тендере" },
    { id: "contract", label: "Исполнение контракта" },
    { id: "warranty", label: "Исполнение гарантийных обязательств" },
    { id: "advance", label: "Возврат аванса" },
]

// Calculate bank guarantee cost
// Formula: ~1.15% annual rate, minimum 5000 RUB
const calculateCost = (amount: number, termMonths: number, hasDiscount: boolean): { price: number; originalPrice: number } => {
    // Base rate: approximately 1.15% per year
    const annualRate = 0.0115
    const monthlyRate = annualRate / 12

    // Calculate cost
    let price = amount * monthlyRate * termMonths

    // Minimum price 5000 RUB
    price = Math.max(price, 5000)

    // Round to nearest 100
    price = Math.round(price / 100) * 100

    const originalPrice = price

    // Apply discount (20%)
    if (hasDiscount) {
        price = Math.round(price * 0.8 / 100) * 100
    }

    return { price, originalPrice }
}

// Format number with spaces
const formatNumber = (num: number): string => {
    return num.toLocaleString("ru-RU")
}

// Format amount for display (e.g., 1.0 млн ₽)
const formatAmountDisplay = (amount: number): string => {
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(1)} млрд ₽`
    }
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)} млн ₽`
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)} тыс ₽`
    }
    return `${formatNumber(amount)} ₽`
}

export function ClientCalculatorView() {
    // Form state
    const [selectedType, setSelectedType] = useState("tender")
    const [amount, setAmount] = useState(1000000) // 1 million default
    const [termMonths, setTermMonths] = useState(10)
    const [hasDiscount, setHasDiscount] = useState(true)

    // Contact form
    const [fullName, setFullName] = useState("")
    const [phone, setPhone] = useState("+7")
    const [agreedToPolicy, setAgreedToPolicy] = useState(true)

    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Calculate price
    const { price, originalPrice } = calculateCost(amount, termMonths, hasDiscount)

    // Handle amount input change
    const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "")
        const numValue = parseInt(value) || 0
        // Clamp between 10000 and 1000000000
        setAmount(Math.max(10000, Math.min(1000000000, numValue)))
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!fullName.trim()) {
            toast.error("Введите ФИО")
            return
        }
        if (phone.length < 12) {
            toast.error("Введите корректный номер телефона")
            return
        }
        if (!agreedToPolicy) {
            toast.error("Необходимо согласие на обработку персональных данных")
            return
        }

        setIsSubmitting(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast.success("Заявка успешно отправлена!", {
            description: "Наш менеджер свяжется с вами в ближайшее время",
        })

        // Reset form
        setFullName("")
        setPhone("+7")
        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#3CE8D1] mb-2">
                    Стоимость банковской гарантии калькулятор онлайн
                </h1>
            </div>

            {/* Main Calculator Container */}
            <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl bg-gradient-to-b from-[#0a1628] to-[#0f1d32] border border-border overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                        {/* Left Panel - Calculator Inputs (3 columns) */}
                        <div className="lg:col-span-3 p-6 lg:p-8">
                            {/* Title */}
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-[#3CE8D1] mb-1">
                                    Рассчитайте стоимость
                                </h2>
                                <h3 className="text-xl font-semibold text-[#3CE8D1]">
                                    банковской гарантии (БГ)
                                </h3>
                                <p className="text-sm text-slate-400 mt-2">Выберите тип гарантии</p>
                            </div>

                            {/* Guarantee Types */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {guaranteeTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                                            selectedType === type.id
                                                ? "bg-[#3CE8D1] text-[#0a1628] border-[#3CE8D1]"
                                                : "bg-transparent text-slate-300 border-slate-600 hover:border-[#3CE8D1]/50"
                                        )}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Amount Input */}
                            <div className="mb-8">
                                <Label className="text-sm text-[#3CE8D1] mb-2 block">
                                    Сумма гарантии, ₽
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formatNumber(amount)}
                                        onChange={handleAmountInputChange}
                                        className="bg-[#1a2942] border-slate-700 text-white text-lg h-12 pr-10"
                                    />
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                        <Calculator className="h-5 w-5" />
                                    </button>
                                </div>
                                {/* Amount Slider */}
                                <div className="mt-4">
                                    <Slider
                                        value={[amount]}
                                        onValueChange={(value) => setAmount(value[0])}
                                        min={10000}
                                        max={1000000000}
                                        step={10000}
                                        className="[&_[role=slider]]:bg-[#3CE8D1] [&_[role=slider]]:border-[#3CE8D1] [&_.relative]:bg-slate-700 [&_[data-orientation=horizontal]>.bg-primary]:bg-[#3CE8D1]"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>10 тыс</span>
                                        <span>1 млн</span>
                                        <span>100 млн</span>
                                        <span>1 млрд</span>
                                    </div>
                                </div>
                            </div>

                            {/* Term Input */}
                            <div>
                                <Label className="text-sm text-[#3CE8D1] mb-2 block">
                                    Срок, месяцев
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={termMonths}
                                        onChange={(e) => setTermMonths(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                                        className="bg-[#1a2942] border-slate-700 text-white text-lg h-12"
                                        min={1}
                                        max={120}
                                    />
                                </div>
                                {/* Term Slider */}
                                <div className="mt-4">
                                    <Slider
                                        value={[termMonths]}
                                        onValueChange={(value) => setTermMonths(value[0])}
                                        min={1}
                                        max={120}
                                        step={1}
                                        className="[&_[role=slider]]:bg-[#3CE8D1] [&_[role=slider]]:border-[#3CE8D1] [&_.relative]:bg-slate-700 [&_[data-orientation=horizontal]>.bg-primary]:bg-[#3CE8D1]"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>от 1 мес</span>
                                        <span>до 120 мес</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Summary & Form (2 columns) */}
                        <div className="lg:col-span-2 bg-[#0f1d32]/80 backdrop-blur-sm p-6 lg:p-8 border-l border-slate-700/50">
                            {/* Summary Card */}
                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-[#1a2942] to-[#0f1d32] border border-slate-700/50">
                                <div className="flex justify-between text-sm text-slate-400 mb-2">
                                    <span>Сумма гарантии:</span>
                                    <span className="font-semibold text-[#3CE8D1]">{formatAmountDisplay(amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-400 mb-4">
                                    <span>Срок:</span>
                                    <span className="font-semibold text-[#3CE8D1]">{termMonths} месяцев</span>
                                </div>

                                <div className="pt-3 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Итоговая цена:</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl font-bold text-[#3CE8D1]">
                                            {formatNumber(price)} ₽
                                        </span>
                                        {hasDiscount && (
                                            <span className="text-lg text-slate-500 line-through">
                                                {formatNumber(originalPrice)} ₽
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="space-y-4">
                                <Input
                                    type="text"
                                    placeholder="ФИО"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="h-12 bg-[#1a2942] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#3CE8D1] focus:ring-[#3CE8D1]/20"
                                />
                                <Input
                                    type="tel"
                                    placeholder="+7"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="h-12 bg-[#1a2942] border-slate-700 text-white placeholder:text-slate-500 focus:border-[#3CE8D1] focus:ring-[#3CE8D1]/20"
                                />

                                {/* Discount Toggle */}
                                <div className="flex items-center justify-between p-3 bg-[#1a2942]/50 rounded-lg border border-slate-700/50">
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={hasDiscount}
                                            onCheckedChange={setHasDiscount}
                                            className="data-[state=checked]:bg-[#3CE8D1]"
                                        />
                                        <span className="text-sm text-slate-300">Скидка</span>
                                    </div>
                                    <span className="text-sm font-bold text-[#E03E9D] bg-[#E03E9D]/20 px-2 py-1 rounded">
                                        -20%
                                    </span>
                                </div>

                                {/* Agreement Checkbox */}
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="agreement"
                                        checked={agreedToPolicy}
                                        onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
                                        className="mt-1 border-slate-600 data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:border-[#3CE8D1]"
                                    />
                                    <label htmlFor="agreement" className="text-xs text-slate-400 leading-tight">
                                        Я даю согласие на обработку{" "}
                                        <a href="#" className="text-[#3CE8D1] hover:underline">
                                            персональных данных
                                        </a>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] font-semibold text-base shadow-lg shadow-[#3CE8D1]/20 transition-all hover:shadow-[#3CE8D1]/30"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Отправка...
                                        </>
                                    ) : (
                                        "Отправить"
                                    )}
                                </Button>

                                {/* Disclaimer */}
                                <p className="text-xs text-slate-500 text-center">
                                    * Предварительный расчет
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

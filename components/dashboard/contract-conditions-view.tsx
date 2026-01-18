"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ChevronDown,
    ChevronUp,
    FileCheck,
    Percent,
} from "lucide-react"

// Contract conditions - commission rates for banking partners
// Extracted from profile-settings-view.tsx
const CONTRACT_CONDITIONS = {
    bankGuarantee: {
        title: "Получение Банковской гарантии",
        partners: [
            {
                partner: "АК Барс", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта до 50 000 000,00 ₽, +40% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽, +40% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Абсолют", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "27.07.2025", endDate: null },
                ]
            },
            {
                partner: "Альфа-Банк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Банк Казани", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Банк Левобережный", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "17.06.2024", endDate: null },
                ]
            },
            {
                partner: "Газпромбанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Держава", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк при сумме продукта до 40 000 000,00 ₽, +50% от превышения тарифа", startDate: "15.02.2022", endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 40 000 000,01 ₽, +50% от превышения тарифа", startDate: "15.02.2021", endDate: null },
                ]
            },
            {
                partner: "Зенит", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Ингосстрах Банк (ранее Союз)", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "КБ Соколовский", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Камкомбанк", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Локо", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.09.2020", endDate: null },
                ]
            },
            {
                partner: "МКБ", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МСП", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МСП (Экспресс)", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МТС", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МетКомБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 50 000 000,00 ₽", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МеталлинвестБанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк при сумме продукта до 10 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта от 10 000 000,01 ₽ до 30 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 30 000 000,01 ₽ до 50 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 50 000 000,01 ₽ до 100 000 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Примсоцбанк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк", startDate: "02.08.2022", endDate: null },
                ]
            },
            {
                partner: "Промсвязьбанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "06.12.2021", endDate: null },
                    { rate: "25% от комиссии, уплаченной на банк при количестве закрытых сделок от 6 шт., +50% от превышения тарифа", startDate: "25.02.2021", endDate: null, note: "до 25.02.2021 - 30% по всем сделкам" },
                ]
            },
            {
                partner: "Реалист Банк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "РусНарБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 14 600 000,00 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 14 600 000,01 ₽, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "СГБ", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.03.2024", endDate: null },
                ]
            },
            {
                partner: "СДМ Банк", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.07.2024", endDate: null },
                ]
            },
            {
                partner: "Санкт-Петербург", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.12.2022", endDate: null },
                ]
            },
            {
                partner: "Сбербанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "01.11.2022", endDate: null, note: "20% от комиссии (44/223/615 ФЗ, открытые закупки). Остальные закупки, в т.ч. КБГ - 15%, превышение запрещено" },
                ]
            },
            {
                partner: "Совкомбанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "01.12.2022", endDate: null, note: "Перевыпуск, изменение и продление БГ 15%" },
                    { rate: "10% от комиссии, уплаченной на банк при сумме продукта от 10 000 000,01 ₽, +50% от превышения тарифа", startDate: "08.04.2020", endDate: null, note: "Перевыпуск, изменение и продление БГ 15%" },
                ]
            },
            {
                partner: "Солид", conditions: [
                    { rate: "15% от комиссии, уплаченной на банк, +35% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "ТКБ", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "01.02.2022", endDate: null },
                ]
            },
            {
                partner: "Трансстройбанк", conditions: [
                    { rate: "30% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "15.10.2025", endDate: null },
                ]
            },
            {
                partner: "Урал ФД", conditions: [
                    { rate: "25% от комиссии, уплаченной на банк, +50% от превышения тарифа", startDate: "10.04.2024", endDate: null },
                ]
            },
            {
                partner: "Уралсиб", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк при сумме продукта до 30 000 000,00 ₽", startDate: "01.12.2020", endDate: null },
                    { rate: "15% от комиссии, уплаченной на банк при сумме продукта от 30 000 000,00 ₽", startDate: "01.12.2020", endDate: null },
                ]
            },
        ]
    },
    tenderLoan: {
        title: "Получение Тендерного займа или Тендерного кредита",
        partners: [
            {
                partner: "Прочие партнёры", conditions: [
                    { rate: "10% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Финтендер", conditions: [
                    { rate: "10% от комиссии, уплаченной на банк", startDate: null, endDate: null, note: "Комиссия за гарантийное обеспечение уплаты процентов - вознаграждение агента не предусмотрено" },
                ]
            },
        ]
    },
    stateContractCredit: {
        title: "Получение кредита на исполнение госконтракта",
        partners: [
            {
                partner: "Альфа-Банк", conditions: [
                    { rate: "0.70% от суммы выданного кредита, +50% от превышения тарифа", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Держава", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "МеталлИнвестБанк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Промсвязьбанк", conditions: [
                    { rate: "0.70% от суммы выданного кредита", startDate: null, endDate: null },
                ]
            },
            {
                partner: "Реалист Банк", conditions: [
                    { rate: "20% от комиссии, уплаченной на банк", startDate: "07.06.2023", endDate: null },
                ]
            },
        ]
    },
    settlementAccount: {
        title: "Открытие расчетного счета",
        partners: [
            {
                partner: "Прочие партнёры", conditions: [
                    { rate: "1 500,00 ₽ (фиксированное)", startDate: null, endDate: null },
                ]
            },
        ]
    }
}

export function ContractConditionsView() {
    // Contract sections expanded state
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        bankGuarantee: true,
        tenderLoan: false,
        stateContractCredit: false,
        settlementAccount: false
    })

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Комиссионное вознаграждение
                </CardTitle>
                <CardDescription>
                    Ставки вознаграждения агента по продуктам и банкам
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Bank Guarantee */}
                <div className="border rounded-lg">
                    <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto font-medium text-base hover:bg-muted/50"
                        onClick={() => toggleSection('bankGuarantee')}
                    >
                        <div className="flex items-center gap-2 text-left">
                            <span className="text-[#3CE8D1]">01.</span>
                            {CONTRACT_CONDITIONS.bankGuarantee.title}
                        </div>
                        {expandedSections.bankGuarantee ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {expandedSections.bankGuarantee && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="h-[1px] bg-border mb-4" />
                            <div className="space-y-3">
                                {CONTRACT_CONDITIONS.bankGuarantee.partners.map((partner, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg border text-sm items-start md:items-center">
                                        <div className="font-semibold text-[#3CE8D1] min-w-[200px]">{partner.partner}</div>
                                        <div className="flex-1 space-y-2">
                                            {partner.conditions.map((cond, cIdx) => (
                                                <div key={cIdx} className="relative pl-3 border-l-2 border-[#3CE8D1]/30">
                                                    <p>{cond.rate}</p>
                                                    {(cond.startDate || cond.endDate) && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {cond.startDate ? `с ${cond.startDate}` : ""}
                                                            {cond.startDate && cond.endDate ? " " : ""}
                                                            {cond.endDate ? `по ${cond.endDate}` : ""}
                                                        </p>
                                                    )}
                                                    {(cond as any).note && (
                                                        <p className="text-xs text-amber-500 mt-1">
                                                            {(cond as any).note}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tender Loan */}
                <div className="border rounded-lg">
                    <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto font-medium text-base hover:bg-muted/50"
                        onClick={() => toggleSection('tenderLoan')}
                    >
                        <div className="flex items-center gap-2 text-left">
                            <span className="text-[#3CE8D1]">02.</span>
                            {CONTRACT_CONDITIONS.tenderLoan.title}
                        </div>
                        {expandedSections.tenderLoan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {expandedSections.tenderLoan && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="h-[1px] bg-border mb-4" />
                            <div className="space-y-3">
                                {CONTRACT_CONDITIONS.tenderLoan.partners.map((partner, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg border text-sm items-start md:items-center">
                                        <div className="font-semibold text-[#3CE8D1] min-w-[200px]">{partner.partner}</div>
                                        <div className="flex-1 space-y-2">
                                            {partner.conditions.map((cond, cIdx) => (
                                                <div key={cIdx} className="relative pl-3 border-l-2 border-[#3CE8D1]/30">
                                                    <p>{cond.rate}</p>
                                                    {(cond as any).note && (
                                                        <p className="text-xs text-amber-500 mt-1">
                                                            {(cond as any).note}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* State Contract Credit */}
                <div className="border rounded-lg">
                    <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto font-medium text-base hover:bg-muted/50"
                        onClick={() => toggleSection('stateContractCredit')}
                    >
                        <div className="flex items-center gap-2 text-left">
                            <span className="text-[#3CE8D1]">03.</span>
                            {CONTRACT_CONDITIONS.stateContractCredit.title}
                        </div>
                        {expandedSections.stateContractCredit ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {expandedSections.stateContractCredit && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="h-[1px] bg-border mb-4" />
                            <div className="space-y-3">
                                {CONTRACT_CONDITIONS.stateContractCredit.partners.map((partner, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg border text-sm items-start md:items-center">
                                        <div className="font-semibold text-[#3CE8D1] min-w-[200px]">{partner.partner}</div>
                                        <div className="flex-1 space-y-2">
                                            {partner.conditions.map((cond, cIdx) => (
                                                <div key={cIdx} className="relative pl-3 border-l-2 border-[#3CE8D1]/30">
                                                    <p>{cond.rate}</p>
                                                    {(cond.startDate || cond.endDate) && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {cond.startDate ? `с ${cond.startDate}` : ""}
                                                            {cond.startDate && cond.endDate ? " " : ""}
                                                            {cond.endDate ? `по ${cond.endDate}` : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Settlement Account */}
                <div className="border rounded-lg">
                    <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto font-medium text-base hover:bg-muted/50"
                        onClick={() => toggleSection('settlementAccount')}
                    >
                        <div className="flex items-center gap-2 text-left">
                            <span className="text-[#3CE8D1]">04.</span>
                            {CONTRACT_CONDITIONS.settlementAccount.title}
                        </div>
                        {expandedSections.settlementAccount ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {expandedSections.settlementAccount && (
                        <div className="p-4 pt-0 space-y-4">
                            <div className="h-[1px] bg-border mb-4" />
                            <div className="space-y-3">
                                {CONTRACT_CONDITIONS.settlementAccount.partners.map((partner, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-lg border text-sm items-start md:items-center">
                                        <div className="font-semibold text-[#3CE8D1] min-w-[200px]">{partner.partner}</div>
                                        <div className="flex-1 space-y-2">
                                            {partner.conditions.map((cond, cIdx) => (
                                                <div key={cIdx} className="relative pl-3 border-l-2 border-[#3CE8D1]/30">
                                                    <p>{cond.rate}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

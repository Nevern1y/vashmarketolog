"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Search,
    Filter,
    Building2,
    FileText,
    ChevronDown,
    ChevronUp,
    Info,
    AlertTriangle,
    ExternalLink
} from "lucide-react"

// Bank conditions data per ТЗ "Индивидуальное рассмотрение"
const BANK_CONDITIONS = [
    {
        id: 1,
        bank_name: "Сбербанк",
        law: "44-ФЗ",
        bg_type: "Все виды",
        client_limit: "Без ограничений",
        application_limit_fz: "50 000 000 ₽",
        application_limit_commercial: "100 000 000 ₽",
        corporate_limit: "Без ограничений",
        term: "до 60 мес.",
        bank_rate: "от 2.5%",
        lg_commission: "0.5%",
        stop_factors: ["Банкротство", "Судебные иски"],
    },
    {
        id: 2,
        bank_name: "ВТБ",
        law: "44-ФЗ, 223-ФЗ",
        bg_type: "Исполнение контракта, Возврат аванса",
        client_limit: "до 500 000 000 ₽",
        application_limit_fz: "30 000 000 ₽",
        application_limit_commercial: "50 000 000 ₽",
        corporate_limit: "200 000 000 ₽",
        term: "до 48 мес.",
        bank_rate: "от 3.0%",
        lg_commission: "0.4%",
        stop_factors: ["Отрицательные чистые активы", "Просроченная налоговая"],
    },
    {
        id: 3,
        bank_name: "Альфа-Банк",
        law: "44-ФЗ, 223-ФЗ, КБГ",
        bg_type: "Все виды",
        client_limit: "до 1 000 000 000 ₽",
        application_limit_fz: "100 000 000 ₽",
        application_limit_commercial: "150 000 000 ₽",
        corporate_limit: "Без ограничений",
        term: "до 72 мес.",
        bank_rate: "от 2.0%",
        lg_commission: "0.6%",
        stop_factors: ["Срок работы < 6 мес."],
    },
    {
        id: 4,
        bank_name: "Реалист Банк",
        law: "44-ФЗ, 223-ФЗ",
        bg_type: "Обеспечение заявки, Исполнение контракта",
        client_limit: "до 100 000 000 ₽",
        application_limit_fz: "15 000 000 ₽",
        application_limit_commercial: "20 000 000 ₽",
        corporate_limit: "50 000 000 ₽",
        term: "до 36 мес.",
        bank_rate: "от 4.0%",
        lg_commission: "0.3%",
        stop_factors: ["Выручка < 5 млн", "Негативная кредитная история"],
    },
    {
        id: 5,
        bank_name: "Совкомбанк",
        law: "44-ФЗ",
        bg_type: "Все виды",
        client_limit: "до 300 000 000 ₽",
        application_limit_fz: "25 000 000 ₽",
        application_limit_commercial: "40 000 000 ₽",
        corporate_limit: "100 000 000 ₽",
        term: "до 60 мес.",
        bank_rate: "от 2.8%",
        lg_commission: "0.45%",
        stop_factors: ["Арбитражные дела", "Залоговое имущество"],
    },
]

// General stop-factors per ТЗ
const GENERAL_STOP_FACTORS = [
    "Компания в процессе ликвидации или реорганизации",
    "Наличие процедуры банкротства",
    "Отрицательные чистые активы более 2 лет",
    "Просроченная задолженность перед бюджетом более 30 дней",
    "Нахождение в реестре недобросовестных поставщиков (РНП)",
    "Массовый директор или массовый адрес регистрации",
    "Срок деятельности менее 3 месяцев",
]

export function IndividualReviewView() {
    const [searchQuery, setSearchQuery] = useState("")
    const [lawFilter, setLawFilter] = useState("all")
    const [expandedRow, setExpandedRow] = useState<number | null>(null)

    // Filter logic
    const filteredConditions = BANK_CONDITIONS.filter(bank => {
        const matchesSearch = bank.bank_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesLaw = lawFilter === "all" || bank.law.includes(lawFilter)
        return matchesSearch && matchesLaw
    })

    const toggleRow = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id)
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#3CE8D1]" />
                    Индивидуальное рассмотрение
                </h1>
                <p className="text-muted-foreground mt-1">
                    Условия банков-партнёров для заявок, выходящих за рамки экспресс-продуктов
                </p>
            </div>

            {/* Info Banner */}
            <Card className="border-[#3CE8D1]/30 bg-[#3CE8D1]/5">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-[#3CE8D1] mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">Индивидуальное рассмотрение применяется для:</p>
                            <ul className="mt-2 space-y-1 text-muted-foreground">
                                <li>• Сумм, превышающих лимиты экспресс-продуктов</li>
                                <li>• Сроков более 24 месяцев</li>
                                <li>• Особых условий по БГ (нестандартные типы)</li>
                                <li>• Клиентов с пограничными показателями</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Фильтры
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Поиск по банку</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Название банка..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-[200px] space-y-2">
                            <Label>Закон о закупках</Label>
                            <Select value={lawFilter} onValueChange={setLawFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Все законы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все законы</SelectItem>
                                    <SelectItem value="44-ФЗ">44-ФЗ</SelectItem>
                                    <SelectItem value="223-ФЗ">223-ФЗ</SelectItem>
                                    <SelectItem value="КБГ">КБГ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bank Conditions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Условия банков-партнёров
                    </CardTitle>
                    <CardDescription>
                        Нажмите на строку для просмотра стоп-факторов банка
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[180px]">Банк</TableHead>
                                    <TableHead>Закон</TableHead>
                                    <TableHead>Тип БГ</TableHead>
                                    <TableHead className="text-right">Лимит клиента</TableHead>
                                    <TableHead className="text-right">Лимит заявки (ФЗ)</TableHead>
                                    <TableHead className="text-right">Лимит КБГ</TableHead>
                                    <TableHead>Срок</TableHead>
                                    <TableHead className="text-right">Ставка</TableHead>
                                    <TableHead className="text-right">Комиссия ЛГ</TableHead>
                                    <TableHead className="w-[40px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredConditions.map((bank) => (
                                    <>
                                        <TableRow
                                            key={bank.id}
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleRow(bank.id)}
                                        >
                                            <TableCell className="font-medium">{bank.bank_name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {bank.law.split(", ").map(l => (
                                                        <Badge key={l} variant="outline" className="text-xs">
                                                            {l}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={bank.bg_type}>
                                                {bank.bg_type}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">{bank.client_limit}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{bank.application_limit_fz}</TableCell>
                                            <TableCell className="text-right font-mono text-sm">{bank.application_limit_commercial}</TableCell>
                                            <TableCell>{bank.term}</TableCell>
                                            <TableCell className="text-right text-[#3CE8D1] font-medium">{bank.bank_rate}</TableCell>
                                            <TableCell className="text-right">{bank.lg_commission}</TableCell>
                                            <TableCell>
                                                {expandedRow === bank.id ? (
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {expandedRow === bank.id && (
                                            <TableRow className="bg-muted/20">
                                                <TableCell colSpan={10} className="py-4">
                                                    <div className="flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                                        <div>
                                                            <p className="font-medium text-sm mb-2">Стоп-факторы {bank.bank_name}:</p>
                                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                                {bank.stop_factors.map((factor, idx) => (
                                                                    <li key={idx}>• {factor}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* General Stop-Factors */}
            <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-500">
                        <AlertTriangle className="h-5 w-5" />
                        Общие стоп-факторы
                    </CardTitle>
                    <CardDescription>
                        Факторы, по которым большинство банков отклоняет заявки
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="grid gap-2 md:grid-cols-2">
                        {GENERAL_STOP_FACTORS.map((factor, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-amber-500">✕</span>
                                {factor}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Action */}
            <Card className="border-[#3CE8D1]/30">
                <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="font-medium">Не нашли подходящий банк?</p>
                            <p className="text-sm text-muted-foreground">
                                Свяжитесь с менеджером для индивидуального подбора условий
                            </p>
                        </div>
                        <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Связаться с менеджером
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

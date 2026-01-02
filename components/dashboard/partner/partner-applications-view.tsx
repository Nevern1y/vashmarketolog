"use client"

import { useState } from "react"
import {
    FileText,
    Filter,
    Plus,
    Search,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useApplications } from "@/hooks/use-applications"
import { cn } from "@/lib/utils"

interface PartnerApplicationsViewProps {
    onOpenDetail?: (id: string) => void
}

/**
 * PartnerApplicationsView - Table-based applications list
 * 
 * Columns per ТЗ:
 * - № заявки / № извещения
 * - ФЗ (Закон)
 * - Дата создания
 * - МФО/Банк
 * - Агент
 * - Клиент
 * - Сумма заявки
 * - Статус
 * - Сообщения
 */
export function PartnerApplicationsView({ onOpenDetail }: PartnerApplicationsViewProps) {
    const { applications, isLoading } = useApplications()
    const [searchQuery, setSearchQuery] = useState("")
    const [productFilter, setProductFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10



    // Filter applications
    const filteredApps = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.company_inn?.includes(searchQuery) ||
            String(app.id).includes(searchQuery)

        const matchesProduct = productFilter === "all" || app.product_type === productFilter

        return matchesSearch && matchesProduct
    })

    // Pagination
    const totalPages = Math.ceil(filteredApps.length / itemsPerPage)
    const paginatedApps = filteredApps.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; border: string }> = {
            draft: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
            pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
            in_review: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
            "in-review": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
            info_requested: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
            approved: { bg: "bg-[#3CE8D1]/20", text: "text-[#3CE8D1]", border: "border-[#3CE8D1]/30" },
            rejected: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
            won: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
        }
        const labels: Record<string, string> = {
            draft: "Черновик",
            pending: "Создание заявки",
            in_review: "На рассмотрении",
            "in-review": "На рассмотрении",
            info_requested: "Запрос информации",
            approved: "Одобрено",
            rejected: "Отклонено",
            won: "Возвращена на доработку",
        }
        const style = styles[status] || styles.draft
        return (
            <Badge className={cn("border", style.bg, style.text, style.border)}>
                {labels[status] || status}
            </Badge>
        )
    }

    // Get law from application data (goscontract_data.law or tender_law)
    const getLaw = (app: typeof paginatedApps[0]) => {
        // Priority: goscontract_data.law > tender_law > product type default
        const law = app.goscontract_data?.law || app.tender_law
        if (law) return law
        // Fallback to product type
        if (app.product_type === "bank_guarantee") return "БГ"
        if (app.product_type === "tender_loan") return "КИК"
        return app.product_type_display || "-"
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Мои заявки</h1>
                    <p className="text-sm text-[#94a3b8] mt-1">
                        Все заявки, созданные в вашей организации
                    </p>
                </div>
            </div>

            {/* Product Category Tabs */}
            <div className="flex flex-wrap gap-2">
                {[
                    { value: "all", label: "Все продукты", desc: "" },
                    { value: "bank_guarantee", label: "Гарантии", desc: "Банковские гарантии для тендеров" },
                    { value: "tender_loan", label: "Кредиты", desc: "Кредитование бизнеса" },
                    { value: "ved", label: "ВЭД", desc: "Внешнеэкономическая деятельность" },
                    { value: "leasing", label: "Лизинг", desc: "Лизинг оборудования и транспорта" },
                    { value: "insurance", label: "Страхование", desc: "Страхование бизнеса" },
                    { value: "special_account", label: "Спецсчета", desc: "Специальные счета для госзакупок" },
                    { value: "rko", label: "РКО", desc: "Расчетно-кассовое обслуживание" },
                    { value: "tender_support", label: "Сопровождение", desc: "Тендерное сопровождение" },
                ].map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setProductFilter(tab.value)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            productFilter === tab.value
                                ? "bg-[#3CE8D1] text-black"
                                : "bg-[#0f2042] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white border border-[#1e3a5f]"
                        )}
                        title={tab.desc}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px] max-w-[400px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                                <Input
                                    placeholder="Поиск по названию, ИНН или номеру"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#94a3b8]"
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white">
                            <Filter className="h-4 w-4 mr-2" />
                            ФИЛЬТР
                        </Button>
                        <div className="text-sm text-[#94a3b8] ml-auto">
                            Всего заявок: <span className="text-[#3CE8D1] font-semibold">{filteredApps.length}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Applications Table */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <FileText className="h-16 w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Нет заявок</h3>
                            <p className="text-sm text-[#94a3b8] text-center">
                                Создайте первую заявку через калькулятор
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#1e3a5f] hover:bg-transparent">
                                        <TableHead className="text-[#94a3b8] font-medium">№ заявки / № извещ.</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">ФЗ</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">Дата созд.</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">МФО/Банк</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">Агент</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">Клиент</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium text-right">Сумма заявки, руб.</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium">Статус заявки</TableHead>
                                        <TableHead className="text-[#94a3b8] font-medium w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedApps.map((app) => (
                                        <TableRow
                                            key={app.id}
                                            className="border-[#1e3a5f] hover:bg-[#0a1628] cursor-pointer transition-colors"
                                            onClick={() => onOpenDetail?.(String(app.id))}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <a
                                                        href="#"
                                                        onClick={(e) => { e.stopPropagation(); onOpenDetail?.(String(app.id)) }}
                                                        className="text-[#3CE8D1] hover:underline font-medium"
                                                    >
                                                        {app.tender_number || app.id}
                                                    </a>
                                                    {app.external_id && (
                                                        <span className="text-xs text-[#94a3b8]">{app.external_id}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] border border-[#3CE8D1]/30">
                                                    {getLaw(app)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-white">
                                                {new Date(app.created_at).toLocaleDateString('ru-RU')}
                                            </TableCell>
                                            <TableCell className="text-white">
                                                {app.target_bank_name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[#3CE8D1]">{app.created_by_name || app.created_by_email || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-medium">
                                                        {app.company_name}
                                                    </span>
                                                    <span className="text-xs text-[#94a3b8]">
                                                        ИНН: {app.company_inn}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-white font-medium">
                                                    {parseFloat(app.amount || '0').toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(app.status)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-[#94a3b8] hover:text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-[#1e3a5f]">
                                    <div className="text-sm text-[#94a3b8]">
                                        Показано {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredApps.length)} из {filteredApps.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={String(currentPage)}
                                            onValueChange={(v) => setCurrentPage(Number(v))}
                                        >
                                            <SelectTrigger className="w-[100px] bg-[#0a1628] border-[#1e3a5f] text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f2042] border-[#1e3a5f]">
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <SelectItem key={i + 1} value={String(i + 1)}>
                                                        Страница {i + 1}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] disabled:opacity-50"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

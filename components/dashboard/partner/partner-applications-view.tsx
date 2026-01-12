"use client"

import { useState } from "react"
import {
    FileText,
    Filter,
    Search,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Calendar,
    Building2,
    User,
    Banknote,
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
    userRole?: "client" | "agent" | "partner" | "admin"
}

const PRODUCT_TABS = [
    { value: "all", label: "Все", shortLabel: "Все", desc: "" },
    { value: "bank_guarantee", label: "Банковские гарантии", shortLabel: "БГ", desc: "Гарантии для тендеров и контрактов" },
    { value: "tender_loan", label: "Кредиты для бизнеса", shortLabel: "Кредит", desc: "Тендерные кредиты и кредитование бизнеса" },
    { value: "leasing", label: "Лизинг для юрлиц", shortLabel: "Лизинг", desc: "Лизинг оборудования и транспорта" },
    { value: "factoring", label: "Факторинг для бизнеса", shortLabel: "Факторинг", desc: "Факторинговое финансирование" },
    { value: "insurance", label: "Страхование СМР", shortLabel: "Страх.", desc: "Страхование строительно-монтажных работ" },
    { value: "ved", label: "Международные платежи", shortLabel: "ВЭД", desc: "ВЭД и международные расчёты" },
    { value: "rko", label: "РКО и спецсчета", shortLabel: "РКО", desc: "Расчётно-кассовое обслуживание и специальные счета" },
    { value: "deposit", label: "Депозиты", shortLabel: "Депозит", desc: "Депозитные продукты для бизнеса" },
]

/**
 * PartnerApplicationsView - Responsive applications list
 * Desktop: Table view | Mobile: Card view
 */
export function PartnerApplicationsView({ onOpenDetail, userRole }: PartnerApplicationsViewProps) {
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
            <Badge className={cn("border text-xs", style.bg, style.text, style.border)}>
                {labels[status] || status}
            </Badge>
        )
    }

    // Get product type for display (второй столбец таблицы)
    const getProductType = (app: typeof paginatedApps[0]) => {
        // Сначала показываем тип продукта, потом закон
        const productTypeMap: Record<string, string> = {
            bank_guarantee: "БГ",
            tender_loan: "КИК",
            contract_loan: "КИК",
            corporate_credit: "Кредит",
            factoring: "Факторинг",
            leasing: "Лизинг",
            ved: "ВЭД",
            insurance: "Страхование",
            rko: "РКО",
            special_account: "Спецсчет",
            tender_support: "Тендерное сопров."
        }
        const productLabel = productTypeMap[app.product_type] || app.product_type_display || app.product_type
        const law = app.goscontract_data?.law || app.tender_law
        if (law && (app.product_type === "bank_guarantee" || app.product_type === "tender_loan" || app.product_type === "contract_loan")) {
            // User request: Law info is low priority, don't show it
            return productLabel
        }
        return productLabel
    }

    // Mobile Application Card
    const ApplicationCard = ({ app }: { app: typeof paginatedApps[0] }) => (
        <div
            onClick={() => onOpenDetail?.(String(app.id))}
            className="p-4 rounded-lg border border-[#1e3a5f] bg-[#0a1628] hover:bg-[#0f2042] cursor-pointer transition-colors"
        >
            {/* Header: ID + Status */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                    <a
                        href="#"
                        onClick={(e) => { e.stopPropagation(); onOpenDetail?.(String(app.id)) }}
                        className="text-[#3CE8D1] hover:underline font-semibold text-base"
                    >
                        №{app.tender_number || app.id}
                    </a>
                    {app.external_id && (
                        <p className="text-xs text-[#94a3b8] mt-0.5">{app.external_id}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] border border-[#3CE8D1]/30 text-xs">
                        {getProductType(app)}
                    </Badge>
                    {getStatusBadge(app.status)}
                </div>
            </div>

            {/* Company - Hide for Client */}
            {userRole !== 'client' && (
                <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-[#94a3b8] shrink-0" />
                    <div className="min-w-0">
                        <p className="text-white font-medium truncate">{app.company_name}</p>
                        <p className="text-xs text-[#94a3b8]">ИНН: {app.company_inn}</p>
                    </div>
                </div>
            )}

            {/* Amount + Date */}
            <div className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#94a3b8]" />
                    <span className="text-white font-medium">
                        {parseFloat(app.amount || '0').toLocaleString('ru-RU')} ₽
                    </span>
                </div>
                <div className="flex items-center gap-2 text-[#94a3b8]">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
            </div>

            {/* Agent + Bank */}
            <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-[#1e3a5f] text-sm">
                {/* Hide Agent for Client */}
                {userRole !== 'client' ? (
                    <div className="flex items-center gap-2 min-w-0">
                        <User className="h-4 w-4 text-[#94a3b8] shrink-0" />
                        <span className="text-[#3CE8D1] truncate">{app.created_by_name || app.created_by_email || '-'}</span>
                    </div>
                ) : (
                    <div></div> // Empty spacer if Agent hidden
                )}
                {app.target_bank_name && (
                    <span className="text-[#94a3b8] truncate">{app.target_bank_name}</span>
                )}
            </div>
        </div>
    )

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">Мои заявки</h1>
                    <p className="text-sm text-[#94a3b8] mt-1 hidden sm:block">
                        Все заявки, созданные в вашей организации
                    </p>
                </div>
                <div className="text-sm text-[#94a3b8]">
                    Всего: <span className="text-[#3CE8D1] font-semibold">{filteredApps.length}</span>
                </div>
            </div>

            {/* Product Category Tabs - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <div className="flex gap-2 min-w-max pb-2">
                    {PRODUCT_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => { setProductFilter(tab.value); setCurrentPage(1) }}
                            className={cn(
                                "px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                                productFilter === tab.value
                                    ? "bg-[#3CE8D1] text-black"
                                    : "bg-[#0f2042] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white border border-[#1e3a5f]"
                            )}
                            title={tab.desc}
                        >
                            {/* Show short label on mobile, full on desktop */}
                            <span className="md:hidden">{tab.shortLabel}</span>
                            <span className="hidden md:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Filter Bar */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                                <Input
                                    placeholder="Поиск по названию, ИНН или номеру"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                                    className="pl-10 bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#94a3b8]"
                                />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white w-full sm:w-auto"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Фильтр
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Applications List */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-0 md:p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <FileText className="h-12 w-12 md:h-16 md:w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">Нет заявок</h3>
                            <p className="text-sm text-[#94a3b8] text-center">
                                Создайте первую заявку через калькулятор
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Card View */}
                            <div className="md:hidden p-3 space-y-3">
                                {paginatedApps.map((app) => (
                                    <ApplicationCard key={app.id} app={app} />
                                ))}
                            </div>

                            {/* Desktop: Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-[#1e3a5f] hover:bg-transparent">
                                            <TableHead className="text-[#94a3b8] font-medium min-w-[120px]">№ заявки / № извещ.</TableHead>
                                            <TableHead className="text-[#94a3b8] font-medium min-w-[100px]">Продукт</TableHead>
                                            <TableHead className="hidden lg:table-cell text-[#94a3b8] font-medium min-w-[100px]">Дата созд.</TableHead>
                                            <TableHead className="hidden xl:table-cell text-[#94a3b8] font-medium min-w-[120px]">МФО/Банк</TableHead>
                                            {userRole !== 'client' && <TableHead className="hidden xl:table-cell text-[#94a3b8] font-medium min-w-[120px]">Агент</TableHead>}
                                            {userRole !== 'client' && <TableHead className="hidden xl:table-cell text-[#94a3b8] font-medium min-w-[150px]">Клиент</TableHead>}
                                            <TableHead className="hidden lg:table-cell text-[#94a3b8] font-medium min-w-[100px] text-right">Сумма, ₽</TableHead>
                                            <TableHead className="text-[#94a3b8] font-medium min-w-[100px]">Статус</TableHead>
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
                                                        {getProductType(app)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-white">
                                                    {new Date(app.created_at).toLocaleDateString('ru-RU')}
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell text-white">
                                                    {app.target_bank_name || '-'}
                                                </TableCell>
                                                {userRole !== 'client' && (
                                                    <TableCell className="hidden xl:table-cell">
                                                        <span className="text-[#3CE8D1]">{app.created_by_name || app.created_by_email || '-'}</span>
                                                    </TableCell>
                                                )}
                                                {userRole !== 'client' && (
                                                    <TableCell className="hidden xl:table-cell">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-medium">{app.company_name}</span>
                                                            <span className="text-xs text-[#94a3b8]">ИНН: {app.company_inn}</span>
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell className="hidden lg:table-cell text-right">
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
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 md:px-6 py-4 border-t border-[#1e3a5f]">
                                    <div className="text-sm text-[#94a3b8] order-2 sm:order-1">
                                        {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredApps.length)} из {filteredApps.length}
                                    </div>
                                    <div className="flex items-center gap-2 order-1 sm:order-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] disabled:opacity-50 h-9 w-9"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {/* Show page numbers on mobile too */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum: number
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i
                                                } else {
                                                    pageNum = currentPage - 2 + i
                                                }
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={cn(
                                                            "h-9 w-9 p-0",
                                                            currentPage === pageNum
                                                                ? "bg-[#3CE8D1] text-black hover:bg-[#2fd4c0]"
                                                                : "border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f]"
                                                        )}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] disabled:opacity-50 h-9 w-9"
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

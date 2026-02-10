"use client"

import { useMemo, useState } from "react"
import { Users, Building2, FileText, CheckCircle, Loader2, Search, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useApplications } from "@/hooks/use-applications"
import { getPrimaryAmountValue } from "@/lib/application-display"

interface PartnerClientRow {
    key: string
    companyName: string
    companyInn: string
    applicationsCount: number
    approvedCount: number
    totalAmount: number
    lastApplicationAt: string | null
}

/**
 * PartnerClientsView - Partner's clients derived from assigned applications.
 */
export function PartnerClientsView() {
    const { applications, isLoading } = useApplications(undefined, undefined, { fetchAllPages: true })
    const [searchQuery, setSearchQuery] = useState("")

    const clients = useMemo<PartnerClientRow[]>(() => {
        const map = new Map<string, PartnerClientRow>()

        applications.forEach((application) => {
            const companyName = application.company_name?.trim() || "Без названия"
            const companyInn = application.company_inn?.trim() || ""
            const key = companyInn ? `inn:${companyInn}` : `name:${companyName.toLowerCase()}`
            const amount = getPrimaryAmountValue(application) || 0
            const createdAt = application.created_at || null

            const existing = map.get(key)
            if (!existing) {
                map.set(key, {
                    key,
                    companyName,
                    companyInn,
                    applicationsCount: 1,
                    approvedCount: application.status === "approved" || application.status === "won" ? 1 : 0,
                    totalAmount: amount,
                    lastApplicationAt: createdAt,
                })
                return
            }

            existing.applicationsCount += 1
            if (application.status === "approved" || application.status === "won") {
                existing.approvedCount += 1
            }
            existing.totalAmount += amount

            if (createdAt && (!existing.lastApplicationAt || new Date(createdAt).getTime() > new Date(existing.lastApplicationAt).getTime())) {
                existing.lastApplicationAt = createdAt
            }
        })

        return Array.from(map.values()).sort((a, b) => {
            const aTime = a.lastApplicationAt ? new Date(a.lastApplicationAt).getTime() : 0
            const bTime = b.lastApplicationAt ? new Date(b.lastApplicationAt).getTime() : 0
            return bTime - aTime
        })
    }, [applications])

    const filteredClients = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return clients

        return clients.filter((client) => (
            client.companyName.toLowerCase().includes(query) || client.companyInn.includes(query)
        ))
    }, [clients, searchQuery])

    const stats = useMemo(() => {
        if (isLoading) {
            return {
                uniqueClients: null,
                repeatRate: null,
                totalProcessed: null,
                approved: null,
            }
        }

        const repeatCompanies = clients.filter((client) => client.applicationsCount >= 2).length

        return {
            uniqueClients: clients.length,
            repeatRate: clients.length > 0 ? Math.round((repeatCompanies / clients.length) * 100) : 0,
            totalProcessed: applications.filter((app) => app.status !== "draft" && app.status !== "pending").length,
            approved: applications.filter((app) => app.status === "approved" || app.status === "won").length,
        }
    }, [applications, clients, isLoading])

    const formatAmount = (value: number) => `${value.toLocaleString("ru-RU")} ₽`

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мои клиенты</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Компании из всех заявок, назначенных вашему банку
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">Всего клиентов</CardTitle>
                        <Users className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[#3CE8D1]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.uniqueClients}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">уникальных компаний</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">Повторные обращения</CardTitle>
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[#3CE8D1]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.repeatRate}%</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">с 2+ заявками</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">Заявок обработано</CardTitle>
                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[#3CE8D1]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.totalProcessed}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">за всё время</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">Одобрено</CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[#3CE8D1]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.approved}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">успешных решений</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader>
                    <CardTitle className="text-white">Список клиентов</CardTitle>
                    <CardDescription className="text-[#94a3b8]">
                        Клиенты по заявкам, назначенным вашей организации
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск по названию компании или ИНН"
                            className="pl-10 bg-[#0a1628] border-[#1e3a5f] text-white placeholder:text-[#94a3b8]"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Users className="h-16 w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {clients.length === 0 ? "Пока нет клиентов" : "Клиенты не найдены"}
                            </h3>
                            <p className="text-sm text-[#94a3b8] text-center max-w-md">
                                {clients.length === 0
                                    ? "Список появится после назначения заявок вашему банку."
                                    : "Измените поисковый запрос и попробуйте снова."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="md:hidden space-y-3">
                                {filteredClients.map((client) => (
                                    <div key={client.key} className="rounded-lg border border-[#1e3a5f] bg-[#0a1628] p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-white">{client.companyName}</p>
                                                <p className="text-xs text-[#94a3b8]">ИНН: {client.companyInn || "—"}</p>
                                            </div>
                                            <Badge className="bg-[#3CE8D1]/15 text-[#3CE8D1] border-[#3CE8D1]/30">
                                                {client.applicationsCount} заявок
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-[#94a3b8]">
                                            <div>Одобрено: <span className="text-white">{client.approvedCount}</span></div>
                                            <div>Объём: <span className="text-white">{formatAmount(client.totalAmount)}</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#1e3a5f]">
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Клиент</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Заявки</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Одобрено</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Общий объём</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Последняя заявка</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1e3a5f]">
                                        {filteredClients.map((client) => (
                                            <tr key={client.key} className="hover:bg-[#1e3a5f]/40 transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-white">{client.companyName}</p>
                                                    <p className="text-xs text-[#94a3b8]">ИНН: {client.companyInn || "—"}</p>
                                                </td>
                                                <td className="px-4 py-4 text-white">{client.applicationsCount}</td>
                                                <td className="px-4 py-4 text-white">{client.approvedCount}</td>
                                                <td className="px-4 py-4 text-white">{formatAmount(client.totalAmount)}</td>
                                                <td className="px-4 py-4 text-[#94a3b8]">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4" />
                                                        <span>
                                                            {client.lastApplicationAt
                                                                ? new Date(client.lastApplicationAt).toLocaleDateString("ru-RU")
                                                                : "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

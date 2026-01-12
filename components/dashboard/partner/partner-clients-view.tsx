"use client"

import { Users, Building2, FileText, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApplications } from "@/hooks/use-applications"

/**
 * PartnerClientsView - Partner's Clients with real API stats
 */
export function PartnerClientsView() {
    // Fetch real applications data - backend filters for partner automatically
    const { applications, isLoading } = useApplications()

    // Calculate stats from real data
    const stats = {
        // Unique companies (clients)
        uniqueClients: isLoading ? null : new Set(
            applications.map(a => a.company_name).filter(Boolean)
        ).size,
        // Total applications processed
        totalProcessed: isLoading ? null : applications.filter(
            a => a.status !== 'draft' && a.status !== 'pending'
        ).length,
        // Approved applications
        approved: isLoading ? null : applications.filter(
            a => a.status === 'approved'
        ).length,
        // Repeat rate (companies with 2+ applications)
        repeatRate: isLoading ? null : (() => {
            const companyCounts: Record<string, number> = {}
            applications.forEach(a => {
                if (a.company_name) {
                    companyCounts[a.company_name] = (companyCounts[a.company_name] || 0) + 1
                }
            })
            const totalCompanies = Object.keys(companyCounts).length
            if (totalCompanies === 0) return 0
            const repeatCompanies = Object.values(companyCounts).filter(c => c >= 2).length
            return Math.round((repeatCompanies / totalCompanies) * 100)
        })(),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мои клиенты</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Клиенты, заявки которых вы рассматриваете
                    </p>
                </div>
            </div>

            {/* Stats Cards with Real Data */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Всего клиентов
                        </CardTitle>
                        <Users className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.uniqueClients}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">уникальных компаний</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Повторные обращения
                        </CardTitle>
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.repeatRate}%</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">возвращаются повторно</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Заявок обработано
                        </CardTitle>
                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.totalProcessed}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">за всё время</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Одобрено
                        </CardTitle>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.approved}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">успешных сделок</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Placeholder */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader>
                    <CardTitle className="text-white">Список клиентов</CardTitle>
                    <CardDescription className="text-[#94a3b8]">
                        История работы с клиентами
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12">
                        <Users className="h-16 w-16 text-[#3CE8D1] mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Раздел в разработке
                        </h3>
                        <p className="text-sm text-[#94a3b8] text-center max-w-md mb-6">
                            Здесь будет отображаться полный список клиентов, история их заявок,
                            статистика одобрений и инструменты для коммуникации.
                        </p>
                        <Button variant="outline" className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10">
                            Загрузить список
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

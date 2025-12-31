"use client"

import { Landmark, Building2, FileText, Settings, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useApplications } from "@/hooks/use-applications"

/**
 * PartnerBankView - Partner's Bank/MFO profile with real API stats
 */
export function PartnerBankView() {
    // Fetch real applications data - backend filters for partner automatically
    const { applications, isLoading } = useApplications()

    // Calculate stats from real data
    const stats = {
        // Active products = unique product types in approved applications
        activeProducts: isLoading ? null : new Set(
            applications.filter(a => a.status === 'approved').map(a => a.product_type)
        ).size,
        // Applications in review
        inReview: isLoading ? null : applications.filter(
            a => a.status === 'pending' || a.status === 'in_review'
        ).length,
        // Approval rate
        approvalRate: isLoading ? null : (() => {
            const decided = applications.filter(a => a.status === 'approved' || a.status === 'rejected')
            if (decided.length === 0) return 0
            const approved = decided.filter(a => a.status === 'approved').length
            return Math.round((approved / decided.length) * 100)
        })(),
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мой банк / МФО</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управление профилем финансовой организации
                    </p>
                </div>
            </div>

            {/* Stats Cards with Real Data */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Типы продуктов
                        </CardTitle>
                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.activeProducts}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">с одобренными заявками</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Заявок в работе
                        </CardTitle>
                        <Landmark className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.inReview}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">на рассмотрении</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Одобрено
                        </CardTitle>
                        <Building2 className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.approvalRate}%</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">коэффициент одобрения</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Всего заявок
                        </CardTitle>
                        <Settings className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{applications.length}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">за всё время</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Placeholder */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader>
                    <CardTitle className="text-white">Профиль организации</CardTitle>
                    <CardDescription className="text-[#94a3b8]">
                        Информация о вашей финансовой организации
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12">
                        <Landmark className="h-16 w-16 text-[#3CE8D1] mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Раздел в разработке
                        </h3>
                        <p className="text-sm text-[#94a3b8] text-center max-w-md mb-6">
                            Здесь будет отображаться полная информация о вашей организации,
                            настройки продуктов и интеграции с системой.
                        </p>
                        <Button className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#3CE8D1]/90">
                            Редактировать профиль
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

"use client"

import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useApplications } from "@/hooks/use-applications"

interface PartnerApplicationsViewProps {
    onOpenDetail?: (id: string) => void
}

/**
 * PartnerApplicationsView - View for Partner's Applications list
 * 
 * This view shows:
 * - All applications assigned to this partner
 * - Application status and filters
 * - Quick actions for each application
 */
export function PartnerApplicationsView({ onOpenDetail }: PartnerApplicationsViewProps) {
    const { applications, isLoading } = useApplications()

    // Calculate stats
    const pendingCount = applications.filter(app => app.status === "pending").length
    const inReviewCount = applications.filter(app => app.status === "in-review").length
    const approvedCount = applications.filter(app => app.status === "approved").length
    const rejectedCount = applications.filter(app => app.status === "rejected").length

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-500/20 text-yellow-400",
            "in-review": "bg-blue-500/20 text-blue-400",
            approved: "bg-green-500/20 text-green-400",
            rejected: "bg-red-500/20 text-red-400",
            draft: "bg-gray-500/20 text-gray-400",
        }
        const labels: Record<string, string> = {
            pending: "Ожидает",
            "in-review": "На рассмотрении",
            approved: "Одобрено",
            rejected: "Отклонено",
            draft: "Черновик",
        }
        return (
            <Badge className={styles[status] || styles.draft}>
                {labels[status] || status}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мои заявки</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Все заявки, назначенные вашей организации
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Ожидают рассмотрения
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{pendingCount}</div>
                        <p className="text-xs text-[#94a3b8]">новых заявок</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            В работе
                        </CardTitle>
                        <FileText className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{inReviewCount}</div>
                        <p className="text-xs text-[#94a3b8]">на рассмотрении</p>
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
                        <div className="text-2xl font-bold text-white">{approvedCount}</div>
                        <p className="text-xs text-[#94a3b8]">успешных</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Отклонено
                        </CardTitle>
                        <XCircle className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{rejectedCount}</div>
                        <p className="text-xs text-[#94a3b8]">отклонённых</p>
                    </CardContent>
                </Card>
            </div>

            {/* Applications List */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader>
                    <CardTitle className="text-white">Список заявок</CardTitle>
                    <CardDescription className="text-[#94a3b8]">
                        {applications.length} заявок всего
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-[#94a3b8]">Загрузка...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-16 w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Нет заявок
                            </h3>
                            <p className="text-sm text-[#94a3b8] text-center">
                                Заявки появятся, когда агенты направят их в вашу организацию
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.slice(0, 10).map((app) => (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f] hover:border-[#3CE8D1]/50 transition-colors cursor-pointer"
                                    onClick={() => onOpenDetail?.(String(app.id))}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                            <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">
                                                {app.company_name || `Заявка #${app.id}`}
                                            </p>
                                            <p className="text-sm text-[#94a3b8]">
                                                {app.product_type_display || app.product_type} • {parseFloat(app.amount || '0').toLocaleString('ru-RU')} ₽
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getStatusBadge(app.status)}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                        >
                                            Открыть
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {applications.length > 10 && (
                                <p className="text-center text-sm text-[#94a3b8] pt-4">
                                    Показано 10 из {applications.length} заявок
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

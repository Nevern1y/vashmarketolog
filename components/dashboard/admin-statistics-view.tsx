"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PRODUCT_TYPE_LABELS } from "@/lib/application-display"
import { FileText, Users, CheckCircle, XCircle, Clock, BarChart3, RefreshCw, TrendingUp, TrendingDown } from "lucide-react"
import { useApplications } from "@/hooks/use-applications"

export function AdminStatisticsView() {
    const { applications, isLoading, refetch } = useApplications()

    const stats = useMemo(() => {
        const apps = applications || []
        const total = apps.length
        const pending = apps.filter(a => a.status === "pending" || a.status === "in_review").length
        const approved = apps.filter(a => a.status === "approved" || a.status === "won").length
        const rejected = apps.filter(a => a.status === "rejected" || a.status === "lost").length

        const byProduct: Record<string, number> = {}
        apps.forEach(a => { byProduct[a.product_type] = (byProduct[a.product_type] || 0) + 1 })

        return { total, pending, approved, rejected, byProduct }
    }, [applications])

    const statCards = [
        { title: "Всего заявок", value: stats.total, icon: FileText, color: "text-[#4F7DF3]", bgColor: "bg-[#4F7DF3]/10", change: "+12%" },
        { title: "В работе", value: stats.pending, icon: Clock, color: "text-amber-500", bgColor: "bg-amber-500/10", change: null },
        { title: "Одобрено", value: stats.approved, icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-500/10", change: "+8%" },
        { title: "Отклонено", value: stats.rejected, icon: XCircle, color: "text-rose-500", bgColor: "bg-rose-500/10", change: "-3%" },
    ]

    const products = useMemo(() => {
        const knownKeys = Object.keys(PRODUCT_TYPE_LABELS)
        const extraKeys = Object.keys(stats.byProduct).filter((key) => !knownKeys.includes(key))

        return [...knownKeys, ...extraKeys].map((key) => ({
            key,
            label: PRODUCT_TYPE_LABELS[key] || key,
        }))
    }, [stats.byProduct])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-[#3CE8D1]" />
                        Статистика
                    </h1>
                    <p className="text-sm text-muted-foreground">Общий обзор по заявкам</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    Обновить
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((s, i) => (
                    <Card key={i} className="border-border">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{s.title}</p>
                                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                                    {s.change && (
                                        <div className={cn("flex items-center gap-1 text-xs mt-1", s.change.startsWith("+") ? "text-emerald-500" : "text-rose-500")}>
                                            {s.change.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {s.change} за месяц
                                        </div>
                                    )}
                                </div>
                                <div className={cn("p-3 rounded-xl", s.bgColor)}>
                                    <s.icon className={cn("h-5 w-5", s.color)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Products Distribution */}
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Распределение по продуктам</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {products.map(p => {
                            const count = stats.byProduct[p.key] || 0
                            const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                            return (
                                <div key={p.key}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">{p.label}</span>
                                        <span className="font-medium">{count} ({percent}%)</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-[#3CE8D1] rounded-full transition-all" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Conversion Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold">Конверсия</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-5xl font-bold text-[#3CE8D1]">
                                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">Одобрено из всех заявок</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-semibold">Средний срок обработки</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <p className="text-5xl font-bold text-[#4F7DF3]">2.4</p>
                            <p className="text-sm text-muted-foreground mt-2">дня в среднем</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { UserCheck, Users, TrendingUp, Award, Copy, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth-context"
import { useApplications } from "@/hooks/use-applications"
import { api } from "@/lib/api"
import { toast } from "sonner"

// Accreditation status configuration
const ACCREDITATION_STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    none: { label: 'Не подана', color: 'text-gray-500 bg-gray-500/10', icon: AlertCircle },
    pending: { label: 'На проверке', color: 'text-[#f97316] bg-[#f97316]/10', icon: Clock },
    approved: { label: 'Аккредитован', color: 'text-[#3CE8D1] bg-[#3CE8D1]/10', icon: CheckCircle },
    rejected: { label: 'Отклонена', color: 'text-red-500 bg-red-500/10', icon: XCircle },
}

interface InvitedAgent {
    id: number
    email: string
    first_name: string
    last_name: string
    phone?: string
    accreditation_status: 'none' | 'pending' | 'approved' | 'rejected'
    date_joined: string
    company_name?: string
}

/**
 * PartnerAgentsView - Partner's Agents management with real API data
 * 
 * Shows list of agents invited by this partner with their accreditation status.
 */
export function PartnerAgentsView() {
    const { user } = useAuth()
    const { applications, isLoading: isLoadingApps } = useApplications()
    const [invitedAgents, setInvitedAgents] = useState<InvitedAgent[]>([])
    const [isLoadingAgents, setIsLoadingAgents] = useState(true)

    // Fetch invited agents
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const data = await api.get('/auth/my-agents/')
                // Handle both array responses and paginated object responses
                let agents: InvitedAgent[] = []
                if (Array.isArray(data)) {
                    agents = data
                } else if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: InvitedAgent[] }).results)) {
                    agents = (data as { results: InvitedAgent[] }).results
                }
                setInvitedAgents(agents)
            } catch (error) {
                console.error('Failed to fetch agents:', error)
                // Fallback to empty - endpoint may not exist yet
                setInvitedAgents([])
            } finally {
                setIsLoadingAgents(false)
            }
        }
        fetchAgents()
    }, [])

    const isLoading = isLoadingApps || isLoadingAgents

    // Calculate stats from real data
    // Note: Applications come from agents who submitted them (created_by_email)
    const stats = {
        // Unique agents = unique creators
        uniqueAgents: isLoading ? null : new Set(
            applications.map(a => a.created_by_email).filter(Boolean)
        ).size,
        // Total applications from all agents
        totalApplications: isLoading ? null : applications.length,
        // Top agent by application count
        topAgent: isLoading ? null : (() => {
            const agentCounts: Record<string, { count: number; name?: string }> = {}
            applications.forEach(a => {
                if (a.created_by_email) {
                    if (!agentCounts[a.created_by_email]) {
                        agentCounts[a.created_by_email] = { count: 0, name: a.created_by_name }
                    }
                    agentCounts[a.created_by_email].count++
                }
            })
            const sorted = Object.entries(agentCounts).sort((a, b) => b[1].count - a[1].count)
            if (sorted.length === 0) return null
            return { email: sorted[0][0], count: sorted[0][1].count, name: sorted[0][1].name }
        })(),
        // New applications this month
        thisMonth: isLoading ? null : applications.filter(a => {
            const created = new Date(a.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
        }).length,
    }

    // Generate and copy referral link to clipboard
    const handleInviteAgent = async () => {
        if (!user?.id) {
            toast.error("Ошибка: пользователь не авторизован")
            return
        }

        const referralUrl = `${window.location.origin}/auth?ref=${user.id}`

        try {
            await navigator.clipboard.writeText(referralUrl)
            toast.success("Ссылка для приглашения скопирована!", {
                description: "Отправьте её агенту для регистрации",
            })
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement("textarea")
            textArea.value = referralUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand("copy")
            document.body.removeChild(textArea)
            toast.success("Ссылка для приглашения скопирована!")
        }
    }

    const getFullName = (agent: InvitedAgent) => {
        if (agent.first_name || agent.last_name) {
            return `${agent.last_name || ''} ${agent.first_name || ''}`.trim()
        }
        return agent.email.split('@')[0]
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Мои агенты</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управление агентами, работающими с вашей организацией
                    </p>
                </div>
                <Button
                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#3CE8D1]/90"
                    onClick={handleInviteAgent}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    Пригласить агента
                </Button>
            </div>

            {/* Stats Cards with Real Data */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Всего агентов
                        </CardTitle>
                        <Users className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{invitedAgents.length || stats.uniqueAgents}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">приглашено вами</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Заявок в этом месяце
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 text-[#3CE8D1]" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.thisMonth}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">от агентов</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Топ-агент
                        </CardTitle>
                        <Award className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24 bg-[#1e3a5f]" />
                        ) : stats.topAgent ? (
                            <>
                                <div className="text-lg font-bold text-white truncate">
                                    {stats.topAgent.name || stats.topAgent.email.split('@')[0]}
                                </div>
                                <p className="text-xs text-[#94a3b8]">{stats.topAgent.count} заявок</p>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-bold text-white">—</div>
                                <p className="text-xs text-[#94a3b8]">нет данных</p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-[#94a3b8]">
                            Всего заявок
                        </CardTitle>
                        <UserCheck className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-12 bg-[#1e3a5f]" />
                        ) : (
                            <div className="text-2xl font-bold text-white">{stats.totalApplications}</div>
                        )}
                        <p className="text-xs text-[#94a3b8]">от всех агентов</p>
                    </CardContent>
                </Card>
            </div>

            {/* Agents List with Accreditation Status */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader>
                    <CardTitle className="text-white">Список агентов</CardTitle>
                    <CardDescription className="text-[#94a3b8]">
                        Агенты, приглашённые по вашей реферальной ссылке
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingAgents ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : invitedAgents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <UserCheck className="h-16 w-16 text-[#3CE8D1] mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Нет приглашённых агентов
                            </h3>
                            <p className="text-sm text-[#94a3b8] text-center max-w-md mb-6">
                                Отправьте реферальную ссылку потенциальным агентам, чтобы они могли зарегистрироваться и работать с вами.
                            </p>
                            <Button
                                variant="outline"
                                className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                                onClick={handleInviteAgent}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Скопировать ссылку
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#1e3a5f]">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                                            Агент
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                                            Компания
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                                            Статус аккредитации
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                                            Дата регистрации
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e3a5f]">
                                    {invitedAgents.map((agent) => {
                                        const statusCfg = ACCREDITATION_STATUS[agent.accreditation_status] || ACCREDITATION_STATUS.none
                                        const StatusIcon = statusCfg.icon
                                        return (
                                            <tr key={agent.id} className="hover:bg-[#1e3a5f]/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {getFullName(agent)}
                                                        </div>
                                                        <div className="text-sm text-[#94a3b8]">
                                                            {agent.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-[#94a3b8]">
                                                        {agent.company_name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge className={statusCfg.color}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {statusCfg.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-[#94a3b8]">
                                                        {new Date(agent.date_joined).toLocaleDateString('ru-RU')}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

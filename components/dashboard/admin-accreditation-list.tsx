"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    Users,
    FileText,
    RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AgentAccreditation {
    id: number
    email: string
    phone?: string
    first_name: string
    last_name: string
    accreditation_status: 'none' | 'pending' | 'approved' | 'rejected'
    accreditation_submitted_at: string | null
    accreditation_comment: string
    company_name: string | null
    date_joined: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    none: { label: 'Не подана', color: 'text-gray-500 bg-gray-500/10', icon: AlertCircle },
    pending: { label: 'На проверке', color: 'text-[#f97316] bg-[#f97316]/10', icon: Clock },
    approved: { label: 'Аккредитован', color: 'text-[#3CE8D1] bg-[#3CE8D1]/10', icon: CheckCircle },
    rejected: { label: 'Отклонена', color: 'text-red-500 bg-red-500/10', icon: XCircle },
}

export function AdminAccreditationList() {
    const [agents, setAgents] = useState<AgentAccreditation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending')
    const [actionAgent, setActionAgent] = useState<AgentAccreditation | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [rejectComment, setRejectComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Load agents on mount and tab change
    useEffect(() => {
        loadAgents()
    }, [activeTab])

    const loadAgents = async () => {
        setIsLoading(true)
        try {
            const statusParam = activeTab === 'all' ? 'all' : 'pending'
            // api.get returns data directly in this codebase
            const data = await api.get(`/auth/admin/accreditation/?status=${statusParam}`) as AgentAccreditation[]
            setAgents(data || [])
        } catch (error) {
            console.error('Failed to load accreditation list:', error)
            toast.error('Ошибка загрузки списка')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAction = (agent: AgentAccreditation, action: 'approve' | 'reject') => {
        setActionAgent(agent)
        setActionType(action)
        setRejectComment('')
    }

    const confirmAction = async () => {
        if (!actionAgent || !actionType) return

        setIsSubmitting(true)
        try {
            await api.post(`/auth/admin/accreditation/${actionAgent.id}/`, {
                action: actionType,
                comment: actionType === 'reject' ? rejectComment : '',
            })

            toast.success(
                actionType === 'approve'
                    ? `${actionAgent.first_name || actionAgent.email} аккредитован!`
                    : `Аккредитация отклонена`
            )

            loadAgents()
        } catch (error) {
            console.error('Action failed:', error)
            toast.error('Ошибка при выполнении действия')
        } finally {
            setIsSubmitting(false)
            setActionAgent(null)
            setActionType(null)
        }
    }

    const getFullName = (agent: AgentAccreditation) => {
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
                    <h1 className="text-2xl font-bold text-foreground">Аккредитация агентов</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Проверка и одобрение заявок на аккредитацию
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={loadAgents}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Обновить
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">На проверке</p>
                                <p className="text-2xl font-bold text-[#f97316]">
                                    {agents.filter(a => a.accreditation_status === 'pending').length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-[#f97316]" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Аккредитовано</p>
                                <p className="text-2xl font-bold text-[#3CE8D1]">
                                    {agents.filter(a => a.accreditation_status === 'approved').length}
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-[#3CE8D1]" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Всего агентов</p>
                                <p className="text-2xl font-bold">{agents.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
                <TabsList>
                    <TabsTrigger value="pending">Ожидают проверки</TabsTrigger>
                    <TabsTrigger value="all">Все агенты</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                        </div>
                    ) : agents.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle className="h-12 w-12 text-[#3CE8D1] mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {activeTab === 'pending'
                                        ? 'Нет заявок на проверку'
                                        : 'Нет агентов'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {agents.map((agent) => {
                                const statusConfig = STATUS_CONFIG[agent.accreditation_status]
                                const StatusIcon = statusConfig.icon
                                return (
                                    <Card key={agent.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg">
                                                            {getFullName(agent)}
                                                        </h3>
                                                        <Badge className={statusConfig.color}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
                                                        <div>Email: {agent.email}</div>
                                                        <div>Телефон: {agent.phone || '—'}</div>
                                                        <div>Компания: {agent.company_name || 'Не указана'}</div>
                                                        <div>
                                                            Подал заявку:{' '}
                                                            {agent.accreditation_submitted_at
                                                                ? new Date(agent.accreditation_submitted_at).toLocaleDateString('ru-RU')
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                    {agent.accreditation_comment && (
                                                        <p className="mt-2 text-sm text-red-400 italic">
                                                            Причина отклонения: {agent.accreditation_comment}
                                                        </p>
                                                    )}
                                                </div>

                                                {agent.accreditation_status === 'pending' && (
                                                    <div className="flex gap-2 ml-4">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                                            onClick={() => handleAction(agent, 'reject')}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                            Отклонить
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                                            onClick={() => handleAction(agent, 'approve')}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Одобрить
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!actionAgent} onOpenChange={() => setActionAgent(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actionType === 'approve' ? 'Одобрить аккредитацию?' : 'Отклонить аккредитацию?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionType === 'approve' ? (
                                <>
                                    Агент <strong>{actionAgent && getFullName(actionAgent)}</strong> получит
                                    полный доступ к системе и сможет создавать заявки.
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <p>
                                        Агент <strong>{actionAgent && getFullName(actionAgent)}</strong> не
                                        сможет создавать заявки до повторной подачи аккредитации.
                                    </p>
                                    <div>
                                        <label className="text-sm font-medium">Причина отклонения:</label>
                                        <Input
                                            value={rejectComment}
                                            onChange={(e) => setRejectComment(e.target.value)}
                                            placeholder="Укажите причину..."
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAction}
                            disabled={isSubmitting}
                            className={actionType === 'approve'
                                ? 'bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]'
                                : 'bg-red-500 hover:bg-red-600'}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {actionType === 'approve' ? 'Одобрить' : 'Отклонить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

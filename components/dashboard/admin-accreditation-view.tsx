"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Users,
    FileText,
    RefreshCw,
    Building2,
    Search,
    ChevronRight,
    Shield,
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
    first_name: string
    last_name: string
    accreditation_status: string
    accreditation_submitted_at: string | null
    company_name: string | null
    company_inn?: string
    director_name?: string
    bank_bik?: string
    bank_name?: string
    bank_account?: string
}

const DOCS = [
    { id: 'charter', name: 'Устав организации' },
    { id: 'inn', name: 'Свидетельство ИНН' },
    { id: 'ogrn', name: 'Свидетельство ОГРН' },
    { id: 'protocol', name: 'Решение/Протокол' },
]

export function AdminAccreditationView() {
    const [agents, setAgents] = useState<AgentAccreditation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selected, setSelected] = useState<AgentAccreditation | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [rejectComment, setRejectComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [docState, setDocState] = useState<Record<string, boolean>>({})

    useEffect(() => { loadAgents() }, [])

    useEffect(() => {
        if (selected) {
            const init: Record<string, boolean> = {}
            DOCS.forEach(d => { init[d.id] = false })
            setDocState(init)
        }
    }, [selected?.id])

    const verified = Object.values(docState).filter(Boolean).length
    const allVerified = verified === DOCS.length

    const loadAgents = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/auth/admin/accreditation/?status=pending')
            setAgents(Array.isArray(res) ? res : (res as any)?.results || [])
        } catch { toast.error('Ошибка загрузки') }
        finally { setIsLoading(false) }
    }

    const filtered = useMemo(() => {
        if (!searchQuery) return agents
        const q = searchQuery.toLowerCase()
        return agents.filter(a =>
            a.email.toLowerCase().includes(q) ||
            (a.company_name || '').toLowerCase().includes(q) ||
            (a.company_inn || '').includes(q)
        )
    }, [agents, searchQuery])

    const getName = (a: AgentAccreditation) =>
        a.first_name || a.last_name ? `${a.last_name || ''} ${a.first_name || ''}`.trim() : a.email.split('@')[0]

    const getInit = (a: AgentAccreditation) =>
        a.first_name && a.last_name ? `${a.last_name[0]}${a.first_name[0]}`.toUpperCase() : a.email.substring(0, 2).toUpperCase()

    const confirmAction = async () => {
        if (!selected || !actionType) return
        setIsSubmitting(true)
        try {
            const ep = actionType === 'approve'
                ? `/auth/admin/accreditation/${selected.id}/approve/`
                : `/auth/admin/accreditation/${selected.id}/reject/`
            await api.post(ep, actionType === 'reject' ? { comment: rejectComment } : {})
            toast.success(actionType === 'approve' ? 'Аккредитован' : 'Отклонено')
            setAgents(agents.filter(a => a.id !== selected.id))
            setSelected(null)
            setActionType(null)
        } catch (e: any) { toast.error(e.message || 'Ошибка') }
        finally { setIsSubmitting(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="h-6 w-6 text-[#3CE8D1]" />
                        Аккредитация агентов
                    </h1>
                    <p className="text-sm text-muted-foreground">Проверка заявок</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                        <Clock className="h-3 w-3 mr-1" />{agents.length} ожидают
                    </Badge>
                    <Button variant="outline" size="sm" onClick={loadAgents} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />Обновить
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 min-h-[500px]">
                <Card className="col-span-4 border-border flex flex-col">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Очередь</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-[#3CE8D1]" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6"><CheckCircle className="h-12 w-12 text-[#3CE8D1]/30 mb-3" /><p className="text-sm text-muted-foreground">Нет заявок</p></div>
                        ) : (
                            <ScrollArea className="h-full">
                                <div className="divide-y divide-border">
                                    {filtered.map(a => (
                                        <div key={a.id} onClick={() => setSelected(a)}
                                            className={cn("p-4 cursor-pointer", selected?.id === a.id ? "bg-[#3CE8D1]/10 border-l-2 border-l-[#3CE8D1]" : "hover:bg-accent/50")}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold", selected?.id === a.id ? "bg-[#3CE8D1] text-[#0a1628]" : "bg-[#4F7DF3]/20 text-[#4F7DF3]")}>{getInit(a)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{getName(a)}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{a.company_name || a.email}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-8 border-border flex flex-col">
                    {selected ? (
                        <>
                            <CardHeader className="pb-4 border-b">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4F7DF3] to-[#3CE8D1] flex items-center justify-center text-lg font-bold text-white">{getInit(selected)}</div>
                                    <div>
                                        <h2 className="text-xl font-bold">{getName(selected)}</h2>
                                        <p className="text-sm text-muted-foreground">{selected.company_name || '—'}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" />Документы</h3>
                                        <Badge variant="outline" className={allVerified ? "text-emerald-500" : "text-amber-500"}>{verified}/{DOCS.length}</Badge>
                                    </div>
                                    <Progress value={(verified / DOCS.length) * 100} className="h-2 mb-4" />
                                    <div className="space-y-2">
                                        {DOCS.map(d => (
                                            <div key={d.id} className={cn("flex items-center justify-between p-3 rounded-lg border", docState[d.id] ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", docState[d.id] ? "bg-emerald-500/20" : "bg-[#4F7DF3]/10")}>
                                                        {docState[d.id] ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <FileText className="h-4 w-4 text-[#4F7DF3]" />}
                                                    </div>
                                                    <span className={cn("text-sm", docState[d.id] && "text-emerald-500")}>{d.name}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDocState(p => ({ ...p, [d.id]: !p[d.id] }))}>
                                                    <CheckCircle className={cn("h-3.5 w-3.5", docState[d.id] && "text-emerald-500")} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Building2 className="h-3 w-3" />Данные</h3>
                                        <Row label="ИНН" value={selected.company_inn} />
                                        <Row label="Руководитель" value={selected.director_name} />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Building2 className="h-3 w-3" />Банк</h3>
                                        <Row label="БИК" value={selected.bank_bik} />
                                        <Row label="Банк" value={selected.bank_name} />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t">
                                    <Button size="lg" variant="outline" className="flex-1 h-12 text-rose-500 border-rose-500/50 hover:bg-rose-500 hover:text-white" onClick={() => setActionType('reject')}>
                                        <XCircle className="h-5 w-5 mr-2" />Отклонить
                                    </Button>
                                    <Button size="lg" className={cn("flex-1 h-12", allVerified ? "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]" : "bg-slate-600 cursor-not-allowed")} onClick={() => allVerified && setActionType('approve')} disabled={!allVerified}>
                                        <CheckCircle className="h-5 w-5 mr-2" />Аккредитовать
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">Выберите агента</h3>
                        </div>
                    )}
                </Card>
            </div>

            <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{actionType === 'approve' ? 'Одобрить?' : 'Отклонить?'}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {actionType === 'reject' ? (
                                <div className="space-y-3">
                                    <p>Укажите причину отклонения:</p>
                                    <Textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Причина..." />
                                </div>
                            ) : <p>Агент получит полный доступ.</p>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction} disabled={isSubmitting} className={actionType === 'approve' ? 'bg-[#3CE8D1] text-[#0a1628]' : 'bg-rose-500'}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {actionType === 'approve' ? 'Одобрить' : 'Отклонить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function Row({ label, value }: { label: string; value?: string }) {
    return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value || '—'}</span></div>
}

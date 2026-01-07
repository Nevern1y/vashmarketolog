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
    ChevronDown,
    ChevronUp,
    User,
    CreditCard,
    MapPin,
    Landmark,
    Download,
    ExternalLink,
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Document types required for agent accreditation
const REQUIRED_DOCS = [
    { id: 4, name: 'Устав организации' },
    { id: 5, name: 'Свидетельство ИНН' },
    { id: 6, name: 'Свидетельство ОГРН' },
    { id: 7, name: 'Решение/Протокол' },
]

interface AgentDocument {
    id: number
    name: string
    document_type_id: number | null
    status: string
    uploaded_at: string | null
    file_url: string | null
}

interface Founder {
    full_name?: string
    inn?: string
    share_relative?: number
    birth_date?: string
    birth_place?: string
    citizen?: string
}

interface AgentAccreditation {
    id: number
    email: string
    phone: string | null
    first_name: string
    last_name: string
    accreditation_status: string
    accreditation_submitted_at: string | null
    accreditation_comment: string | null
    date_joined: string
    // Company basic info
    company_name: string | null
    company_short_name: string | null
    company_inn: string | null
    company_ogrn: string | null
    company_kpp: string | null
    company_legal_form: string | null
    is_resident: boolean
    // Addresses
    legal_address: string | null
    legal_address_postal_code: string | null
    actual_address: string | null
    actual_address_postal_code: string | null
    // State registration
    okato: string | null
    oktmo: string | null
    okpo: string | null
    okfs: string | null
    okved: string | null
    registration_date: string | null
    registration_authority: string | null
    authorized_capital_declared: string | null
    authorized_capital_paid: string | null
    // Contacts
    company_website: string | null
    company_email: string | null
    company_phone: string | null
    // Director
    director_name: string | null
    director_position: string | null
    director_birth_date: string | null
    director_birth_place: string | null
    director_email: string | null
    director_phone: string | null
    // Passport
    passport_series: string | null
    passport_number: string | null
    passport_issued_by: string | null
    passport_date: string | null
    passport_code: string | null
    // Tax and signatory
    signatory_basis: string | null
    tax_system: string | null
    vat_rate: string | null
    // Bank
    bank_bik: string | null
    bank_name: string | null
    bank_account: string | null
    bank_corr_account: string | null
    // Founders
    founders_data: Founder[]
    // Documents
    documents: AgentDocument[]
}

export function AdminAccreditationView() {
    const [agents, setAgents] = useState<AgentAccreditation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selected, setSelected] = useState<AgentAccreditation | null>(null)
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
    const [rejectComment, setRejectComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [docState, setDocState] = useState<Record<string, boolean>>({})

    // Collapsible sections state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        company: true,
        registration: false,
        director: false,
        bank: false,
        founders: false,
        documents: true,
    })

    useEffect(() => { loadAgents() }, [])

    useEffect(() => {
        if (selected) {
            // Initialize doc state based on actual documents
            const init: Record<string, boolean> = {}
            REQUIRED_DOCS.forEach(d => { init[d.id.toString()] = false })
            // Mark verified documents
            selected.documents?.forEach(doc => {
                if (doc.status === 'verified' && doc.document_type_id) {
                    init[doc.document_type_id.toString()] = true
                }
            })
            setDocState(init)
        }
    }, [selected?.id])

    const verified = Object.values(docState).filter(Boolean).length
    const allVerified = verified === REQUIRED_DOCS.length

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

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const confirmAction = async () => {
        if (!selected || !actionType) return
        setIsSubmitting(true)
        try {
            // Backend expects single endpoint with action in body
            await api.post(`/auth/admin/accreditation/${selected.id}/`, {
                action: actionType,
                comment: actionType === 'reject' ? rejectComment : ''
            })
            toast.success(actionType === 'approve' ? 'Агент аккредитован' : 'Заявка отклонена')
            setAgents(agents.filter(a => a.id !== selected.id))
            setSelected(null)
            setActionType(null)
            setRejectComment('')
        } catch (e: any) { toast.error(e.message || 'Ошибка') }
        finally { setIsSubmitting(false) }
    }

    const toggleDocVerification = async (docId: string) => {
        setDocState(p => ({ ...p, [docId]: !p[docId] }))
    }

    const formatDate = (date: string | null) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('ru-RU')
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

            <div className="grid grid-cols-12 gap-6 min-h-[700px]">
                {/* Left Panel - Queue */}
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
                                                    <p className="text-xs text-muted-foreground truncate">{a.company_short_name || a.company_name || a.email}</p>
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

                {/* Right Panel - Details */}
                <Card className="col-span-8 border-border flex flex-col">
                    {selected ? (
                        <>
                            <CardHeader className="pb-4 border-b">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4F7DF3] to-[#3CE8D1] flex items-center justify-center text-lg font-bold text-white">{getInit(selected)}</div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold">{getName(selected)}</h2>
                                        <p className="text-sm text-muted-foreground">{selected.company_short_name || selected.company_name || '—'}</p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        <p>Заявка от: {formatDate(selected.accreditation_submitted_at)}</p>
                                        <p>Email: {selected.email}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Section: Общая информация */}
                                <Collapsible open={openSections.company} onOpenChange={() => toggleSection('company')}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="font-semibold text-sm">Общая информация о компании</span>
                                            </div>
                                            {openSections.company ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-3 px-1">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Row label="Полное наименование" value={selected.company_name} />
                                            <Row label="Краткое наименование" value={selected.company_short_name} />
                                            <Row label="ИНН" value={selected.company_inn} highlight />
                                            <Row label="ОГРН" value={selected.company_ogrn} highlight />
                                            <Row label="КПП" value={selected.company_kpp} />
                                            <Row label="ОПФ" value={selected.company_legal_form} />
                                            <Row label="Резидент РФ" value={selected.is_resident ? 'Да' : 'Нет'} />
                                            <Row label="Сайт" value={selected.company_website} isLink />
                                            <Row label="Email компании" value={selected.company_email} />
                                            <Row label="Телефон компании" value={selected.company_phone} />
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" />Адреса</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                <Row label="Юридический адрес" value={`${selected.legal_address_postal_code ? selected.legal_address_postal_code + ', ' : ''}${selected.legal_address || '—'}`} />
                                                <Row label="Фактический адрес" value={`${selected.actual_address_postal_code ? selected.actual_address_postal_code + ', ' : ''}${selected.actual_address || '—'}`} />
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Section: Государственная регистрация */}
                                <Collapsible open={openSections.registration} onOpenChange={() => toggleSection('registration')}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                            <div className="flex items-center gap-2">
                                                <Landmark className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="font-semibold text-sm">Государственная регистрация</span>
                                            </div>
                                            {openSections.registration ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-3 px-1">
                                        <div className="grid grid-cols-3 gap-3">
                                            <Row label="ОКАТО" value={selected.okato} />
                                            <Row label="ОКТМО" value={selected.oktmo} />
                                            <Row label="ОКПО" value={selected.okpo} />
                                            <Row label="ОКФС" value={selected.okfs} />
                                            <Row label="Дата регистрации" value={formatDate(selected.registration_date)} />
                                            <Row label="Рег. орган" value={selected.registration_authority} />
                                            <Row label="ОКВЭД" value={selected.okved} span2 />
                                            <Row label="Объявл. УК" value={selected.authorized_capital_declared ? `${Number(selected.authorized_capital_declared).toLocaleString('ru-RU')} ₽` : '—'} />
                                            <Row label="Оплач. УК" value={selected.authorized_capital_paid ? `${Number(selected.authorized_capital_paid).toLocaleString('ru-RU')} ₽` : '—'} />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Section: Руководитель */}
                                <Collapsible open={openSections.director} onOpenChange={() => toggleSection('director')}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="font-semibold text-sm">Руководитель</span>
                                            </div>
                                            {openSections.director ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-3 px-1">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Row label="ФИО" value={selected.director_name} highlight />
                                            <Row label="Должность" value={selected.director_position} />
                                            <Row label="Дата рождения" value={formatDate(selected.director_birth_date)} />
                                            <Row label="Место рождения" value={selected.director_birth_place} />
                                            <Row label="Email" value={selected.director_email} />
                                            <Row label="Телефон" value={selected.director_phone} />
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Паспортные данные (проверка на мошенничество)</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Row label="Серия и номер" value={selected.passport_series && selected.passport_number ? `${selected.passport_series} ${selected.passport_number}` : '—'} highlight />
                                                <Row label="Дата выдачи" value={formatDate(selected.passport_date)} />
                                                <Row label="Кем выдан" value={selected.passport_issued_by} span2 />
                                                <Row label="Код подразделения" value={selected.passport_code} />
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border/50">
                                            <div className="grid grid-cols-2 gap-3">
                                                <Row label="Действует на основании" value={selected.signatory_basis === 'charter' ? 'Устава' : 'Доверенности'} />
                                                <Row label="Система налогообложения" value={selected.tax_system?.toUpperCase() || '—'} />
                                                <Row label="Ставка НДС" value={selected.vat_rate ? `${selected.vat_rate}%` : '—'} />
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Section: Банковские реквизиты */}
                                <Collapsible open={openSections.bank} onOpenChange={() => toggleSection('bank')}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="font-semibold text-sm">Банковские реквизиты</span>
                                            </div>
                                            {openSections.bank ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-3 px-1">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Row label="Наименование банка" value={selected.bank_name} span2 />
                                            <Row label="БИК" value={selected.bank_bik} highlight />
                                            <Row label="Р/с" value={selected.bank_account} highlight />
                                            <Row label="К/с" value={selected.bank_corr_account} span2 />
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Section: Учредители */}
                                {selected.founders_data && selected.founders_data.length > 0 && (
                                    <Collapsible open={openSections.founders} onOpenChange={() => toggleSection('founders')}>
                                        <CollapsibleTrigger asChild>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-[#4F7DF3]" />
                                                    <span className="font-semibold text-sm">Учредители ({selected.founders_data.length})</span>
                                                </div>
                                                {openSections.founders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pt-3 px-1">
                                            <div className="space-y-3">
                                                {selected.founders_data.map((founder, idx) => (
                                                    <div key={idx} className="p-3 border border-border/50 rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium text-sm">{founder.full_name || `Учредитель ${idx + 1}`}</span>
                                                            {founder.share_relative && <Badge variant="outline">{founder.share_relative}%</Badge>}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <Row label="ИНН" value={founder.inn} small />
                                                            <Row label="Гражданство" value={founder.citizen} small />
                                                            <Row label="Дата рождения" value={founder.birth_date} small />
                                                            <Row label="Место рождения" value={founder.birth_place} small />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {/* Section: Документы */}
                                <Collapsible open={openSections.documents} onOpenChange={() => toggleSection('documents')}>
                                    <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 cursor-pointer hover:bg-accent/50">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#4F7DF3]" />
                                                <span className="font-semibold text-sm">Документы</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={allVerified ? "text-emerald-500" : "text-amber-500"}>{verified}/{REQUIRED_DOCS.length}</Badge>
                                                {openSections.documents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-3 px-1">
                                        <Progress value={(verified / REQUIRED_DOCS.length) * 100} className="h-2 mb-4" />
                                        <div className="space-y-2">
                                            {REQUIRED_DOCS.map(reqDoc => {
                                                const uploadedDoc = selected.documents?.find(d => d.document_type_id === reqDoc.id)
                                                const isVerified = docState[reqDoc.id.toString()]
                                                return (
                                                    <div key={reqDoc.id} className={cn("flex items-center justify-between p-3 rounded-lg border", isVerified ? "border-emerald-500/30 bg-emerald-500/5" : uploadedDoc ? "border-border" : "border-rose-500/30 bg-rose-500/5")}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isVerified ? "bg-emerald-500/20" : uploadedDoc ? "bg-[#4F7DF3]/10" : "bg-rose-500/10")}>
                                                                {isVerified ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : uploadedDoc ? <FileText className="h-4 w-4 text-[#4F7DF3]" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                                                            </div>
                                                            <div>
                                                                <span className={cn("text-sm", isVerified && "text-emerald-500")}>{reqDoc.name}</span>
                                                                {uploadedDoc && (
                                                                    <p className="text-xs text-muted-foreground">{uploadedDoc.name}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {uploadedDoc?.file_url && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                    <a href={uploadedDoc.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Download className="h-3.5 w-3.5" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {uploadedDoc && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleDocVerification(reqDoc.id.toString())}>
                                                                    <CheckCircle className={cn("h-3.5 w-3.5", isVerified && "text-emerald-500")} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Other uploaded documents */}
                                        {selected.documents && selected.documents.filter(d => !REQUIRED_DOCS.some(r => r.id === d.document_type_id)).length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Дополнительные документы</h4>
                                                <div className="space-y-2">
                                                    {selected.documents.filter(d => !REQUIRED_DOCS.some(r => r.id === d.document_type_id)).map(doc => (
                                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">{doc.name}</span>
                                                            </div>
                                                            {doc.file_url && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t mt-6">
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
                            <p className="text-sm text-muted-foreground/60 mt-1">для просмотра подробной информации</p>
                        </div>
                    )}
                </Card>
            </div>

            <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{actionType === 'approve' ? 'Аккредитовать агента?' : 'Отклонить заявку?'}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            {actionType === 'reject' ? (
                                <div className="space-y-3">
                                    <p>Укажите причину отклонения:</p>
                                    <Textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Причина отклонения..." />
                                </div>
                            ) : <p>Агент получит полный доступ к системе и сможет создавать заявки от имени клиентов.</p>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction} disabled={isSubmitting || (actionType === 'reject' && !rejectComment.trim())} className={actionType === 'approve' ? 'bg-[#3CE8D1] text-[#0a1628]' : 'bg-rose-500'}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {actionType === 'approve' ? 'Аккредитовать' : 'Отклонить'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface RowProps {
    label: string
    value?: string | null
    highlight?: boolean
    isLink?: boolean
    span2?: boolean
    small?: boolean
}

function Row({ label, value, highlight, isLink, span2, small }: RowProps) {
    const content = value || '—'
    return (
        <div className={cn("flex justify-between items-start gap-2", span2 && "col-span-2", small && "text-xs")}>
            <span className={cn("text-muted-foreground shrink-0", small ? "text-xs" : "text-sm")}>{label}</span>
            {isLink && value ? (
                <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[#4F7DF3] hover:underline text-sm text-right truncate max-w-[200px]">{content}</a>
            ) : (
                <span className={cn("text-right truncate max-w-[200px]", highlight ? "font-semibold text-[#3CE8D1]" : "font-medium", small ? "text-xs" : "text-sm")}>{content}</span>
            )}
        </div>
    )
}

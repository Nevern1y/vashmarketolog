"use client"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Building2,
    Upload,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    FileSignature,
    Send,
    Shield,
    PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMyCompany } from "@/hooks/use-companies"
import { useDocuments, useDocumentMutations } from "@/hooks/use-documents"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { api } from "@/lib/api"

// Document types required for agent accreditation (per PDF spec)
// UPDATED: Using numeric IDs for agent documents
const accreditationDocuments = [
    { id: 4, label: "Устав", description: "Устав компании (актуальная редакция)" },
    { id: 5, label: "Копия свидетельства ИНН", description: "Свидетельство о постановке на налоговый учет" },
    { id: 6, label: "Копия свидетельства ОГРН", description: "Свидетельство о регистрации" },
    { id: 7, label: "Протокол/Решение о назначении", description: "Документ о назначении директора" },
]

// Documents for signing (UI stubs per ТЗ)
const signingDocuments = [
    { id: "agent_contract", label: "Агентский договор", description: "Договор с платформой" },
    { id: "joining_application", label: "Заявление о присоединении", description: "К правилам платформы" },
    { id: "personal_data_consent", label: "Согласие на обработку персональных данных", description: "Согласие на обработку ПД" },
]

export function AgentAccreditationView() {
    const { user } = useAuth()
    const { company, isLoading: companyLoading } = useMyCompany()
    const { documents, isLoading: docsLoading, refetch: refetchDocs } = useDocuments()
    const { uploadDocument, isLoading: uploading } = useDocumentMutations()

    // Track uploaded document type IDs for this accreditation
    const [uploadedDocTypeIds, setUploadedDocTypeIds] = useState<Set<number>>(new Set())

    // Track signed documents (UI state only - stub for MVP)
    const [signedDocs, setSignedDocs] = useState<Set<string>>(new Set())

    // Track accreditation submission
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    // File input refs by document type
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

    // Check if user is already approved - cast user to access accreditation_status
    const isApproved = (user as any)?.accreditation_status === 'approved'

    // Check organization data completeness
    const hasOrgData = company && company.inn && company.name && company.director_name

    // Check if specific doc type ID is uploaded
    const isDocUploaded = useCallback((docTypeId: number) => {
        // Check in local state or in existing documents
        if (uploadedDocTypeIds.has(docTypeId)) return true
        // Also check if document matching this type ID exists in backend
        return documents.some(d => d.document_type_id === docTypeId)
    }, [uploadedDocTypeIds, documents])

    // Handle file upload - now uses numeric document_type_id
    const handleFileUpload = async (docTypeId: number, file: File) => {
        const docInfo = accreditationDocuments.find(d => d.id === docTypeId)
        const doc = await uploadDocument({
            name: file.name,
            file: file,
            document_type_id: docTypeId,  // NEW: Numeric ID
            product_type: 'agent',         // Agent accreditation context
        })

        if (doc && doc.id) {
            setUploadedDocTypeIds(prev => new Set(prev).add(docTypeId))
            toast.success(`Документ "${docInfo?.label}" загружен`)
            refetchDocs()
        } else {
            toast.error("Ошибка загрузки документа")
        }
    }

    // Handle document signing (UI stub)
    const handleSign = (docId: string) => {
        setSignedDocs(prev => new Set(prev).add(docId))
        toast.success(`Документ "${signingDocuments.find(d => d.id === docId)?.label}" подписан`)
    }

    // Calculate progress
    const totalSteps = 4 // Org data + Docs + Signing + Submit
    const orgDataComplete = hasOrgData ? 1 : 0
    const docsComplete = accreditationDocuments.filter(d => isDocUploaded(d.id)).length === accreditationDocuments.length ? 1 : 0
    const signingComplete = signedDocs.size === signingDocuments.length ? 1 : 0
    const submitComplete = isSubmitted ? 1 : 0
    const completedSteps = orgDataComplete + docsComplete + signingComplete + submitComplete
    const progress = (completedSteps / totalSteps) * 100

    // Check if can submit
    const canSubmit = hasOrgData &&
        accreditationDocuments.every(d => isDocUploaded(d.id)) &&
        signedDocs.size === signingDocuments.length &&
        !isSubmitted

    // Handle accreditation submission - calls real API
    const handleSubmitAccreditation = async () => {
        if (!canSubmit) return

        setIsSubmitting(true)

        try {
            // Phase 4: Call real API endpoint using centralized api client
            await api.post('/auth/accreditation/submit/', {})

            setIsSubmitted(true)
            toast.success("Заявка на аккредитацию отправлена! Ожидайте проверки модератором.")
        } catch (error: any) {
            toast.error(error.message || "Ошибка отправки заявки")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Loading state
    if (companyLoading || docsLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                    <p className="text-muted-foreground">Загрузка данных аккредитации...</p>
                </div>
            </div>
        )
    }

    // If agent is already approved, show success view instead of steps
    if (isApproved) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Аккредитация агента</h1>
                    <p className="text-muted-foreground">Статус вашей аккредитации</p>
                </div>

                {/* Success Card */}
                <Card className="shadow-sm border-[#3CE8D1] bg-[#3CE8D1]/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3CE8D1]/20">
                                <PartyPopper className="h-10 w-10 text-[#3CE8D1]" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-[#3CE8D1]">Аккредитация одобрена!</h2>
                                <p className="mt-2 text-muted-foreground max-w-md">
                                    Поздравляем! Ваша аккредитация успешно пройдена.
                                    Теперь вы можете создавать заявки на финансовые продукты.
                                </p>
                            </div>
                            <Badge className="bg-[#3CE8D1] text-[#0a1628] text-sm px-4 py-1">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Активный агент
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Available Actions */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Доступные действия</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-start gap-3 rounded-lg border p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                    <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <p className="font-medium">Создать заявку</p>
                                    <p className="text-sm text-muted-foreground">
                                        Оформите заявку на банковскую гарантию, кредит или другие продукты
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 rounded-lg border p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3CE8D1]/10">
                                    <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                                </div>
                                <div>
                                    <p className="font-medium">Мои клиенты</p>
                                    <p className="text-sm text-muted-foreground">
                                        Управляйте клиентской базой и их заявками
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Аккредитация агента</h1>
                <p className="text-muted-foreground">Заполните все данные и загрузите документы для получения статуса агента</p>
            </div>

            {/* Status Banner */}
            {isSubmitted && (
                <Card className="shadow-sm border-[#f97316] bg-[#f97316]/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="h-6 w-6 text-[#f97316]" />
                            <div>
                                <p className="font-medium text-[#f97316]">Заявка на проверке</p>
                                <p className="text-sm text-muted-foreground">Ваша заявка на аккредитацию отправлена. Ожидайте решения модератора.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress Card */}
            <Card className="shadow-sm">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Прогресс аккредитации</p>
                            <p className="text-2xl font-bold">
                                {completedSteps} из {totalSteps} этапов
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-[#3CE8D1]">{Math.round(progress)}%</p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-3" />
                </CardContent>
            </Card>

            {/* Step 1: Organization Data */}
            <Card className={cn("shadow-sm transition-all", !hasOrgData && "ring-2 ring-[#f97316]")}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                hasOrgData ? "bg-[#3CE8D1]/10" : "bg-[#f97316]/10"
                            )}>
                                <Building2 className={cn("h-5 w-5", hasOrgData ? "text-[#3CE8D1]" : "text-[#f97316]")} />
                            </div>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground">Шаг 1.</span>
                                    Данные организации
                                </CardTitle>
                                <CardDescription>Информация о вашей компании</CardDescription>
                            </div>
                        </div>
                        <Badge className={hasOrgData ? "bg-[#3CE8D1]/10 text-[#3CE8D1]" : "bg-[#f97316]/10 text-[#f97316]"}>
                            {hasOrgData ? "Заполнено" : "Требуется"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Полное наименование организации</Label>
                                <Input
                                    value={company?.name || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Краткое наименование</Label>
                                <Input
                                    value={company?.short_name || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ИНН</Label>
                                <Input
                                    value={company?.inn || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ОГРН</Label>
                                <Input
                                    value={company?.ogrn || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ФИО Директора</Label>
                                <Input
                                    value={company?.director_name || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Должность</Label>
                                <Input
                                    value={company?.director_position || "Генеральный директор"}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={company?.email || ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Действует на основании</Label>
                                <Input
                                    value={company?.acts_on_basis || "Устава"}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                        {!hasOrgData && (
                            <p className="text-sm text-[#f97316] mt-4 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Заполните профиль компании в разделе «Моя компания»
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Document Upload */}
            <Card className={cn(
                "shadow-sm transition-all",
                hasOrgData && !accreditationDocuments.every(d => isDocUploaded(d.id)) && "ring-2 ring-[#f97316]"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                accreditationDocuments.every(d => isDocUploaded(d.id)) ? "bg-[#3CE8D1]/10" : "bg-[#f97316]/10"
                            )}>
                                <FileText className={cn(
                                    "h-5 w-5",
                                    accreditationDocuments.every(d => isDocUploaded(d.id)) ? "text-[#3CE8D1]" : "text-[#f97316]"
                                )} />
                            </div>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground">Шаг 2.</span>
                                    Загрузка документов
                                </CardTitle>
                                <CardDescription>Загрузите необходимые документы организации</CardDescription>
                            </div>
                        </div>
                        <Badge className={
                            accreditationDocuments.every(d => isDocUploaded(d.id))
                                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                                : "bg-[#f97316]/10 text-[#f97316]"
                        }>
                            {accreditationDocuments.filter(d => isDocUploaded(d.id)).length}/{accreditationDocuments.length} загружено
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-3">
                        {accreditationDocuments.map((doc) => {
                            const isUploaded = isDocUploaded(doc.id)
                            return (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {isUploaded ? (
                                            <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
                                        ) : (
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{doc.label}</p>
                                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                                        </div>
                                    </div>
                                    {isUploaded ? (
                                        <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1]">Загружен</Badge>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                ref={(el) => { fileInputRefs.current[doc.id] = el }}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFileUpload(doc.id, file)
                                                }}
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2 bg-transparent"
                                                disabled={uploading}
                                                onClick={() => fileInputRefs.current[doc.id]?.click()}
                                            >
                                                {uploading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Upload className="h-3 w-3" />
                                                )}
                                                Загрузить
                                            </Button>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Document Signing (UI Stub) */}
            <Card className={cn(
                "shadow-sm transition-all",
                accreditationDocuments.every(d => isDocUploaded(d.id)) && signedDocs.size < signingDocuments.length && "ring-2 ring-[#f97316]"
            )}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                signedDocs.size === signingDocuments.length ? "bg-[#3CE8D1]/10" : "bg-[#f97316]/10"
                            )}>
                                <FileSignature className={cn(
                                    "h-5 w-5",
                                    signedDocs.size === signingDocuments.length ? "text-[#3CE8D1]" : "text-[#f97316]"
                                )} />
                            </div>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground">Шаг 3.</span>
                                    Подписание документов
                                </CardTitle>
                                <CardDescription>Подпишите необходимые договоры и согласия</CardDescription>
                            </div>
                        </div>
                        <Badge className={
                            signedDocs.size === signingDocuments.length
                                ? "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                                : "bg-[#f97316]/10 text-[#f97316]"
                        }>
                            {signedDocs.size}/{signingDocuments.length} подписано
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="border-t pt-4 space-y-3">
                        {signingDocuments.map((doc) => {
                            const isSigned = signedDocs.has(doc.id)
                            return (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        {isSigned ? (
                                            <CheckCircle2 className="h-5 w-5 text-[#3CE8D1]" />
                                        ) : (
                                            <FileSignature className="h-5 w-5 text-muted-foreground" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">{doc.label}</p>
                                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                                        </div>
                                    </div>
                                    {isSigned ? (
                                        <Badge className="bg-[#3CE8D1]/10 text-[#3CE8D1]">Подписано</Badge>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-2 bg-transparent border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
                                            onClick={() => handleSign(doc.id)}
                                        >
                                            <FileSignature className="h-3 w-3" />
                                            Подписать
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Submit Accreditation */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                isSubmitted ? "bg-[#3CE8D1]/10" : "bg-muted"
                            )}>
                                <Shield className={cn(
                                    "h-5 w-5",
                                    isSubmitted ? "text-[#3CE8D1]" : "text-muted-foreground"
                                )} />
                            </div>
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-muted-foreground">Шаг 4.</span>
                                    Подача заявки
                                </CardTitle>
                                <CardDescription>Отправьте заявку на проверку модератору</CardDescription>
                            </div>
                        </div>
                        <Badge className={isSubmitted ? "bg-[#3CE8D1]/10 text-[#3CE8D1]" : "bg-muted text-muted-foreground"}>
                            {isSubmitted ? "Подано" : "Ожидает"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="border-t pt-4">
                        <Button
                            onClick={handleSubmitAccreditation}
                            disabled={!canSubmit || isSubmitting}
                            className={cn(
                                "w-full gap-2",
                                canSubmit
                                    ? "bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Отправка...
                                </>
                            ) : isSubmitted ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Заявка отправлена
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Подать заявку на аккредитацию
                                </>
                            )}
                        </Button>
                        {!canSubmit && !isSubmitted && (
                            <p className="text-sm text-muted-foreground mt-3 text-center">
                                Завершите все предыдущие шаги для подачи заявки
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

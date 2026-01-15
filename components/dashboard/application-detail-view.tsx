"use client"

import { useState, useCallback, useRef } from "react"
import {
    ChevronLeft,
    ChevronDown,
    ChevronUp,
    FileText,
    Upload,
    Send,
    CheckCircle,
    Clock,
    XCircle,
    Building2,
    Calendar,
    Banknote,
    ExternalLink,
    Download,
    Eye,
    Trash2,
    Loader2,
    MapPin,
    Phone,
    Mail,
    User,
    CreditCard,
    Hash,
    Landmark
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApplication, useApplicationMutations, type Application } from "@/hooks/use-applications"
import { useDocumentMutations } from "@/hooks/use-documents"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ApplicationChat } from "./application-chat"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ApplicationDetailViewProps {
    applicationId: string | number
    onBack?: () => void
    onNavigateToCalculationSession?: (sessionId: number) => void
}

/**
 * ApplicationDetailView - Agent's Application Detail with Step-by-Step Workflow
 * 
 * Design based on Bankon24 (techzadanie2) with Tiffany color scheme:
 * - Step 1: Заполните формы (Form completion)
 * - Step 2: Загрузите документы (Document upload)  
 * - Step 3: Отправка в банк (Bank submission)
 * - Step 4: Согласование и оплата (Approval & Payment)
 */
export function ApplicationDetailView({ applicationId, onBack, onNavigateToCalculationSession }: ApplicationDetailViewProps) {
    const { application, isLoading, error, refetch } = useApplication(applicationId)
    const { submitApplication, updateApplication, deleteApplication, isLoading: isSubmitting } = useApplicationMutations()
    const { uploadDocument, deleteDocument } = useDocumentMutations()

    // Step expansion state
    const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
        1: true,
        2: true,
        3: true,
        4: true,
    })

    // File upload state
    const [isUploading, setIsUploading] = useState(false)
    const [uploadingDocType, setUploadingDocType] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Simple ref for documents section to scroll to after upload
    const documentsSectionRef = useRef<HTMLDivElement>(null)
    // Track which doc type was just uploaded to scroll to it
    const lastUploadedDocTypeRef = useRef<number | null>(null)
    const specificFileInputRef = useRef<HTMLInputElement>(null)

    // Simple function to scroll to documents section after upload
    const scrollToDocumentsSection = useCallback(() => {
        // Small delay to ensure DOM has updated
        setTimeout(() => {
            if (documentsSectionRef.current) {
                documentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                console.log('[scrollIntoView] Scrolled to documents section')
            }
        }, 100)
    }, [])

    // Get required documents list based on product type
    const getRequiredDocuments = (productType: string): { name: string; id: number; required: boolean }[] => {
        // Required documents for БГ КИК и кредиты (with asterisk)
        const requiredDocs = [
            { name: "Карточка компании", id: 1, required: true },
            { name: "Бухбаланс Ф1 и ОПиУ Ф2 на 30.06.2025", id: 200, required: true },
            { name: "Бухбаланс Ф1 и ОПиУ Ф2 на 30.09.2025", id: 201, required: true },
            { name: "Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2023 с квитанцией ИФНС", id: 202, required: true },
            { name: "Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2024 с квитанцией ИФНС", id: 203, required: true },
            { name: "Бухбаланс Ф1 и ОПиУ Ф2 на 31.12.2025 с квитанцией ИФНС", id: 204, required: true },
            { name: "Реестр контрактов", id: 50, required: true },
            { name: "Паспорт руководителя (все страницы)", id: 21, required: true },
            { name: "Паспорта всех учредителей (все страницы)", id: 22, required: true },
            { name: "Устав", id: 75, required: true },
            { name: "Решение/протокол о назначении руководителя", id: 76, required: true },
            { name: "Договор аренды с актом или свидетельство о праве собственности", id: 81, required: true },
        ]

        // Optional documents (without asterisk)
        const optionalDocs = [
            { name: "Карточка 51 счета за 24 месяца", id: 80, required: false },
            { name: "Налоговая декларация на прибыль за 24 год с квитанцией ИФНС", id: 210, required: false },
            { name: "Налоговая декларация на прибыль за 25 год с квитанцией ИФНС", id: 211, required: false },
            { name: "Общая ОСВ за 1 год по всем счетам в разбивке по субсчетам", id: 220, required: false },
            { name: "ОСВ 60 за 1 год в разбивке по субсчетам и контрагентам (Excel)", id: 221, required: false },
            { name: "ОСВ 62 за 1 год в разбивке по субсчетам и контрагентам (Excel)", id: 222, required: false },
            { name: "Выписка в формате txt за 12 месяцев", id: 223, required: false },
        ]

        switch (productType) {
            case 'bank_guarantee':
            case 'contract_loan':
            case 'corporate_credit':
            case 'tender_loan':
                return [
                    ...requiredDocs,
                    ...optionalDocs,
                ]
            case 'factoring':
                return [
                    ...requiredDocs,
                    { name: "Реестр дебиторов", id: 10, required: true },
                    { name: "Договоры поставки", id: 11, required: true },
                    ...optionalDocs,
                ]
            default:
                return [
                    ...requiredDocs,
                    ...optionalDocs,
                ]
        }
    }


    const toggleStep = (step: number) => {
        setExpandedSteps(prev => ({ ...prev, [step]: !prev[step] }))
    }

    // Calculate step progress
    const calculateFormProgress = (app: Application): number => {
        const requiredFields = ['company_name', 'amount', 'product_type']
        const filledCount = requiredFields.filter(field => {
            const value = app[field as keyof Application]
            return value !== null && value !== undefined && value !== ''
        }).length
        return Math.round((filledCount / requiredFields.length) * 100)
    }

    const calculateDocumentProgress = (app: Application): number => {
        if (!app.documents || app.documents.length === 0) return 0
        const approvedCount = app.documents.filter(d => d.status === 'approved').length
        return Math.round((approvedCount / app.documents.length) * 100)
    }

    // Handle file upload - uploads to library AND attaches to application
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0 || !application) return

        setIsUploading(true)
        try {
            const uploadedDocIds: number[] = []

            for (const file of Array.from(files)) {
                const uploadedDoc = await uploadDocument({
                    file,
                    document_type_id: 0,
                    name: file.name,
                })
                if (uploadedDoc) {
                    uploadedDocIds.push(uploadedDoc.id)
                }
            }

            if (uploadedDocIds.length > 0) {
                // Get existing document IDs and add new ones
                const existingDocIds = application.documents?.map(d => d.id) || []
                const allDocIds = [...existingDocIds, ...uploadedDocIds]

                // Attach documents to application
                await updateApplication(application.id, {
                    document_ids: allDocIds
                } as Parameters<typeof updateApplication>[1])

                toast.success(`Загружено документов: ${uploadedDocIds.length}`)

                // Wait for refetch then scroll to documents section
                await refetch()
                scrollToDocumentsSection()
            } else {
                toast.error('Не удалось загрузить документы')
            }
        } catch {
            toast.error('Ошибка загрузки документов')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }, [uploadDocument, updateApplication, application, refetch, scrollToDocumentsSection])

    // Handle specific document type upload  
    const handleSpecificDocUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, docTypeId: number, docTypeName: string) => {
        const files = e.target.files
        if (!files || files.length === 0 || !application) {
            console.log('[Upload] No files or no application')
            return
        }

        console.log(`[Upload] Starting upload for ${docTypeName}, docTypeId: ${docTypeId}`)
        lastUploadedDocTypeRef.current = docTypeId

        setUploadingDocType(docTypeName)
        try {
            const uploadedDocIds: number[] = []

            for (const file of Array.from(files)) {
                console.log(`[Upload] Uploading file: ${file.name}`)
                const uploadedDoc = await uploadDocument({
                    file,
                    document_type_id: docTypeId,
                    name: `${docTypeName} - ${file.name}`,
                })
                console.log(`[Upload] Upload result:`, uploadedDoc)
                if (uploadedDoc) {
                    uploadedDocIds.push(uploadedDoc.id)
                }
            }

            if (uploadedDocIds.length > 0) {
                console.log(`[Upload] Attaching ${uploadedDocIds.length} docs to application`)
                const existingDocIds = application.documents?.map(d => d.id) || []
                const allDocIds = [...existingDocIds, ...uploadedDocIds]

                await updateApplication(application.id, {
                    document_ids: allDocIds
                } as Parameters<typeof updateApplication>[1])

                toast.success(`${docTypeName}: загружено`)

                // Wait for refetch then scroll to documents section
                await refetch()
                scrollToDocumentsSection()
            } else {
                console.error('[Upload] No documents were uploaded')
                toast.error('Не удалось загрузить документ')
            }
        } catch (err) {
            console.error('[Upload] Error:', err)
            toast.error('Ошибка загрузки документа')
        } finally {
            setUploadingDocType(null)
            if (e.target) {
                e.target.value = ''
            }
        }
    }, [uploadDocument, updateApplication, application, refetch, scrollToDocumentsSection])

    // Check if a required document is already uploaded
    // Matches by document_type_id OR by name prefix (since we upload with "{docName} - {filename}" format)
    const isDocumentUploaded = (docName: string, docId: number): boolean => {
        if (!application?.documents) return false

        const found = application.documents.some(d => {
            // Match by exact document_type_id
            if (d.document_type_id && d.document_type_id === docId) return true

            // Fallback: match by name prefix (format: "{docName} - {filename}")
            if (d.name && d.name.startsWith(docName + ' - ')) return true

            return false
        })

        console.log(`[isDocumentUploaded] "${docName}" (id: ${docId}) => ${found}`,
            application.documents.map(d => ({ id: d.id, name: d.name, type_id: d.document_type_id })))

        return found
    }

    // Get uploaded document for a specific type
    const getUploadedDocForType = (docName: string, docId: number) => {
        if (!application?.documents) return null

        // First try to find by document_type_id
        const byTypeId = application.documents.find(d => d.document_type_id && d.document_type_id === docId)
        if (byTypeId) return byTypeId

        // Fallback: find by name prefix
        return application.documents.find(d => d.name && d.name.startsWith(docName + ' - '))
    }

    // Handle application deletion
    const [isDeleting, setIsDeleting] = useState(false)
    const handleDeleteApplication = async () => {
        if (!confirm("Вы действительно хотите удалить эту заявку? Это действие нельзя отменить.")) return

        setIsDeleting(true)
        try {
            const success = await deleteApplication(Number(applicationId))
            if (success) {
                toast.success("Заявка успешно удалена")
                onBack?.()
            }
        } catch (err) {
            console.error(err)
            toast.error("Не удалось удалить заявку")
        } finally {
            setIsDeleting(false)
        }
    }

    // Handle submit to bank
    const handleSubmitToBank = useCallback(async () => {
        if (!application) return

        // Check if documents are attached
        if (!application.documents || application.documents.length === 0) {
            toast.error('Необходимо прикрепить документы', {
                description: 'Загрузите требуемые документы перед отправкой заявки в банк'
            })
            return
        }

        const result = await submitApplication(application.id)
        if (result) {
            toast.success('Заявка отправлена в банк')
            refetch()
        } else {
            // Show user-friendly error message
            toast.error('Не удалось отправить заявку', {
                description: 'Проверьте, что все обязательные документы загружены и данные заполнены'
            })
        }
    }, [application, submitApplication, refetch])

    // Handle document delete
    const handleDeleteDocument = useCallback(async (docId: number) => {
        console.log(`[Delete] Deleting document ${docId}`)

        try {
            await deleteDocument(docId)
            toast.success('Документ удален')

            // Wait for refetch then scroll to documents section
            await refetch()
            scrollToDocumentsSection()
        } catch (err) {
            console.error('[Delete] Error:', err)
            toast.error('Ошибка удаления документа')
        }
    }, [deleteDocument, refetch, scrollToDocumentsSection])

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            in_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            info_requested: "bg-orange-500/20 text-orange-400 border-orange-500/30",
            approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            rejected: "bg-red-500/20 text-red-400 border-red-500/30",
            won: "bg-[#3CE8D1]/20 text-[#3CE8D1] border-[#3CE8D1]/30",
        }
        const labels: Record<string, string> = {
            draft: "Черновик",
            pending: "Ожидает",
            in_review: "На рассмотрении",
            info_requested: "Запрос информации",
            approved: "Одобрено",
            rejected: "Отклонено",
            won: "Выигран",
        }
        return (
            <Badge className={cn("border", styles[status] || styles.draft)}>
                {labels[status] || status}
            </Badge>
        )
    }

    // Document status badge
    const getDocStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
            pending: {
                bg: "bg-yellow-500/20",
                text: "text-yellow-400",
                icon: <Clock className="h-3 w-3" />,
                label: "На проверке"
            },
            uploaded: {
                bg: "bg-blue-500/20",
                text: "text-blue-400",
                icon: <Upload className="h-3 w-3" />,
                label: "Загружен"
            },
            approved: {
                bg: "bg-emerald-500/20",
                text: "text-emerald-400",
                icon: <CheckCircle className="h-3 w-3" />,
                label: "Одобрен"
            },
            rejected: {
                bg: "bg-red-500/20",
                text: "text-red-400",
                icon: <XCircle className="h-3 w-3" />,
                label: "Отклонен"
            },
        }
        const style = styles[status] || styles.pending
        return (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", style.bg, style.text)}>
                {style.icon}
                {style.label}
            </span>
        )
    }

    // Circular progress component
    const CircularProgress = ({ progress, size = 60, color = "#3CE8D1" }: { progress: number; size?: number; color?: string }) => {
        const strokeWidth = 4
        const radius = (size - strokeWidth) / 2
        const circumference = radius * 2 * Math.PI
        const offset = circumference - (progress / 100) * circumference

        return (
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#1e3a5f"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-500"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                    {progress}
                </span>
            </div>
        )
    }

    // Step header component
    const StepHeader = ({
        step,
        title,
        subtitle,
        icon,
        progress,
        isComplete,
        isExpanded,
        onToggle
    }: {
        step: number
        title: string
        subtitle: string
        icon: React.ReactNode
        progress: number
        isComplete: boolean
        isExpanded: boolean
        onToggle: () => void
    }) => (
        <button
            onClick={onToggle}
            className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg transition-all",
                "hover:bg-[#1e3a5f]/50",
                isComplete ? "bg-emerald-500/10" : "bg-[#0f2042]"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg",
                    isComplete ? "bg-emerald-500/20 text-emerald-400" : "bg-[#3CE8D1]/10 text-[#3CE8D1]"
                )}>
                    {isComplete ? <CheckCircle className="h-6 w-6" /> : icon}
                </div>
                <div className="text-left">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        Шаг {step}: {title}
                        {isComplete && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                    </h3>
                    <p className="text-sm text-[#94a3b8]">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <CircularProgress
                    progress={progress}
                    color={isComplete ? "#10b981" : progress > 0 ? "#ffa726" : "#3CE8D1"}
                />
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[#94a3b8]" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-[#94a3b8]" />
                )}
            </div>
        </button>
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    if (error || !application) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <XCircle className="h-16 w-16 text-red-400" />
                <p className="text-red-400">{error || 'Заявка не найдена'}</p>
                <Button onClick={onBack} variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Назад к списку
                </Button>
            </div>
        )
    }

    const formProgress = calculateFormProgress(application)
    const docProgress = calculateDocumentProgress(application)
    const isSubmitted = application.status !== 'draft' && application.status !== 'pending'
    const canSubmit = formProgress === 100 && application.status === 'draft'

    return (
        <div className="space-y-4 md:space-y-6 pb-8">
            {/* Header with Breadcrumb - per reference format */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f] shrink-0"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0">
                        {/* Breadcrumb: ← Мои заявки / Тип / Заявка #ID */}
                        <nav className="flex items-center gap-2 text-xs md:text-sm text-[#94a3b8] mb-1">
                            <button onClick={onBack} className="hover:text-[#3CE8D1] transition-colors flex items-center gap-1">
                                <span>←</span>
                                <span>Мои заявки</span>
                            </button>
                            <span>/</span>
                            {application.calculation_session ? (
                                <button
                                    onClick={() => onNavigateToCalculationSession?.(application.calculation_session!)}
                                    className="hover:text-[#3CE8D1] transition-colors cursor-pointer"
                                    title="Перейти к результатам отбора банков"
                                >
                                    {application.product_type_display || application.product_type || 'Заявка'}
                                </button>
                            ) : (
                                <span className="text-[#94a3b8]">
                                    {application.product_type_display || application.product_type || 'Заявка'}
                                </span>
                            )}
                            <span>/</span>
                            <span className="text-[#3CE8D1]">Заявка #{application.id}</span>
                        </nav>
                        {/* Title: Заявка #ID */}
                        <h1 className="text-lg md:text-2xl font-bold text-white flex flex-wrap items-center gap-2 md:gap-3">
                            <span className="truncate">Заявка #{application.id}</span>
                            {application.target_bank_name && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs md:text-sm font-medium">
                                    {application.target_bank_name}
                                </Badge>
                            )}
                            <span className="text-xs md:text-sm font-normal text-[#94a3b8]">
                                от {new Date(application.created_at).toLocaleDateString('ru-RU')}
                            </span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Grid - Content + Chat */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left Column - Main Content */}
                <div className="xl:col-span-3 space-y-4">
                    {/* Application Info Card - Compact BANKON24 style */}
                    {/* Application Info Card - Refined per User Request */}
                    <Card className="bg-[#0f2042] border-[#1e3a5f]">
                        <CardContent className="p-4">
                            {/* Key Information Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4 text-sm">
                                {/* 1. Client */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Клиент</p>
                                    <p className="font-medium text-white truncate" title={application.company_name}>
                                        {application.company_name}
                                    </p>
                                </div>

                                {/* 2. INN */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">ИНН</p>
                                    <p className="font-medium text-white font-mono">{application.company_inn}</p>
                                </div>

                                {/* 3. Date Created */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Дата создания</p>
                                    <p className="font-medium text-white">
                                        {new Date(application.created_at).toLocaleDateString('ru-RU')}
                                    </p>
                                </div>

                                {/* 4. Bank */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Банк</p>
                                    <p className="font-medium text-white truncate" title={application.target_bank_name || 'Не выбран'}>
                                        {application.target_bank_name || 'Не выбран'}
                                    </p>
                                </div>

                                {/* 5. Amount */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Сумма кредита</p>
                                    <p className="font-medium text-white">
                                        {parseFloat(application.amount || '0').toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>

                                {/* 6. Term */}
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Срок кредита</p>
                                    <p className="font-medium text-white">
                                        {(() => {
                                            const data = application.goscontract_data;
                                            if (data) {
                                                // Try to find specific start/end dates
                                                const start = data.credit_start_date || data.guarantee_start_date || data.contract_start_date;
                                                const end = data.credit_end_date || data.guarantee_end_date || data.contract_end_date;

                                                if (start && end) {
                                                    const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');
                                                    return `${formatDate(start)} - ${formatDate(end)}`;
                                                }
                                            }
                                            return `${application.term_months} мес.`;
                                        })()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Company Information Tabs */}
                    <Card className="bg-[#0f2042] border-[#1e3a5f]">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                                Информация о компании
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Tabs defaultValue="general" className="w-full">
                                {/* Horizontal scroll tabs on mobile */}
                                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                                    <TabsList className="inline-flex min-w-max w-full md:grid md:grid-cols-4 bg-[#0a1628] mb-4 gap-1">
                                        <TabsTrigger value="general" className="text-xs md:text-sm data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black whitespace-nowrap">
                                            Общие
                                        </TabsTrigger>
                                        <TabsTrigger value="registration" className="text-xs md:text-sm data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black whitespace-nowrap">
                                            Регистр.
                                        </TabsTrigger>
                                        <TabsTrigger value="bank" className="text-xs md:text-sm data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black whitespace-nowrap">
                                            Банк
                                        </TabsTrigger>
                                        <TabsTrigger value="contacts" className="text-xs md:text-sm data-[state=active]:bg-[#3CE8D1] data-[state=active]:text-black whitespace-nowrap">
                                            Контакты
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* General Information Tab */}
                                <TabsContent value="general" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Building2 className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Наименование</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.name || application.company_name}</p>
                                            <p className="text-sm text-[#94a3b8] mt-1">{application.company_data?.short_name || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Hash className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Реквизиты</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white">ИНН: <span className="font-medium">{application.company_data?.inn || application.company_inn}</span></p>
                                                <p className="text-white">КПП: <span className="font-medium">{application.company_data?.kpp || '-'}</span></p>
                                                <p className="text-white">ОГРН: <span className="font-medium">{application.company_data?.ogrn || '-'}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Юридический адрес</span>
                                            </div>
                                            <p className="text-white text-sm">{application.company_data?.legal_address || 'Не указан'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Фактический адрес</span>
                                            </div>
                                            <p className="text-white text-sm">{application.company_data?.actual_address || 'Совпадает с юридическим'}</p>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Registration Tab */}
                                <TabsContent value="registration" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <User className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Руководитель</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.director_name || 'Не указан'}</p>
                                            <p className="text-sm text-[#94a3b8] mt-1">{application.company_data?.director_position || 'Генеральный директор'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Учредители</span>
                                            </div>
                                            {application.company_data?.founders_data && application.company_data.founders_data.length > 0 ? (
                                                <div className="space-y-2">
                                                    {application.company_data.founders_data.map((founder, idx) => (
                                                        <div key={idx} className="text-white text-sm">
                                                            <span className="font-medium">{founder.name}</span>
                                                            {founder.inn && <span className="text-[#94a3b8]"> (ИНН: {founder.inn})</span>}
                                                            {founder.share && <span className="text-[#94a3b8]"> — {founder.share}%</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[#94a3b8] text-sm">Данные не заполнены</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Bank Requisites Tab */}
                                <TabsContent value="bank" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Банк</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.bank_name || 'Не указан'}</p>
                                            <p className="text-sm text-[#94a3b8] mt-1">БИК: {application.company_data?.bank_bic || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CreditCard className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Счета</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white text-sm">Р/с: <span className="font-mono">{application.company_data?.bank_account || '-'}</span></p>
                                                <p className="text-white text-sm">К/с: <span className="font-mono">{application.company_data?.bank_corr_account || '-'}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                    {application.company_data?.bank_accounts_data && application.company_data.bank_accounts_data.length > 0 && (
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Landmark className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Дополнительные счета</span>
                                            </div>
                                            <div className="space-y-3">
                                                {application.company_data.bank_accounts_data.map((acc, idx) => (
                                                    <div key={idx} className="p-3 rounded bg-[#0f2042] border border-[#1e3a5f]">
                                                        <p className="text-white font-medium">{acc.bank_name}</p>
                                                        <p className="text-sm text-[#94a3b8]">БИК: {acc.bic} | Счет: {acc.account}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Contacts Tab */}
                                <TabsContent value="contacts" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <User className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Контактное лицо</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.contact_person || 'Не указано'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Phone className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Телефон</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.contact_phone || 'Не указан'}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0a1628] border border-[#1e3a5f]">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Mail className="h-4 w-4 text-[#3CE8D1]" />
                                                <span className="text-sm font-medium text-[#94a3b8]">Email</span>
                                            </div>
                                            <p className="text-white font-medium">{application.company_data?.contact_email || 'Не указан'}</p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Product-Specific Parameters Card */}
                    {application.product_type && (
                        <Card className="bg-[#0f2042] border-[#1e3a5f]">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                    Параметры {
                                        application.product_type === 'bank_guarantee' ? 'гарантии' :
                                            application.product_type === 'contract_loan' ? 'кредита' :
                                                application.product_type === 'corporate_credit' ? 'кредита' :
                                                    application.product_type === 'factoring' ? 'факторинга' :
                                                        application.product_type === 'ved' ? 'ВЭД' :
                                                            application.product_type === 'leasing' ? 'лизинга' :
                                                                application.product_type === 'insurance' ? 'страхования' :
                                                                    application.product_type === 'rko' ? 'РКО' :
                                                                        application.product_type === 'special_account' ? 'спецсчёта' :
                                                                            'продукта'
                                    }
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-4">
                                {/* Bank Guarantee Fields */}
                                {application.product_type === 'bank_guarantee' && (
                                    <>
                                        {/* Guarantee Type & Law */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {application.guarantee_type && (
                                                <ProductInfoItem
                                                    label="Тип гарантии"
                                                    value={
                                                        application.guarantee_type === 'application_security' ? 'Обеспечение заявки' :
                                                            application.guarantee_type === 'contract_execution' ? 'Исполнение контракта' :
                                                                application.guarantee_type === 'advance_return' ? 'Возврат аванса' :
                                                                    application.guarantee_type === 'warranty_obligations' ? 'Гарантийные обязательства' :
                                                                        application.guarantee_type === 'payment_guarantee' ? 'Гарантии оплаты товара' :
                                                                            application.guarantee_type === 'customs_guarantee' ? 'Таможенные гарантии' :
                                                                                application.guarantee_type === 'vat_refund' ? 'Возмещение НДС' :
                                                                                    application.guarantee_type
                                                    }
                                                />
                                            )}
                                            {application.tender_law && (
                                                <ProductInfoItem
                                                    label="Закон о закупках"
                                                    value={
                                                        application.tender_law === '44_fz' ? '44-ФЗ' :
                                                            application.tender_law === '223_fz' ? '223-ФЗ' :
                                                                application.tender_law === '615_pp' ? '615-ПП' :
                                                                    application.tender_law === '185_fz' ? '185-ФЗ' :
                                                                        application.tender_law === 'kbg' ? 'КБГ (Коммерческая)' :
                                                                            application.tender_law === 'commercial' ? 'Коммерческий' :
                                                                                application.tender_law
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* Tender Data */}
                                        {(application.goscontract_data?.purchase_number || application.goscontract_data?.contract_number) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {application.goscontract_data?.purchase_number && (
                                                    <ProductInfoItem label="Номер закупки" value={application.goscontract_data.purchase_number} mono />
                                                )}
                                                {application.goscontract_data?.contract_number && (
                                                    <ProductInfoItem label="Номер контракта" value={application.goscontract_data.contract_number} mono />
                                                )}
                                            </div>
                                        )}

                                        {application.goscontract_data?.subject && (
                                            <ProductInfoItem label="Предмет закупки" value={application.goscontract_data.subject} fullWidth />
                                        )}

                                        {/* Checkboxes as tags */}
                                        {(application.goscontract_data?.is_close_auction ||
                                            application.goscontract_data?.is_single_supplier ||
                                            application.goscontract_data?.no_eis_placement ||
                                            application.goscontract_data?.has_advance ||
                                            application.goscontract_data?.is_resecuring ||
                                            application.goscontract_data?.tender_not_held ||
                                            application.goscontract_data?.needs_credit ||
                                            application.goscontract_data?.has_customer_template) && (
                                                <div className="flex flex-wrap gap-2">
                                                    {application.goscontract_data?.is_close_auction && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Закрытый аукцион</Badge>
                                                    )}
                                                    {application.goscontract_data?.is_single_supplier && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Единственный поставщик</Badge>
                                                    )}
                                                    {application.goscontract_data?.no_eis_placement && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Без размещения в ЕИС</Badge>
                                                    )}
                                                    {application.goscontract_data?.has_advance && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Наличие аванса</Badge>
                                                    )}
                                                    {application.goscontract_data?.is_resecuring && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Переобеспечение</Badge>
                                                    )}
                                                    {application.goscontract_data?.has_customer_template && (
                                                        <Badge className="bg-[#1e3a5f] text-[#94a3b8] border-[#1e3a5f]">✓ Шаблон заказчика</Badge>
                                                    )}
                                                    {application.goscontract_data?.tender_not_held && (
                                                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Торги не проведены</Badge>
                                                    )}
                                                    {application.goscontract_data?.needs_credit && (
                                                        <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] border-[#3CE8D1]/30">💡 Нужен кредит</Badge>
                                                    )}
                                                </div>
                                            )}

                                        {/* Executed Contracts Count */}
                                        {application.goscontract_data?.executed_contracts_count !== undefined && application.goscontract_data.executed_contracts_count > 0 && (
                                            <ProductInfoItem
                                                label="Количество исполненных контрактов"
                                                value={String(application.goscontract_data.executed_contracts_count)}
                                            />
                                        )}

                                        {/* Financials */}
                                        {(application.goscontract_data?.initial_price || application.goscontract_data?.offered_price) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {application.goscontract_data?.initial_price && (
                                                    <ProductInfoItem
                                                        label="Начальная цена контракта"
                                                        value={`${parseFloat(application.goscontract_data.initial_price).toLocaleString('ru-RU')} ₽`}
                                                    />
                                                )}
                                                {application.goscontract_data?.offered_price && (
                                                    <ProductInfoItem
                                                        label="Предложенная цена"
                                                        value={`${parseFloat(application.goscontract_data.offered_price).toLocaleString('ru-RU')} ₽`}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Beneficiary */}
                                        {application.goscontract_data?.beneficiary_inn && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <ProductInfoItem label="ИНН Заказчика" value={application.goscontract_data.beneficiary_inn} mono />
                                                {application.goscontract_data?.beneficiary_name && (
                                                    <ProductInfoItem label="Наименование заказчика" value={application.goscontract_data.beneficiary_name} />
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Contract Loan / Corporate Credit Fields */}
                                {(application.product_type === 'contract_loan' || application.product_type === 'corporate_credit') && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {application.credit_sub_type && (
                                                <ProductInfoItem
                                                    label="Тип кредита"
                                                    value={
                                                        application.credit_sub_type === 'one_time_credit' ? 'Разовый кредит' :
                                                            application.credit_sub_type === 'non_revolving_line' ? 'Невозобновляемая КЛ' :
                                                                application.credit_sub_type === 'revolving_line' ? 'Возобновляемая КЛ' :
                                                                    application.credit_sub_type === 'overdraft' ? 'Овердрафт' :
                                                                        application.credit_sub_type
                                                    }
                                                />
                                            )}
                                            {application.financing_term_days && (
                                                <ProductInfoItem label="Срок финансирования" value={`${application.financing_term_days} дн.`} />
                                            )}
                                        </div>
                                        {application.pledge_description && (
                                            <ProductInfoItem label="Обеспечение / залог" value={application.pledge_description} fullWidth />
                                        )}
                                        {application.goscontract_data?.beneficiary_inn && (
                                            <ProductInfoItem label="ИНН Заказчика" value={application.goscontract_data.beneficiary_inn} mono />
                                        )}
                                    </>
                                )}

                                {/* Factoring Fields */}
                                {application.product_type === 'factoring' && (
                                    <>
                                        {application.factoring_type && (
                                            <ProductInfoItem
                                                label="Тип факторинга"
                                                value={
                                                    application.factoring_type === 'classic' ? 'Классический факторинг' :
                                                        application.factoring_type === 'closed' ? 'Закрытый факторинг' :
                                                            application.factoring_type === 'procurement' ? 'Закупочный факторинг' :
                                                                application.factoring_type
                                                }
                                            />
                                        )}
                                        {(application.contractor_inn || application.goscontract_data?.contractor_inn) && (
                                            <ProductInfoItem
                                                label="ИНН Контрагента (Дебитора)"
                                                value={application.contractor_inn || application.goscontract_data?.contractor_inn || ''}
                                                mono
                                            />
                                        )}
                                        {application.financing_term_days && (
                                            <ProductInfoItem label="Срок финансирования" value={`${application.financing_term_days} дн.`} />
                                        )}
                                    </>
                                )}

                                {/* VED Fields */}
                                {application.product_type === 'ved' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(application.ved_currency || application.goscontract_data?.currency) && (
                                            <ProductInfoItem label="Валюта" value={application.ved_currency || application.goscontract_data?.currency || ''} />
                                        )}
                                        {(application.ved_country || application.goscontract_data?.country) && (
                                            <ProductInfoItem label="Страна платежа" value={application.ved_country || application.goscontract_data?.country || ''} />
                                        )}
                                    </div>
                                )}

                                {/* Leasing Fields */}
                                {application.product_type === 'leasing' && (
                                    <>
                                        {application.goscontract_data?.equipment_type && (
                                            <ProductInfoItem label="Предмет лизинга" value={application.goscontract_data.equipment_type} fullWidth />
                                        )}
                                    </>
                                )}

                                {/* Insurance Fields */}
                                {application.product_type === 'insurance' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {application.insurance_category && (
                                            <ProductInfoItem
                                                label="Вид страхования"
                                                value={
                                                    application.insurance_category === 'personnel' ? 'Персонал' :
                                                        application.insurance_category === 'transport' ? 'Транспорт' :
                                                            application.insurance_category === 'property' ? 'Имущество' :
                                                                application.insurance_category === 'liability' ? 'Ответственность' :
                                                                    application.insurance_category
                                                }
                                            />
                                        )}
                                        {application.insurance_product_type && (
                                            <ProductInfoItem
                                                label="Страховой продукт"
                                                value={
                                                    // Personnel
                                                    application.insurance_product_type === 'dms' ? 'Добровольное медицинское страхование (ДМС)' :
                                                        application.insurance_product_type === 'critical_illness' ? 'Страхование критических заболеваний' :
                                                            application.insurance_product_type === 'accidents' ? 'Страхование несчастных случаев' :
                                                                application.insurance_product_type === 'travel' ? 'Комплексное страхование в поездках' :
                                                                    // Transport
                                                                    application.insurance_product_type === 'osago' ? 'ОСАГО юридических лиц' :
                                                                        application.insurance_product_type === 'fleet' ? 'Комплексное страхование автопарков' :
                                                                            application.insurance_product_type === 'special_equipment' ? 'Страхование специальной техники' :
                                                                                application.insurance_product_type === 'carrier_liability' ? 'Страхование ответственности перевозчика' :
                                                                                    // Property
                                                                                    application.insurance_product_type === 'construction' ? 'Страхование объектов строительства' :
                                                                                        application.insurance_product_type === 'cargo' ? 'Страхование грузов и перевозок' :
                                                                                            application.insurance_product_type === 'company_property' ? 'Страхование имущества компаний' :
                                                                                                application.insurance_product_type === 'business_interruption' ? 'Страхование перерывов деятельности' :
                                                                                                    // Liability
                                                                                                    application.insurance_product_type === 'civil' ? 'Страхование гражданской ответственности' :
                                                                                                        application.insurance_product_type === 'hazardous' ? 'Страхование опасных объектов' :
                                                                                                            application.insurance_product_type === 'professional' ? 'Страхование профессиональных рисков' :
                                                                                                                application.insurance_product_type === 'quality' ? 'Страхование ответственности за качество' :
                                                                                                                    application.insurance_product_type
                                                }
                                            />
                                        )}
                                    </div>
                                )}

                                {/* RKO Fields */}
                                {application.product_type === 'rko' && (
                                    <>
                                        {application.account_type && (
                                            <ProductInfoItem
                                                label="Тип обслуживания"
                                                value={
                                                    application.account_type === 'rko_basic' ? 'РКО Базовый' :
                                                        application.account_type === 'rko_premium' ? 'РКО Премиум' :
                                                            application.account_type === 'rko_business' ? 'РКО Бизнес' :
                                                                application.account_type === 'rko' ? 'РКО' :
                                                                    application.account_type
                                                }
                                            />
                                        )}
                                    </>
                                )}

                                {/* Special Account Fields */}
                                {application.product_type === 'special_account' && (
                                    <>
                                        {application.account_type && (
                                            <ProductInfoItem
                                                label="Тип спецсчёта"
                                                value={
                                                    application.account_type === '44fz' ? 'Спецсчет 44-ФЗ' :
                                                        application.account_type === '223fz' ? 'Спецсчет 223-ФЗ' :
                                                            application.account_type === '615pp' ? 'Спецсчет 615-ПП' :
                                                                application.account_type === 'special' ? 'Спецсчёт' :
                                                                    application.account_type
                                                }
                                            />
                                        )}
                                    </>
                                )}

                                {/* Tender Support Fields */}
                                {application.product_type === 'tender_support' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {application.tender_support_type && (
                                                <ProductInfoItem
                                                    label="Вариант сопровождения"
                                                    value={
                                                        application.tender_support_type === 'one_time' ? 'Разовое сопровождение' :
                                                            application.tender_support_type === 'full_service' ? 'Тендерное сопровождение под ключ' :
                                                                application.tender_support_type
                                                    }
                                                />
                                            )}
                                            {application.purchase_category && (
                                                <ProductInfoItem
                                                    label="Тип закупки"
                                                    value={
                                                        application.purchase_category === '44fz' ? 'Госзакупки по 44-ФЗ' :
                                                            application.purchase_category === '223fz' ? 'Закупки по 223-ФЗ' :
                                                                application.purchase_category === 'property_auctions' ? 'Имущественные торги' :
                                                                    application.purchase_category === 'commercial' ? 'Коммерческие закупки' :
                                                                        application.purchase_category
                                                    }
                                                />
                                            )}
                                        </div>
                                        {application.industry && (
                                            <ProductInfoItem label="Закупки в отрасли" value={application.industry} fullWidth />
                                        )}
                                    </>
                                )}

                                {/* Notes */}
                                {application.notes && (
                                    <div className="pt-2 border-t border-[#1e3a5f]">
                                        <ProductInfoItem label="Примечания" value={application.notes} fullWidth />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 1: Forms */}
                    <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                        <StepHeader
                            step={1}
                            title="Заполните формы"
                            subtitle="Заполните анкету и данные о компании"
                            icon={<FileText className="h-6 w-6" />}
                            progress={formProgress}
                            isComplete={formProgress === 100}
                            isExpanded={expandedSteps[1]}
                            onToggle={() => toggleStep(1)}
                        />
                        {expandedSteps[1] && (
                            <CardContent className="p-6 pt-0">
                                <Separator className="my-4 bg-[#1e3a5f]" />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-[#94a3b8]">Компания</span>
                                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <p className="font-medium text-white truncate">{application.company_name}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-[#94a3b8]">Тип продукта</span>
                                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <p className="font-medium text-white">{application.product_type_display}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-[#94a3b8]">Сумма</span>
                                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <p className="font-medium text-white">
                                                {parseFloat(application.amount || '0').toLocaleString('ru-RU')} ₽
                                            </p>
                                        </div>
                                    </div>
                                    {application.tender_number && (
                                        <div className="p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm text-[#94a3b8]">№ извещения</span>
                                                    <p className="font-medium text-white">{application.tender_number}</p>
                                                </div>
                                                <a
                                                    href={`https://zakupki.gov.ru/epz/order/notice/ea44/view/common-info.html?regNumber=${application.tender_number}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#3CE8D1] hover:underline flex items-center gap-1"
                                                >
                                                    Открыть на ЕИС
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Step 2: Documents */}
                    <Card ref={documentsSectionRef} className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                        <StepHeader
                            step={2}
                            title="Загрузите документы"
                            subtitle={`${application.documents?.length || 0} документов загружено`}
                            icon={<Upload className="h-6 w-6" />}
                            progress={docProgress}
                            isComplete={docProgress === 100 && (application.documents?.length || 0) > 0}
                            isExpanded={expandedSteps[2]}
                            onToggle={() => toggleStep(2)}
                        />
                        {expandedSteps[2] && (
                            <CardContent className="p-6 pt-0">
                                <Separator className="my-4 bg-[#1e3a5f]" />

                                {/* Upload Area */}
                                <div
                                    className="border-2 border-dashed border-[#1e3a5f] rounded-lg p-8 text-center mb-6 hover:border-[#3CE8D1]/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    {isUploading ? (
                                        <Loader2 className="h-10 w-10 mx-auto text-[#3CE8D1] animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="h-10 w-10 mx-auto text-[#3CE8D1] mb-4" />
                                            <p className="text-white font-medium mb-1">Перетащите файлы сюда</p>
                                            <p className="text-sm text-[#94a3b8]">или нажмите для выбора</p>
                                        </>
                                    )}
                                </div>

                                {/* Required Documents Checklist */}
                                <div className="mb-6">
                                    <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                        Обязательные документы
                                    </h4>
                                    <div className="space-y-2">
                                        {getRequiredDocuments(application.product_type || 'bank_guarantee').map((reqDoc, idx) => {
                                            const isUploaded = isDocumentUploaded(reqDoc.name, reqDoc.id)
                                            const uploadedDoc = getUploadedDocForType(reqDoc.name, reqDoc.id)
                                            const isCurrentlyUploading = uploadingDocType === reqDoc.name

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg border",
                                                        isUploaded
                                                            ? "bg-emerald-500/10 border-emerald-500/30"
                                                            : reqDoc.required
                                                                ? "bg-[#0f2042] border-orange-500/30"
                                                                : "bg-[#0f2042] border-[#1e3a5f]"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {isUploaded ? (
                                                            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                                                        ) : (
                                                            <div className={cn(
                                                                "h-5 w-5 rounded-full border-2 shrink-0",
                                                                reqDoc.required ? "border-orange-400" : "border-[#94a3b8]"
                                                            )} />
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className={cn(
                                                                "font-medium text-sm truncate",
                                                                isUploaded ? "text-emerald-400" : "text-white"
                                                            )}>
                                                                {reqDoc.name} {reqDoc.required && <span className="text-orange-400">*</span>}
                                                            </p>
                                                            {uploadedDoc && (
                                                                <p className="text-xs text-[#94a3b8] truncate">{uploadedDoc.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {isUploaded && uploadedDoc ? (
                                                            <>
                                                                {getDocStatusBadge(uploadedDoc.status)}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-[#94a3b8] hover:text-white"
                                                                    asChild
                                                                >
                                                                    <a href={uploadedDoc.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <Eye className="h-4 w-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        e.stopPropagation()
                                                                        console.log('[UI] Delete clicked for doc:', uploadedDoc.id)
                                                                        handleDeleteDocument(uploadedDoc.id)
                                                                    }}
                                                                    title="Удалить документ"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <label
                                                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 border border-[#3CE8D1]/30 text-[#3CE8D1] hover:bg-[#3CE8D1]/10 transition-colors"
                                                            >
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    disabled={isCurrentlyUploading}
                                                                    onChange={(e) => {
                                                                        console.log('[UI] File input change triggered for:', reqDoc.name)
                                                                        handleSpecificDocUpload(e, reqDoc.id, reqDoc.name)
                                                                    }}
                                                                />
                                                                {isCurrentlyUploading ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <Upload className="h-4 w-4 mr-1" />
                                                                        Загрузить
                                                                    </>
                                                                )}
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Separator */}
                                <Separator className="my-4 bg-[#1e3a5f]" />

                                <h4 className="text-white font-medium mb-4">Дополнительные документы</h4>

                                {/* Documents List - Only show non-required documents to avoid duplicates */}
                                {(() => {
                                    // Get list of required document IDs
                                    const requiredDocIds = getRequiredDocuments(application.product_type || 'bank_guarantee').map(d => d.id)

                                    // Filter out documents that are in the required list
                                    const additionalDocs = application.documents?.filter(doc =>
                                        !requiredDocIds.includes(doc.document_type_id || 0) &&
                                        !getRequiredDocuments(application.product_type || 'bank_guarantee').some(reqDoc =>
                                            doc.name?.toLowerCase().includes(reqDoc.name.toLowerCase().substring(0, 20))
                                        )
                                    ) || []

                                    return additionalDocs.length > 0 ? (
                                        <div className="space-y-2">
                                            {additionalDocs.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center justify-between p-4 rounded-lg bg-[#0f2042] border border-[#1e3a5f]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-[#3CE8D1]" />
                                                        <div>
                                                            <p className="font-medium text-white">{doc.name}</p>
                                                            <p className="text-xs text-[#94a3b8]">{doc.type_display}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {getDocStatusBadge(doc.status)}
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-[#94a3b8] hover:text-white"
                                                                asChild
                                                            >
                                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                                    <Eye className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-[#94a3b8] hover:text-white"
                                                                asChild
                                                            >
                                                                <a href={doc.file_url} download>
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            {application.status === 'draft' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-400 hover:text-red-300"
                                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-[#94a3b8]">
                                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                            <p>Дополнительные документы не загружены</p>
                                            <p className="text-xs mt-1">Все обязательные документы показаны выше</p>
                                        </div>
                                    )
                                })()}
                            </CardContent>
                        )}
                    </Card>

                    {/* Step 3: Submit to Bank */}
                    <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                        <StepHeader
                            step={3}
                            title="Отправка в банк"
                            subtitle={isSubmitted ? "Заявка отправлена" : "Отправьте заявку на рассмотрение"}
                            icon={<Send className="h-6 w-6" />}
                            progress={isSubmitted ? 100 : 0}
                            isComplete={isSubmitted}
                            isExpanded={expandedSteps[3]}
                            onToggle={() => toggleStep(3)}
                        />
                        {expandedSteps[3] && (
                            <CardContent className="p-6 pt-0">
                                <Separator className="my-4 bg-[#1e3a5f]" />

                                {isSubmitted ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            Заявка отправлена
                                        </h3>
                                        <p className="text-[#94a3b8] mb-4">
                                            Статус: {application.status_display}
                                        </p>
                                        {application.submitted_at && (
                                            <p className="text-sm text-[#94a3b8]">
                                                Отправлено: {new Date(application.submitted_at).toLocaleString('ru-RU')}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="max-w-md mx-auto">
                                            <Send className="h-16 w-16 mx-auto text-[#3CE8D1] mb-4" />
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                Готовы отправить?
                                            </h3>
                                            <p className="text-[#94a3b8] mb-6">
                                                После отправки заявка будет передана в банк для рассмотрения.
                                                Редактирование будет недоступно.
                                            </p>
                                            <Button
                                                onClick={handleSubmitToBank}
                                                disabled={!canSubmit || isSubmitting}
                                                className="bg-[#3CE8D1] hover:bg-[#2fd5bf] text-black font-semibold px-8"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4 mr-2" />
                                                )}
                                                ОТПРАВИТЬ ЗАЯВКУ
                                            </Button>
                                            {!canSubmit && (
                                                <p className="text-sm text-orange-400 mt-4">
                                                    Заполните все обязательные поля перед отправкой
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* Step 4: Approval & Payment */}
                    <Card className="bg-[#0a1628] border-[#1e3a5f] overflow-hidden">
                        <StepHeader
                            step={4}
                            title="Согласование и оплата"
                            subtitle="Финальный этап оформления"
                            icon={<CheckCircle className="h-6 w-6" />}
                            progress={application.status === 'approved' || application.status === 'won' ? 100 : 0}
                            isComplete={application.status === 'approved' || application.status === 'won'}
                            isExpanded={expandedSteps[4]}
                            onToggle={() => toggleStep(4)}
                        />
                        {expandedSteps[4] && (
                            <CardContent className="p-6 pt-0">
                                <Separator className="my-4 bg-[#1e3a5f]" />

                                {application.status === 'approved' || application.status === 'won' ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-20 w-20 mx-auto text-emerald-400 mb-4" />
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            🎉 Заявка одобрена!
                                        </h3>
                                        <p className="text-[#94a3b8] mb-6">
                                            Поздравляем! Банковская гарантия будет выпущена после оплаты комиссии.
                                        </p>
                                        {application.commission_data && (
                                            <div className="bg-[#0f2042] rounded-lg p-4 inline-block">
                                                <p className="text-sm text-[#94a3b8] mb-2">Комиссия к оплате</p>
                                                <p className="text-2xl font-bold text-[#3CE8D1]">
                                                    {(application.commission_data.total || 0).toLocaleString('ru-RU')} ₽
                                                </p>
                                            </div>
                                        )}
                                        {application.signing_url && (
                                            <Button
                                                asChild
                                                className="mt-6 bg-[#3CE8D1] hover:bg-[#2fd5bf] text-black font-semibold"
                                            >
                                                <a href={application.signing_url} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Перейти к подписанию
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ) : application.status === 'rejected' ? (
                                    <div className="text-center py-8">
                                        <XCircle className="h-20 w-20 mx-auto text-red-400 mb-4" />
                                        <h3 className="text-2xl font-bold text-white mb-2">
                                            Заявка отклонена
                                        </h3>
                                        <p className="text-[#94a3b8]">
                                            К сожалению, банк не одобрил данную заявку.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Clock className="h-16 w-16 mx-auto text-[#94a3b8] mb-4" />
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            Ожидание решения банка
                                        </h3>
                                        <p className="text-[#94a3b8]">
                                            Заявка находится на рассмотрении. Вы получите уведомление о решении.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-4">
                        <Button
                            variant="outline"
                            onClick={onBack}
                            className="border-[#1e3a5f] text-[#94a3b8] hover:bg-[#1e3a5f] hover:text-white"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Назад к списку
                        </Button>

                        {application.status === 'draft' && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={isDeleting}
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4 mr-2" />
                                        )}
                                        Удалить заявку
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#0f2042] border-[#1e3a5f] text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[#94a3b8]">
                                            Вы действительно хотите удалить эту заявку? Это действие нельзя отменить.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-transparent border-[#1e3a5f] text-white hover:bg-[#1e3a5f]">
                                            Отмена
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDeleteApplication();
                                            }}
                                            className="bg-red-500 hover:bg-red-600 text-white border-0"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                "Удалить"
                                            )}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>

                {/* Right Column - Chat Panel */}
                <div className="xl:col-span-1">
                    <div className="sticky top-6">
                        <ApplicationChat
                            applicationId={applicationId}
                            className="h-[600px] xl:h-[calc(100vh-200px)]"
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}

// Helper component for displaying product info items
function ProductInfoItem({
    label,
    value,
    mono,
    fullWidth
}: {
    label: string;
    value: string;
    mono?: boolean;
    fullWidth?: boolean
}) {
    return (
        <div className={cn("p-3 rounded-lg bg-[#0a1628] border border-[#1e3a5f]", fullWidth && "col-span-full")}>
            <p className="text-xs text-[#94a3b8] mb-1">{label}</p>
            <p className={cn("text-white text-sm", mono && "font-mono")}>{value}</p>
        </div>
    )
}

"use client"

/**
 * CalculationSessionView - "Результат отбора" page
 * 
 * Displays bank calculation results from a saved CalculationSession.
 * Allows users to select additional banks and create new applications.
 * This is the "root application" that groups multiple applications created
 * from the same calculation.
 */

import { useApplication, useApplicationMutations, useApplications, useCalculationSession, useCalculationSessionMutations } from "@/hooks/use-applications"
import { useDocuments, formatDocumentType } from "@/hooks/use-documents"
import { useCRMClient, useMyCompany } from "@/hooks/use-companies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ChevronLeft,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Plus,
    PlusCircle,
    Pencil,
    Search
} from "lucide-react"
import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { getCompanyBasicsError } from "@/lib/company-basics"
import { navigateToApplications } from "@/lib/navigation"
import { getDocumentTypeName, getRequiredDocumentsForProduct } from "@/lib/document-types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ApplicationEditModal } from "@/components/dashboard/application-edit-modal"
import { buildApplicationUpdatePayload, type ApplicationEditSource } from "@/components/dashboard/application-edit-helpers"
import { getPrimaryAmountValue } from "@/lib/application-display"

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    bank_guarantee: "Банковская гарантия",
    tender_loan: "Тендерный кредит",
    contract_loan: "Кредит на исполнение контракта",
    corporate_credit: "Корпоративный кредит",
    factoring: "Факторинг",
    leasing: "Лизинг",
    ved: "ВЭД",
    insurance: "Страхование",
    rko: "РКО",
    special_account: "Спецсчет",
    tender_support: "Тендерное сопровождение",
}

const getProductTypeLabel = (productType: string) => {
    return PRODUCT_TYPE_LABELS[productType] || productType
}

const parseNumber = (value: unknown) => {
    if (value === null || value === undefined || value === "") return undefined
    const num = Number(String(value).replace(/\s/g, ""))
    return Number.isFinite(num) ? num : undefined
}

// Bank database for adding new banks to session
interface BankInfo {
    name: string
    bgRate: number
    creditRate: number
    speed: string
    individual?: boolean
    type?: string
}

const ALL_BANKS: BankInfo[] = [
    { name: "Сбербанк", bgRate: 2.5, creditRate: 15, speed: "Низкая" },
    { name: "ВТБ", bgRate: 2.8, creditRate: 14.5, speed: "Средняя" },
    { name: "Альфа-Банк", bgRate: 3.0, creditRate: 16, speed: "Высокая" },
    { name: "Промсвязьбанк", bgRate: 2.7, creditRate: 15.5, speed: "Высокая" },
    { name: "Совкомбанк", bgRate: 3.2, creditRate: 17, speed: "Высокая" },
    { name: "Газпромбанк", bgRate: 2.3, creditRate: 13, speed: "Низкая" },
    { name: "Тинькофф", bgRate: 4.0, creditRate: 18, speed: "Высокая" },
    { name: "Открытие", bgRate: 2.9, creditRate: 15, speed: "Средняя" },
    { name: "Райффайзен", bgRate: 2.6, creditRate: 14, speed: "Средняя" },
    { name: "Локо-Банк", bgRate: 3.5, creditRate: 19, speed: "Высокая" },
    { name: "МКБ", bgRate: 2.8, creditRate: 15.5, speed: "Средняя" },
    { name: "Уралсиб", bgRate: 3.1, creditRate: 16.5, speed: "Средняя" },
    { name: "Индивидуальное рассмотрение", bgRate: 0, creditRate: 0, speed: "Высокая", individual: true },
    // Leasing companies
    { name: "Эволюция (Лизинг)", bgRate: 0, creditRate: 0, speed: "Высокая", type: "leasing" },
    { name: "Carcade (Лизинг)", bgRate: 0, creditRate: 0, speed: "Высокая", type: "leasing" },
    { name: "Европлан (Лизинг)", bgRate: 0, creditRate: 0, speed: "Высокая", type: "leasing" },
    { name: "ВТБ Лизинг", bgRate: 0, creditRate: 0, speed: "Средняя", type: "leasing" },
    { name: "ПСБ Лизинг", bgRate: 0, creditRate: 0, speed: "Средняя", type: "leasing" },
    { name: "Газпромбанк Автолизинг", bgRate: 0, creditRate: 0, speed: "Средняя", type: "leasing" },
    { name: "Ресо Лизинг", bgRate: 0, creditRate: 0, speed: "Высокая", type: "leasing" },
    { name: "Контрол Лизинг", bgRate: 0, creditRate: 0, speed: "Высокая", type: "leasing" },
    { name: "МГКЛ (Лизинг)", bgRate: 0, creditRate: 0, speed: "Средняя", type: "leasing" },
    { name: "Индивидуальное рассмотрение (Лизинг)", bgRate: 0, creditRate: 0, speed: "Высокая", individual: true, type: "leasing" },
]

interface CalculationSessionViewProps {
    sessionId: number
    onBack: () => void
    onOpenApplicationDetail?: (applicationId: string) => void
    onNavigateToApplications?: () => void
}

export function CalculationSessionView({
    sessionId,
    onBack,
    onOpenApplicationDetail,
    onNavigateToApplications
}: CalculationSessionViewProps) {
    const { session, isLoading, error, refetch: refetchSession } = useCalculationSession(sessionId)
    const { createApplication, updateApplication } = useApplicationMutations()
    const { updateSubmittedBanks, addApprovedBanks, updateSession } = useCalculationSessionMutations()
    const { documents: companyDocuments, isLoading: documentsLoading } = useDocuments({ company: session?.company, includeUnassigned: true })
    const { user } = useAuth()
    const { company: myCompany } = useMyCompany()
    const crmClientId = user?.role === "agent" ? session?.company ?? null : null
    const { client: crmCompany } = useCRMClient(crmClientId)
    const sessionApplicationParams = useMemo(() => ({ calculation_session: sessionId }), [sessionId])
    const {
        applications: sessionApplications,
        isLoading: isLoadingApplications,
        refetch: refetchApplications
    } = useApplications(undefined, sessionApplicationParams, { fetchAllPages: true })
    const referenceApplicationId = useMemo(() => {
        if (sessionApplications.length === 0) return null
        const editable = sessionApplications.find(app => app.status === "draft" || app.status === "info_requested")
        return editable?.id ?? sessionApplications[0].id
    }, [sessionApplications])
    const { application: referenceApplication, refetch: refetchReferenceApplication } = useApplication(referenceApplicationId)
    const [selectedBanks, setSelectedBanks] = useState<string[]>([])
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const autoSelectDoneRef = useRef(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isBulkUpdating, setIsBulkUpdating] = useState(false)

    
    // Add Bank Dialog state
    const [isAddBankDialogOpen, setIsAddBankDialogOpen] = useState(false)
    const [bankSearchQuery, setBankSearchQuery] = useState("")
    const [banksToAdd, setBanksToAdd] = useState<string[]>([])
    const [isAddingBanks, setIsAddingBanks] = useState(false)

    useEffect(() => {
        autoSelectDoneRef.current = false
    }, [sessionId])

    // Filter available banks (not already in approved_banks)
    const availableBanksToAdd = useMemo(() => {
        if (!session) return ALL_BANKS
        const existingNames = new Set(session.approved_banks.map(b => b.name))
        const isLeasing = session.product_type === 'leasing'
        
        return ALL_BANKS.filter(bank => {
            // Filter by type
            if (isLeasing && bank.type !== 'leasing') return false
            if (!isLeasing && bank.type === 'leasing') return false
            // Not already in session
            if (existingNames.has(bank.name)) return false
            // Search filter
            if (bankSearchQuery && !bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())) return false
            return true
        })
    }, [session, bankSearchQuery])

    const handleAddBanks = async () => {
        if (banksToAdd.length === 0 || !session) return
        
        setIsAddingBanks(true)
        try {
            const banksData = banksToAdd.map(name => {
                const bank = ALL_BANKS.find(b => b.name === name)
                return bank ? {
                    name: bank.name,
                    bgRate: bank.bgRate,
                    creditRate: bank.creditRate,
                    speed: bank.speed,
                    individual: bank.individual,
                } : null
            }).filter(Boolean) as BankInfo[]
            
            const result = await addApprovedBanks(session.id, banksData)
            if (result) {
                toast.success(`Добавлено банков: ${banksData.length}`)
                setBanksToAdd([])
                setIsAddBankDialogOpen(false)
                await refetchSession()
            } else {
                toast.error("Ошибка добавления банков")
            }
        } catch {
            toast.error("Ошибка добавления банков")
        } finally {
            setIsAddingBanks(false)
        }
    }

    const toggleBankToAdd = (bankName: string) => {
        setBanksToAdd(prev => 
            prev.includes(bankName)
                ? prev.filter(b => b !== bankName)
                : [...prev, bankName]
        )
    }

    const handleBankToggle = useCallback((bankName: string) => {
        setSelectedBanks(prev =>
            prev.includes(bankName)
                ? prev.filter(b => b !== bankName)
                : [...prev, bankName]
        )
    }, [])

    const handleSelectAllAvailable = useCallback(() => {
        if (!session) return
        const availableBanks = session.approved_banks
            .filter(bank => !session.submitted_banks.includes(bank.name))
            .map(bank => bank.name)
        setSelectedBanks(availableBanks)
    }, [session])

    const handleClearSelection = useCallback(() => {
        setSelectedBanks([])
    }, [])

    const handleCreateApplications = async () => {
        if (selectedBanks.length === 0 || !session) return

        const guardCompany = user?.role === "agent" ? crmCompany : myCompany
        const companyError = getCompanyBasicsError(guardCompany)
        if (!guardCompany || companyError) {
            toast.error(companyError || "Для создания заявки заполните ИНН и полное наименование.")
            return
        }

        const requiredDocs = getRequiredDocumentsForProduct(session.product_type)
        const requiredDocIds = requiredDocs.map(d => d.id)
        const foundTypeIds = filteredDocuments.map(d => d.document_type_id)
        const missingRequired = requiredDocIds
            .filter(id => !foundTypeIds.includes(id))
            .map(id => ({ id, name: getDocumentTypeName(id, session.product_type) }))

        if (missingRequired.length > 0) {
            toast.warning(`Недостающие документы: ${missingRequired.map(d => d.name).join(', ')}`, {
                description: 'Заявка будет создана. Загрузите документы позже в карточке заявки.'
            })
        }

        setIsCreating(true)
        const successfulBankNames: string[] = []
        let successCount = 0
        let errorCount = 0
        const createdApplicationIds: number[] = []

        // Helper to reconstruct goscontract_data based on product type
        const buildGoscontractData = (formData: any, productType: string) => {
            const lawMapping: Record<string, string> = {
                "44": "44_fz",
                "223": "223_fz",
                "615": "615_pp",
                "kbg": "kbg"
            }

            const baseData: Record<string, unknown> = {}
            if (formData.federalLaw) {
                baseData.law = lawMapping[formData.federalLaw] || "44-ФЗ"
            }
            if (formData.noticeNumber) {
                baseData.purchase_number = formData.noticeNumber
            }
            if (formData.lotNumber) {
                baseData.lot_number = formData.lotNumber
            }

            if (productType === "bank_guarantee") {
                return {
                    ...baseData,
                    bg_type: formData.bgType || undefined,
                    guarantee_start_date: formData.dateFrom || undefined,
                    guarantee_end_date: formData.dateTo || undefined,
                    has_prepayment: formData.hasAdvance,
                    advance_percent: formData.hasAdvance ? formData.advancePercent : undefined,
                }
            }

            if (productType === "contract_loan" || productType === "tender_loan") { // tender_loan sometimes uses similar structure
                return {
                    ...baseData,
                    contract_loan_type: formData.kikType || undefined,
                    contract_price: formData.contractPrice?.toString(),
                    credit_amount: formData.creditAmount?.toString(),
                    contracts_44fz_count: 0,
                    contracts_223fz_count: 0,
                }
            }

            if (productType === "corporate_credit") {
                return {
                    credit_type: formData.creditType || undefined,
                    credit_start_date: formData.dateFrom || undefined,
                    credit_end_date: formData.dateTo || undefined,
                }
            }

            if (productType === "factoring") {
                return {
                    ...baseData,
                    contractor_inn: formData.contractorInn || undefined,
                    factoring_type: formData.factoringType || undefined,
                    financing_amount: formData.financingAmount?.toString() || undefined,
                }
            }

            if (productType === "leasing") {
                return {
                    leasing_credit_type: formData.leasingCreditType || undefined,
                    leasing_amount: formData.leasingAmount?.toString() || undefined,
                }
            }

            if (productType === "insurance") {
                return {
                    insurance_category: formData.insuranceCategory || undefined,
                    insurance_product_type: formData.insuranceProduct || undefined,
                    insurance_amount: formData.insuranceAmount?.toString() || undefined,
                    insurance_term_months: formData.insuranceTerm || undefined,
                }
            }

            return baseData
        }

        const formData = session.form_data
        const isRkoProduct = session.product_type === "rko" || session.product_type === "special_account"

        for (const bankName of selectedBanks) {
            try {
                // Determine tender law from mapping
                const lawMapping: Record<string, string> = {
                    "44": "44_fz",
                    "223": "223_fz",
                    "615": "615_pp",
                    "kbg": "kbg"
                }

                // Calculate term months
                const dateFrom = formData.dateFrom as string
                const dateTo = formData.dateTo as string
                const termMonths = (() => {
                    if (isRkoProduct) return 12
                    if (session.product_type === "insurance" && formData.insuranceTerm) {
                        const termValue = Number(formData.insuranceTerm)
                        return Number.isFinite(termValue) && termValue > 0 ? termValue : 1
                    }
                    if (dateFrom && dateTo) {
                        return Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    }
                    return 1
                })()

                const shouldSetTenderLaw = ["bank_guarantee", "tender_loan", "contract_loan"].includes(session.product_type)
                const tenderLawValue = shouldSetTenderLaw
                    ? lawMapping[formData.federalLaw as string] || "44_fz"
                    : undefined

                const amountValue = (() => {
                    if (isRkoProduct) return 0

                    switch (session.product_type) {
                        case "tender_loan":
                        case "contract_loan":
                            return (formData.creditAmount as number) ?? (formData.amount as number) ?? 0
                        case "factoring":
                            return (formData.financingAmount as number) ?? (formData.amount as number) ?? 0
                        case "leasing":
                            return (formData.leasingAmount as number) ?? (formData.amount as number) ?? 0
                        case "insurance":
                            return (formData.insuranceAmount as number) ?? (formData.amount as number) ?? 0
                        default:
                            return (formData.amount as number) ?? 0
                    }
                })()

                const payload = {
                    company: session.company, // session.company is the ID (number)
                    product_type: session.product_type,
                    amount: amountValue.toString(),
                    term_months: termMonths,
                    target_bank_name: bankName,
                    tender_number: (formData.noticeNumber as string) || undefined,
                    tender_platform: undefined, // Platform not always stored in form data, okay to be undefined
                    goscontract_data: buildGoscontractData(formData, session.product_type),
                    guarantee_type: session.product_type === "bank_guarantee" ? (formData.bgType as string) : undefined,
                    tender_law: tenderLawValue,
                    account_type: isRkoProduct
                        ? (session.product_type === "special_account" ? "specaccount" : "rko")
                        : undefined,
                    insurance_category: session.product_type === "insurance"
                        ? ((formData.insuranceCategoryBackend as string) || (formData.insuranceCategory as string) || undefined)
                        : undefined,
                    insurance_product_type: session.product_type === "insurance"
                        ? ((formData.insuranceProductBackend as string) || (formData.insuranceProduct as string) || undefined)
                        : undefined,
                    calculation_session: session.id,
                    document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
                }

                const result = await createApplication(payload as any)
                if (result) {
                    successCount++
                    successfulBankNames.push(bankName)
                    createdApplicationIds.push(result.id)
                } else {
                    errorCount++
                }
            } catch (err) {
                errorCount++
            }
        }

        // Update submitted banks in the session
        if (successfulBankNames.length > 0) {
            try {
                await updateSubmittedBanks(session.id, successfulBankNames)
                // Refetch session to update the UI (move banks from available to submitted)
                await refetchSession()
            } catch (err) {
                // Non-critical — applications were already created
            }
        }

        if (successCount > 0) {
            toast.success(`Создано заявок: ${successCount}${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`)
            setSelectedBanks([])
            setSelectedDocumentIds([])

            // Navigate to applications page after successful creation
            setTimeout(() => {
                if (onNavigateToApplications) {
                    onNavigateToApplications()
                }
                if (createdApplicationIds.length === 1) {
                    navigateToApplications({ appId: createdApplicationIds[0] })
                } else if (createdApplicationIds.length > 1) {
                    navigateToApplications({ highlightIds: createdApplicationIds })
                } else {
                    navigateToApplications()
                }
            }, 500) // Small delay to show toast
        } else {
            toast.error("Не удалось создать заявки")
        }

        setIsCreating(false)
    }

    const buildUpdatedFormData = useCallback((data: Record<string, unknown>) => {
        if (!session) return null

        const nextFormData: Record<string, unknown> = {
            ...(session.form_data || {}),
        }

        const amountValue = parseNumber(data.amount)
        if (amountValue !== undefined) nextFormData.amount = amountValue

        if (data.purchase_number !== undefined) nextFormData.noticeNumber = data.purchase_number
        if (data.lot_number !== undefined) nextFormData.lotNumber = data.lot_number

        if (typeof data.law === "string") {
            const lawMap: Record<string, string> = {
                "44_fz": "44",
                "223_fz": "223",
                "615_pp": "615",
                "185_fz": "185",
                "275_fz": "275",
                "kbg": "kbg",
                "commercial": "kbg",
                "44-ФЗ": "44",
                "223-ФЗ": "223",
                "615-ПП": "615",
                "615 ПП": "615",
                "185-ФЗ": "185",
                "275-ФЗ": "275",
            }
            nextFormData.federalLaw = lawMap[data.law] || data.law
        }

        if (session.product_type === "bank_guarantee" || session.product_type === "tender_loan") {
            if (data.guarantee_type !== undefined) nextFormData.bgType = data.guarantee_type
            if (data.guarantee_start_date !== undefined) nextFormData.dateFrom = data.guarantee_start_date
            if (data.guarantee_end_date !== undefined) nextFormData.dateTo = data.guarantee_end_date
            if (data.has_prepayment !== undefined) nextFormData.hasAdvance = data.has_prepayment
            if (data.advance_percent !== undefined) nextFormData.advancePercent = data.advance_percent
        }

        if (session.product_type === "contract_loan") {
            if (data.contract_loan_type !== undefined) nextFormData.kikType = data.contract_loan_type
            const contractPriceValue = parseNumber(data.contract_price)
            if (contractPriceValue !== undefined) nextFormData.contractPrice = contractPriceValue
            const creditAmountValue = parseNumber(data.credit_amount)
            if (creditAmountValue !== undefined) nextFormData.creditAmount = creditAmountValue

            const dateFrom = (data.contract_start_date || data.credit_start_date) as string | undefined
            const dateTo = (data.contract_end_date || data.credit_end_date) as string | undefined
            if (dateFrom !== undefined) nextFormData.dateFrom = dateFrom
            if (dateTo !== undefined) nextFormData.dateTo = dateTo

            if (data.has_prepayment !== undefined) nextFormData.hasAdvance = data.has_prepayment
            if (data.advance_percent !== undefined) nextFormData.advancePercent = data.advance_percent
        }

        if (session.product_type === "corporate_credit") {
            if (data.credit_sub_type !== undefined) nextFormData.creditType = data.credit_sub_type
            if (data.credit_start_date !== undefined) nextFormData.dateFrom = data.credit_start_date
            if (data.credit_end_date !== undefined) nextFormData.dateTo = data.credit_end_date
        }

        if (session.product_type === "factoring") {
            if (data.factoring_type !== undefined) nextFormData.factoringType = data.factoring_type
            if (data.contractor_inn !== undefined) nextFormData.contractorInn = data.contractor_inn
            const financingAmountValue = parseNumber(data.financing_amount)
            if (financingAmountValue !== undefined) nextFormData.financingAmount = financingAmountValue
        }

        if (session.product_type === "leasing") {
            if (data.leasing_credit_type !== undefined) nextFormData.leasingCreditType = data.leasing_credit_type
            const leasingAmountValue = parseNumber(data.leasing_amount)
            if (leasingAmountValue !== undefined) nextFormData.leasingAmount = leasingAmountValue
            if (data.leasing_end_date !== undefined) nextFormData.leasingEndDate = data.leasing_end_date
        }

        if (session.product_type === "insurance") {
            if (data.insurance_category !== undefined) nextFormData.insuranceCategory = data.insurance_category
            if (data.insurance_product_type !== undefined) nextFormData.insuranceProduct = data.insurance_product_type
            const insuranceAmountValue = parseNumber(data.insurance_amount)
            if (insuranceAmountValue !== undefined) nextFormData.insuranceAmount = insuranceAmountValue
            if (data.insurance_term_months !== undefined) nextFormData.insuranceTerm = data.insurance_term_months
        }

        if (session.product_type === "ved") {
            if (data.ved_currency !== undefined) nextFormData.vedCurrency = data.ved_currency
            if (data.ved_country !== undefined) nextFormData.vedCountry = data.ved_country
        }

        return nextFormData
    }, [session])

    const editableApplications = useMemo(() => {
        return sessionApplications.filter(
            app => app.status === "draft" || app.status === "info_requested"
        )
    }, [sessionApplications])

    const lockedApplications = useMemo(() => {
        return sessionApplications.filter(
            app => app.status !== "draft" && app.status !== "info_requested"
        )
    }, [sessionApplications])

    const handleBulkEditSave = useCallback(async (data: Record<string, unknown>): Promise<boolean> => {
        if (!session) return false
        if (!referenceApplication || editableApplications.length === 0) {
            toast.error("Нет заявок для редактирования")
            return false
        }

        setIsBulkUpdating(true)

        const results = await Promise.allSettled(
            editableApplications.map((app) => {
                const { updatePayload } = buildApplicationUpdatePayload(app as ApplicationEditSource, data)
                return updateApplication(app.id, updatePayload)
            })
        )

        const successCount = results.filter(
            (result) => result.status === "fulfilled" && result.value
        ).length
        const errorCount = results.length - successCount

        if (successCount === 0) {
            toast.error("Не удалось обновить заявки")
        } else if (errorCount > 0) {
            toast.warning(`Часть заявок не обновлена: ${errorCount}`)
        }

        if (successCount > 0) {
            const updatedFormData = buildUpdatedFormData(data)
            if (updatedFormData) {
                const amountValue = parseNumber(data.amount)
                const nextTitle = amountValue !== undefined
                    ? `${getProductTypeLabel(session.product_type)} ${amountValue.toLocaleString("ru-RU")} ₽`
                    : session.title

                await updateSession(session.id, {
                    form_data: updatedFormData,
                    title: nextTitle,
                })
            }
        }

        await refetchApplications()
        await refetchSession()
        refetchReferenceApplication()

        setIsBulkUpdating(false)
        return successCount > 0
    }, [buildUpdatedFormData, editableApplications, refetchApplications, refetchReferenceApplication, refetchSession, referenceApplication, session, updateApplication, updateSession])

    const filteredDocuments = useMemo(() => {
        return session?.company
            ? companyDocuments.filter(doc => doc.company === session.company || doc.company == null)
            : []
    }, [session?.company, companyDocuments])

    useEffect(() => {
        if (!session || filteredDocuments.length === 0 || autoSelectDoneRef.current) return

        const requiredDocs = getRequiredDocumentsForProduct(session.product_type)
        const requiredDocIds = requiredDocs.map(d => d.id)
        const matchedIds = filteredDocuments
            .filter(doc => requiredDocIds.includes(doc.document_type_id))
            .map(doc => doc.id)

        const sessionDocIds = Array.isArray((session.form_data as { document_ids?: number[] })?.document_ids)
            ? (session.form_data as { document_ids?: number[] }).document_ids || []
            : []
        const availableDocIds = new Set(filteredDocuments.map(doc => doc.id))
        const preselectedIds = sessionDocIds.filter(id => availableDocIds.has(id))

        if (matchedIds.length > 0 || preselectedIds.length > 0) {
            setSelectedDocumentIds(prev => [
                ...new Set([
                    ...prev,
                    ...preselectedIds,
                    ...matchedIds,
                ])
            ])
        }

        autoSelectDoneRef.current = true
    }, [session, filteredDocuments])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
            </div>
        )
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">{error || 'Сессия не найдена'}</p>
                <Button onClick={onBack} variant="outline">
                    ← Назад
                </Button>
            </div>
        )
    }

    const isRkoSession = session.product_type === "rko" || session.product_type === "special_account"

    const canAddBanks = !isRkoSession

    const availableBanks = session.approved_banks.filter(
        bank => !session.submitted_banks.includes(bank.name)
    )
    const submittedBanks = session.approved_banks.filter(
        bank => session.submitted_banks.includes(bank.name)
    )
    const canBulkEdit = Boolean(referenceApplication) && editableApplications.length > 0
    const referenceAmount = referenceApplication ? getPrimaryAmountValue(referenceApplication) : null
    const referenceAmountLabel = referenceAmount !== null
        ? `${referenceAmount.toLocaleString("ru-RU")} ₽`
        : "—"
    const referenceBankLabel = sessionApplications.length > 1
        ? `Несколько банков (${sessionApplications.length})`
        : referenceApplication?.target_bank_name || "Не выбран"
    const referenceTermLabel = (() => {
        if (!referenceApplication) return "—"
        const data = (referenceApplication.goscontract_data || {}) as Record<string, unknown>
        const start = data.credit_start_date || data.guarantee_start_date || data.contract_start_date
        const end = data.credit_end_date || data.guarantee_end_date || data.contract_end_date
        if (start && end) {
            const formatDate = (value: unknown) => {
                try {
                    return new Date(String(value)).toLocaleDateString("ru-RU")
                } catch {
                    return String(value)
                }
            }
            return `${formatDate(start)} - ${formatDate(end)}`
        }
        return referenceApplication.term_months ? `${referenceApplication.term_months} мес.` : "—"
    })()
    const toggleDocumentSelection = (docId: number) => {
        setSelectedDocumentIds(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f] shrink-0"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                    <nav className="flex items-center gap-2 text-xs md:text-sm text-[#94a3b8] mb-1">
                        <button onClick={onBack} className="hover:text-[#3CE8D1] transition-colors flex items-center gap-1">
                            <span>←</span>
                            <span>Мои заявки</span>
                        </button>
                        <span>/</span>
                        <span className="text-[#3CE8D1]">Результат отбора</span>
                    </nav>
                    <h1 className="text-lg md:text-2xl font-bold text-white flex flex-wrap items-center gap-2 md:gap-3">
                        <span>{session.title || getProductTypeLabel(session.product_type)}</span>
                        <Badge className="bg-[#3CE8D1]/20 text-[#3CE8D1] border-[#3CE8D1]/30">
                            {getProductTypeLabel(session.product_type)}
                        </Badge>
                        <span className="text-xs md:text-sm font-normal text-[#94a3b8]">
                            от {new Date(session.created_at).toLocaleDateString('ru-RU')}
                        </span>
                    </h1>
                </div>
            </div>

            {/* Summary Card */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                            Результат отбора банков
                        </CardTitle>
                        {canAddBanks && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddBankDialogOpen(true)}
                                className="border-[#3CE8D1]/50 text-[#3CE8D1] hover:bg-[#3CE8D1]/10"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Добавить банк
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-[#94a3b8]">Компания:</span>
                            <p className="text-white font-medium">{session.company_name}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Одобрено банков:</span>
                            <p className="text-emerald-400 font-medium">{session.approved_banks.length}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Отправлено заявок:</span>
                            <p className="text-blue-400 font-medium">{submittedBanks.length}</p>
                        </div>
                        <div>
                            <span className="text-[#94a3b8]">Доступно для отправки:</span>
                            <p className="text-[#3CE8D1] font-medium">{availableBanks.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Application Data Card */}
            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-[#3CE8D1] uppercase tracking-wide">
                            Данные заявки
                        </h3>
                        <Button
                            size="sm"
                            onClick={() => setIsEditModalOpen(true)}
                            disabled={!canBulkEdit || isBulkUpdating || isLoadingApplications}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0] shadow-md shadow-[#3CE8D1]/20 font-semibold"
                            title={canBulkEdit ? "Редактировать все заявки сессии" : "Нет заявок, доступных для редактирования"}
                        >
                            {isBulkUpdating ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Pencil className="h-4 w-4 mr-1" />
                            )}
                            Редактировать
                        </Button>
                    </div>

                    {referenceApplication ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4 text-sm">
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Клиент</p>
                                    <p className="font-medium text-white truncate" title={referenceApplication.company_name}>
                                        {referenceApplication.company_name || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">ИНН</p>
                                    <p className="font-medium text-white font-mono">{referenceApplication.company_inn || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Дата создания</p>
                                    <p className="font-medium text-white">
                                        {new Date(referenceApplication.created_at).toLocaleDateString("ru-RU")}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Банк</p>
                                    <p className="font-medium text-white truncate" title={referenceBankLabel}>
                                        {referenceBankLabel}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Сумма</p>
                                    <p className="font-medium text-white">{referenceAmountLabel}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] md:text-xs text-[#94a3b8]">Срок</p>
                                    <p className="font-medium text-white">{referenceTermLabel}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#1e3a5f] bg-[#0a1628] px-4 py-3 text-xs text-[#94a3b8]">
                                <AlertTriangle className="h-4 w-4 text-[#f59e0b] mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-white text-sm">
                                        Изменения применятся ко всем заявкам этой сессии
                                    </p>
                                    <p>
                                        Доступно для редактирования: <span className="text-white">{editableApplications.length}</span>,
                                        недоступно: <span className="text-white">{lockedApplications.length}</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                            {isLoadingApplications ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Загрузка данных заявки...
                                </>
                            ) : (
                                <>Заявки еще не созданы</>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Available Banks Section */}
            {availableBanks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Plus className="h-5 w-5 text-[#3CE8D1]" />
                                Доступные банки ({availableBanks.length})
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSelectAllAvailable}
                                    className="text-[#3CE8D1] hover:text-[#3CE8D1]/80"
                                >
                                    Выбрать все
                                </Button>
                                {selectedBanks.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleClearSelection}
                                        className="text-[#94a3b8] hover:text-white"
                                    >
                                        Очистить
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {availableBanks.map((bank, index) => {
                                const isSelected = selectedBanks.includes(bank.name)
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleBankToggle(bank.name)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                                            isSelected
                                                ? "bg-[#3CE8D1]/10 border-[#3CE8D1]/50"
                                                : "bg-[#1e3a5f]/50 border-[#1e3a5f] hover:border-[#3CE8D1]/30"
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => handleBankToggle(bank.name)}
                                            onClick={(event) => event.stopPropagation()}
                                            className="border-[#3CE8D1] data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:text-[#0f2042]"
                                        />
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{bank.name}</p>
                                            <div className="flex flex-wrap gap-3 text-sm text-[#94a3b8] mt-1">
                                                {isRkoSession ? (
                                                    <Badge variant="outline" className="text-[#3CE8D1] border-[#3CE8D1]/30">
                                                        Тарифы по запросу
                                                    </Badge>
                                                ) : (
                                                    <>
                                                        <span>Ставка БГ: <span className="text-[#3CE8D1]">{bank.bgRate}%</span></span>
                                                        <span>Срок: <span className="text-[#3CE8D1]">{bank.speed}</span></span>
                                                        {bank.individual && (
                                                            <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                                                                Индивидуально
                                                            </Badge>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {selectedBanks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
                                <Button
                                    onClick={handleCreateApplications}
                                    disabled={isCreating}
                                    className="w-full bg-[#3CE8D1] text-[#0f2042] hover:bg-[#3CE8D1]/90"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Создание...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Создать заявки ({selectedBanks.length} банков)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="bg-[#0f2042] border-[#1e3a5f]">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white">Документы компании</CardTitle>
                </CardHeader>
                <CardContent>
                    {documentsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Загрузка документов...
                        </div>
                    ) : filteredDocuments.length > 0 ? (
                        <div className="rounded-lg border border-[#1e3a5f] overflow-hidden">
                            <div className="max-h-[240px] overflow-y-auto divide-y divide-[#1e3a5f]">
                                {filteredDocuments.map((doc) => (
                                    <label key={doc.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1e3a5f]/40">
                                        <Checkbox
                                            checked={selectedDocumentIds.includes(doc.id)}
                                            onCheckedChange={() => toggleDocumentSelection(doc.id)}
                                            className="border-[#3CE8D1] data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:text-[#0f2042]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{formatDocumentType(doc)}</p>
                                            <p className="text-xs text-[#94a3b8] truncate">{doc.name}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-[#94a3b8]">Документы компании пока не загружены.</p>
                    )}
                    {selectedDocumentIds.length > 0 && (
                        <p className="text-xs text-[#3CE8D1] mt-2">
                            Выбрано документов: {selectedDocumentIds.length}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Already Submitted Banks */}
            {submittedBanks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            Заявки отправлены ({submittedBanks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            {submittedBanks.map((bank, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                                >
                                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{bank.name}</p>
                                        <div className="flex flex-wrap gap-3 text-sm text-[#94a3b8] mt-1">
                                            {isRkoSession ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    Тарифы по запросу
                                                </Badge>
                                            ) : (
                                                <>
                                                    <span>Ставка БГ: <span className="text-emerald-400">{bank.bgRate}%</span></span>
                                                    <span>Срок: <span className="text-emerald-400">{bank.speed}</span></span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                        Заявка создана
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Rejected Banks */}
            {session.rejected_banks.length > 0 && (
                <Card className="bg-[#0f2042] border-[#1e3a5f]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-white flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-400" />
                            Отклонено ({session.rejected_banks.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-2">
                            {session.rejected_banks.map((rejection, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                                >
                                    <span className="text-white">{rejection.bank}</span>
                                    <span className="text-sm text-red-400">{rejection.reason}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Bank Dialog */}
            {canAddBanks && (
                <Dialog open={isAddBankDialogOpen} onOpenChange={setIsAddBankDialogOpen}>
                    <DialogContent className="bg-[#0f2042] border-[#1e3a5f] max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-[#3CE8D1]" />
                            Добавить банк
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                            <Input
                                placeholder="Поиск банка..."
                                value={bankSearchQuery}
                                onChange={(e) => setBankSearchQuery(e.target.value)}
                                className="pl-10 bg-[#1a2942] border-[#2a3a5c] text-white placeholder:text-[#94a3b8]"
                            />
                        </div>
                        
                        {/* Bank list */}
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                                {availableBanksToAdd.length === 0 ? (
                                    <p className="text-center text-[#94a3b8] py-8">
                                        {bankSearchQuery ? 'Банки не найдены' : 'Все доступные банки уже добавлены'}
                                    </p>
                                ) : (
                                    availableBanksToAdd.map((bank) => {
                                        const isSelected = banksToAdd.includes(bank.name)
                                        return (
                                            <div
                                                key={bank.name}
                                                onClick={() => toggleBankToAdd(bank.name)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                                    isSelected
                                                        ? "bg-[#3CE8D1]/10 border-[#3CE8D1]/50"
                                                        : "bg-[#1a2942]/50 border-[#2a3a5c]/50 hover:bg-[#1a2942]"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleBankToAdd(bank.name)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="border-[#3CE8D1]/50 data-[state=checked]:bg-[#3CE8D1] data-[state=checked]:border-[#3CE8D1]"
                                                    />
                                                    <div>
                                                        <span className="text-white font-medium">{bank.name}</span>
                                                        {bank.individual && (
                                                            <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                                                Индивидуально
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-sm text-[#94a3b8]">
                                                    {bank.speed}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                        
                        {banksToAdd.length > 0 && (
                            <p className="text-sm text-[#94a3b8]">
                                Выбрано: <span className="text-[#3CE8D1] font-medium">{banksToAdd.length}</span>
                            </p>
                        )}
                    </div>
                    
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddBankDialogOpen(false)
                                setBanksToAdd([])
                                setBankSearchQuery("")
                            }}
                            className="border-[#2a3a5c] text-[#94a3b8] hover:bg-[#1a2942]"
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleAddBanks}
                            disabled={banksToAdd.length === 0 || isAddingBanks}
                            className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#3CE8D1]/90"
                        >
                            {isAddingBanks ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Добавление...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добавить ({banksToAdd.length})
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            )}
            {referenceApplication && (
                <ApplicationEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    application={referenceApplication}
                    onSave={handleBulkEditSave}
                />
            )}
        </div>
    )
}

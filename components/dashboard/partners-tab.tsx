"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Building2,
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    UserPlus,
    Link2,
    Unlink,
    Mail,
    Phone,
    CheckCircle2,
    CircleDot,
    Copy,
    Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAdminBanks, type AdminBank, type BankPayload, type PartnerInviteResponse } from "@/hooks/use-admin-banks"
import { useAdminBankConditions } from "@/hooks/use-admin-bank-conditions"

type BankDialogMode = "create" | "edit"
type ConditionDialogType = "bank" | "individual" | "rko"
type ConditionDialogMode = "create" | "edit"

const emptyBankForm: BankPayload = {
    name: "",
    short_name: "",
    logo_url: "",
    is_active: true,
    order: 0,
    contact_email: "",
    contact_phone: "",
    description: "",
}

const emptyBankConditionForm = {
    product: "",
    sum_min: "",
    sum_max: "",
    term_months: "",
    term_days: "",
    rate_min: "",
    rate_type: "annual" as "annual" | "individual",
    service_commission: "",
    service_commission_max: "",
    additional_conditions: "",
    is_active: true,
}

const emptyIndividualForm = {
    fz_type: "",
    guarantee_type: "all" as "all" | "execution" | "application" | "execution_application",
    client_limit: "",
    fz_application_limit: "",
    commercial_application_limit: "",
    corporate_dept_limit: "",
    term: "",
    bank_rate: "",
    service_commission: "",
    is_active: true,
}

const emptyRkoForm = {
    description: "",
    order: "",
    is_active: true,
}

const toNullableNumber = (value: string) => {
    if (!value.trim()) return null
    const parsed = Number(value.replace(/\s/g, ""))
    return Number.isFinite(parsed) ? parsed : null
}

export function PartnersTab() {
    const {
        banks,
        isLoading,
        isSaving,
        error,
        refetch,
        createBank,
        updateBank,
        deleteBank,
        invitePartner,
        getPartnerInvite,
        resendPartnerInvite,
        linkPartner,
        unlinkPartner,
    } = useAdminBanks()

    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null)

    const selectedBank = useMemo(
        () => banks.find((bank) => bank.id === selectedBankId) || null,
        [banks, selectedBankId]
    )

    const {
        bankConditions,
        individualReviews,
        rkoConditions,
        isLoading: conditionsLoading,
        error: conditionsError,
        createBankCondition,
        updateBankCondition,
        deleteBankCondition,
        createIndividualReview,
        updateIndividualReview,
        deleteIndividualReview,
        createRkoCondition,
        updateRkoCondition,
        deleteRkoCondition,
    } = useAdminBankConditions(selectedBank?.id ?? null)

    const filteredBanks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return banks
        return banks.filter((bank) =>
            bank.name.toLowerCase().includes(query) ||
            bank.short_name.toLowerCase().includes(query)
        )
    }, [banks, searchQuery])

    const conditionCounts = useMemo(() => ({
        bank: bankConditions.length,
        individual: individualReviews.length,
        rko: rkoConditions.length,
    }), [bankConditions.length, individualReviews.length, rkoConditions.length])

    const totalConditions = conditionCounts.bank + conditionCounts.individual + conditionCounts.rko

    const nextStepMessage = useMemo(() => {
        if (!selectedBank) {
            return "Выберите банк слева или создайте новый банк."
        }
        if (!selectedBank.partner_user_id) {
            return "Подключите партнёра: пригласите нового или привяжите существующий аккаунт."
        }
        if (!selectedBank.partner_is_active) {
            return "Партнёр ещё не активировал аккаунт. При необходимости отправьте ссылку вручную."
        }
        if (totalConditions === 0) {
            return "Добавьте условия банка, чтобы заявки обрабатывались корректно."
        }
        return "Основные шаги завершены. Проверьте статус банка и условия."
    }, [selectedBank, totalConditions])

    const stepItems = useMemo(() => ([
        {
            key: "bank",
            label: "Банк",
            done: Boolean(selectedBank),
        },
        {
            key: "partner",
            label: "Партнёр",
            done: Boolean(selectedBank?.partner_user_id),
        },
        {
            key: "activation",
            label: "Активация",
            done: Boolean(selectedBank?.partner_is_active),
        },
        {
            key: "conditions",
            label: "Условия",
            done: totalConditions > 0,
        },
    ]), [selectedBank, totalConditions])

    const [bankDialogOpen, setBankDialogOpen] = useState(false)
    const [bankDialogMode, setBankDialogMode] = useState<BankDialogMode>("create")
    const [bankForm, setBankForm] = useState<BankPayload>(emptyBankForm)

    const [deleteBankOpen, setDeleteBankOpen] = useState(false)

    const [partnerDialogOpen, setPartnerDialogOpen] = useState(false)
    const [partnerMode, setPartnerMode] = useState<"invite" | "link">("invite")
    const [partnerInviteForm, setPartnerInviteForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
    })
    const [partnerLinkForm, setPartnerLinkForm] = useState({
        email: "",
    })

    const [inviteDetails, setInviteDetails] = useState<PartnerInviteResponse | null>(null)
    const [inviteError, setInviteError] = useState<string | null>(null)
    const [isInviteLoading, setIsInviteLoading] = useState(false)
    const [isInviteSending, setIsInviteSending] = useState(false)

    const [conditionDialogOpen, setConditionDialogOpen] = useState(false)
    const [conditionDialogType, setConditionDialogType] = useState<ConditionDialogType>("bank")
    const [conditionDialogMode, setConditionDialogMode] = useState<ConditionDialogMode>("create")
    const [conditionEditId, setConditionEditId] = useState<number | null>(null)
    const [bankConditionForm, setBankConditionForm] = useState({ ...emptyBankConditionForm })
    const [individualForm, setIndividualForm] = useState({ ...emptyIndividualForm })
    const [rkoForm, setRkoForm] = useState({ ...emptyRkoForm })

    useEffect(() => {
        setInviteDetails(null)
        setInviteError(null)
        setIsInviteLoading(false)
        setIsInviteSending(false)
    }, [selectedBankId])

    const openPartnerDialog = (mode: "invite" | "link") => {
        setPartnerMode(mode)
        setPartnerDialogOpen(true)
    }

    const openCreateBank = () => {
        setBankDialogMode("create")
        setBankForm({ ...emptyBankForm })
        setBankDialogOpen(true)
    }

    const openEditBank = (bank: AdminBank) => {
        setBankDialogMode("edit")
        setBankForm({
            name: bank.name,
            short_name: bank.short_name,
            logo_url: bank.logo_url || "",
            is_active: bank.is_active,
            order: bank.order,
            contact_email: bank.contact_email || "",
            contact_phone: bank.contact_phone || "",
            description: bank.description || "",
        })
        setBankDialogOpen(true)
    }

    const handleSaveBank = async () => {
        if (!bankForm.name.trim()) {
            toast.error("Название банка обязательно")
            return
        }

        const payload: BankPayload = {
            ...bankForm,
            name: bankForm.name.trim(),
            short_name: bankForm.short_name?.trim() || "",
            logo_url: bankForm.logo_url?.trim() || "",
            contact_email: bankForm.contact_email?.trim() || "",
            contact_phone: bankForm.contact_phone?.trim() || "",
            description: bankForm.description?.trim() || "",
        }

        const result = bankDialogMode === "create"
            ? await createBank(payload)
            : selectedBank
                ? await updateBank(selectedBank.id, payload)
                : null

        if (!result) {
            toast.error("Не удалось сохранить банк")
            return
        }

        toast.success(bankDialogMode === "create" ? "Банк создан" : "Банк обновлен")
        setBankDialogOpen(false)
    }

    const handleDeleteBank = async () => {
        if (!selectedBank) return
        const success = await deleteBank(selectedBank.id)
        if (!success) {
            toast.error("Ошибка удаления банка")
            return
        }
        toast.success("Банк удалён")
        setDeleteBankOpen(false)
        setSelectedBankId(null)
    }

    const handleInvitePartner = async () => {
        if (!selectedBank) return
        if (!partnerInviteForm.email.trim()) {
            toast.error("Email обязателен")
            return
        }
        const response = await invitePartner(selectedBank.id, {
            email: partnerInviteForm.email.trim(),
            first_name: partnerInviteForm.first_name.trim(),
            last_name: partnerInviteForm.last_name.trim(),
        })
        if (!response) {
            toast.error("Ошибка создания приглашения")
            return
        }
        setInviteDetails(response)
        setInviteError(null)
        toast.success(response.message)
        setPartnerInviteForm({ email: "", first_name: "", last_name: "" })
        setPartnerDialogOpen(false)
    }

    const handleLinkPartner = async () => {
        if (!selectedBank) return
        if (!partnerLinkForm.email.trim()) {
            toast.error("Email обязателен")
            return
        }
        const response = await linkPartner(selectedBank.id, {
            email: partnerLinkForm.email.trim(),
        })
        if (!response) {
            toast.error("Ошибка привязки партнёра")
            return
        }
        setInviteDetails(null)
        setInviteError(null)
        toast.success("Партнёр привязан")
        setPartnerLinkForm({ email: "" })
        setPartnerDialogOpen(false)
    }

    const handleUnlinkPartner = async () => {
        if (!selectedBank) return
        const response = await unlinkPartner(selectedBank.id)
        if (!response) {
            toast.error("Ошибка отвязки партнёра")
            return
        }
        setInviteDetails(null)
        setInviteError(null)
        toast.success("Партнёр отвязан")
    }

    const handleLoadInviteDetails = async () => {
        if (!selectedBank) return
        setIsInviteLoading(true)
        setInviteError(null)
        const response = await getPartnerInvite(selectedBank.id)
        if (!response) {
            const message = "Не удалось получить ссылку приглашения"
            setInviteError(message)
            toast.error(message)
            setIsInviteLoading(false)
            return
        }
        setInviteDetails(response)
        setIsInviteLoading(false)
    }

    const handleResendInvite = async () => {
        if (!selectedBank) return
        setIsInviteSending(true)
        setInviteError(null)
        const response = await resendPartnerInvite(selectedBank.id)
        if (!response) {
            const message = "Не удалось отправить приглашение"
            setInviteError(message)
            toast.error(message)
            setIsInviteSending(false)
            return
        }
        setInviteDetails(response)
        toast.success(response.message)
        setIsInviteSending(false)
    }

    const handleCopyInviteLink = async (inviteUrl: string) => {
        if (!inviteUrl) return
        try {
            await navigator.clipboard.writeText(inviteUrl)
            toast.success("Ссылка приглашения скопирована")
        } catch {
            toast.error("Не удалось скопировать ссылку")
        }
    }

    const openConditionDialog = (type: ConditionDialogType, mode: ConditionDialogMode, data?: any) => {
        setConditionDialogType(type)
        setConditionDialogMode(mode)
        setConditionEditId(data?.id ?? null)
        if (type === "bank") {
            setBankConditionForm({
                ...emptyBankConditionForm,
                ...(data ? {
                    product: data.product || "",
                    sum_min: data.sum_min || "",
                    sum_max: data.sum_max || "",
                    term_months: data.term_months?.toString() || "",
                    term_days: data.term_days?.toString() || "",
                    rate_min: data.rate_min || "",
                    rate_type: data.rate_type || "annual",
                    service_commission: data.service_commission || "",
                    service_commission_max: data.service_commission_max || "",
                    additional_conditions: data.additional_conditions || "",
                    is_active: data.is_active ?? true,
                } : {})
            })
        }
        if (type === "individual") {
            setIndividualForm({
                ...emptyIndividualForm,
                ...(data ? {
                    fz_type: data.fz_type || "",
                    guarantee_type: data.guarantee_type || "all",
                    client_limit: data.client_limit || "",
                    fz_application_limit: data.fz_application_limit || "",
                    commercial_application_limit: data.commercial_application_limit || "",
                    corporate_dept_limit: data.corporate_dept_limit || "",
                    term: data.term || "",
                    bank_rate: data.bank_rate || "",
                    service_commission: data.service_commission || "",
                    is_active: data.is_active ?? true,
                } : {})
            })
        }
        if (type === "rko") {
            setRkoForm({
                ...emptyRkoForm,
                ...(data ? {
                    description: data.description || "",
                    order: data.order?.toString() || "",
                    is_active: data.is_active ?? true,
                } : {})
            })
        }
        setConditionDialogOpen(true)
    }

    const handleSaveCondition = async () => {
        if (!selectedBank) return

        if (conditionDialogType === "bank") {
            if (!bankConditionForm.product.trim()) {
                toast.error("Поле продукта обязательно")
                return
            }
            const payload = {
                bank: selectedBank.id,
                product: bankConditionForm.product.trim(),
                sum_min: bankConditionForm.sum_min || null,
                sum_max: bankConditionForm.sum_max || null,
                term_months: toNullableNumber(bankConditionForm.term_months),
                term_days: toNullableNumber(bankConditionForm.term_days),
                rate_min: bankConditionForm.rate_min || null,
                rate_type: bankConditionForm.rate_type,
                service_commission: bankConditionForm.service_commission || null,
                service_commission_max: bankConditionForm.service_commission_max || null,
                additional_conditions: bankConditionForm.additional_conditions || "",
                is_active: bankConditionForm.is_active,
            }
            const result = conditionDialogMode === "create"
                ? await createBankCondition(payload)
                : conditionEditId
                    ? await updateBankCondition(conditionEditId, payload)
                    : null

            if (!result) {
                toast.error("Ошибка сохранения условия")
                return
            }
        }

        if (conditionDialogType === "individual") {
            const payload = {
                bank: selectedBank.id,
                fz_type: individualForm.fz_type || "",
                guarantee_type: individualForm.guarantee_type,
                client_limit: individualForm.client_limit || null,
                fz_application_limit: individualForm.fz_application_limit || null,
                commercial_application_limit: individualForm.commercial_application_limit || null,
                corporate_dept_limit: individualForm.corporate_dept_limit || null,
                term: individualForm.term || "",
                bank_rate: individualForm.bank_rate || "",
                service_commission: individualForm.service_commission || null,
                is_active: individualForm.is_active,
            }
            const result = conditionDialogMode === "create"
                ? await createIndividualReview(payload)
                : conditionEditId
                    ? await updateIndividualReview(conditionEditId, payload)
                    : null

            if (!result) {
                toast.error("Ошибка сохранения условия")
                return
            }
        }

        if (conditionDialogType === "rko") {
            const orderValue = toNullableNumber(rkoForm.order)
            const payload = {
                bank: selectedBank.id,
                description: rkoForm.description || "",
                ...(orderValue !== null ? { order: orderValue } : {}),
                is_active: rkoForm.is_active,
            }
            const result = conditionDialogMode === "create"
                ? await createRkoCondition(payload)
                : conditionEditId
                    ? await updateRkoCondition(conditionEditId, payload)
                    : null

            if (!result) {
                toast.error("Ошибка сохранения условия")
                return
            }
        }

        toast.success("Условия сохранены")
        setConditionDialogOpen(false)
    }

    const handleDeleteCondition = async (type: ConditionDialogType, id: number) => {
        const success = type === "bank"
            ? await deleteBankCondition(id)
            : type === "individual"
                ? await deleteIndividualReview(id)
                : await deleteRkoCondition(id)

        if (!success) {
            toast.error("Ошибка удаления условия")
            return
        }
        toast.success("Условие удалено")
    }

    return (
        <Card className="shadow-sm border-border">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <div>
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-[#3CE8D1]" />
                        Партнёры (Банки)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Управление банками и подключением партнёров
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refetch}
                        disabled={isLoading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Обновить
                    </Button>
                    <Button
                        size="sm"
                        className="gap-2 bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                        onClick={openCreateBank}
                    >
                        <Plus className="h-4 w-4" />
                        Добавить банк
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
                    <div className="space-y-3">
                        <Card className="border-border/60">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Банки</CardTitle>
                                    <Badge variant="outline" className="text-xs">{banks.length}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Выберите банк для управления партнёром
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Input
                                    placeholder="Поиск банка..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                <div className="space-y-2">
                                    {filteredBanks.map((bank) => (
                                        <button
                                            key={bank.id}
                                            onClick={() => setSelectedBankId(bank.id)}
                                            className={cn(
                                                "w-full text-left rounded-lg border p-3 transition-colors",
                                                selectedBankId === bank.id
                                                    ? "border-[#3CE8D1]/60 bg-[#3CE8D1]/10"
                                                    : "hover:bg-accent/40"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-lg flex items-center justify-center",
                                                        bank.is_active ? "bg-emerald-500/10" : "bg-amber-500/10"
                                                    )}>
                                                        <Building2 className={cn(
                                                            "h-4 w-4",
                                                            bank.is_active ? "text-emerald-500" : "text-amber-500"
                                                        )} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate">{bank.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{bank.short_name || "—"}</p>
                                                    </div>
                                                </div>
                                                <Badge className={bank.is_active ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/30"}>
                                                    {bank.is_active ? "Подключен" : "Не подключен"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground gap-2">
                                                <span className="truncate">
                                                    {bank.partner_name || bank.partner_email || "Партнёр не назначен"}
                                                </span>
                                                {bank.partner_user_id && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {bank.partner_is_active ? "Активен" : "Ожидает"}
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>
                                    ))}

                                    {isLoading && (
                                        <div className="text-sm text-muted-foreground py-6 text-center">
                                            Загрузка...
                                        </div>
                                    )}

                                    {!isLoading && filteredBanks.length === 0 && (
                                        <div className="text-sm text-muted-foreground py-6 text-center">
                                            Банки не найдены
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        {!selectedBank && (
                            <Card className="border-dashed bg-muted/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Как подключаются партнёры</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-start gap-2">
                                        <CircleDot className="mt-0.5 h-4 w-4 text-[#3CE8D1]" />
                                        <span>Выберите банк слева или добавьте новый.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CircleDot className="mt-0.5 h-4 w-4 text-[#3CE8D1]" />
                                        <span>Пригласите партнёра или привяжите существующий аккаунт.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CircleDot className="mt-0.5 h-4 w-4 text-[#3CE8D1]" />
                                        <span>Партнёр получает письмо, задаёт пароль и активирует доступ.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CircleDot className="mt-0.5 h-4 w-4 text-[#3CE8D1]" />
                                        <span>Заполните условия банка для корректной обработки заявок.</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {selectedBank && (
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {selectedBank.name}
                                            {selectedBank.is_active ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                                    Подключен
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                                    Не подключен
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">{selectedBank.short_name || "—"}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEditBank(selectedBank)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Редактировать
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-rose-500 border-rose-500/40" onClick={() => setDeleteBankOpen(true)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Удалить
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="rounded-xl border bg-muted/30 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold">Статус подключения</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Банк {"->"} Партнёр {"->"} Активация {"->"} Условия
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {selectedBank.partner_user_id
                                                    ? (selectedBank.partner_is_active ? "Активен" : "Ожидает")
                                                    : "Нет партнёра"}
                                            </Badge>
                                        </div>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            {stepItems.map((step, index) => (
                                                <div key={step.key} className="rounded-lg border bg-background/60 p-3">
                                                    <div className="flex items-center gap-2">
                                                        {step.done ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                        ) : (
                                                            <CircleDot className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <p className="text-[10px] uppercase text-muted-foreground">Шаг {index + 1}</p>
                                                            <p className="text-sm font-medium">{step.label}</p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "mt-2 text-[10px]",
                                                            step.done ? "border-emerald-500/30 text-emerald-500" : "border-border text-muted-foreground"
                                                        )}
                                                    >
                                                        {step.done ? "Готово" : "Далее"}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 rounded-lg border bg-background/60 p-3">
                                            <p className="text-xs text-muted-foreground">Следующий шаг</p>
                                            <p className="text-sm">{nextStepMessage}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                                        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold">Данные банка</p>
                                                    <p className="text-xs text-muted-foreground">Контакты и описание</p>
                                                </div>
                                                <Badge className={selectedBank.is_active ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-amber-500/10 text-amber-500 border border-amber-500/30"}>
                                                    {selectedBank.is_active ? "Подключен" : "Не подключен"}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span>{selectedBank.contact_email || "—"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{selectedBank.contact_phone || "—"}</span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg border bg-background/60 p-3 text-sm">
                                                <p className="text-xs text-muted-foreground mb-1">Описание</p>
                                                <p>{selectedBank.description || "Описание не заполнено"}</p>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold">Партнёрский аккаунт</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Приглашение создаёт аккаунт и отправляет письмо
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {!selectedBank.partner_user_id
                                                        ? "Не подключен"
                                                        : selectedBank.partner_is_active
                                                            ? "Активен"
                                                            : "Ожидает"}
                                                </Badge>
                                            </div>

                                            {!selectedBank.partner_user_id ? (
                                                <>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <Button size="sm" className="gap-2" onClick={() => openPartnerDialog("invite")}>
                                                            <UserPlus className="h-4 w-4" />
                                                            Пригласить партнёра
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="gap-2" onClick={() => openPartnerDialog("link")}>
                                                            <Link2 className="h-4 w-4" />
                                                            Привязать существующего
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        После приглашения вы сможете скопировать ссылку и отправить её вручную.
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium">
                                                            {selectedBank.partner_name || selectedBank.partner_email}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {selectedBank.partner_email || "—"}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {!selectedBank.partner_is_active && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-2"
                                                                    onClick={handleLoadInviteDetails}
                                                                    disabled={isInviteLoading}
                                                                >
                                                                    <Link2 className={cn("h-4 w-4", isInviteLoading && "animate-spin")} />
                                                                    Получить ссылку
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-2"
                                                                    onClick={handleResendInvite}
                                                                    disabled={isInviteSending || isSaving}
                                                                >
                                                                    <Send className={cn("h-4 w-4", isInviteSending && "animate-spin")} />
                                                                    Отправить повторно
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button size="sm" variant="outline" className="gap-2" onClick={() => openPartnerDialog("link")}>
                                                            <Link2 className="h-4 w-4" />
                                                            Привязать другого
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="gap-2 text-rose-500 border-rose-500/40" onClick={handleUnlinkPartner}>
                                                            <Unlink className="h-4 w-4" />
                                                            Отвязать
                                                        </Button>
                                                    </div>

                                                    {inviteDetails && !selectedBank.partner_is_active && (
                                                        <div className="rounded-lg border bg-background/60 p-3 space-y-2">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <p className="text-xs text-muted-foreground">Ссылка приглашения</p>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "text-[10px]",
                                                                        inviteDetails.email_sent === true && "border-emerald-500/30 text-emerald-500",
                                                                        inviteDetails.email_sent === false && "border-amber-500/30 text-amber-500"
                                                                    )}
                                                                >
                                                                    {inviteDetails.email_sent === null
                                                                        ? "Сформирована"
                                                                        : inviteDetails.email_sent
                                                                            ? "Письмо отправлено"
                                                                            : "Письмо не отправлено"}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row gap-2">
                                                                <Input value={inviteDetails.full_invite_url} readOnly />
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="gap-2"
                                                                    onClick={() => handleCopyInviteLink(inviteDetails.full_invite_url)}
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                    Копировать
                                                                </Button>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                Отправьте ссылку вручную, если письмо не дошло.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {inviteError && (
                                                        <div className="text-xs text-rose-500">
                                                            {inviteError}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold">Условия банка</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Настройте параметры для продуктов и сервисов
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{totalConditions} всего</Badge>
                                        </div>

                                        {conditionsError && (
                                            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-500">
                                                {conditionsError}
                                            </div>
                                        )}

                                        <Tabs defaultValue="conditions" className="w-full">
                                            <TabsList className="grid grid-cols-3 w-full">
                                                <TabsTrigger value="conditions" className="flex items-center gap-2">
                                                    Условия
                                                    <Badge variant="outline" className="text-[10px]">{conditionCounts.bank}</Badge>
                                                </TabsTrigger>
                                                <TabsTrigger value="individual" className="flex items-center gap-2">
                                                    Инд. рассмотрение
                                                    <Badge variant="outline" className="text-[10px]">{conditionCounts.individual}</Badge>
                                                </TabsTrigger>
                                                <TabsTrigger value="rko" className="flex items-center gap-2">
                                                    РКО
                                                    <Badge variant="outline" className="text-[10px]">{conditionCounts.rko}</Badge>
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="conditions" className="mt-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm text-muted-foreground">Базовые условия банка</p>
                                                    <Button size="sm" variant="outline" onClick={() => openConditionDialog("bank", "create")}>Добавить</Button>
                                                </div>
                                                {conditionsLoading ? (
                                                    <div className="text-sm text-muted-foreground">Загрузка...</div>
                                                ) : bankConditions.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground">Нет условий</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {bankConditions.map((condition) => (
                                                            <div key={condition.id} className="rounded-lg border p-3">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium text-sm">{condition.product}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {condition.sum_min || "—"} – {condition.sum_max || "—"} | {condition.term_months || condition.term_days || "—"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {condition.is_active ? (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Активно</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">Не активно</Badge>
                                                                        )}
                                                                        <Button size="sm" variant="outline" onClick={() => openConditionDialog("bank", "edit", condition)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="text-rose-500 border-rose-500/40" onClick={() => handleDeleteCondition("bank", condition.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="individual" className="mt-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm text-muted-foreground">Индивидуальные условия</p>
                                                    <Button size="sm" variant="outline" onClick={() => openConditionDialog("individual", "create")}>Добавить</Button>
                                                </div>
                                                {conditionsLoading ? (
                                                    <div className="text-sm text-muted-foreground">Загрузка...</div>
                                                ) : individualReviews.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground">Нет условий</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {individualReviews.map((review) => (
                                                            <div key={review.id} className="rounded-lg border p-3">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium text-sm">{review.fz_type || "—"}</p>
                                                                        <p className="text-xs text-muted-foreground">Ставка: {review.bank_rate || "—"}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {review.is_active ? (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Активно</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">Не активно</Badge>
                                                                        )}
                                                                        <Button size="sm" variant="outline" onClick={() => openConditionDialog("individual", "edit", review)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="text-rose-500 border-rose-500/40" onClick={() => handleDeleteCondition("individual", review.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TabsContent>

                                            <TabsContent value="rko" className="mt-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm text-muted-foreground">Условия РКО</p>
                                                    <Button size="sm" variant="outline" onClick={() => openConditionDialog("rko", "create")}>Добавить</Button>
                                                </div>
                                                {conditionsLoading ? (
                                                    <div className="text-sm text-muted-foreground">Загрузка...</div>
                                                ) : rkoConditions.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground">Нет условий</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {rkoConditions.map((rko) => (
                                                            <div key={rko.id} className="rounded-lg border p-3">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <p className="font-medium text-sm">{rko.description}</p>
                                                                        <p className="text-xs text-muted-foreground">Порядок: {rko.order}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {rko.is_active ? (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">Активно</Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">Не активно</Badge>
                                                                        )}
                                                                        <Button size="sm" variant="outline" onClick={() => openConditionDialog("rko", "edit", rko)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" className="text-rose-500 border-rose-500/40" onClick={() => handleDeleteCondition("rko", rko.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </CardContent>

            <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{bankDialogMode === "create" ? "Добавить банк" : "Редактировать банк"}</DialogTitle>
                        <DialogDescription>Укажите основные данные банка и статус подключения.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Название *</Label>
                            <Input value={bankForm.name} onChange={(e) => setBankForm(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Краткое название</Label>
                            <Input value={bankForm.short_name} onChange={(e) => setBankForm(prev => ({ ...prev, short_name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={bankForm.contact_email} onChange={(e) => setBankForm(prev => ({ ...prev, contact_email: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Телефон</Label>
                                <Input value={bankForm.contact_phone} onChange={(e) => setBankForm(prev => ({ ...prev, contact_phone: e.target.value }))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Описание</Label>
                            <Input value={bankForm.description} onChange={(e) => setBankForm(prev => ({ ...prev, description: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Порядок</Label>
                                <Input
                                    type="number"
                                    value={bankForm.order?.toString() ?? ""}
                                    onChange={(e) => setBankForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-7">
                                <Checkbox
                                    checked={bankForm.is_active ?? true}
                                    onCheckedChange={(value) => setBankForm(prev => ({ ...prev, is_active: Boolean(value) }))}
                                    id="bank-active"
                                />
                                <Label htmlFor="bank-active" className="text-sm">Подключен</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBankDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleSaveBank} disabled={isSaving} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                            {bankDialogMode === "create" ? "Создать" : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={partnerDialogOpen} onOpenChange={setPartnerDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Подключение партнёра</DialogTitle>
                        <DialogDescription>
                            Приглашение создаёт аккаунт и отправляет письмо. Привязка соединяет существующий аккаунт с банком.
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs value={partnerMode} onValueChange={(value) => setPartnerMode(value as "invite" | "link")}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="invite">Пригласить</TabsTrigger>
                            <TabsTrigger value="link">Привязать</TabsTrigger>
                        </TabsList>
                        <TabsContent value="invite" className="mt-4 space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Партнёр получит письмо со ссылкой для установки пароля.
                            </p>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input value={partnerInviteForm.email} onChange={(e) => setPartnerInviteForm(prev => ({ ...prev, email: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Имя</Label>
                                    <Input value={partnerInviteForm.first_name} onChange={(e) => setPartnerInviteForm(prev => ({ ...prev, first_name: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Фамилия</Label>
                                    <Input value={partnerInviteForm.last_name} onChange={(e) => setPartnerInviteForm(prev => ({ ...prev, last_name: e.target.value }))} />
                                </div>
                            </div>
                            <Button onClick={handleInvitePartner} disabled={isSaving} className="w-full bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                                Создать приглашение
                            </Button>
                        </TabsContent>
                        <TabsContent value="link" className="mt-4 space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Используйте email существующего партнёрского аккаунта.
                            </p>
                            <div className="space-y-2">
                                <Label>Email партнёра *</Label>
                                <Input value={partnerLinkForm.email} onChange={(e) => setPartnerLinkForm({ email: e.target.value })} />
                            </div>
                            <Button onClick={handleLinkPartner} disabled={isSaving} className="w-full">
                                Привязать партнёра
                            </Button>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <Dialog open={conditionDialogOpen} onOpenChange={setConditionDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{conditionDialogMode === "create" ? "Добавить условие" : "Редактировать условие"}</DialogTitle>
                        <DialogDescription>Заполните параметры условий банка.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {conditionDialogType === "bank" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Продукт *</Label>
                                    <Input value={bankConditionForm.product} onChange={(e) => setBankConditionForm(prev => ({ ...prev, product: e.target.value }))} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Сумма мин</Label>
                                        <Input value={bankConditionForm.sum_min} onChange={(e) => setBankConditionForm(prev => ({ ...prev, sum_min: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Сумма макс</Label>
                                        <Input value={bankConditionForm.sum_max} onChange={(e) => setBankConditionForm(prev => ({ ...prev, sum_max: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Срок (мес)</Label>
                                        <Input value={bankConditionForm.term_months} onChange={(e) => setBankConditionForm(prev => ({ ...prev, term_months: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Срок (дней)</Label>
                                        <Input value={bankConditionForm.term_days} onChange={(e) => setBankConditionForm(prev => ({ ...prev, term_days: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Ставка мин</Label>
                                        <Input value={bankConditionForm.rate_min} onChange={(e) => setBankConditionForm(prev => ({ ...prev, rate_min: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Тип ставки</Label>
                                        <Select value={bankConditionForm.rate_type} onValueChange={(value) => setBankConditionForm(prev => ({ ...prev, rate_type: value as "annual" | "individual" }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Тип ставки" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="annual">Годовая</SelectItem>
                                                <SelectItem value="individual">Индивидуальная</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Комиссия</Label>
                                        <Input value={bankConditionForm.service_commission} onChange={(e) => setBankConditionForm(prev => ({ ...prev, service_commission: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Комиссия макс</Label>
                                        <Input value={bankConditionForm.service_commission_max} onChange={(e) => setBankConditionForm(prev => ({ ...prev, service_commission_max: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Доп. условия</Label>
                                    <Input value={bankConditionForm.additional_conditions} onChange={(e) => setBankConditionForm(prev => ({ ...prev, additional_conditions: e.target.value }))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={bankConditionForm.is_active}
                                        onCheckedChange={(value) => setBankConditionForm(prev => ({ ...prev, is_active: Boolean(value) }))}
                                        id="bank-condition-active"
                                    />
                                    <Label htmlFor="bank-condition-active">Активно</Label>
                                </div>
                            </>
                        )}

                        {conditionDialogType === "individual" && (
                            <>
                                <div className="space-y-2">
                                    <Label>ФЗ</Label>
                                    <Input value={individualForm.fz_type} onChange={(e) => setIndividualForm(prev => ({ ...prev, fz_type: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Тип гарантии</Label>
                                    <Select value={individualForm.guarantee_type} onValueChange={(value) => setIndividualForm(prev => ({ ...prev, guarantee_type: value as "all" | "execution" | "application" | "execution_application" }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Тип гарантии" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все виды</SelectItem>
                                            <SelectItem value="execution">Исполнение</SelectItem>
                                            <SelectItem value="application">Заявка</SelectItem>
                                            <SelectItem value="execution_application">Исполнение + заявка</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Лимит клиента</Label>
                                        <Input value={individualForm.client_limit} onChange={(e) => setIndividualForm(prev => ({ ...prev, client_limit: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Лимит ФЗ</Label>
                                        <Input value={individualForm.fz_application_limit} onChange={(e) => setIndividualForm(prev => ({ ...prev, fz_application_limit: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Лимит коммерция</Label>
                                        <Input value={individualForm.commercial_application_limit} onChange={(e) => setIndividualForm(prev => ({ ...prev, commercial_application_limit: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Лимит корп. отдела</Label>
                                        <Input value={individualForm.corporate_dept_limit} onChange={(e) => setIndividualForm(prev => ({ ...prev, corporate_dept_limit: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Срок</Label>
                                        <Input value={individualForm.term} onChange={(e) => setIndividualForm(prev => ({ ...prev, term: e.target.value }))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ставка банка</Label>
                                        <Input value={individualForm.bank_rate} onChange={(e) => setIndividualForm(prev => ({ ...prev, bank_rate: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Комиссия ЛГ</Label>
                                    <Input value={individualForm.service_commission} onChange={(e) => setIndividualForm(prev => ({ ...prev, service_commission: e.target.value }))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={individualForm.is_active}
                                        onCheckedChange={(value) => setIndividualForm(prev => ({ ...prev, is_active: Boolean(value) }))}
                                        id="individual-active"
                                    />
                                    <Label htmlFor="individual-active">Активно</Label>
                                </div>
                            </>
                        )}

                        {conditionDialogType === "rko" && (
                            <>
                                <div className="space-y-2">
                                    <Label>Описание</Label>
                                    <Input value={rkoForm.description} onChange={(e) => setRkoForm(prev => ({ ...prev, description: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Порядок</Label>
                                    <Input value={rkoForm.order} onChange={(e) => setRkoForm(prev => ({ ...prev, order: e.target.value }))} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={rkoForm.is_active}
                                        onCheckedChange={(value) => setRkoForm(prev => ({ ...prev, is_active: Boolean(value) }))}
                                        id="rko-active"
                                    />
                                    <Label htmlFor="rko-active">Активно</Label>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConditionDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleSaveCondition} disabled={isSaving} className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]">
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteBankOpen} onOpenChange={setDeleteBankOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить банк?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Банк и его условия будут удалены. Это действие нельзя отменить.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBank} className="bg-rose-600 hover:bg-rose-700">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

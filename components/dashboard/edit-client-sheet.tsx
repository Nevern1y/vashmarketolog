"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Building2,
    MapPin,
    Users,
    Landmark,
    Plus,
    Trash2,
    Loader2,
    Save,
    X,
    ExternalLink,
    FileSignature,
    Briefcase,
    Award,
    Globe,
    Contact,
} from "lucide-react"
import { useCRMClient, useCRMClientMutations, type FounderData, type BankAccountData } from "@/hooks/use-companies"
import { toast } from "sonner"

// =============================================================================
// PROPS
// =============================================================================

interface EditClientSheetProps {
    isOpen: boolean
    clientId: number | null
    onClose: () => void
    onSaved: () => void
    mode?: 'view' | 'edit'
}

// =============================================================================
// ZOD SCHEMAS - Matches Postman API 1.1 Structure
// =============================================================================

const founderDocumentSchema = z.object({
    series: z.string().max(5, "Максимум 5 символов"),
    number: z.string().max(6, "Максимум 6 символов"),
    issued_at: z.string().optional(),
    authority_name: z.string().optional(),
    authority_code: z.string().max(7, "Формат: XXX-XXX").optional(),
})

const founderSchema = z.object({
    full_name: z.string().min(1, "Обязательное поле"),
    inn: z.string().max(12, "Максимум 12 цифр"),
    share_relative: z.coerce.number().min(0).max(100, "Доля 0-100%"),
    document: founderDocumentSchema,
    birth_place: z.string().optional(),
    birth_date: z.string().optional(),
    gender: z.coerce.number().min(1).max(2).optional(),
    citizen: z.string().default("РФ"),
    // WAVE 2: New address fields for API compliance
    legal_address: z.string().optional(),
    legal_address_postal_code: z.string().max(6, "Индекс: 6 цифр").optional(),
    actual_address: z.string().optional(),
    actual_address_postal_code: z.string().max(6, "Индекс: 6 цифр").optional(),
})

const bankAccountSchema = z.object({
    bank_name: z.string().min(1, "Обязательное поле"),
    bank_bik: z.string().max(9, "БИК: 9 цифр"),
    account: z.string().max(20, "Счёт: 20 цифр"),
})

// ТЗ Клиенты: Деятельность и лицензии
const activitySchema = z.object({
    okved_code: z.string().min(1, "Код ОКВЭД"),
    okved_name: z.string().optional(),
    is_primary: z.boolean().default(false),
})

const licenseSchema = z.object({
    license_type: z.string().min(1, "Тип лицензии"),
    license_number: z.string().optional(),
    issue_date: z.string().optional(),
    expiry_date: z.string().optional(),
    issuing_authority: z.string().optional(),
})

// ТЗ Клиенты: Реквизиты счетов ЭТП (16 platform options)
const etpAccountSchema = z.object({
    platform: z.string().min(1, "Выберите площадку"),
    account_number: z.string().optional(),
    bank_bik: z.string().max(9, "БИК: 9 цифр").optional(),
    bank_name: z.string().optional(),
    corr_account: z.string().max(20, "К/С: 20 цифр").optional(),
})

// ТЗ Клиенты: Контактные лица
const contactPersonSchema = z.object({
    position: z.string().optional(),
    last_name: z.string().min(1, "Фамилия"),
    first_name: z.string().min(1, "Имя"),
    middle_name: z.string().optional(),
    email: z.string().email("Некорректный email").optional().or(z.literal("")),
    phone: z.string().optional(),
})


const clientFormSchema = z.object({
    // Core Identity
    inn: z.string().min(10, "ИНН: 10 или 12 цифр").max(12, "ИНН: 10 или 12 цифр"),
    kpp: z.string().max(9, "КПП: 9 цифр").optional().or(z.literal("")),
    ogrn: z.string().max(15, "ОГРН: 13 или 15 цифр").optional().or(z.literal("")),
    name: z.string().min(1, "Обязательное поле"),
    short_name: z.string().optional().or(z.literal("")),
    region: z.string().optional().or(z.literal("")),

    // Addresses with postal codes (WAVE 2)
    legal_address: z.string().optional().or(z.literal("")),
    legal_address_postal_code: z.string().max(6, "Индекс: 6 цифр").optional().or(z.literal("")),
    actual_address: z.string().optional().or(z.literal("")),
    actual_address_postal_code: z.string().max(6, "Индекс: 6 цифр").optional().or(z.literal("")),
    post_address: z.string().optional().or(z.literal("")),
    post_address_postal_code: z.string().max(6, "Индекс: 6 цифр").optional().or(z.literal("")),
    is_actual_same_as_legal: z.boolean().default(false),
    is_post_same_as_legal: z.boolean().default(false),

    // Company details (WAVE 2: Postman API compliance)
    employee_count: z.coerce.number().min(0).optional(),

    // MCHD Signatory (WAVE 2: Postman API compliance)
    signatory_basis: z.enum(["charter", "power_of_attorney"]).default("charter"),
    is_mchd: z.boolean().default(false),
    mchd_full_name: z.string().optional().or(z.literal("")),
    mchd_inn: z.string().max(12, "ИНН: 10 или 12 цифр").optional().or(z.literal("")),
    mchd_number: z.string().optional().or(z.literal("")),
    mchd_date: z.string().optional().or(z.literal("")),

    // Director + Passport
    director_name: z.string().optional().or(z.literal("")),
    director_position: z.string().optional().or(z.literal("")),
    passport_series: z.string().max(4, "Максимум 4 цифры").optional().or(z.literal("")),
    passport_number: z.string().max(6, "Максимум 6 цифр").optional().or(z.literal("")),
    passport_date: z.string().optional().or(z.literal("")),
    passport_code: z.string().max(7, "Формат: XXX-XXX").optional().or(z.literal("")),
    passport_issued_by: z.string().optional().or(z.literal("")),

    // Founders (Dynamic Array)
    founders: z.array(founderSchema).default([]),

    // Bank Accounts (Dynamic Array)
    bank_accounts: z.array(bankAccountSchema).default([]),

    // Legacy bank fields (for single primary account)
    bank_name: z.string().optional().or(z.literal("")),
    bank_bic: z.string().optional().or(z.literal("")),
    bank_account: z.string().optional().or(z.literal("")),
    bank_corr_account: z.string().optional().or(z.literal("")),

    // Contact
    contact_person: z.string().optional().or(z.literal("")),
    contact_phone: z.string().optional().or(z.literal("")),
    contact_email: z.string().email("Некорректный email").optional().or(z.literal("")),
    website: z.string().optional().or(z.literal("")),

    // ТЗ Клиенты: New dynamic arrays
    activities: z.array(activitySchema).default([]),
    licenses: z.array(licenseSchema).default([]),
    etp_accounts: z.array(etpAccountSchema).default([]),
    contact_persons: z.array(contactPersonSchema).default([]),
})

type ClientFormData = z.infer<typeof clientFormSchema>

// =============================================================================
// HELPERS
// =============================================================================

const safeString = (value: string | null | undefined): string => value ?? ""

const createEmptyFounder = (): z.infer<typeof founderSchema> => ({
    full_name: "",
    inn: "",
    share_relative: 0,
    document: {
        series: "",
        number: "",
        issued_at: "",
        authority_name: "",
        authority_code: "",
    },
    birth_place: "",
    birth_date: "",
    gender: 1,
    citizen: "РФ",
    // WAVE 2: Address fields
    legal_address: "",
    legal_address_postal_code: "",
    actual_address: "",
    actual_address_postal_code: "",
})

const createEmptyBankAccount = (): z.infer<typeof bankAccountSchema> => ({
    bank_name: "",
    bank_bik: "",
    account: "",
})

const createEmptyActivity = (): z.infer<typeof activitySchema> => ({
    okved_code: "",
    okved_name: "",
    is_primary: false,
})

const createEmptyLicense = (): z.infer<typeof licenseSchema> => ({
    license_type: "",
    license_number: "",
    issue_date: "",
    expiry_date: "",
    issuing_authority: "",
})

// ТЗ Клиенты: 16 ETP platforms
const ETP_PLATFORMS = [
    { value: "roseltorg", label: "ЕЭТП (roseltorg.ru)" },
    { value: "rts", label: "РТС (rts-tender.ru)" },
    { value: "etp-ets", label: "ЭТП НЭП (etp-ets.ru)" },
    { value: "sberbank-ast", label: "СБЕРБАНК-АСТ (sberbank-ast.ru)" },
    { value: "zakazrf", label: "АГЗ РТ (etp.zakazrf.ru)" },
    { value: "gazprom", label: "ГАЗПРОМ (etpgpb.ru)" },
    { value: "rad", label: "АО РАД" },
    { value: "tektorg", label: "ТЭК-Торг" },
    { value: "ats-goz", label: "АТС ГОЗ" },
    { value: "b2b-center", label: "B2BЦЕНТР (b2b-center.ru)" },
    { value: "otc", label: "ОСТЕНДЕР (otc.ru)" },
    { value: "fabrikant", label: "FABRIKANT.RU (fabrikant.ru)" },
    { value: "etprf", label: "ЭТП (etprf.ru)" },
    { value: "oborontorg", label: "Оборонторг (oborontorg.ru)" },
    { value: "sstorg", label: "Спецстройторг (sstorg.ru)" },
    { value: "avtodor", label: "Автодор (etp-avtodor.ru)" },
    { value: "estp", label: "ESTP (estp.ru)" },
]

const createEmptyEtpAccount = (): z.infer<typeof etpAccountSchema> => ({
    platform: "",
    account_number: "",
    bank_bik: "",
    bank_name: "",
    corr_account: "",
})

const createEmptyContactPerson = (): z.infer<typeof contactPersonSchema> => ({
    position: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    email: "",
    phone: "",
})

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EditClientSheet({ isOpen, clientId, onClose, onSaved, mode = 'edit' }: EditClientSheetProps) {
    const { client, isLoading, error: loadError } = useCRMClient(clientId)
    const { updateClient, isLoading: isSaving, error: saveError } = useCRMClientMutations()

    const isReadOnly = mode === 'view'

    // Initialize form with react-hook-form + zod
    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: {
            inn: "",
            kpp: "",
            ogrn: "",
            name: "",
            short_name: "",
            region: "",
            legal_address: "",
            legal_address_postal_code: "",
            actual_address: "",
            actual_address_postal_code: "",
            post_address: "",
            post_address_postal_code: "",
            is_actual_same_as_legal: false,
            is_post_same_as_legal: false,
            employee_count: 0,
            signatory_basis: "charter",
            is_mchd: false,
            mchd_full_name: "",
            mchd_inn: "",
            mchd_number: "",
            mchd_date: "",
            director_name: "",
            director_position: "",
            passport_series: "",
            passport_number: "",
            passport_date: "",
            passport_code: "",
            passport_issued_by: "",
            founders: [],
            bank_accounts: [],
            bank_name: "",
            bank_bic: "",
            bank_account: "",
            bank_corr_account: "",
            contact_person: "",
            contact_phone: "",
            contact_email: "",
            website: "",
        },
    })

    // useFieldArray for dynamic founders list
    const foundersArray = useFieldArray({
        control: form.control,
        name: "founders",
    })

    // useFieldArray for dynamic bank accounts
    const bankAccountsArray = useFieldArray({
        control: form.control,
        name: "bank_accounts",
    })

    // ТЗ Клиенты: useFieldArray for activities
    const activitiesArray = useFieldArray({
        control: form.control,
        name: "activities",
    })

    // ТЗ Клиенты: useFieldArray for licenses
    const licensesArray = useFieldArray({
        control: form.control,
        name: "licenses",
    })

    // ТЗ Клиенты: useFieldArray for ETP accounts
    const etpAccountsArray = useFieldArray({
        control: form.control,
        name: "etp_accounts",
    })

    // ТЗ Клиенты: useFieldArray for contact persons
    const contactPersonsArray = useFieldArray({
        control: form.control,
        name: "contact_persons",
    })

    // Watch address checkbox
    const isActualSameAsLegal = form.watch("is_actual_same_as_legal")
    const legalAddress = form.watch("legal_address")

    // Sync actual address when checkbox is checked
    useEffect(() => {
        if (isActualSameAsLegal) {
            form.setValue("actual_address", legalAddress)
        }
    }, [isActualSameAsLegal, legalAddress, form])

    // Load client data into form when available
    useEffect(() => {
        if (client) {
            // Map founders_data from backend to form format
            const mappedFounders: z.infer<typeof founderSchema>[] =
                (client.founders_data || []).map((f: FounderData) => ({
                    full_name: f.full_name || "",
                    inn: f.inn || "",
                    share_relative: f.share_relative || 0,
                    document: {
                        series: f.document?.series || "",
                        number: f.document?.number || "",
                        issued_at: f.document?.issued_at || "",
                        authority_name: f.document?.authority_name || "",
                        authority_code: f.document?.authority_code || "",
                    },
                    birth_place: f.birth_place || "",
                    birth_date: f.birth_date || "",
                    gender: f.gender || 1,
                    citizen: f.citizen || "РФ",
                }))

            // Map bank_accounts_data from backend
            const mappedBankAccounts: z.infer<typeof bankAccountSchema>[] =
                (client.bank_accounts_data || []).map((b: BankAccountData) => ({
                    bank_name: b.bank_name || "",
                    bank_bik: b.bank_bik || "",
                    account: b.account || "",
                }))

            form.reset({
                // Core Identity
                inn: safeString(client.inn),
                kpp: safeString(client.kpp),
                ogrn: safeString(client.ogrn),
                name: safeString(client.name),
                short_name: safeString(client.short_name),
                region: safeString(client.region),
                // Addresses with postal codes
                legal_address: safeString(client.legal_address),
                legal_address_postal_code: safeString(client.legal_address_postal_code),
                actual_address: safeString(client.actual_address),
                actual_address_postal_code: safeString(client.actual_address_postal_code),
                post_address: safeString(client.post_address),
                post_address_postal_code: safeString(client.post_address_postal_code),
                is_actual_same_as_legal: client.legal_address === client.actual_address && !!client.legal_address,
                is_post_same_as_legal: client.legal_address === client.post_address && !!client.legal_address,
                // Company details
                employee_count: client.employee_count ?? 0,
                // Signatory
                signatory_basis: (client.signatory_basis as "charter" | "power_of_attorney") || "charter",
                is_mchd: client.is_mchd ?? false,
                mchd_full_name: safeString(client.mchd_full_name),
                mchd_inn: safeString(client.mchd_inn),
                mchd_number: safeString(client.mchd_number),
                mchd_date: safeString(client.mchd_date),
                // Director + Passport
                director_name: safeString(client.director_name),
                director_position: safeString(client.director_position),
                passport_series: safeString(client.passport_series),
                passport_number: safeString(client.passport_number),
                passport_date: safeString(client.passport_date),
                passport_code: safeString(client.passport_code),
                passport_issued_by: safeString(client.passport_issued_by),
                // Dynamic arrays
                founders: mappedFounders,
                bank_accounts: mappedBankAccounts,
                activities: client.activities_data || [],
                licenses: client.licenses_data || [],
                etp_accounts: client.etp_accounts_data || [],
                contact_persons: client.contact_persons_data || [],
                // Legacy bank fields
                bank_name: safeString(client.bank_name),
                bank_bic: safeString(client.bank_bic),
                bank_account: safeString(client.bank_account),
                bank_corr_account: safeString(client.bank_corr_account),
                // Contact
                contact_person: safeString(client.contact_person),
                contact_phone: safeString(client.contact_phone),
                contact_email: safeString(client.contact_email),
                website: safeString(client.website),
            })
        }
    }, [client, form])

    // Reset form when sheet closes
    useEffect(() => {
        if (!isOpen) {
            form.reset()
        }
    }, [isOpen, form])

    // Open Checko.ru verification
    const openCheckoVerification = () => {
        const inn = form.getValues("inn")
        if (inn) {
            window.open(`https://checko.ru/company/${inn}`, "_blank")
        }
    }

    // Handle form submission
    const onSubmit = async (data: ClientFormData) => {
        if (!clientId || isReadOnly) return

        // Prepare actual_address based on checkbox
        const actualAddress = data.is_actual_same_as_legal
            ? data.legal_address
            : data.actual_address

        // Prepare founders_data for backend
        const foundersData: FounderData[] = data.founders.map(f => ({
            full_name: f.full_name,
            inn: f.inn,
            share_relative: f.share_relative,
            document: {
                series: f.document.series,
                number: f.document.number,
                issued_at: f.document.issued_at || "",
                authority_name: f.document.authority_name || "",
                authority_code: f.document.authority_code || "",
            },
            birth_place: f.birth_place || "",
            birth_date: f.birth_date || "",
            gender: (f.gender || 1) as 1 | 2,
            citizen: f.citizen || "РФ",
        }))

        // Prepare bank_accounts_data for backend
        const bankAccountsData: BankAccountData[] = data.bank_accounts.map(b => ({
            bank_name: b.bank_name,
            bank_bik: b.bank_bik,
            account: b.account,
        }))

        const payload = {
            inn: data.inn,
            kpp: data.kpp || undefined,
            ogrn: data.ogrn || undefined,
            name: data.name,
            short_name: data.short_name || undefined,
            region: data.region || undefined,
            legal_address: data.legal_address || undefined,
            actual_address: actualAddress || undefined,
            director_name: data.director_name || undefined,
            director_position: data.director_position || undefined,
            passport_series: data.passport_series || undefined,
            passport_number: data.passport_number || undefined,
            passport_date: data.passport_date || undefined,
            passport_code: data.passport_code || undefined,
            passport_issued_by: data.passport_issued_by || undefined,
            founders_data: foundersData.length > 0 ? foundersData : undefined,
            bank_accounts_data: bankAccountsData.length > 0 ? bankAccountsData : undefined,
            bank_name: data.bank_name || undefined,
            bank_bic: data.bank_bic || undefined,
            bank_account: data.bank_account || undefined,
            bank_corr_account: data.bank_corr_account || undefined,
            contact_person: data.contact_person || undefined,
            contact_phone: data.contact_phone || undefined,
            contact_email: data.contact_email || undefined,
            // Only send website if it's a valid URL (contains protocol) or is empty
            website: data.website && data.website.trim()
                ? (data.website.startsWith('http://') || data.website.startsWith('https://')
                    ? data.website
                    : `https://${data.website}`)
                : undefined,
        }

        const result = await updateClient(clientId, payload)

        if (result) {
            toast.success("Данные клиента сохранены")
            onSaved()
            onClose()
        } else {
            toast.error(saveError || "Ошибка сохранения данных")
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col h-full">
                {/* Fixed Header */}
                <SheetHeader className="px-6 py-4 border-b bg-background shrink-0">
                    <SheetTitle>
                        {isReadOnly ? "Карточка клиента" : "Редактирование клиента"}
                    </SheetTitle>
                    <SheetDescription>
                        {client?.name || client?.short_name || "Загрузка..."}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                            <p className="text-muted-foreground">Загрузка данных клиента...</p>
                        </div>
                    </div>
                ) : loadError ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-red-500">
                            <p>Ошибка загрузки: {loadError}</p>
                            <Button variant="outline" className="mt-4" onClick={onClose}>
                                Закрыть
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Scrollable Content Area with Tabs */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
                                    <Tabs defaultValue="identity" className="w-full">
                                        <div className="overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                                            <TabsList className="flex w-max md:w-full md:grid md:grid-cols-9 bg-muted/50 mb-2">
                                                <TabsTrigger value="identity" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Building2 className="h-3 w-3" />
                                                    <span>Орг-ция</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="addresses" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Адреса</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="management" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>Рук-во</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="signatory" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <FileSignature className="h-3 w-3" />
                                                    <span>Подпис.</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="founders" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>Учред.</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="banks" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Landmark className="h-3 w-3" />
                                                    <span>Банки</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="activities" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    <span>ОКВЭД</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="etp" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Globe className="h-3 w-3" />
                                                    <span>ЭТП</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="contacts" className="flex items-center gap-1 text-[10px] md:text-xs px-2 md:px-1">
                                                    <Contact className="h-3 w-3" />
                                                    <span>Контакты</span>
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        {/* TAB 1: CORE IDENTITY */}
                                        <TabsContent value="identity">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Общая информация</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        {/* INN */}
                                                        <FormField
                                                            control={form.control}
                                                            name="inn"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>ИНН *</FormLabel>
                                                                    <div className="flex gap-2">
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="10 или 12 цифр"
                                                                                maxLength={12}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                            />
                                                                        </FormControl>
                                                                        {field.value && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={openCheckoVerification}
                                                                                title="Проверить на Checko.ru"
                                                                            >
                                                                                <ExternalLink className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* KPP */}
                                                        <FormField
                                                            control={form.control}
                                                            name="kpp"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>КПП</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="9 цифр"
                                                                            maxLength={9}
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* OGRN */}
                                                        <FormField
                                                            control={form.control}
                                                            name="ogrn"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>ОГРН</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="13 или 15 цифр"
                                                                            maxLength={15}
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {/* Full Name */}
                                                        <FormField
                                                            control={form.control}
                                                            name="name"
                                                            render={({ field }) => (
                                                                <FormItem className="md:col-span-2">
                                                                    <FormLabel>Полное наименование *</FormLabel>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder="Общество с ограниченной ответственностью «Название»"
                                                                            className="min-h-[60px]"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Short Name */}
                                                        <FormField
                                                            control={form.control}
                                                            name="short_name"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Сокращённое наименование</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="ООО «Название»"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Region */}
                                                        <FormField
                                                            control={form.control}
                                                            name="region"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Регион</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Московская область"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Employee Count (WAVE 2: MSP requirement) */}
                                                        <FormField
                                                            control={form.control}
                                                            name="employee_count"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Численность сотрудников</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            placeholder="Количество"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Contact Person */}
                                                        <FormField
                                                            control={form.control}
                                                            name="contact_person"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Контактное лицо</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Иванов Иван Иванович"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Contact Phone */}
                                                        <FormField
                                                            control={form.control}
                                                            name="contact_phone"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Телефон</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="+7 (XXX) XXX-XX-XX"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Contact Email */}
                                                        <FormField
                                                            control={form.control}
                                                            name="contact_email"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Email</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="email"
                                                                            placeholder="info@company.ru"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        {/* Website */}
                                                        <FormField
                                                            control={form.control}
                                                            name="website"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Сайт</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="https://company.ru"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 2: ADDRESSES */}
                                        <TabsContent value="addresses">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Адреса</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Legal Address */}
                                                    <FormField
                                                        control={form.control}
                                                        name="legal_address"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Юридический адрес</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="123456, г. Москва, ул. Примерная, д. 1, офис 1"
                                                                        className="min-h-[80px]"
                                                                        disabled={isReadOnly}
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Checkbox */}
                                                    {!isReadOnly && (
                                                        <FormField
                                                            control={form.control}
                                                            name="is_actual_same_as_legal"
                                                            render={({ field }) => (
                                                                <FormItem className="flex items-center gap-3 rounded-lg border p-4">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value}
                                                                            onCheckedChange={field.onChange}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="!mt-0 cursor-pointer">
                                                                        Фактический адрес совпадает с юридическим
                                                                    </FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}

                                                    {/* Actual Address (hidden when checkbox checked) */}
                                                    {!isActualSameAsLegal && (
                                                        <FormField
                                                            control={form.control}
                                                            name="actual_address"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Фактический адрес</FormLabel>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder="123456, г. Москва, ул. Примерная, д. 2, офис 2"
                                                                            className="min-h-[80px]"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 3: MANAGEMENT (Director + Passport) */}
                                        <TabsContent value="management">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Руководитель компании</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="director_name"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>ФИО руководителя</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Иванов Иван Иванович"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="director_position"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Должность</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder="Генеральный директор"
                                                                            disabled={isReadOnly}
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Passport Section */}
                                                    <div className="border-t pt-4">
                                                        <h4 className="mb-4 font-medium text-foreground text-sm">
                                                            Паспортные данные руководителя
                                                        </h4>
                                                        <div className="grid gap-4 md:grid-cols-4">
                                                            <FormField
                                                                control={form.control}
                                                                name="passport_series"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Серия</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="0000"
                                                                                maxLength={4}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="passport_number"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Номер</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="000000"
                                                                                maxLength={6}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="passport_date"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Дата выдачи</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="date"
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="passport_code"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Код подразд.</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="000-000"
                                                                                maxLength={7}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="mt-4">
                                                            <FormField
                                                                control={form.control}
                                                                name="passport_issued_by"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Кем выдан</FormLabel>
                                                                        <FormControl>
                                                                            <Textarea
                                                                                placeholder="ОТДЕЛОМ УФМС РОССИИ ПО Г. МОСКВЕ"
                                                                                className="min-h-[60px]"
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 4: SIGNATORY (WAVE 2 - MCHD) */}
                                        <TabsContent value="signatory">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Подписант документов</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Signatory Basis Selection */}
                                                    <FormField
                                                        control={form.control}
                                                        name="signatory_basis"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Действует на основании *</FormLabel>
                                                                <Select
                                                                    value={field.value}
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value)
                                                                        form.setValue("is_mchd", value === "power_of_attorney")
                                                                    }}
                                                                    disabled={isReadOnly}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Выберите основание" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="charter">Устава</SelectItem>
                                                                        <SelectItem value="power_of_attorney">Доверенности</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* MCHD Fields - shown only when power_of_attorney selected */}
                                                    {form.watch("signatory_basis") === "power_of_attorney" && (
                                                        <div className="rounded-lg border border-[#3CE8D1]/30 bg-[#3CE8D1]/5 p-4 space-y-4">
                                                            <h4 className="text-sm font-medium text-[#3CE8D1]">Данные доверенности</h4>

                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                {/* MCHD Full Name */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name="mchd_full_name"
                                                                    render={({ field }) => (
                                                                        <FormItem className="md:col-span-2">
                                                                            <FormLabel>ФИО Подписанта *</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="Иванов Иван Иванович"
                                                                                    disabled={isReadOnly}
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {/* MCHD INN */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name="mchd_inn"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>ИНН Подписанта *</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="12 цифр"
                                                                                    maxLength={12}
                                                                                    disabled={isReadOnly}
                                                                                    {...field}
                                                                                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {/* MCHD Number */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name="mchd_number"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Номер доверенности *</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    placeholder="№123"
                                                                                    disabled={isReadOnly}
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />

                                                                {/* MCHD Date */}
                                                                <FormField
                                                                    control={form.control}
                                                                    name="mchd_date"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Дата доверенности *</FormLabel>
                                                                            <FormControl>
                                                                                <Input
                                                                                    type="date"
                                                                                    disabled={isReadOnly}
                                                                                    {...field}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 5: FOUNDERS (Dynamic Array) */}
                                        <TabsContent value="founders">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">Учредители (участники / акционеры)</CardTitle>
                                                    {!isReadOnly && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => foundersArray.append(createEmptyFounder())}
                                                            className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Добавить учредителя
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {foundersArray.fields.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                            <p>Учредители не добавлены</p>
                                                            <p className="text-sm">Нажмите «Добавить учредителя» для заполнения</p>
                                                        </div>
                                                    ) : (
                                                        foundersArray.fields.map((field, index) => (
                                                            <div
                                                                key={field.id}
                                                                className="rounded-lg border p-4 space-y-4"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <h5 className="font-medium">Учредитель #{index + 1}</h5>
                                                                    {!isReadOnly && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => foundersArray.remove(index)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    )}
                                                                </div>

                                                                {/* Basic Info */}
                                                                <div className="grid gap-4 md:grid-cols-3">
                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`founders.${index}.full_name`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>ФИО *</FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        placeholder="Иванов Иван Иванович"
                                                                                        disabled={isReadOnly}
                                                                                        {...field}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`founders.${index}.inn`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>ИНН</FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        placeholder="12 цифр"
                                                                                        maxLength={12}
                                                                                        disabled={isReadOnly}
                                                                                        {...field}
                                                                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />

                                                                    <FormField
                                                                        control={form.control}
                                                                        name={`founders.${index}.share_relative`}
                                                                        render={({ field }) => (
                                                                            <FormItem>
                                                                                <FormLabel>Доля (%)</FormLabel>
                                                                                <FormControl>
                                                                                    <Input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        placeholder="0-100"
                                                                                        disabled={isReadOnly}
                                                                                        {...field}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormMessage />
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                </div>

                                                                {/* Passport Document */}
                                                                <div className="border-t pt-4">
                                                                    <h6 className="text-sm font-medium text-muted-foreground mb-3">
                                                                        Паспортные данные
                                                                    </h6>
                                                                    <div className="grid gap-4 md:grid-cols-5">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.document.series`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Серия</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="00 00"
                                                                                            maxLength={5}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.document.number`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Номер</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="000000"
                                                                                            maxLength={6}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.document.issued_at`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Дата выдачи</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            type="date"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.document.authority_code`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Код подразд.</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="000-000"
                                                                                            maxLength={7}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.citizen`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Гражданство</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="РФ"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    <div className="mt-4">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.document.authority_name`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Кем выдан паспорт</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="Наименование подразделения"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Personal Details */}
                                                                <div className="border-t pt-4">
                                                                    <h6 className="text-sm font-medium text-muted-foreground mb-3">
                                                                        Личные данные
                                                                    </h6>
                                                                    <div className="grid gap-4 md:grid-cols-3">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.birth_date`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Дата рождения</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            type="date"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.birth_place`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Место рождения</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="г. Москва"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.gender`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Пол</FormLabel>
                                                                                    <Select
                                                                                        value={String(field.value || 1)}
                                                                                        onValueChange={(v) => field.onChange(Number(v))}
                                                                                        disabled={isReadOnly}
                                                                                    >
                                                                                        <FormControl>
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Выберите" />
                                                                                            </SelectTrigger>
                                                                                        </FormControl>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="1">Мужской</SelectItem>
                                                                                            <SelectItem value="2">Женский</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Addresses (WAVE 2: API Compliance) */}
                                                                <div className="border-t pt-4">
                                                                    <h6 className="text-sm font-medium text-muted-foreground mb-3">
                                                                        Адреса учредителя
                                                                    </h6>
                                                                    <div className="grid gap-4 md:grid-cols-2">
                                                                        {/* Legal Address */}
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.legal_address`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Адрес регистрации</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="Полный адрес регистрации"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.legal_address_postal_code`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Индекс (рег.)</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="000000"
                                                                                            maxLength={6}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        {/* Actual Address */}
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.actual_address`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Адрес проживания</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="Фактический адрес проживания"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`founders.${index}.actual_address_postal_code`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Индекс (прож.)</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="000000"
                                                                                            maxLength={6}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 5: BANK ACCOUNTS */}
                                        <TabsContent value="banks">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">Банковские реквизиты</CardTitle>
                                                    {!isReadOnly && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => bankAccountsArray.append(createEmptyBankAccount())}
                                                            className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Добавить счёт
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {/* Primary Bank Account (Legacy) */}
                                                    <div className="rounded-lg border p-4 bg-muted/30">
                                                        <h5 className="font-medium mb-4 text-sm">Основной счёт</h5>
                                                        <div className="grid gap-4 md:grid-cols-4">
                                                            <FormField
                                                                control={form.control}
                                                                name="bank_account"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Расчётный счёт</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="40702810000000000000"
                                                                                maxLength={20}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="bank_bic"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>БИК</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="044525000"
                                                                                maxLength={9}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="bank_name"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Банк</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="ПАО Сбербанк"
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />

                                                            <FormField
                                                                control={form.control}
                                                                name="bank_corr_account"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Корр. счёт</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                placeholder="30101810000000000000"
                                                                                maxLength={20}
                                                                                disabled={isReadOnly}
                                                                                {...field}
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Additional Bank Accounts */}
                                                    {bankAccountsArray.fields.length > 0 && (
                                                        <div className="space-y-4">
                                                            <h5 className="font-medium text-muted-foreground text-sm">
                                                                Дополнительные счета
                                                            </h5>
                                                            {bankAccountsArray.fields.map((field, index) => (
                                                                <div
                                                                    key={field.id}
                                                                    className="rounded-lg border p-4 flex items-start gap-4"
                                                                >
                                                                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`bank_accounts.${index}.account`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Расчётный счёт</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="40702810000000000000"
                                                                                            maxLength={20}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`bank_accounts.${index}.bank_bik`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>БИК</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="044525000"
                                                                                            maxLength={9}
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />

                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`bank_accounts.${index}.bank_name`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Банк</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input
                                                                                            placeholder="ПАО Сбербанк"
                                                                                            disabled={isReadOnly}
                                                                                            {...field}
                                                                                        />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    {!isReadOnly && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => bankAccountsArray.remove(index)}
                                                                            className="mt-7"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 7: ACTIVITIES & LICENSES (ТЗ Клиенты) */}
                                        <TabsContent value="activities">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">Деятельность и лицензии</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    {/* ОКВЕД Section */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-medium">Виды деятельности (ОКВЭД)</h4>
                                                            {!isReadOnly && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => activitiesArray.append(createEmptyActivity())}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Добавить
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {activitiesArray.fields.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground py-4">Виды деятельности не добавлены</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {activitiesArray.fields.map((field, index) => (
                                                                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                                                                        <div className="grid gap-3 flex-1 md:grid-cols-3">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`activities.${index}.okved_code`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Код ОКВЭД *</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="01.11" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`activities.${index}.okved_name`}
                                                                                render={({ field }) => (
                                                                                    <FormItem className="md:col-span-2">
                                                                                        <FormLabel>Наименование</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Выращивание зерновых культур" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                        {!isReadOnly && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => activitiesArray.remove(index)}
                                                                                className="mt-7"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Licenses Section */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-medium">Лицензии</h4>
                                                            {!isReadOnly && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => licensesArray.append(createEmptyLicense())}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-1" />
                                                                    Добавить
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {licensesArray.fields.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground py-4">Лицензии не добавлены</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {licensesArray.fields.map((field, index) => (
                                                                    <div key={field.id} className="flex items-start gap-2 p-3 border rounded-lg">
                                                                        <div className="grid gap-3 flex-1 md:grid-cols-2">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`licenses.${index}.license_type`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Тип лицензии *</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="СРО, ФСБ, и т.д." disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                        <FormMessage />
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`licenses.${index}.license_number`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Номер</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="№ лицензии" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`licenses.${index}.issue_date`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Дата выдачи</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input type="date" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`licenses.${index}.issuing_authority`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Орган выдачи</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Орган, выдавший лицензию" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                        {!isReadOnly && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => licensesArray.remove(index)}
                                                                                className="mt-7"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 8: ETP ACCOUNTS (ТЗ Клиенты - 16 platforms) */}
                                        <TabsContent value="etp">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">Реквизиты счетов ЭТП</CardTitle>
                                                    {!isReadOnly && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => etpAccountsArray.append(createEmptyEtpAccount())}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Добавить счёт
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardContent>
                                                    {etpAccountsArray.fields.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground py-4">Счета ЭТП не добавлены</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {etpAccountsArray.fields.map((field, index) => (
                                                                <div key={field.id} className="flex items-start gap-2 p-4 border rounded-lg bg-muted/20">
                                                                    <div className="grid gap-4 flex-1">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`etp_accounts.${index}.platform`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Площадка *</FormLabel>
                                                                                    <Select onValueChange={field.onChange} value={field.value} disabled={isReadOnly}>
                                                                                        <FormControl>
                                                                                            <SelectTrigger>
                                                                                                <SelectValue placeholder="Выберите площадку" />
                                                                                            </SelectTrigger>
                                                                                        </FormControl>
                                                                                        <SelectContent>
                                                                                            {ETP_PLATFORMS.map((platform) => (
                                                                                                <SelectItem key={platform.value} value={platform.value}>
                                                                                                    {platform.label}
                                                                                                </SelectItem>
                                                                                            ))}
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <div className="grid gap-3 md:grid-cols-2">
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`etp_accounts.${index}.account_number`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Расчетный счет (р/с)</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="20 цифр" maxLength={20} disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`etp_accounts.${index}.bank_bik`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>БИК</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="9 цифр" maxLength={9} disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`etp_accounts.${index}.bank_name`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Банк</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="Открыт в банке" disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                            <FormField
                                                                                control={form.control}
                                                                                name={`etp_accounts.${index}.corr_account`}
                                                                                render={({ field }) => (
                                                                                    <FormItem>
                                                                                        <FormLabel>Корр. счет (к/с)</FormLabel>
                                                                                        <FormControl>
                                                                                            <Input placeholder="20 цифр" maxLength={20} disabled={isReadOnly} {...field} />
                                                                                        </FormControl>
                                                                                    </FormItem>
                                                                                )}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    {!isReadOnly && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => etpAccountsArray.remove(index)}
                                                                            className="mt-7"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        {/* TAB 9: CONTACT PERSONS (ТЗ Клиенты) */}
                                        <TabsContent value="contacts">
                                            <Card>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <CardTitle className="text-base">Контактные лица</CardTitle>
                                                    {!isReadOnly && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => contactPersonsArray.append(createEmptyContactPerson())}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Добавить контакт
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardContent>
                                                    {contactPersonsArray.fields.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground py-4">Контактные лица не добавлены</p>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {contactPersonsArray.fields.map((field, index) => (
                                                                <div key={field.id} className="flex items-start gap-2 p-4 border rounded-lg">
                                                                    <div className="grid gap-3 flex-1 md:grid-cols-3">
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.position`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Должность</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input placeholder="Менеджер" disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.last_name`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Фамилия *</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.first_name`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Имя *</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.middle_name`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Отчество</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.email`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>E-mail</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input type="email" placeholder="email@example.com" disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                    <FormMessage />
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                        <FormField
                                                                            control={form.control}
                                                                            name={`contact_persons.${index}.phone`}
                                                                            render={({ field }) => (
                                                                                <FormItem>
                                                                                    <FormLabel>Телефон</FormLabel>
                                                                                    <FormControl>
                                                                                        <Input placeholder="+7 (999) 123-45-67" disabled={isReadOnly} {...field} />
                                                                                    </FormControl>
                                                                                </FormItem>
                                                                            )}
                                                                        />
                                                                    </div>
                                                                    {!isReadOnly && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => contactPersonsArray.remove(index)}
                                                                            className="mt-7"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </form>
                            </Form>
                        </div>

                        {/* Fixed Footer */}
                        <SheetFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2 shrink-0">
                            <Button variant="outline" onClick={onClose} disabled={isSaving}>
                                <X className="h-4 w-4 mr-2" />
                                {isReadOnly ? "Закрыть" : "Отмена"}
                            </Button>
                            {!isReadOnly && (
                                <Button
                                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Сохранение...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Сохранить
                                        </>
                                    )}
                                </Button>
                            )}
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}

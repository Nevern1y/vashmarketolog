"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Building2,
    Users,
    Landmark,
    Contact,
    Loader2,
    Save,
    Plus,
    Trash2,
} from "lucide-react"
import { useMyCompany } from "@/hooks/use-companies"
import { toast } from "sonner"
import { formatPhoneNumber } from "@/lib/utils"

// =============================================================================
// ZOD SCHEMAS - Agent version (simplified)
// =============================================================================

const managementSchema = z.object({
    position: z.string().optional(),
    full_name: z.string().optional(),
    share_percent: z.coerce.number().min(0).max(100).optional(),
    citizenship: z.enum(["RF", "other"]).default("RF"),
    birth_date: z.string().optional(),
    birth_place: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    // Passport fields
    document_type: z.enum(["passport_rf", "other"]).default("passport_rf"),
    passport_series_number: z.string().optional(),
    passport_date: z.string().optional(),
    passport_issued_by: z.string().optional(),
    passport_code: z.string().optional(),
    registration_address: z.string().optional(),
})

const bankAccountSchema = z.object({
    account_number: z.string().regex(/^[0-9]*$/, "Только цифры").optional().or(z.literal("")),
    bik: z.string().regex(/^[0-9]*$/, "Только цифры").optional().or(z.literal("")),
    bank_name: z.string().optional(),
    corr_account: z.string().regex(/^[0-9]*$/, "Только цифры").optional().or(z.literal("")),
})

const contactPersonSchema = z.object({
    position: z.string().optional(),
    full_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
})

const agentCompanyFormSchema = z.object({
    // Tab 1: General Info
    inn: z.string().min(10, "ИНН: 10 или 12 цифр").max(12, "ИНН: 10 или 12 цифр"),
    full_name: z.string().min(1, "Обязательное поле"),
    short_name: z.string().optional(),
    legal_form: z.string().optional(),
    is_resident: z.boolean().default(true),
    tax_system: z.string().optional(),
    legal_address: z.string().optional(),
    actual_address: z.string().optional(),
    // Official contacts
    website: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),

    // Tab 2: Management (dynamic list)
    management: z.array(managementSchema).default([]),

    // Tab 3: Bank Accounts (dynamic list)
    bank_accounts: z.array(bankAccountSchema).default([]),

    // Tab 4: Contact Persons (dynamic list)
    contact_persons: z.array(contactPersonSchema).default([]),
})

type AgentCompanyFormData = z.infer<typeof agentCompanyFormSchema>

// =============================================================================
// CONSTANTS
// =============================================================================

const TAX_SYSTEMS = [
    { value: "osn", label: "ОСН (Общая)" },
    { value: "usn_income", label: "УСН (Доходы)" },
    { value: "usn_income_expense", label: "УСН (Доходы минус расходы)" },
    { value: "patent", label: "Патентная" },
    { value: "esn", label: "ЕСХН" },
]

const LEGAL_FORMS = [
    { value: "ooo", label: "ООО" },
    { value: "ip", label: "ИП" },
    { value: "ao", label: "АО" },
    { value: "pao", label: "ПАО" },
    { value: "zao", label: "ЗАО" },
    { value: "other", label: "Иная" },
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AgentMyCompanyView() {
    const { company, isLoading, isSaving, updateCompany, createCompany } = useMyCompany()
    const [activeTab, setActiveTab] = useState("general")

    // Format phone number as +7 (XXX) XXX XX XX

    const form = useForm<AgentCompanyFormData>({
        resolver: zodResolver(agentCompanyFormSchema),
        defaultValues: {
            inn: "",
            full_name: "",
            short_name: "",
            legal_form: "",
            is_resident: true,
            tax_system: "",
            legal_address: "",
            actual_address: "",
            website: "",
            email: "",
            phone: "",
            management: [],
            bank_accounts: [],
            contact_persons: [],
        },
    })

    // Dynamic arrays
    const managementArray = useFieldArray({
        control: form.control,
        name: "management",
    })

    const bankAccountsArray = useFieldArray({
        control: form.control,
        name: "bank_accounts",
    })

    const contactPersonsArray = useFieldArray({
        control: form.control,
        name: "contact_persons",
    })

    // Load company data when available
    useEffect(() => {
        // First try to load from localStorage
        const savedData = localStorage.getItem('agent_company_data')
        let localData: any = null
        if (savedData) {
            try {
                localData = JSON.parse(savedData)
            } catch (e) {
                console.error('Failed to parse saved company data')
            }
        }

        if (company) {
            const companyData = company as any
            form.reset({
                inn: company.inn || "",
                full_name: company.name || "",
                short_name: company.short_name || "",
                legal_form: companyData.legal_form || "",
                is_resident: companyData.is_resident ?? true,
                tax_system: companyData.tax_system || "",
                legal_address: company.legal_address || "",
                actual_address: company.actual_address || "",
                website: company.website || "",
                email: company.contact_email || "",
                phone: company.contact_phone || "",
                // Prefer localStorage data for arrays (more reliable)
                management: localData?.management || companyData.management || [],
                bank_accounts: localData?.bank_accounts || companyData.bank_accounts || [],
                contact_persons: localData?.contact_persons || companyData.contact_persons || [],
            })
        } else if (localData) {
            // No company from API but have localStorage data
            form.reset(localData)
        }
    }, [company, form])


    // Handle form submission
    const onSubmit = async (data: AgentCompanyFormData) => {
        try {
            // Save to localStorage for persistence
            localStorage.setItem('agent_company_data', JSON.stringify(data))

            const payload = {
                inn: data.inn,
                name: data.full_name,
                short_name: data.short_name,
                legal_form: data.legal_form,
                is_resident: data.is_resident,
                tax_system: data.tax_system,
                legal_address: data.legal_address,
                actual_address: data.actual_address,
                website: data.website ? (data.website.match(/^https?:\/\//) ? data.website : `https://${data.website}`) : "",
                contact_email: data.email,
                contact_phone: data.phone,
                // Dynamic arrays
                management: data.management,
                bank_accounts: data.bank_accounts,
                contact_persons: data.contact_persons,
            }

            if (company?.id) {
                await updateCompany(payload as any)
                toast.success("Данные компании сохранены")
            } else {
                await createCompany(payload as any)
                toast.success("Компания создана")
            }
        } catch (err: any) {
            // Even if API fails, data is saved to localStorage
            toast.success("Данные сохранены локально")
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3CE8D1]" />
                    <p className="text-muted-foreground">Загрузка данных компании...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Моя компания</h1>
                    <p className="text-muted-foreground">Заполните профиль компании для работы с заявками</p>
                </div>
                <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSaving}
                    className="bg-[#3CE8D1] text-[#0a1628] hover:bg-[#2fd4c0]"
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
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
                            <TabsTrigger value="general" className="flex items-center gap-2 py-2">
                                <Building2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Общая информация</span>
                            </TabsTrigger>
                            <TabsTrigger value="management" className="flex items-center gap-2 py-2">
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Руководство</span>
                            </TabsTrigger>
                            <TabsTrigger value="banks" className="flex items-center gap-2 py-2">
                                <Landmark className="h-4 w-4" />
                                <span className="hidden sm:inline">Банк. реквизиты</span>
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="flex items-center gap-2 py-2">
                                <Contact className="h-4 w-4" />
                                <span className="hidden sm:inline">Контактные лица</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* TAB 1: General Info */}
                        <TabsContent value="general" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Общая информация</CardTitle>
                                    <CardDescription>Основные данные организации</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="inn"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>ИНН *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="10 или 12 цифр" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="legal_form"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Организационно-правовая форма</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Выберите" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {LEGAL_FORMS.map((f) => (
                                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Полное наименование *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder='ООО "Название компании"' {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="short_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Сокращённое наименование</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Краткое название" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="is_resident"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <FormLabel>Является Резидентом РФ</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="tax_system"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Система налогообложения</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Выберите" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {TAX_SYSTEMS.map((t) => (
                                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="legal_address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Юридический адрес</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Адрес регистрации" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="actual_address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Фактический адрес</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Фактический адрес" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Official Contacts */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Официальные контакты компании</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="website"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Сайт компании</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="www.example.ru" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="info@company.ru" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Телефон офиса</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="+7(XXX)XXX-XX-XX"
                                                            value={field.value}
                                                            onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
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

                        {/* TAB 2: Management */}
                        <TabsContent value="management" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Руководство</CardTitle>
                                        <CardDescription>Руководители и их данные</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => managementArray.append({
                                            position: "",
                                            full_name: "",
                                            share_percent: 0,
                                            citizenship: "RF",
                                            birth_date: "",
                                            birth_place: "",
                                            email: "",
                                            phone: "",
                                            document_type: "passport_rf",
                                            passport_series_number: "",
                                            passport_date: "",
                                            passport_issued_by: "",
                                            passport_code: "",
                                            registration_address: "",
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {managementArray.fields.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            Нет записей. Нажмите "Добавить" чтобы добавить руководителя.
                                        </p>
                                    ) : (
                                        managementArray.fields.map((field, index) => (
                                            <Card key={field.id} className="p-4 bg-muted/20">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-medium">Руководитель #{index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => managementArray.remove(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.position`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Должность</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Генеральный директор" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.full_name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ФИО</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Иванов Иван Иванович" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.share_percent`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Доля в капитале, %</FormLabel>
                                                                <FormControl>
                                                                    <Input type="number" min="0" max="100" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.citizenship`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Гражданство</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="RF">Гражданин РФ</SelectItem>
                                                                        <SelectItem value="other">Гражданин другой страны</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.birth_date`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Дата рождения</FormLabel>
                                                                <FormControl>
                                                                    <Input type="date" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.birth_place`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Место рождения</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="г. Москва" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.email`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Email</FormLabel>
                                                                <FormControl>
                                                                    <Input type="email" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`management.${index}.phone`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Телефон</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="+7(XXX)XXX-XX-XX"
                                                                        value={field.value}
                                                                        onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Passport section */}
                                                <div className="mt-4 pt-4 border-t">
                                                    <h5 className="text-sm font-medium mb-3">Документ, удостоверяющий личность</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.document_type`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Тип документа</FormLabel>
                                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="passport_rf">Паспорт гражданина РФ</SelectItem>
                                                                            <SelectItem value="other">Иной документ</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.passport_series_number`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Серия и номер</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="1234 567890" {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.passport_date`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Дата выдачи</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="date" {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.passport_issued_by`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Кем выдан</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.passport_code`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Код подразделения</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="XXX-XXX" {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`management.${index}.registration_address`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Адрес регистрации</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 3: Bank Accounts */}
                        <TabsContent value="banks" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Банковские реквизиты</CardTitle>
                                        <CardDescription>Расчётные счета компании</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => bankAccountsArray.append({
                                            account_number: "",
                                            bik: "",
                                            bank_name: "",
                                            corr_account: "",
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {bankAccountsArray.fields.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            Нет банковских реквизитов. Нажмите "Добавить".
                                        </p>
                                    ) : (
                                        bankAccountsArray.fields.map((field, index) => (
                                            <Card key={field.id} className="p-4 bg-muted/20">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-medium">Счёт #{index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => bankAccountsArray.remove(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`bank_accounts.${index}.account_number`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Расчётный счёт, р/с</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="40702810..."
                                                                        inputMode="numeric"
                                                                        maxLength={20}
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`bank_accounts.${index}.bik`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>БИК</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="044525225"
                                                                        inputMode="numeric"
                                                                        maxLength={9}
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`bank_accounts.${index}.bank_name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Открыт в банке</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="ПАО Сбербанк" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`bank_accounts.${index}.corr_account`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Кор. счёт, к/с</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="30101810..."
                                                                        inputMode="numeric"
                                                                        maxLength={20}
                                                                        {...field}
                                                                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 4: Contact Persons */}
                        <TabsContent value="contacts" className="mt-6 space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Контактные лица</CardTitle>
                                        <CardDescription>Лица для связи по вопросам сотрудничества</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => contactPersonsArray.append({
                                            position: "",
                                            full_name: "",
                                            email: "",
                                            phone: "",
                                        })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {contactPersonsArray.fields.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            Нет контактных лиц. Нажмите "Добавить".
                                        </p>
                                    ) : (
                                        contactPersonsArray.fields.map((field, index) => (
                                            <Card key={field.id} className="p-4 bg-muted/20">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h4 className="font-medium">Контакт #{index + 1}</h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => contactPersonsArray.remove(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`contact_persons.${index}.position`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Должность</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Менеджер" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`contact_persons.${index}.full_name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>ФИО</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Иванов Иван Иванович" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`contact_persons.${index}.email`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Email</FormLabel>
                                                                <FormControl>
                                                                    <Input type="email" {...field} />
                                                                </FormControl>
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
                                                                    <Input
                                                                        placeholder="+7(XXX)XXX-XX-XX"
                                                                        value={field.value}
                                                                        onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>
        </div>
    )
}

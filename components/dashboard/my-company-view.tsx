"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
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
  ExternalLink,
} from "lucide-react"
import { useMyCompany, type FounderData, type BankAccountData } from "@/hooks/use-companies"
import { useToast } from "@/hooks/use-toast"

// =============================================================================
// ZOD SCHEMA - Matches Postman API 1.1 Structure
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
})

const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "Обязательное поле"),
  bank_bik: z.string().length(9, "БИК должен быть 9 цифр"),
  account: z.string().length(20, "Счёт должен быть 20 цифр"),
})

const companyFormSchema = z.object({
  // Section 1: Core Identity
  inn: z.string().min(10, "ИНН: 10 или 12 цифр").max(12, "ИНН: 10 или 12 цифр"),
  kpp: z.string().max(9, "КПП: 9 цифр").optional().or(z.literal("")),
  ogrn: z.string().max(15, "ОГРН: 13 или 15 цифр").optional().or(z.literal("")),
  name: z.string().min(1, "Обязательное поле"),
  short_name: z.string().optional().or(z.literal("")),

  // Section 2: Addresses
  legal_address: z.string().optional().or(z.literal("")),
  actual_address: z.string().optional().or(z.literal("")),
  is_actual_same_as_legal: z.boolean().default(false),

  // Section 3: Director + Passport
  director_name: z.string().optional().or(z.literal("")),
  director_position: z.string().optional().or(z.literal("")),
  passport_series: z.string().max(4, "Максимум 4 цифры").optional().or(z.literal("")),
  passport_number: z.string().max(6, "Максимум 6 цифр").optional().or(z.literal("")),
  passport_date: z.string().optional().or(z.literal("")),
  passport_code: z.string().max(7, "Формат: XXX-XXX").optional().or(z.literal("")),
  passport_issued_by: z.string().optional().or(z.literal("")),

  // Section 4: Founders (Dynamic Array)
  founders: z.array(founderSchema).default([]),

  // Section 5: Bank Accounts (Dynamic Array)
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
  website: z.string().url("Некорректный URL").optional().or(z.literal("")),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const safeString = (value: string | null | undefined): string => value ?? ""

// Create empty founder object
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
})

// Create empty bank account
const createEmptyBankAccount = (): z.infer<typeof bankAccountSchema> => ({
  bank_name: "",
  bank_bik: "",
  account: "",
})

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MyCompanyView() {
  const { company, isLoading, isSaving, error, updateCompany, createCompany } = useMyCompany()
  const { toast } = useToast()

  // Initialize form with react-hook-form + zod
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      inn: "",
      kpp: "",
      ogrn: "",
      name: "",
      short_name: "",
      legal_address: "",
      actual_address: "",
      is_actual_same_as_legal: false,
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

  // Watch address checkbox
  const isActualSameAsLegal = form.watch("is_actual_same_as_legal")
  const legalAddress = form.watch("legal_address")

  // Sync actual address when checkbox is checked
  useEffect(() => {
    if (isActualSameAsLegal) {
      form.setValue("actual_address", legalAddress)
    }
  }, [isActualSameAsLegal, legalAddress, form])

  // Load company data into form when available
  useEffect(() => {
    if (company) {
      // Map founders_data from backend to form format
      const mappedFounders: z.infer<typeof founderSchema>[] =
        (company.founders_data || []).map((f: FounderData) => ({
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
        (company.bank_accounts_data || []).map((b: BankAccountData) => ({
          bank_name: b.bank_name || "",
          bank_bik: b.bank_bik || "",
          account: b.account || "",
        }))

      form.reset({
        inn: safeString(company.inn),
        kpp: safeString(company.kpp),
        ogrn: safeString(company.ogrn),
        name: safeString(company.name),
        short_name: safeString(company.short_name),
        legal_address: safeString(company.legal_address),
        actual_address: safeString(company.actual_address),
        is_actual_same_as_legal: company.legal_address === company.actual_address && !!company.legal_address,
        director_name: safeString(company.director_name),
        director_position: safeString(company.director_position),
        passport_series: safeString(company.passport_series),
        passport_number: safeString(company.passport_number),
        passport_date: safeString(company.passport_date),
        passport_code: safeString(company.passport_code),
        passport_issued_by: safeString(company.passport_issued_by),
        founders: mappedFounders,
        bank_accounts: mappedBankAccounts,
        bank_name: safeString(company.bank_name),
        bank_bic: safeString(company.bank_bic),
        bank_account: safeString(company.bank_account),
        bank_corr_account: safeString(company.bank_corr_account),
        contact_person: safeString(company.contact_person),
        contact_phone: safeString(company.contact_phone),
        contact_email: safeString(company.contact_email),
        website: safeString(company.website),
      })
    }
  }, [company, form])

  // Open Checko.ru verification
  const openCheckoVerification = () => {
    const inn = form.getValues("inn")
    if (inn) {
      window.open(`https://checko.ru/company/${inn}`, "_blank")
    }
  }

  // Handle form submission
  const onSubmit = async (data: CompanyFormData) => {
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
      website: data.website || undefined,
    }

    let result
    if (company) {
      result = await updateCompany(payload)
    } else {
      result = await createCompany(payload as Required<typeof payload>)
    }

    if (result) {
      toast({
        title: "Успешно",
        description: "Профиль компании сохранён",
      })
    } else {
      toast({
        title: "Ошибка",
        description: error || "Не удалось сохранить данные",
        variant: "destructive",
      })
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
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              <TabsTrigger value="identity" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden md:inline">Организация</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden md:inline">Адреса</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Руководство</span>
              </TabsTrigger>
              <TabsTrigger value="founders" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Учредители</span>
              </TabsTrigger>
              <TabsTrigger value="banks" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                <span className="hidden md:inline">Банки</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CORE IDENTITY */}
            <TabsContent value="identity">
              <Card>
                <CardHeader>
                  <CardTitle>Общая информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                              className="min-h-[80px]"
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
                            <Input placeholder="ООО «Название»" {...field} />
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
                            <Input type="email" placeholder="info@company.ru" {...field} />
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
                            <Input placeholder="+7 (XXX) XXX-XX-XX" {...field} />
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
                            <Input placeholder="https://company.ru" {...field} />
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
                  <CardTitle>Адреса</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Checkbox */}
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
                  <CardTitle>Руководитель компании</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="director_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ФИО руководителя</FormLabel>
                          <FormControl>
                            <Input placeholder="Иванов Иван Иванович" {...field} />
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
                            <Input placeholder="Генеральный директор" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Passport Section */}
                  <div className="border-t pt-6">
                    <h4 className="mb-4 font-medium text-foreground">
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
                              <Input type="date" {...field} />
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
                              <Input placeholder="000-000" maxLength={7} {...field} />
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

            {/* TAB 4: FOUNDERS (Dynamic Array) */}
            <TabsContent value="founders">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Учредители (участники / акционеры)</CardTitle>
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
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => foundersArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
                                  <Input placeholder="Иванов Иван Иванович" {...field} />
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
                                    <Input placeholder="00 00" maxLength={5} {...field} />
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
                                    <Input placeholder="000000" maxLength={6} {...field} />
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
                                    <Input type="date" {...field} />
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
                                    <Input placeholder="000-000" maxLength={7} {...field} />
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
                                    <Input placeholder="РФ" {...field} />
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
                                    <Input placeholder="Наименование подразделения" {...field} />
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
                                    <Input type="date" {...field} />
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
                                    <Input placeholder="г. Москва" {...field} />
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
                  <CardTitle>Банковские реквизиты</CardTitle>
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
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Bank Account (Legacy) */}
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h5 className="font-medium mb-4">Основной счёт</h5>
                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField
                        control={form.control}
                        name="bank_account"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Расчётный счёт</FormLabel>
                            <FormControl>
                              <Input placeholder="40702810000000000000" maxLength={20} {...field} />
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
                              <Input placeholder="044525000" maxLength={9} {...field} />
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
                              <Input placeholder="ПАО Сбербанк" {...field} />
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
                              <Input placeholder="30101810000000000000" maxLength={20} {...field} />
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
                      <h5 className="font-medium text-muted-foreground">
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
                                    <Input placeholder="ПАО Сбербанк" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => bankAccountsArray.remove(index)}
                            className="mt-7"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
  )
}

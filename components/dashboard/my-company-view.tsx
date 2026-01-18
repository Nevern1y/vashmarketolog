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
import { useAuth } from "@/lib/auth-context"
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
  Briefcase,
  Globe,
  UserPlus,
  FileText,
  ScrollText,
  Contact,
} from "lucide-react"
import {
  useMyCompany,
  Company,
  FounderData,
  BankAccountData,
  EtpAccountData,
  ContactPersonData,
  ActivityData,
  LegalFounderData,
  LeaderData
} from "@/hooks/use-companies"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

// =============================================================================
// ZOD SCHEMA - Extended for 8 Sections per ТЗ
// =============================================================================

// ----------- Section 3: Activities & Licenses -----------
const activitySchema = z.object({
  primary_okved: z.string().optional(),
  additional_okved: z.string().optional(),
  revenue_share: z.coerce.number().min(0).max(100).optional(),
  activity_years: z.coerce.number().min(0).optional(),
  license_number: z.string().optional(),
  license_date: z.string().optional(),
  license_issuer: z.string().optional(),
  license_valid_until: z.string().optional(),
})

const LATIN_REGEX = /^[\u0000-\u007F]*$/
const LATIN_ERROR = "Только латинские символы"

// ----------- Section 4: Management (Director & Additional) -----------
// All fields optional - user fills when ready
const founderDocumentSchema = z.object({
  series: z.string().max(5, "Максимум 5 символов").optional().or(z.literal("")),
  number: z.string().max(6, "Максимум 6 символов").optional().or(z.literal("")),
  issued_at: z.string().optional().or(z.literal("")),
  authority_name: z.string().optional().or(z.literal("")),
  authority_code: z.string().max(7, "Формат: XXX-XXX").optional().or(z.literal("")),
})

const leaderSchema = z.object({
  position: z.string().optional().default(""),
  full_name: z.string().optional().default(""),
  share_percent: z.coerce.number().min(0).max(100).optional(),
  citizenship: z.string().default("РФ"),
  birth_date: z.string().optional(),
  birth_place: z.string().optional(),
  email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
  phone: z.string().optional(),
  registration_address: z.string().optional(),
  passport: z.object({
    series: z.string().optional(),
    number: z.string().optional(),
    issued_date: z.string().optional(),
    issued_by: z.string().optional(),
    department_code: z.string().optional(),
    registration_address: z.string().optional(),
  }).optional(),
})

// ----------- Section 5: Individual Founders -----------
// All fields optional - user fills founders when ready
const founderSchema = z.object({
  full_name: z.string().optional().or(z.literal("")),
  inn: z.string().max(12, "Максимум 12 цифр").optional().or(z.literal("")),
  share_relative: z.coerce.number().min(0).max(100, "Доля 0-100%").optional(),
  document: founderDocumentSchema.optional(),
  birth_place: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.coerce.number().min(1).max(2).optional(),
  citizen: z.string().default("РФ"),
  registration_address: z.string().optional().or(z.literal("")),
  is_resident: z.boolean().default(true),
  actual_address: z.string().optional().or(z.literal("")),
})

// ----------- Section 5: Legal Entity Founders -----------
const legalFounderSchema = z.object({
  share_relative: z.coerce.number().min(0).max(100).optional(),
  inn: z.string().optional(),
  ogrn: z.string().optional(),
  name: z.string().optional(),
  registration_date: z.string().optional(),
  first_registration_date: z.string().optional(),
  is_resident: z.boolean().default(true),
  bank_name: z.string().optional(),
  website: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional(),
  email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional(),
  phone: z.string().optional(),
  director_position: z.string().optional(),
  director_name: z.string().optional(),
})

// ----------- Section 6: Bank Accounts -----------
// All fields optional - user fills bank details when ready
// Validation only triggers if user starts filling (non-empty values)
const bankAccountSchema = z.object({
  bank_name: z.string().optional().or(z.literal("")),
  bank_bik: z.string().max(9, "БИК должен быть максимум 9 цифр").optional().or(z.literal("")),
  account: z.string().max(20, "Счёт должен быть максимум 20 цифр").optional().or(z.literal("")),
  corr_account: z.string().optional().or(z.literal("")),
})

// ----------- Section 7: ETP Accounts -----------
const etpAccountSchema = z.object({
  platform: z.string().optional(),
  account: z.string().optional(),
  bik: z.string().optional(),
  bank_name: z.string().optional(),
  corr_account: z.string().optional(),
})

// ----------- Section 8: Contact Persons -----------
const contactPersonSchema = z.object({
  position: z.string().optional(),
  last_name: z.string().optional(),
  first_name: z.string().optional(),
  middle_name: z.string().optional(),

  email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional(),
  phone: z.string().optional(),
})

// ----------- Main Form Schema -----------
const companyFormSchema = z.object({
  // Section 1: General Information
  inn: z.string().min(10, "ИНН: 10 или 12 цифр").max(12, "ИНН: 10 или 12 цифр"),
  name: z.string().min(1, "Обязательное поле"),
  short_name: z.string().optional().or(z.literal("")),
  foreign_name: z.string().optional().or(z.literal("")),
  legal_form: z.string().optional().or(z.literal("")),
  is_resident: z.boolean().default(true),
  tax_system: z.string().optional().or(z.literal("")),
  employee_count: z.coerce.number().optional(),
  contracts_count: z.coerce.number().optional(),
  contracts_44fz: z.coerce.number().optional(),
  contracts_223fz: z.coerce.number().optional(),
  region: z.string().optional().or(z.literal("")),
  legal_address: z.string().optional().or(z.literal("")),
  actual_address: z.string().optional().or(z.literal("")),
  is_actual_same_as_legal: z.boolean().default(false),
  website: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
  contact_email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),

  // Section 2: State Registration
  kpp: z.string().max(9, "КПП: 9 цифр").optional().or(z.literal("")),
  ogrn: z.string().max(15, "ОГРН: 13 или 15 цифр").optional().or(z.literal("")),
  okato: z.string().optional().or(z.literal("")),
  oktmo: z.string().optional().or(z.literal("")),
  oktmo_date: z.string().optional().or(z.literal("")),
  okpo: z.string().optional().or(z.literal("")),
  okfs: z.string().optional().or(z.literal("")),
  registration_date: z.string().optional().or(z.literal("")),
  stated_capital: z.string().optional().or(z.literal("")),
  paid_capital: z.string().optional().or(z.literal("")),
  paid_capital_date: z.string().optional().or(z.literal("")),
  registrar_name: z.string().optional().or(z.literal("")),
  okved: z.string().optional().or(z.literal("")),

  // Section 3: Activities & Licenses
  activities: z.array(activitySchema).default([]),

  // Section 4: Management
  leadership: z.array(leaderSchema).default([]),
  director_name: z.string().optional().or(z.literal("")),
  director_position: z.string().optional().or(z.literal("")),
  director_share: z.coerce.number().optional(),
  director_citizen: z.string().default("РФ"),
  director_birth_date: z.string().optional().or(z.literal("")),
  director_birth_place: z.string().optional().or(z.literal("")),
  director_email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
  director_phone: z.string().optional().or(z.literal("")),
  passport_series: z.string().max(4, "Максимум 4 цифры").optional().or(z.literal("")),
  passport_number: z.string().max(6, "Максимум 6 цифр").optional().or(z.literal("")),
  passport_date: z.string().optional().or(z.literal("")),
  passport_code: z.string().max(7, "Формат: XXX-XXX").optional().or(z.literal("")),
  passport_issued_by: z.string().optional().or(z.literal("")),
  director_registration_address: z.string().optional().or(z.literal("")),

  // Section 5: Founders
  founders: z.array(founderSchema).default([]),
  legal_founders: z.array(legalFounderSchema).default([]),

  // Section 6: Bank Accounts
  bank_accounts: z.array(bankAccountSchema).default([]),
  bank_name: z.string().optional().or(z.literal("")),
  bank_bic: z.string().optional().or(z.literal("")),
  bank_account: z.string().optional().or(z.literal("")),
  bank_corr_account: z.string().optional().or(z.literal("")),

  // Section 7: ETP Accounts
  etp_accounts: z.array(etpAccountSchema).default([]),

  // Section 8: Contact Persons
  contact_persons: z.array(contactPersonSchema).default([]),
  contact_person: z.string().optional().or(z.literal("")),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const safeString = (value: string | null | undefined): string => value ?? ""

// Create empty leader
const createEmptyLeader = (): z.infer<typeof leaderSchema> => ({
  position: "",
  full_name: "",
  share_percent: 0,
  citizenship: "РФ",
  birth_date: "",
  birth_place: "",
  email: "",
  phone: "",
  registration_address: "",
  passport: { series: "", number: "", issued_date: "", issued_by: "", department_code: "", registration_address: "" },
})

// Create empty founder (physical person)
const createEmptyFounder = (): z.infer<typeof founderSchema> => ({
  full_name: "",
  inn: "",
  share_relative: 0,
  document: { series: "", number: "", issued_at: "", authority_name: "", authority_code: "" },
  birth_place: "",
  birth_date: "",
  gender: 1,
  citizen: "РФ",
  registration_address: "",
  is_resident: true,
  actual_address: "",
})

// Create empty legal entity founder
const createEmptyLegalFounder = (): z.infer<typeof legalFounderSchema> => ({
  share_relative: 0,
  inn: "",
  ogrn: "",
  name: "",
  registration_date: "",
  first_registration_date: "",
  is_resident: true,
  bank_name: "",
  website: "",
  email: "",
  phone: "",
  director_position: "",
  director_name: "",
})

// Create empty bank account
const createEmptyBankAccount = (): z.infer<typeof bankAccountSchema> => ({
  bank_name: "",
  bank_bik: "",
  account: "",
  corr_account: "",
})

// Create empty activity
const createEmptyActivity = (): z.infer<typeof activitySchema> => ({
  primary_okved: "",
  additional_okved: "",
  revenue_share: 0,
  activity_years: 0,
  license_number: "",
  license_date: "",
  license_issuer: "",
  license_valid_until: "",
})

// Create empty ETP account
const createEmptyEtpAccount = (): z.infer<typeof etpAccountSchema> => ({
  platform: "",
  account: "",
  bik: "",
  bank_name: "",
  corr_account: "",
})

// Create empty contact person
const createEmptyContactPerson = (): z.infer<typeof contactPersonSchema> => ({
  position: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  email: "",
  phone: "",
})

// ETP Platforms list
const ETP_PLATFORMS = [
  "ЕЭТП (roseltorg.ru)",
  "РТС (rts-tender.ru)",
  "ЭТП НЭП (etp-ets.ru)",
  "СБЕРБАНК-АСТ (sberbank-ast.ru)",
  "ГАЗПРОМ (etpgpb.ru)",
  "В2ВЦЕНТР (b2b-center.ru)",
  "ОТСТЕНДЕР (otc.ru)",
  "FABRIKANT.RU (fabrikant.ru)",
  "ЭТП (etprf.ru)",
  "Оборонторг (oborontorg.ru)",
  "Спецстройторг (sstorg.ru)",
  "Автодор (etp-avtodor.ru)",
  "ESTP (estp.ru)",
  "АГЗ РТ (etp.zakazrf.ru)",
  "АО РАД",
  "ТЭК-Торг",
  "АСТ ГОЗ",
  "Другая",
]

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function MyCompanyView() {
  const { user } = useAuth()
  const { company, isLoading, isSaving, error, updateCompany, createCompany } = useMyCompany()

  // Helper to clean decimal values - convert empty strings to undefined and validate format
  const cleanDecimalValue = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === "") return undefined
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, "")
    // Validate it's a valid number with max 13 digits before decimal
    const num = parseFloat(cleaned)
    if (isNaN(num)) return undefined
    // If number is too large (more than 13 digits before decimal), return undefined
    if (num >= 10000000000000) return undefined
    return cleaned
  }

  // Format phone number as +7 (XXX) XXX-XX-XX
  // Format phone number as +7 (XXX) XXX XX XX
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Allow empty
    if (!digits) return ""

    // Handle initial 7 or 8
    let processed = digits;
    if (digits.length === 1 && digits === '8') {
      processed = '7';
    } else if (digits.startsWith('8')) {
      processed = '7' + digits.slice(1);
    } else if (digits.length > 0 && !digits.startsWith('7')) {
      processed = '7' + digits; // enforce 7 prefix
    }

    // Limit to 11 digits
    const limited = processed.slice(0, 11);

    // Format
    // +7 (XXX) XXX XX XX
    if (limited.length === 0) return "";
    if (limited.length <= 1) return `+${limited}`;
    if (limited.length <= 4) return `+${limited.slice(0, 1)} (${limited.slice(1)}`;
    if (limited.length <= 7) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
    if (limited.length <= 9) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7)}`;
    return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7, 9)} ${limited.slice(9, 11)}`;
  }

  // Format number with thousand separators (supports decimals: 1000000.5 -> "1 000 000,5")
  const formatInputNumber = (value: number | string | undefined): string => {
    if (!value && value !== 0) return ""

    // Convert to string
    let str = typeof value === 'number' ? value.toString() : value

    // Remove all spaces for processing
    str = str.replace(/\s/g, '')

    // Split into integer and decimal parts
    const parts = str.split(/[.,]/)
    const integerPart = parts[0]
    const decimalPart = parts[1]

    // Format integer part with spaces
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    // Reassemble
    if (decimalPart !== undefined) {
      return `${formattedInteger},${decimalPart}`
    }

    // If user just typed comma/dot
    if (str.endsWith(',') || str.endsWith('.')) {
      return `${formattedInteger},`
    }

    return formattedInteger
  }

  // Parse formatted string back to number ("1 000 000,50" -> 1000000.5)
  const parseInputNumber = (value: string): number | undefined => {
    if (!value) return undefined

    // Allow only digits, spaces, comma and dot
    const sanitized = value.replace(/[^\d\s,.]/g, '')

    // Remove spaces and replace comma with dot
    const cleaned = sanitized.replace(/\s/g, '').replace(',', '.')

    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
  }

  // Initialize form with react-hook-form + zod
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      // Section 1: General Info
      inn: "", name: "", short_name: "", foreign_name: "", legal_form: "",
      is_resident: true, tax_system: "", employee_count: 0,
      contracts_count: 0, contracts_44fz: 0, contracts_223fz: 0,
      region: "", legal_address: "", actual_address: "", is_actual_same_as_legal: false,
      website: "", contact_email: "", contact_phone: "",
      // Section 2: State Registration
      kpp: "", ogrn: "", okato: "", oktmo: "", oktmo_date: "", okpo: "", okfs: "",
      registration_date: "", stated_capital: "", paid_capital: "", paid_capital_date: "",
      registrar_name: "", okved: "",
      // Section 3: Activities
      activities: [],
      // Section 4: Management
      leadership: [],
      director_name: "", director_position: "", director_share: 0, director_citizen: "РФ",
      director_birth_date: "", director_birth_place: "", director_email: "", director_phone: "",
      passport_series: "", passport_number: "", passport_date: "", passport_code: "",
      passport_issued_by: "", director_registration_address: "",
      // Section 5: Founders
      founders: [], legal_founders: [],
      // Section 6: Bank Accounts
      bank_accounts: [], bank_name: "", bank_bic: "", bank_account: "", bank_corr_account: "",
      // Section 7: ETP Accounts
      etp_accounts: [],
      // Section 8: Contact Persons
      contact_persons: [], contact_person: "",
    },
  })

  // useFieldArray for dynamic founders list
  const foundersArray = useFieldArray({ control: form.control, name: "founders" })
  const legalFoundersArray = useFieldArray({ control: form.control, name: "legal_founders" })
  const leadersArray = useFieldArray({ control: form.control, name: "leadership" })
  const bankAccountsArray = useFieldArray({ control: form.control, name: "bank_accounts" })
  const activitiesArray = useFieldArray({ control: form.control, name: "activities" })
  const etpAccountsArray = useFieldArray({ control: form.control, name: "etp_accounts" })
  const contactPersonsArray = useFieldArray({ control: form.control, name: "contact_persons" })

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
          registration_address: f.legal_address?.value || "", // Map legal_address.value back to registration_address
          is_resident: f.is_resident ?? true,
          actual_address: f.actual_address?.value || "",
        }))

      const mappedLegalFounders = (company.legal_founders_data || []).map((f: LegalFounderData) => ({
        ...createEmptyLegalFounder(),
        ...f
      }));

      const mappedLeadership = (company.leadership_data || []).map((l: LeaderData) => ({
        ...createEmptyLeader(),
        ...l
      }));

      // Map bank_accounts_data from backend
      const mappedBankAccounts: z.infer<typeof bankAccountSchema>[] =
        (company.bank_accounts_data || []).map((b: BankAccountData) => ({
          bank_name: b.bank_name || "",
          bank_bik: b.bank_bik || "",
          account: b.account || "",
        }))

      form.reset({
        // Section 1: General Info
        inn: safeString(company.inn),
        name: safeString(company.name),
        short_name: safeString(company.short_name),
        foreign_name: "", // Not in Company type, default to empty
        legal_form: "", // Not in Company type
        is_resident: true,
        tax_system: "", // Not in Company type
        employee_count: 0,
        contracts_count: 0,
        contracts_44fz: 0,
        contracts_223fz: 0,
        region: safeString(company.region),
        legal_address: safeString(company.legal_address),
        actual_address: safeString(company.actual_address),
        is_actual_same_as_legal: company.legal_address === company.actual_address && !!company.legal_address,
        website: safeString(company.website),
        contact_email: safeString(company.contact_email),
        contact_phone: safeString(company.contact_phone),
        // Section 2: State Registration
        kpp: safeString(company.kpp),
        ogrn: safeString(company.ogrn),
        okato: safeString(company.okato),
        oktmo: safeString(company.oktmo),
        oktmo_date: safeString(company.oktmo_date),
        okpo: safeString(company.okpo),
        okfs: safeString(company.okfs),
        registration_date: safeString(company.registration_date),
        stated_capital: safeString(company.authorized_capital_declared),
        paid_capital: safeString(company.authorized_capital_paid),
        paid_capital_date: safeString(company.authorized_capital_paid_date),
        registrar_name: safeString(company.registration_authority),
        okved: safeString(company.okved),
        // Section 3: Activities
        activities: (company as any).activities_data || [],
        // Section 4: Management
        leadership: mappedLeadership,
        director_name: safeString(company.director_name),
        director_position: safeString(company.director_position),
        director_share: 0,
        director_citizen: "РФ",
        director_birth_date: safeString(company.director_birth_date),
        director_birth_place: safeString(company.director_birth_place),
        director_email: safeString(company.director_email),
        director_phone: safeString(company.director_phone),
        passport_series: safeString(company.passport_series),
        passport_number: safeString(company.passport_number),
        passport_date: safeString(company.passport_date),
        passport_code: safeString(company.passport_code),
        passport_issued_by: safeString(company.passport_issued_by),
        director_registration_address: safeString(company.director_registration_address),
        // Section 5: Founders
        founders: mappedFounders,
        legal_founders: mappedLegalFounders,
        // Section 6: Bank Accounts
        bank_accounts: mappedBankAccounts,
        bank_name: safeString(company.bank_name),
        bank_bic: safeString(company.bank_bic),
        bank_account: safeString(company.bank_account),
        bank_corr_account: safeString(company.bank_corr_account),
        // Section 7: ETP Accounts
        etp_accounts: (company as any).etp_accounts_data || [],
        // Section 8: Contact Persons
        contact_persons: (company as any).contact_persons_data || [],
        contact_person: safeString(company.contact_person),
      }, { keepDirty: true })
    }
  }, [company, form])

  // Pre-fill from User if Company is null (New Registration)
  useEffect(() => {
    // Run if not loading, company is null (new profile), and user exists
    if (!isLoading && !company && user) {
      const currentValues = form.getValues()
      
      // Auto-fill Email
      if (!currentValues.contact_email && user.email) {
        form.setValue("contact_email", user.email, { shouldDirty: true })
      }
      
      // Auto-fill Phone
      if (!currentValues.contact_phone && user.phone) {
        form.setValue("contact_phone", formatPhoneNumber(user.phone), { shouldDirty: true })
      }
    }
  }, [isLoading, company, user, form])

  // Auto-expand empty form sections with one empty entry
  useEffect(() => {
    if (isLoading) return

    // Allow a small delay to ensure form state is ready
    const timer = setTimeout(() => {
      const values = form.getValues()

      // Add one empty entry to each dynamic section if empty
      // We check if the field array is empty to avoid duplicates
      if (activitiesArray.fields.length === 0) {
        activitiesArray.append(createEmptyActivity())
      }
      if (foundersArray.fields.length === 0) {
        foundersArray.append(createEmptyFounder())
      }
      if (bankAccountsArray.fields.length === 0) {
        bankAccountsArray.append(createEmptyBankAccount())
      }
      if (etpAccountsArray.fields.length === 0) {
        etpAccountsArray.append(createEmptyEtpAccount())
      }
      if (contactPersonsArray.fields.length === 0) {
        contactPersonsArray.append(createEmptyContactPerson())
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isLoading, company]) // Added company to dependency to re-check when company data loads


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

    // Prepare founders_data for backend - filter out empty entries
    const foundersData: FounderData[] = data.founders
      .filter(f => f.full_name && f.full_name.trim() !== "") // Only include founders with a name
      .map(f => ({
        full_name: f.full_name || "",
        inn: f.inn || "",
        share_relative: f.share_relative || 0,
        document: f.document ? {
          series: f.document.series || "",
          number: f.document.number || "",
          issued_at: f.document.issued_at || "",
          authority_name: f.document.authority_name || "",
          authority_code: f.document.authority_code || "",
        } : undefined,
        birth_place: f.birth_place || "",
        birth_date: f.birth_date || "",
        gender: (f.gender || 1) as 1 | 2,
        citizen: f.citizen || "РФ",
        is_resident: f.is_resident,
        legal_address: { value: f.registration_address || "", postal_code: "" },
        actual_address: f.actual_address ? { value: f.actual_address, postal_code: "" } : undefined,
      }))

    // Prepare leadership_data - filter out empty entries (without full_name)
    const leadershipData: LeaderData[] = data.leadership
      .filter(l => l.full_name && l.full_name.trim() !== "")
      .map(l => ({ ...l }))

    // Prepare legal_founders_data
    const legalFoundersData: LegalFounderData[] = data.legal_founders.map(l => ({
      ...l,
      website: l.website ? (l.website.match(/^https?:\/\//) ? l.website : `https://${l.website}`) : undefined
    }))

    // Prepare bank_accounts_data for backend - filter out empty entries
    const bankAccountsData: BankAccountData[] = data.bank_accounts
      .filter(b => b.bank_name && b.bank_name.trim() !== "") // Only include accounts with a bank name
      .map(b => ({
        bank_name: b.bank_name || "",
        bank_bik: b.bank_bik || "",
        account: b.account || "",
      }))

    const payload = {
      // Section 1: General Info
      inn: data.inn,
      name: data.name,
      short_name: data.short_name || undefined,
      legal_address: data.legal_address || undefined,
      actual_address: actualAddress || undefined,
      region: data.region || undefined,
      website: data.website ? (data.website.match(/^https?:\/\//) ? data.website : `https://${data.website}`) : undefined,
      contact_email: data.contact_email || undefined,
      contact_phone: data.contact_phone || undefined,
      // Section 2: State Registration
      kpp: data.kpp || undefined,
      ogrn: data.ogrn || undefined,
      okato: data.okato || undefined,
      oktmo: data.oktmo || undefined,
      oktmo_date: data.oktmo_date || undefined,
      okpo: data.okpo || undefined,
      okfs: data.okfs || undefined,
      registration_date: data.registration_date || undefined,
      authorized_capital_declared: cleanDecimalValue(data.stated_capital),
      authorized_capital_paid: cleanDecimalValue(data.paid_capital),
      authorized_capital_paid_date: data.paid_capital_date || undefined,
      registration_authority: data.registrar_name || undefined,
      okved: data.okved || undefined,
      // Section 4: Management / Director
      director_name: data.director_name ?? "",
      director_position: data.director_position ?? "",
      director_birth_date: data.director_birth_date ?? "",
      director_birth_place: data.director_birth_place ?? "",
      director_email: data.director_email ?? "",
      director_phone: data.director_phone ?? "",
      director_registration_address: data.director_registration_address ?? "",
      passport_series: data.passport_series ?? "",
      passport_number: data.passport_number ?? "",
      passport_date: data.passport_date ?? "",
      passport_code: data.passport_code ?? "",
      passport_issued_by: data.passport_issued_by ?? "",
      leadership_data: leadershipData.length > 0 ? leadershipData : undefined,
      // Section 3: Activities
      activities_data: data.activities.length > 0 ? data.activities : undefined,
      // Section 5: Founders
      founders_data: foundersData.length > 0 ? foundersData : undefined,
      legal_founders_data: legalFoundersData.length > 0 ? legalFoundersData : undefined,
      // Section 6: Bank Accounts
      bank_accounts_data: bankAccountsData.length > 0 ? bankAccountsData : undefined,
      bank_name: data.bank_name || undefined,
      bank_bic: data.bank_bic || undefined,
      bank_account: data.bank_account || undefined,
      bank_corr_account: data.bank_corr_account || undefined,
      // Section 7: ETP Accounts
      etp_accounts_data: data.etp_accounts.length > 0 ? data.etp_accounts : undefined,
      // Section 8: Contact Persons
      contact_persons_data: data.contact_persons.length > 0 ? data.contact_persons : undefined,
      contact_person: data.contact_person || undefined,
    }

    let result
    if (company) {
      result = await updateCompany(payload)
    } else {
      result = await createCompany(payload as Required<typeof payload>)
    }

    if (result) {
      toast.success("Данные успешно сохранены", {
        description: "Профиль компании обновлён",
      })
    } else {
      toast.error("Ошибка сохранения", {
        description: error || "Не удалось сохранить данные. Проверьте правильность заполнения полей.",
      })
    }
  }

  // Handle form validation errors - show toast notification
  // Handle form validation errors - show toast notification
  const onFormError = (errors: any) => {
    console.log("Form validation errors:", errors)

    // Map field names to tab names for better error reporting
    const fieldToTab: Record<string, string> = {
      inn: "Общая информация",
      name: "Общая информация",
      contact_email: "Общая информация",
      contact_phone: "Общая информация",
      kpp: "Госрегистрация",
      ogrn: "Госрегистрация",
      activities: "Деятельность",
      leadership: "Руководство",
      director_name: "Руководство",
      director_position: "Руководство",
      founders: "Учредители",
      legal_founders: "Учредители",
      bank_accounts: "Банк. реквизиты",
      etp_accounts: "Счета ЭТП",
      contact_persons: "Контакты"
    }

    const errorTabs = new Set<string>()
    const errorMessages: string[] = []

    const collectErrors = (obj: any, path: string = "") => {
      for (const key in obj) {
        if (obj[key]?.message) {
          // Found an error message
          errorMessages.push(obj[key].message)

          // Identify which tab this error belongs to
          // Check exact match or prefix
          const rootField = path ? path.split('.')[0] : key
          const tabName = fieldToTab[rootField] || fieldToTab[key]
          if (tabName) {
            errorTabs.add(tabName)
          }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          // Recurse
          const newPath = path ? `${path}.${key}` : key
          collectErrors(obj[key], newPath)
        }
      }
    }

    collectErrors(errors)

    // Format the error message
    const tabsList = Array.from(errorTabs).join(", ")
    const displayErrors = errorMessages.slice(0, 3).join("; ")
    const moreCount = errorMessages.length - 3

    toast.error("Ошибка валидации", {
      description: (
        <div className="flex flex-col gap-1">
          {tabsList && <span className="font-semibold">Проверьте вкладки: {tabsList}</span>}
          <span>{displayErrors}{moreCount > 0 ? ` и ещё ${moreCount}` : ""}</span>
        </div>
      ),
      duration: 5000,
    })
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
          onClick={form.handleSubmit(onSubmit, onFormError)}
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
        <form onSubmit={form.handleSubmit(onSubmit, onFormError)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
              <TabsTrigger value="general" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Общая информация</span>
              </TabsTrigger>
              <TabsTrigger value="registration" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <ScrollText className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Госрегистрация</span>
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Деятельность</span>
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Руководство</span>
              </TabsTrigger>
              <TabsTrigger value="founders" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Учредители</span>
              </TabsTrigger>
              <TabsTrigger value="banks" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Landmark className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Банк. реквизиты</span>
              </TabsTrigger>
              <TabsTrigger value="etp" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Счета ЭТП</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-1 text-xs px-2 py-1.5">
                <Contact className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Контакты</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GENERAL INFORMATION */}
            <TabsContent value="general">
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
                                {...field}
                                maxLength={12}
                                onChange={(e) => {
                                  // Force strict 12 char limit
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                                  e.target.value = value // Force update DOM element
                                  field.onChange(value) // Update react-hook-form
                                }}
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

                    {/* Official Contacts Header */}
                    <div className="md:col-span-2 mt-4 mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Официальные контакты компании</h4>
                      <div className="h-px bg-border mt-1" />
                    </div>

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
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z0-9@._-]/g, ""))}
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
                              placeholder="+7(XXX)XXX-XX-XX"
                              value={field.value}
                              onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
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
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/[^a-zA-Z0-9.:\/-]/g, ""))}
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

            {/* TAB 2: STATE REGISTRATION */}
            <TabsContent value="registration">
              <Card>
                <CardHeader>
                  <CardTitle>Госрегистрация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField control={form.control} name="kpp" render={({ field }) => (
                      <FormItem>
                        <FormLabel>КПП</FormLabel>
                        <FormControl><Input placeholder="9 цифр" maxLength={9} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ogrn" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОГРН</FormLabel>
                        <FormControl><Input placeholder="13 или 15 цифр" maxLength={15} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="okato" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОКАТО</FormLabel>
                        <FormControl><Input placeholder="Код ОКАТО" maxLength={11} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="oktmo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОКТМО</FormLabel>
                        <FormControl><Input placeholder="Код ОКТМО" maxLength={11} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="oktmo_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата постановки ОКТМО</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="okpo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОКПО</FormLabel>
                        <FormControl><Input placeholder="Код ОКПО" maxLength={10} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="okfs" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОКФС</FormLabel>
                        <FormControl><Input placeholder="Код ОКФС" maxLength={2} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="registration_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата гос. регистрации</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="okved" render={({ field }) => (
                      <FormItem>
                        <FormLabel>ОКВЭД (основной)</FormLabel>
                        <FormControl><Input placeholder="XX.XX.XX" maxLength={8} {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField control={form.control} name="stated_capital" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Объявленный УК</FormLabel>
                        <FormControl><Input placeholder="Сумма" {...field} value={formatInputNumber(field.value)} onChange={(e) => field.onChange(e.target.value.replace(/[^\d\s,.]/g, ''))} inputMode="decimal" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paid_capital" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Оплаченный УК</FormLabel>
                        <FormControl><Input placeholder="Сумма" {...field} value={formatInputNumber(field.value)} onChange={(e) => field.onChange(e.target.value.replace(/[^\d\s,.]/g, ''))} inputMode="decimal" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paid_capital_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата изменения УК</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="registrar_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Наименование регистрирующего органа</FormLabel>
                      <FormControl><Input placeholder="Название органа" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: ACTIVITIES & LICENSES */}
            <TabsContent value="activities">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Деятельность и лицензии</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => activitiesArray.append(createEmptyActivity())} className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]">
                    <Plus className="h-4 w-4 mr-2" />Добавить деятельность
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activitiesArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Деятельность не добавлена</p>
                    </div>
                  ) : (
                    activitiesArray.fields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Деятельность #{index + 1}</h5>
                          <Button type="button" variant="ghost" size="icon" onClick={() => activitiesArray.remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <FormField control={form.control} name={`activities.${index}.primary_okved`} render={({ field }) => (
                            <FormItem><FormLabel>Основной ОКВЭД</FormLabel><FormControl><Input placeholder="XX.XX" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.additional_okved`} render={({ field }) => (
                            <FormItem><FormLabel>Доп. ОКВЭД</FormLabel><FormControl><Input placeholder="через запятую" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.revenue_share`} render={({ field }) => (
                            <FormItem><FormLabel>Доля в выручке, %</FormLabel><FormControl><Input type="text" inputMode="decimal" min="0" max="100" {...field} value={formatInputNumber(field.value)} onChange={(e) => field.onChange(parseInputNumber(e.target.value))} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.activity_years`} render={({ field }) => (
                            <FormItem><FormLabel>Срок деятельности, лет</FormLabel><FormControl><Input type="text" inputMode="numeric" min="0" {...field} value={formatInputNumber(field.value)} onChange={(e) => field.onChange(parseInputNumber(e.target.value))} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-4">
                          <FormField control={form.control} name={`activities.${index}.license_number`} render={({ field }) => (
                            <FormItem><FormLabel>Номер лицензии</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.license_date`} render={({ field }) => (
                            <FormItem><FormLabel>Дата выдачи</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.license_issuer`} render={({ field }) => (
                            <FormItem><FormLabel>Кто выдал</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`activities.${index}.license_valid_until`} render={({ field }) => (
                            <FormItem><FormLabel>Действует до</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                    ))
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

                  <div className="grid gap-4 md:grid-cols-4 mt-4">
                    <FormField
                      control={form.control}
                      name="director_share"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Доля в капитале %</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              min="0"
                              max="100"
                              {...field}
                              value={formatInputNumber(field.value)}
                              onChange={(e) => field.onChange(parseInputNumber(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="director_citizen"
                      render={({ field }) => (
                        <FormItem><FormLabel>Гражданство</FormLabel><FormControl><Input placeholder="РФ" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="director_birth_date"
                      render={({ field }) => (
                        <FormItem><FormLabel>Дата рождения</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="director_birth_place"
                      render={({ field }) => (
                        <FormItem><FormLabel>Место рождения</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="director_email"
                      render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="director_phone"
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
                    <FormField
                      control={form.control}
                      name="director_registration_address"
                      render={({ field }) => (
                        <FormItem className="col-span-2"><FormLabel>Адрес регистрации</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
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

                  {/* Additional Managers */}
                  <div className="border-t pt-6">
                    <div className="flex flex-row items-center justify-between mb-4">
                      <h4 className="font-medium text-foreground">
                        Дополнительные руководители
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => leadersArray.append(createEmptyLeader())}
                        className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить руководителя
                      </Button>
                    </div>

                    {leadersArray.fields.length > 0 && (
                      <div className="space-y-4">
                        {leadersArray.fields.map((field, index) => (
                          <div key={field.id} className="rounded-lg border p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Руководитель #{index + 1}</h5>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => leadersArray.remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-4">
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.position`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>Должность</FormLabel><FormControl><Input placeholder="Зам. директора" {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.full_name`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>ФИО</FormLabel><FormControl><Input placeholder="Иванов И.И." {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.share_percent`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Доля в капитале %</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        min="0"
                                        max="100"
                                        {...field}
                                        value={formatInputNumber(field.value)}
                                        onChange={(e) => field.onChange(parseInputNumber(e.target.value))}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.citizenship`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>Гражданство</FormLabel><FormControl><Input placeholder="РФ" {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.birth_date`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>Дата рождения</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.birth_place`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>Место рождения</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.email`}
                                render={({ field }) => (
                                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.phone`}
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
                              <FormField
                                control={form.control}
                                name={`leadership.${index}.registration_address`}
                                render={({ field }) => (
                                  <FormItem className="col-span-2"><FormLabel>Адрес регистрации</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                                    {...field}
                                    maxLength={12}
                                    onChange={(e) => {
                                      // Force strict 12 char limit
                                      const value = e.target.value.replace(/\D/g, "").slice(0, 12)
                                      e.target.value = value
                                      field.onChange(value)
                                    }}
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
                                    type="text"
                                    inputMode="decimal"
                                    min="0"
                                    max="100"
                                    placeholder="0-100"
                                    {...field}
                                    value={formatInputNumber(field.value)}
                                    onChange={(e) => field.onChange(parseInputNumber(e.target.value))}
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

                            <FormField
                              control={form.control}
                              name={`founders.${index}.registration_address`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Адрес регистрации</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Адрес регистрации" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`founders.${index}.is_resident`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                  <div className="space-y-0.5">
                                    <FormLabel>Резидент РФ</FormLabel>
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

              {/* Legal Founders Section */}
              <Card className="mt-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Учредители (Юридические лица)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => legalFoundersArray.append(createEmptyLegalFounder())}
                    className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить юр. лицо
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {legalFoundersArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Юридические лица не добавлены</p>
                    </div>
                  ) : (
                    legalFoundersArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-lg border p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Юр. лицо #{index + 1}</h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => legalFoundersArray.remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.name`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Наименование</FormLabel><FormControl><Input placeholder="ООО Ромашка" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.inn`}
                            render={({ field }) => (
                              <FormItem><FormLabel>ИНН</FormLabel><FormControl><Input placeholder="10 цифр" maxLength={10} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.ogrn`}
                            render={({ field }) => (
                              <FormItem><FormLabel>ОГРН</FormLabel><FormControl><Input placeholder="13 цифр" maxLength={13} {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.share_relative`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Доля (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    min="0"
                                    max="100"
                                    {...field}
                                    value={formatInputNumber(field.value)}
                                    onChange={(e) => field.onChange(parseInputNumber(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.registration_date`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Дата регистрации</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.first_registration_date`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Дата перв. регистрации</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.bank_name`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Банк</FormLabel><FormControl><Input placeholder="Название банка" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.is_resident`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-[62px]">
                                <div className="space-y-0.5"><FormLabel>Резидент РФ</FormLabel></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="border-t pt-4 grid gap-4 md:grid-cols-4">
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.director_position`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Должность руководителя</FormLabel><FormControl><Input placeholder="Генеральный директор" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.director_name`}
                            render={({ field }) => (
                              <FormItem><FormLabel>ФИО руководителя</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.email`}
                            render={({ field }) => (
                              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`legal_founders.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Телефон</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+7(XXX)XXX-XX-XX"
                                    {...field}
                                    value={field.value}
                                    onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: BANK ACCOUNTS */}
            < TabsContent value="banks" >
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

            {/* TAB 7: ETP ACCOUNTS */}
            <TabsContent value="etp">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Реквизиты счетов ЭТП</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => etpAccountsArray.append(createEmptyEtpAccount())} className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]">
                    <Plus className="h-4 w-4 mr-2" />Добавить счёт ЭТП
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {etpAccountsArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Счета ЭТП не добавлены</p>
                    </div>
                  ) : (
                    etpAccountsArray.fields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Счёт ЭТП #{index + 1}</h5>
                          <Button type="button" variant="ghost" size="icon" onClick={() => etpAccountsArray.remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-5">
                          <FormField control={form.control} name={`etp_accounts.${index}.platform`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Площадка</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {ETP_PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`etp_accounts.${index}.account`} render={({ field }) => (
                            <FormItem><FormLabel>Расчётный счёт</FormLabel><FormControl><Input placeholder="40702810..." {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`etp_accounts.${index}.bik`} render={({ field }) => (
                            <FormItem><FormLabel>БИК</FormLabel><FormControl><Input placeholder="044525000" maxLength={9} {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`etp_accounts.${index}.bank_name`} render={({ field }) => (
                            <FormItem><FormLabel>Банк</FormLabel><FormControl><Input placeholder="Название банка" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`etp_accounts.${index}.corr_account`} render={({ field }) => (
                            <FormItem><FormLabel>Корр. счёт</FormLabel><FormControl><Input placeholder="30101810..." {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 8: CONTACT PERSONS */}
            <TabsContent value="contacts">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Контактные лица</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={() => contactPersonsArray.append(createEmptyContactPerson())} className="border-[#3CE8D1] text-[#3CE8D1] hover:bg-[#3CE8D1] hover:text-[#0a1628]">
                    <Plus className="h-4 w-4 mr-2" />Добавить контакт
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactPersonsArray.fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Contact className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Контактные лица не добавлены</p>
                    </div>
                  ) : (
                    contactPersonsArray.fields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Контакт #{String(index + 1).padStart(6, '0')}</h5>
                          <Button type="button" variant="ghost" size="icon" onClick={() => contactPersonsArray.remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-6">
                          <FormField control={form.control} name={`contact_persons.${index}.position`} render={({ field }) => (
                            <FormItem><FormLabel>Должность</FormLabel><FormControl><Input placeholder="Менеджер" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`contact_persons.${index}.last_name`} render={({ field }) => (
                            <FormItem><FormLabel>Фамилия</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`contact_persons.${index}.first_name`} render={({ field }) => (
                            <FormItem><FormLabel>Имя</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`contact_persons.${index}.middle_name`} render={({ field }) => (
                            <FormItem><FormLabel>Отчество</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`contact_persons.${index}.email`} render={({ field }) => (
                            <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name={`contact_persons.${index}.phone`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Телефон</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+7(XXX)XXX-XX-XX"
                                  {...field}
                                  value={field.value}
                                  onChange={e => field.onChange(formatPhoneNumber(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div >
  )
}

/**
 * Company Form Schemas - Shared Zod schemas for company data
 * 
 * Extracted from edit-client-sheet.tsx and my-company-view.tsx
 * to eliminate code duplication.
 */

import { z } from "zod"
import { LATIN_REGEX, LATIN_ERROR } from "./form-utils"

// =============================================================================
// FOUNDER SCHEMAS
// =============================================================================

export const founderDocumentSchema = z.object({
    series: z.string().max(5, "Максимум 5 символов").optional().or(z.literal("")),
    number: z.string().max(6, "Максимум 6 символов").optional().or(z.literal("")),
    issued_at: z.string().optional().or(z.literal("")),
    authority_name: z.string().optional().or(z.literal("")),
    authority_code: z.string().max(7, "Формат: XXX-XXX").optional().or(z.literal("")),
})

export const founderSchema = z.object({
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

export const legalFounderSchema = z.object({
    share_relative: z.coerce.number().min(0).max(100).optional(),
    inn: z.string().optional(),
    ogrn: z.string().optional(),
    name: z.string().optional(),
    registration_date: z.string().optional(),
    first_registration_date: z.string().optional(),
    is_resident: z.boolean().default(true),
    bank_name: z.string().optional(),
    website: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
    email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
    phone: z.string().optional(),
    director_position: z.string().optional(),
    director_name: z.string().optional(),
})

// =============================================================================
// LEADERSHIP SCHEMAS
// =============================================================================

export const leaderPassportSchema = z.object({
    series: z.string().optional(),
    number: z.string().optional(),
    issued_date: z.string().optional(),
    issued_by: z.string().optional(),
    department_code: z.string().optional(),
    registration_address: z.string().optional(),
})

export const leaderSchema = z.object({
    position: z.string().optional().default(""),
    full_name: z.string().optional().default(""),
    share_percent: z.coerce.number().min(0).max(100).optional(),
    citizenship: z.string().default("РФ"),
    birth_date: z.string().optional(),
    birth_place: z.string().optional(),
    email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
    phone: z.string().optional(),
    registration_address: z.string().optional(),
    passport: leaderPassportSchema.optional(),
})

// =============================================================================
// BANK ACCOUNT SCHEMAS
// =============================================================================

export const bankAccountSchema = z.object({
    bank_name: z.string().optional().or(z.literal("")),
    bank_bik: z.string().max(9, "БИК: 9 цифр").optional().or(z.literal("")),
    account: z.string().max(20, "Счёт: 20 цифр").optional().or(z.literal("")),
    corr_account: z.string().optional().or(z.literal("")),
})

// =============================================================================
// ACTIVITY & LICENSE SCHEMAS
// =============================================================================

export const activitySchema = z.object({
    primary_okved: z.string().optional(),
    additional_okved: z.string().optional(),
    revenue_share: z.coerce.number().min(0).max(100).optional(),
    activity_years: z.coerce.number().min(0).optional(),
    license_number: z.string().optional(),
    license_date: z.string().optional(),
    license_issuer: z.string().optional(),
    license_valid_until: z.string().optional(),
})

export const licenseSchema = z.object({
    license_type: z.string().min(1, "Тип лицензии"),
    license_number: z.string().optional(),
    issue_date: z.string().optional(),
    expiry_date: z.string().optional(),
    issuing_authority: z.string().optional(),
})

// =============================================================================
// ETP ACCOUNT SCHEMA
// =============================================================================

export const etpAccountSchema = z.object({
    platform: z.string().optional(),
    account_number: z.string().optional(),
    bank_bik: z.string().max(9, "БИК: 9 цифр").optional(),
    bank_name: z.string().optional(),
    corr_account: z.string().max(20, "К/С: 20 цифр").optional(),
    // Legacy fields for compatibility
    account: z.string().optional(),
    bik: z.string().optional(),
})

// =============================================================================
// CONTACT PERSON SCHEMA
// =============================================================================

export const contactPersonSchema = z.object({
    position: z.string().optional(),
    last_name: z.string().optional(),
    first_name: z.string().optional(),
    middle_name: z.string().optional(),
    email: z.string().regex(LATIN_REGEX, LATIN_ERROR).optional().or(z.literal("")),
    phone: z.string().optional(),
})

// =============================================================================
// EMPTY OBJECT CREATORS
// =============================================================================

export const createEmptyFounder = (): z.infer<typeof founderSchema> => ({
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
    registration_address: "",
    is_resident: true,
    actual_address: "",
})

export const createEmptyLegalFounder = (): z.infer<typeof legalFounderSchema> => ({
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

export const createEmptyLeader = (): z.infer<typeof leaderSchema> => ({
    position: "",
    full_name: "",
    share_percent: 0,
    citizenship: "РФ",
    birth_date: "",
    birth_place: "",
    email: "",
    phone: "",
    registration_address: "",
    passport: {
        series: "",
        number: "",
        issued_date: "",
        issued_by: "",
        department_code: "",
        registration_address: "",
    },
})

export const createEmptyBankAccount = (): z.infer<typeof bankAccountSchema> => ({
    bank_name: "",
    bank_bik: "",
    account: "",
    corr_account: "",
})

export const createEmptyActivity = (): z.infer<typeof activitySchema> => ({
    primary_okved: "",
    additional_okved: "",
    revenue_share: 0,
    activity_years: 0,
    license_number: "",
    license_date: "",
    license_issuer: "",
    license_valid_until: "",
})

export const createEmptyLicense = (): z.infer<typeof licenseSchema> => ({
    license_type: "",
    license_number: "",
    issue_date: "",
    expiry_date: "",
    issuing_authority: "",
})

export const createEmptyEtpAccount = (): z.infer<typeof etpAccountSchema> => ({
    platform: "",
    account_number: "",
    bank_bik: "",
    bank_name: "",
    corr_account: "",
})

export const createEmptyContactPerson = (): z.infer<typeof contactPersonSchema> => ({
    position: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    email: "",
    phone: "",
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FounderFormData = z.infer<typeof founderSchema>
export type LegalFounderFormData = z.infer<typeof legalFounderSchema>
export type LeaderFormData = z.infer<typeof leaderSchema>
export type BankAccountFormData = z.infer<typeof bankAccountSchema>
export type ActivityFormData = z.infer<typeof activitySchema>
export type LicenseFormData = z.infer<typeof licenseSchema>
export type EtpAccountFormData = z.infer<typeof etpAccountSchema>
export type ContactPersonFormData = z.infer<typeof contactPersonSchema>

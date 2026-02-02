"use client"

import { useState, useEffect, useCallback } from 'react'
import api, { type ApiError } from '@/lib/api'

// =============================================================================
// TYPES
// =============================================================================

export interface Bank {
    id: number
    name: string
    short_name: string
    logo_url: string
    is_active: boolean
    order: number
}

export interface BankCondition {
    id: number
    bank: number
    bank_name: string
    product: string
    sum_min: string | null
    sum_max: string | null
    term_months: number | null
    term_days: number | null
    rate_min: string | null
    rate_type: 'annual' | 'individual'
    service_commission: string | null
    service_commission_max: string | null
    additional_conditions: string
    is_active: boolean
    updated_at: string
}

export interface IndividualReviewCondition {
    id: number
    bank: number
    bank_name: string
    fz_type: string
    guarantee_type: 'all' | 'execution' | 'application' | 'execution_application'
    client_limit: string | null
    fz_application_limit: string | null
    commercial_application_limit: string | null
    corporate_dept_limit: string | null
    term: string
    bank_rate: string
    service_commission: string | null
    is_active: boolean
    updated_at: string
}

export interface RKOCondition {
    id: number
    bank: number
    bank_name: string
    description: string
    is_active: boolean
    order: number
}

export interface StopFactor {
    id: number
    description: string
    is_active: boolean
    order: number
}

export interface BankConditionsData {
    banks: Bank[]
    conditions: BankCondition[]
    individual_reviews: IndividualReviewCondition[]
    rko_conditions: RKOCondition[]
    stop_factors: StopFactor[]
}

// =============================================================================
// HOOK
// =============================================================================

export function useBankConditions() {
    const [data, setData] = useState<BankConditionsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Use aggregated endpoint for single request
            const response = await api.get<BankConditionsData>('/bank-conditions/all/')
            setData(response)
        } catch (err: any) {
            console.error('Error fetching bank conditions:', err)
            setError(err.message || 'Ошибка загрузки условий банков')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const refetch = useCallback(() => {
        fetchData()
    }, [fetchData])

    return {
        data,
        banks: data?.banks || [],
        conditions: data?.conditions || [],
        individualReviews: data?.individual_reviews || [],
        rkoConditions: data?.rko_conditions || [],
        stopFactors: data?.stop_factors || [],
        isLoading,
        error,
        refetch,
    }
}

// =============================================================================
// PARTNER BANK PROFILE HOOK
// =============================================================================

export interface PartnerBankProfile {
    id: number
    name: string
    short_name: string
    logo_url: string
    contact_email: string
    contact_phone: string
    description: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface PartnerBankProfileUpdate {
    short_name?: string
    logo_url?: string
    contact_email?: string
    contact_phone?: string
    description?: string
}

export function usePartnerBankProfile() {
    const [profile, setProfile] = useState<PartnerBankProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchProfile = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.get<PartnerBankProfile>('/bank-conditions/partner/profile/')
            setProfile(response)
        } catch (err) {
            const apiError = err as ApiError
            // 404 is expected when partner has no linked bank - don't log as error
            if (apiError.status === 404) {
                setProfile(null)
            } else {
                console.error('Error fetching partner bank profile:', err)
                setError(apiError.message || 'Ошибка загрузки профиля банка')
            }
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    const updateProfile = useCallback(async (data: PartnerBankProfileUpdate): Promise<PartnerBankProfile | null> => {
        setIsSaving(true)
        setError(null)

        try {
            const response = await api.patch<PartnerBankProfile>('/bank-conditions/partner/profile/', data)
            setProfile(response)
            return response
        } catch (err) {
            const apiError = err as ApiError
            console.error('Error updating partner bank profile:', err)
            setError(apiError.message || 'Ошибка сохранения профиля')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [])

    return {
        profile,
        isLoading,
        error,
        isSaving,
        refetch: fetchProfile,
        updateProfile,
    }
}

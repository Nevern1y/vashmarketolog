/**
 * Admin hook for managing bank conditions per bank.
 */
"use client"

import { useCallback, useEffect, useState } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface AdminBankCondition {
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

export interface AdminIndividualReviewCondition {
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

export interface AdminRKOCondition {
    id: number
    bank: number
    bank_name: string
    description: string
    is_active: boolean
    order: number
}

export function useAdminBankConditions(bankId: number | null) {
    const [bankConditions, setBankConditions] = useState<AdminBankCondition[]>([])
    const [individualReviews, setIndividualReviews] = useState<AdminIndividualReviewCondition[]>([])
    const [rkoConditions, setRkoConditions] = useState<AdminRKOCondition[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAll = useCallback(async () => {
        if (!bankId) {
            setBankConditions([])
            setIndividualReviews([])
            setRkoConditions([])
            return
        }
        setIsLoading(true)
        setError(null)
        try {
            const [conditions, reviews, rko] = await Promise.all([
                api.get<AdminBankCondition[]>(`/bank-conditions/admin/conditions/?bank=${bankId}`),
                api.get<AdminIndividualReviewCondition[]>(`/bank-conditions/admin/individual-reviews/?bank=${bankId}`),
                api.get<AdminRKOCondition[]>(`/bank-conditions/admin/rko/?bank=${bankId}`),
            ])
            setBankConditions(Array.isArray(conditions) ? conditions : [])
            setIndividualReviews(Array.isArray(reviews) ? reviews : [])
            setRkoConditions(Array.isArray(rko) ? rko : [])
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка загрузки условий')
        } finally {
            setIsLoading(false)
        }
    }, [bankId])

    useEffect(() => {
        fetchAll()
    }, [fetchAll])

    const createBankCondition = useCallback(async (payload: Partial<AdminBankCondition>): Promise<AdminBankCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminBankCondition>('/bank-conditions/admin/conditions/', payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка создания условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const updateBankCondition = useCallback(async (id: number, payload: Partial<AdminBankCondition>): Promise<AdminBankCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.patch<AdminBankCondition>(`/bank-conditions/admin/conditions/${id}/`, payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка обновления условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const deleteBankCondition = useCallback(async (id: number): Promise<boolean> => {
        setIsSaving(true)
        setError(null)
        try {
            await api.delete(`/bank-conditions/admin/conditions/${id}/`)
            await fetchAll()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка удаления условия')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const createIndividualReview = useCallback(async (payload: Partial<AdminIndividualReviewCondition>): Promise<AdminIndividualReviewCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminIndividualReviewCondition>('/bank-conditions/admin/individual-reviews/', payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка создания условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const updateIndividualReview = useCallback(async (id: number, payload: Partial<AdminIndividualReviewCondition>): Promise<AdminIndividualReviewCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.patch<AdminIndividualReviewCondition>(`/bank-conditions/admin/individual-reviews/${id}/`, payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка обновления условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const deleteIndividualReview = useCallback(async (id: number): Promise<boolean> => {
        setIsSaving(true)
        setError(null)
        try {
            await api.delete(`/bank-conditions/admin/individual-reviews/${id}/`)
            await fetchAll()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка удаления условия')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const createRkoCondition = useCallback(async (payload: Partial<AdminRKOCondition>): Promise<AdminRKOCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminRKOCondition>('/bank-conditions/admin/rko/', payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка создания условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const updateRkoCondition = useCallback(async (id: number, payload: Partial<AdminRKOCondition>): Promise<AdminRKOCondition | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.patch<AdminRKOCondition>(`/bank-conditions/admin/rko/${id}/`, payload)
            await fetchAll()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка обновления условия')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    const deleteRkoCondition = useCallback(async (id: number): Promise<boolean> => {
        setIsSaving(true)
        setError(null)
        try {
            await api.delete(`/bank-conditions/admin/rko/${id}/`)
            await fetchAll()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка удаления условия')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [fetchAll])

    return {
        bankConditions,
        individualReviews,
        rkoConditions,
        isLoading,
        isSaving,
        error,
        refetch: fetchAll,
        createBankCondition,
        updateBankCondition,
        deleteBankCondition,
        createIndividualReview,
        updateIndividualReview,
        deleteIndividualReview,
        createRkoCondition,
        updateRkoCondition,
        deleteRkoCondition,
        clearError: () => setError(null),
    }
}

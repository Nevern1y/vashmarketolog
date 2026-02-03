/**
 * Admin hook for managing banks and partner links.
 */
"use client"

import { useCallback, useEffect, useState } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface AdminBank {
    id: number
    name: string
    short_name: string
    logo_url: string
    is_active: boolean
    order: number
    contact_email: string
    contact_phone: string
    description: string
    partner_user_id: number | null
    partner_email: string | null
    partner_is_active: boolean | null
    partner_name: string | null
    created_at: string
    updated_at: string
}

export interface BankPayload {
    name: string
    short_name?: string
    logo_url?: string
    is_active?: boolean
    order?: number
    contact_email?: string
    contact_phone?: string
    description?: string
}

export interface PartnerInvitePayload {
    email: string
    first_name?: string
    last_name?: string
}

export interface PartnerLinkPayload {
    partner_user_id?: number
    email?: string
}

export interface PartnerInviteResponse {
    message: string
    email_sent: boolean | null
    email_error: string | null
    partner: {
        id: number
        email: string
        invite_token: string
    }
    invite_url: string
    full_invite_url: string
}

export function useAdminBanks() {
    const [banks, setBanks] = useState<AdminBank[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBanks = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.get<AdminBank[] | { results: AdminBank[] }>('/bank-conditions/admin/banks/')
            const list = Array.isArray(response) ? response : (response.results || [])
            setBanks(list)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка загрузки банков')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBanks()
    }, [fetchBanks])

    const createBank = useCallback(async (payload: BankPayload): Promise<AdminBank | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminBank>('/bank-conditions/admin/banks/', payload)
            await fetchBanks()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка создания банка')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    const updateBank = useCallback(async (id: number, payload: Partial<BankPayload>): Promise<AdminBank | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.patch<AdminBank>(`/bank-conditions/admin/banks/${id}/`, payload)
            await fetchBanks()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка обновления банка')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    const deleteBank = useCallback(async (id: number): Promise<boolean> => {
        setIsSaving(true)
        setError(null)
        try {
            await api.delete(`/bank-conditions/admin/banks/${id}/`)
            await fetchBanks()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка удаления банка')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    const invitePartner = useCallback(async (bankId: number, payload: PartnerInvitePayload): Promise<PartnerInviteResponse | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<PartnerInviteResponse>(`/bank-conditions/admin/banks/${bankId}/invite_partner/`, payload)
            await fetchBanks()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка создания приглашения')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    const getPartnerInvite = useCallback(async (bankId: number): Promise<PartnerInviteResponse | null> => {
        try {
            const response = await api.get<PartnerInviteResponse>(`/bank-conditions/admin/banks/${bankId}/partner_invite/`)
            return response
        } catch (err) {
            return null
        }
    }, [])

    const resendPartnerInvite = useCallback(async (bankId: number): Promise<PartnerInviteResponse | null> => {
        setIsSaving(true)
        try {
            const response = await api.post<PartnerInviteResponse>(`/bank-conditions/admin/banks/${bankId}/resend_partner_invite/`)
            return response
        } catch (err) {
            return null
        } finally {
            setIsSaving(false)
        }
    }, [])

    const linkPartner = useCallback(async (bankId: number, payload: PartnerLinkPayload): Promise<AdminBank | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminBank>(`/bank-conditions/admin/banks/${bankId}/link_partner/`, payload)
            await fetchBanks()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка привязки партнёра')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    const unlinkPartner = useCallback(async (bankId: number): Promise<AdminBank | null> => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.post<AdminBank>(`/bank-conditions/admin/banks/${bankId}/unlink_partner/`)
            await fetchBanks()
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка отвязки партнёра')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [fetchBanks])

    return {
        banks,
        isLoading,
        isSaving,
        error,
        refetch: fetchBanks,
        createBank,
        updateBank,
        deleteBank,
        invitePartner,
        getPartnerInvite,
        resendPartnerInvite,
        linkPartner,
        unlinkPartner,
        clearError: () => setError(null),
    }
}

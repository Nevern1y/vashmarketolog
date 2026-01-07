/**
 * API Hook for Admin CRM Clients Management
 */
"use client"

import { useState, useEffect, useCallback } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface AdminCRMClient {
    id: number
    inn: string
    kpp: string
    ogrn: string
    name: string
    short_name: string
    legal_address: string
    region: string
    director_name: string
    client_status: 'pending' | 'confirmed'
    client_status_display: string
    is_accredited: boolean
    invitation_email: string
    contact_person: string
    contact_phone: string
    contact_email: string
    agent_email: string
    agent_name: string
    has_duplicates: boolean
    created_at: string
    updated_at: string
}

interface DuplicateCheckResponse {
    has_duplicates: boolean
    duplicates: AdminCRMClient[]
    message?: string
}

export function useAdminCRMClients() {
    const [clients, setClients] = useState<AdminCRMClient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchClients = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.get<{ results: AdminCRMClient[] } | AdminCRMClient[]>('/companies/admin/crm/')
            // Handle both paginated and non-paginated responses
            const clientsArray = Array.isArray(response) ? response : (response.results || [])
            setClients(clientsArray)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка загрузки клиентов')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const confirmClient = useCallback(async (id: number): Promise<boolean> => {
        try {
            await api.post(`/companies/admin/crm/${id}/confirm/`)
            await fetchClients()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка закрепления клиента')
            return false
        }
    }, [fetchClients])

    const rejectClient = useCallback(async (id: number): Promise<boolean> => {
        try {
            await api.post(`/companies/admin/crm/${id}/reject/`)
            await fetchClients()
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка отклонения клиента')
            return false
        }
    }, [fetchClients])

    const checkDuplicates = useCallback(async (id: number): Promise<DuplicateCheckResponse | null> => {
        try {
            const response = await api.get<DuplicateCheckResponse>(`/companies/admin/crm/${id}/check_duplicates/`)
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка проверки дубликатов')
            return null
        }
    }, [])

    return {
        clients,
        isLoading,
        error,
        refetch: fetchClients,
        confirmClient,
        rejectClient,
        checkDuplicates,
        clearError: () => setError(null),
    }
}

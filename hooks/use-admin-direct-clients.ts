/**
 * API Hook for Admin Direct Clients View
 * Direct clients are those who registered without an agent (is_crm_client=False)
 */
"use client"

import { useState, useEffect, useCallback } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface AdminDirectClient {
    id: number
    inn: string
    kpp: string
    ogrn: string
    name: string
    short_name: string
    legal_address: string
    region: string
    director_name: string
    is_accredited: boolean
    contact_person: string
    contact_phone: string
    contact_email: string
    // Owner info (the client themselves)
    owner_email: string
    owner_name: string
    // Applications
    applications_count: number
    created_at: string
    updated_at: string
}

export function useAdminDirectClients() {
    const [clients, setClients] = useState<AdminDirectClient[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchClients = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await api.get<{ results: AdminDirectClient[] } | AdminDirectClient[]>('/companies/admin/direct/')
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

    return {
        clients,
        isLoading,
        error,
        refetch: fetchClients,
        clearError: () => setError(null),
    }
}

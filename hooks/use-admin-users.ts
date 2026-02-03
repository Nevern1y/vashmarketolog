/**
 * Admin hook for user management (block/update/delete).
 */
"use client"

import { useCallback, useEffect, useState } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface AdminUserUpdatePayload {
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
    is_active?: boolean
}

export interface AdminUser {
    id: number
    email: string
    phone?: string
    first_name?: string
    last_name?: string
    role: string
    is_active: boolean
    date_joined?: string
}

interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export function getAdminDisplayName(admin: Partial<AdminUser> | null | undefined) {
    if (!admin) return 'Администратор'
    const firstName = admin.first_name || ''
    const lastName = admin.last_name || ''
    const fullName = `${lastName} ${firstName}`.trim()
    return fullName || admin.email || 'Администратор'
}

export function useAdminUsers() {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [listError, setListError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchAdmins = useCallback(async () => {
        setIsLoading(true)
        setListError(null)

        try {
            const response = await api.get<PaginatedResponse<AdminUser> | AdminUser[]>(
                '/auth/admin/users/',
                { role: 'admin' }
            )

            if (Array.isArray(response)) {
                setAdmins(response)
            } else if (response && 'results' in response) {
                setAdmins(response.results)
            } else {
                setAdmins([])
            }
        } catch (err) {
            const apiError = err as ApiError
            setListError(apiError.message || 'Ошибка загрузки администраторов')
        } finally {
            setIsLoading(false)
        }
    }, [])

    const updateUser = useCallback(async (id: number, payload: AdminUserUpdatePayload) => {
        setIsSaving(true)
        setError(null)
        try {
            const response = await api.patch(`/auth/admin/users/${id}/`, payload)
            return response
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка обновления пользователя')
            return null
        } finally {
            setIsSaving(false)
        }
    }, [])

    const deleteUser = useCallback(async (id: number) => {
        setIsSaving(true)
        setError(null)
        try {
            await api.delete(`/auth/admin/users/${id}/`)
            return true
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка удаления пользователя')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [])

    const blockUser = useCallback(async (id: number) => {
        return updateUser(id, { is_active: false })
    }, [updateUser])

    const unblockUser = useCallback(async (id: number) => {
        return updateUser(id, { is_active: true })
    }, [updateUser])

    useEffect(() => {
        fetchAdmins()
    }, [fetchAdmins])

    return {
        admins,
        isLoading,
        listError,
        refetch: fetchAdmins,
        updateUser,
        deleteUser,
        blockUser,
        unblockUser,
        isSaving,
        error,
        clearError: () => setError(null),
        clearListError: () => setListError(null),
    }
}

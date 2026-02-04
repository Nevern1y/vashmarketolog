"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import api, { type ApiError } from '@/lib/api'

export interface NotificationSettings {
    email_enabled: boolean
    email_new_applications: boolean
    email_status_changes: boolean
    email_chat_messages: boolean
    email_marketing: boolean
    updated_at: string
}

export function useNotificationSettings() {
    const [settings, setSettings] = useState<NotificationSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const isMounted = useRef(true)

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await api.get<NotificationSettings>('/notifications/settings/')
            if (isMounted.current) {
                setSettings(response)
            }
        } catch (err) {
            const apiError = err as ApiError
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка загрузки настроек уведомлений')
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false)
            }
        }
    }, [])

    const updateSettings = useCallback(async (
        data: Partial<
            Pick<
                NotificationSettings,
                | 'email_enabled'
                | 'email_new_applications'
                | 'email_status_changes'
                | 'email_chat_messages'
                | 'email_marketing'
            >
        >
    ): Promise<NotificationSettings | null> => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await api.put<NotificationSettings>('/notifications/settings/', data)
            if (isMounted.current) {
                setSettings(response)
            }
            return response
        } catch (err) {
            const apiError = err as ApiError
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка сохранения настроек уведомлений')
            }
            return null
        } finally {
            if (isMounted.current) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        isMounted.current = true
        fetchSettings()
        return () => {
            isMounted.current = false
        }
    }, [fetchSettings])

    return { settings, isLoading, error, refetch: fetchSettings, updateSettings }
}

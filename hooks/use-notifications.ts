/**
 * Notifications Hook
 *
 * Fetches and manages notifications from multiple sources:
 * 1. Partner decisions on applications
 * 2. Application status changes
 * 3. Document status changes
 * 4. Chat messages
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import api, { type ApiError } from '@/lib/api'

// Notification types
export type NotificationType =
    | 'decision_approved'
    | 'decision_rejected'
    | 'decision_info_requested'
    | 'status_change'
    | 'document_verified'
    | 'document_rejected'
    | 'chat_message'

export interface PartnerDecision {
    id: number
    application: number
    application_id: number
    application_company_name: string
    application_company_inn: string
    application_product_type: string
    application_product_type_display: string
    application_amount: string
    application_term_months: number
    application_status: string
    application_status_display: string
    partner: number
    partner_email: string
    partner_name: string
    decision: 'approved' | 'rejected' | 'info_requested'
    decision_display: string
    comment: string
    offered_rate: string | null
    offered_amount: string | null
    created_at: string
}

export interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    details: {
        applicationId?: number
        companyName?: string
        productType?: string
        amount?: string
        offeredRate?: string
        offeredAmount?: string
        partnerName?: string
        comment?: string
        documentId?: number
        documentName?: string
    }
    createdAt: string
    isRead: boolean
}

interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

const READ_NOTIFICATIONS_KEY = 'read_notifications'
const POLLING_INTERVAL = 30000 // 30 seconds

// Get read notification IDs from localStorage
function getReadNotificationIds(): Set<string> {
    if (typeof window === 'undefined') return new Set()
    try {
        const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
        if (stored) {
            return new Set(JSON.parse(stored))
        }
    } catch {
        // Ignore errors
    }
    return new Set()
}

// Save read notification IDs to localStorage
function saveReadNotificationIds(ids: Set<string>) {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]))
    } catch {
        // Ignore errors
    }
}

// Transform partner decision to notification
function decisionToNotification(decision: PartnerDecision, readIds: Set<string>): Notification {
    const id = `decision_${decision.id}`

    let type: NotificationType
    let title: string
    let message: string

    switch (decision.decision) {
        case 'approved':
            type = 'decision_approved'
            title = '✅ Заявка одобрена'
            message = decision.offered_rate
                ? `Ставка: ${decision.offered_rate}%`
                : 'Без указания ставки'
            break
        case 'rejected':
            type = 'decision_rejected'
            title = '❌ Заявка отклонена'
            message = decision.comment || 'Причина не указана'
            break
        case 'info_requested':
            type = 'decision_info_requested'
            title = 'ℹ️ Запрошена информация'
            message = decision.comment || 'Требуется дополнительная информация'
            break
        default:
            type = 'status_change'
            title = 'Изменение статуса'
            message = decision.decision_display
    }

    return {
        id,
        type,
        title,
        message,
        details: {
            applicationId: decision.application_id,
            companyName: decision.application_company_name,
            productType: decision.application_product_type_display,
            amount: decision.application_amount,
            offeredRate: decision.offered_rate || undefined,
            offeredAmount: decision.offered_amount || undefined,
            partnerName: decision.partner_name || decision.partner_email,
            comment: decision.comment || undefined,
        },
        createdAt: decision.created_at,
        isRead: readIds.has(id),
    }
}

// Format amount as currency
export function formatCurrency(amount: string | number): string {
    try {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(num)
    } catch {
        return String(amount)
    }
}

// Format relative time
export function formatRelativeTime(dateStr: string): string {
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'только что'
        if (diffMins < 60) return `${diffMins} мин. назад`
        if (diffHours < 24) return `${diffHours} ч. назад`
        if (diffDays < 7) return `${diffDays} дн. назад`

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    } catch {
        return dateStr
    }
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [readIds, setReadIds] = useState<Set<string>>(new Set())

    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch all notifications
    const fetchNotifications = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setIsLoading(true)
        }
        setError(null)

        try {
            // Fetch partner decisions
            const decisionsRes = await api.get<PaginatedResponse<PartnerDecision>>('/applications/decisions/')

            const currentReadIds = getReadNotificationIds()
            setReadIds(currentReadIds)

            // Transform decisions to notifications
            const decisionNotifications = decisionsRes.results.map((d) =>
                decisionToNotification(d, currentReadIds)
            )

            // Sort by date (newest first)
            const allNotifications = [...decisionNotifications].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            setNotifications(allNotifications)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка загрузки уведомлений')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Mark notification as read
    const markAsRead = useCallback((notificationId: string) => {
        setReadIds((prev) => {
            const newIds = new Set(prev)
            newIds.add(notificationId)
            saveReadNotificationIds(newIds)
            return newIds
        })

        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        )
    }, [])

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setNotifications((prev) => {
            const newReadIds = new Set(readIds)
            prev.forEach((n) => newReadIds.add(n.id))
            saveReadNotificationIds(newReadIds)
            setReadIds(newReadIds)
            return prev.map((n) => ({ ...n, isRead: true }))
        })
    }, [readIds])

    // Get unread count
    const unreadCount = notifications.filter((n) => !n.isRead).length

    // Start polling
    const startPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
        }
        pollingRef.current = setInterval(() => {
            fetchNotifications(false)
        }, POLLING_INTERVAL)
    }, [fetchNotifications])

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
    }, [])

    // Initialize
    useEffect(() => {
        fetchNotifications(true)
        startPolling()

        return () => {
            stopPolling()
        }
    }, [fetchNotifications, startPolling, stopPolling])

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        refetch: () => fetchNotifications(true),
    }
}

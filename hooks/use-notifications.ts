/**
 * Notifications Hook
 *
 * Fetches and manages notifications from unified backend API:
 * 1. Partner decisions on applications
 * 2. Application status changes
 * 3. Document status changes (verified/rejected)
 * 4. Document requests
 * 5. Chat messages
 * 6. New applications (for partners)
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import api, { type ApiError } from '@/lib/api'

// Notification types - matches backend NotificationType
export type NotificationType =
    | 'decision_approved'
    | 'decision_rejected'
    | 'decision_info_requested'
    | 'status_change'
    | 'document_verified'
    | 'document_rejected'
    | 'document_requested'
    | 'chat_message'
    | 'new_application'
    | 'admin_new_application'
    | 'admin_new_lead'
    | 'admin_new_agent'
    | 'admin_new_partner'
    | 'admin_application_sent'

// API response interface - matches backend serializer
export interface NotificationResponse {
    id: number
    type: NotificationType
    type_display: string
    title: string
    message: string
    data: {
        application_id?: number
        company_name?: string
        product_type?: string
        product_type_display?: string
        amount?: string
        offered_rate?: string
        offered_amount?: string
        partner_name?: string
        comment?: string
        document_id?: number
        document_name?: string
        request_id?: number
        document_type_name?: string
        requester_name?: string
        message_id?: number
        sender_name?: string
        sender_role?: string
        preview_text?: string
        old_status?: string
        new_status?: string
        status_display?: string
        lead_id?: number
        lead_name?: string
        lead_phone?: string
        lead_email?: string
        lead_source?: string
        lead_source_display?: string
        user_id?: number
        user_email?: string
        user_phone?: string
        user_full_name?: string
        user_role?: string
    }
    is_read: boolean
    created_at: string
}

// Frontend notification interface (converted from API response)
export interface Notification {
    id: string
    type: NotificationType
    title: string
    message: string
    details: {
        applicationId?: number
        companyName?: string
        productType?: string
        productTypeDisplay?: string
        amount?: string
        offeredRate?: string
        offeredAmount?: string
        partnerName?: string
        comment?: string
        documentId?: number
        documentName?: string
        requestId?: number
        documentTypeName?: string
        requesterName?: string
        messageId?: number
        senderName?: string
        senderRole?: string
        previewText?: string
        oldStatus?: string
        newStatus?: string
        statusDisplay?: string
        leadId?: number
        leadName?: string
        leadPhone?: string
        leadEmail?: string
        leadSource?: string
        leadSourceDisplay?: string
        userId?: number
        userEmail?: string
        userPhone?: string
        userName?: string
        userRole?: string
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

interface UnreadCountResponse {
    unread_count: number
}

interface MarkReadResponse {
    success: boolean
    notification: NotificationResponse
}

interface MarkAllReadResponse {
    success: boolean
    count: number
}

const POLLING_INTERVAL = 30000 // 30 seconds

// Transform API response to frontend notification
function transformNotification(apiNotification: NotificationResponse): Notification {
    const data = apiNotification.data || {}
    
    return {
        id: String(apiNotification.id),
        type: apiNotification.type,
        title: apiNotification.title,
        message: apiNotification.message,
        details: {
            applicationId: data.application_id,
            companyName: data.company_name,
            productType: data.product_type,
            productTypeDisplay: data.product_type_display,
            amount: data.amount || undefined,
            offeredRate: data.offered_rate || undefined,
            offeredAmount: data.offered_amount || undefined,
            partnerName: data.partner_name,
            comment: data.comment || undefined,
            documentId: data.document_id,
            documentName: data.document_name,
            requestId: data.request_id,
            documentTypeName: data.document_type_name,
            requesterName: data.requester_name,
            messageId: data.message_id,
            senderName: data.sender_name,
            senderRole: data.sender_role,
            previewText: data.preview_text,
            oldStatus: data.old_status,
            newStatus: data.new_status,
            statusDisplay: data.status_display,
            leadId: data.lead_id,
            leadName: data.lead_name,
            leadPhone: data.lead_phone,
            leadEmail: data.lead_email,
            leadSource: data.lead_source,
            leadSourceDisplay: data.lead_source_display,
            userId: data.user_id,
            userEmail: data.user_email,
            userPhone: data.user_phone,
            userName: data.user_full_name,
            userRole: data.user_role,
        },
        createdAt: apiNotification.created_at,
        isRead: apiNotification.is_read,
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

    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch all notifications from unified API
    const fetchNotifications = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setIsLoading(true)
        }
        setError(null)

        try {
            // Fetch from unified notifications API
            const response = await api.get<PaginatedResponse<NotificationResponse>>('/notifications/')

            // Transform to frontend format
            const transformedNotifications = response.results.map(transformNotification)

            // Sort by date (newest first) - already sorted by backend, but just in case
            const sortedNotifications = [...transformedNotifications].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )

            setNotifications(sortedNotifications)
        } catch (err) {
            const apiError = err as ApiError
            setError(apiError.message || 'Ошибка загрузки уведомлений')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Mark notification as read via API
    const markAsRead = useCallback(async (notificationId: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        )

        try {
            // Call API to persist read state
            await api.post<MarkReadResponse>(`/notifications/${notificationId}/read/`)
        } catch (err) {
            // Revert on error
            const apiError = err as ApiError
            console.error('Failed to mark notification as read:', apiError.message)
            // Optionally revert the optimistic update
            // fetchNotifications(false)
        }
    }, [])

    // Mark all notifications as read via API
    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true }))
        )

        try {
            // Call API to persist read state
            await api.post<MarkAllReadResponse>('/notifications/read_all/')
        } catch (err) {
            const apiError = err as ApiError
            console.error('Failed to mark all notifications as read:', apiError.message)
            // Optionally revert the optimistic update
            // fetchNotifications(false)
        }
    }, [])

    // Get unread count (computed from state)
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

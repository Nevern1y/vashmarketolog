/**
 * Chat Threads Hook for Admin Panel
 * 
 * Provides WebSocket connection for real-time updates of chat threads.
 * Falls back to REST polling if WebSocket fails.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import api, { tokenStorage, type ApiError } from '@/lib/api'

// ============================================
// Types for Chat Threads
// ============================================

export interface ChatThread {
    applicationId: number
    companyName: string
    lastSenderEmail: string
    lastSenderName: string
    lastMessagePreview: string
    unreadCount: number
    adminReplied: boolean
    lastMessageAt: string
    agentName?: string | null
    agentEmail?: string | null
    agentPhone?: string | null
}

// API response type (matches backend serializer - snake_case)
interface ChatThreadResponse {
    application_id: number
    company_name: string
    last_sender_email: string
    last_sender_name: string
    last_message_preview: string
    unread_count: number
    admin_replied: boolean
    last_message_at: string
    agent_name?: string | null
    agent_email?: string | null
    agent_phone?: string | null
}

// WebSocket message types
interface WebSocketMessage {
    type: 'threads_update' | 'new_message' | 'error'
    threads?: ChatThreadResponse[]
    application_id?: number
    company_name?: string
    sender_name?: string
    preview?: string
    message?: string
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const POLLING_INTERVAL = 30000 // 30 seconds fallback

// ============================================
// Transform API response to frontend format
// ============================================

function transformThread(thread: ChatThreadResponse): ChatThread {
    return {
        applicationId: thread.application_id,
        companyName: thread.company_name,
        lastSenderEmail: thread.last_sender_email,
        lastSenderName: thread.last_sender_name,
        lastMessagePreview: thread.last_message_preview,
        unreadCount: thread.unread_count,
        adminReplied: thread.admin_replied,
        lastMessageAt: thread.last_message_at,
        agentName: thread.agent_name ?? null,
        agentEmail: thread.agent_email ?? null,
        agentPhone: thread.agent_phone ?? null,
    }
}

// ============================================
// useChatThreads Hook
// ============================================

/**
 * Hook for admin chat threads list with WebSocket support.
 * 
 * Provides real-time updates of chat threads that need attention:
 * - Threads with unread messages
 * - Threads where admin hasn't replied yet
 */
export function useChatThreads() {
    const [threads, setThreads] = useState<ChatThread[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const pollingRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch threads via REST API (fallback)
    const fetchThreads = useCallback(async (showLoading: boolean = false) => {
        if (showLoading) {
            setIsLoading(true)
        }
        setError(null)

        try {
            const response = await api.get<ChatThreadResponse[]>('/applications/chat-threads/')
            const threadsList = Array.isArray(response) ? response : []
            setThreads(threadsList.map(transformThread))
        } catch (err) {
            const apiError = err as ApiError
            console.error('[ChatThreads] Fetch error:', apiError)
            setError(apiError.message || 'Ошибка загрузки чатов')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Connect to WebSocket
    const connect = useCallback(() => {
        const token = tokenStorage.getAccessToken()
        if (!token) {
            console.warn('[ChatThreads] No token, using polling')
            return false
        }

        if (wsRef.current) {
            wsRef.current.close()
        }

        const wsUrl = `${WS_BASE_URL}/ws/admin/chat-threads/?token=${token}`

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('[ChatThreads] WebSocket connected')
                setIsConnected(true)
                setError(null)
                // Stop polling when WS is connected
                if (pollingRef.current) {
                    clearInterval(pollingRef.current)
                    pollingRef.current = null
                }
            }

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data)

                    switch (data.type) {
                        case 'threads_update':
                            if (data.threads) {
                                setThreads(data.threads.map(transformThread))
                                setIsLoading(false)
                            }
                            break

                        case 'new_message':
                            // Refresh threads on new message
                            fetchThreads(false)
                            break

                        case 'error':
                            console.error('[ChatThreads] WS error:', data.message)
                            break
                    }
                } catch (e) {
                    console.error('[ChatThreads] Failed to parse WS message:', e)
                }
            }

            ws.onerror = (error) => {
                console.error('[ChatThreads] WebSocket error:', error)
            }

            ws.onclose = (event) => {
                console.log('[ChatThreads] WebSocket closed:', event.code)
                setIsConnected(false)
                
                // Start polling as fallback
                if (!pollingRef.current) {
                    pollingRef.current = setInterval(() => {
                        fetchThreads(false)
                    }, POLLING_INTERVAL)
                }
                
                // Attempt reconnect if not intentional close
                if (event.code !== 1000) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, 5000)
                }
            }

            return true
        } catch (e) {
            console.error('[ChatThreads] Failed to create WebSocket:', e)
            return false
        }
    }, [fetchThreads])

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
        if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
        }
        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected')
            wsRef.current = null
        }
        setIsConnected(false)
    }, [])

    // Request refresh via WebSocket
    const refresh = useCallback(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'refresh' }))
        } else {
            fetchThreads(false)
        }
    }, [fetchThreads])

    // Initialize on mount
    useEffect(() => {
        // Initial fetch via REST
        fetchThreads(true)
        
        // Try to connect WebSocket
        const wsConnected = connect()
        
        // If WS failed, start polling
        if (!wsConnected) {
            pollingRef.current = setInterval(() => {
                fetchThreads(false)
            }, POLLING_INTERVAL)
        }

        return () => {
            disconnect()
        }
    }, [fetchThreads, connect, disconnect])

    return {
        threads,
        isLoading,
        error,
        isConnected,
        refresh,
        clearError: () => setError(null),
    }
}

// ============================================
// Helper: Format relative time
// ============================================

export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'только что'
    if (diffMin < 60) return `${diffMin} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays === 1) return 'вчера'
    if (diffDays < 7) return `${diffDays} дн. назад`
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

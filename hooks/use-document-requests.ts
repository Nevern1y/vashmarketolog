"use client"

import { useState, useCallback } from 'react'
import { api } from '@/lib/api'

/**
 * Hook for managing document requests (admin -> agent/client)
 */

export interface DocumentRequest {
    id: number
    user: number
    user_email: string
    user_name: string
    requested_by: number | null
    requested_by_email: string | null
    document_type_name: string
    document_type_id: number | null
    comment: string
    status: 'pending' | 'fulfilled' | 'cancelled'
    status_display: string
    fulfilled_document: number | null
    created_at: string
    updated_at: string
    fulfilled_at: string | null
    is_read: boolean
}

export interface CreateDocumentRequestPayload {
    user: number
    document_type_name: string
    document_type_id?: number
    comment?: string
}

export function useDocumentRequests() {
    const [requests, setRequests] = useState<DocumentRequest[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pendingCount, setPendingCount] = useState(0)

    // Fetch document requests (optionally filtered by user_id)
    const fetchRequests = useCallback(async (userId?: number) => {
        setIsLoading(true)
        setError(null)
        try {
            const params = userId ? { user_id: userId.toString() } : undefined
            const data = await api.get<DocumentRequest[]>('/documents/requests/', params)
            setRequests(Array.isArray(data) ? data : (data as any)?.results || [])
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки запросов')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Get pending count for notification badge
    const fetchPendingCount = useCallback(async () => {
        try {
            const data = await api.get<{ pending_count: number }>('/documents/requests/pending_count/')
            setPendingCount(data.pending_count)
        } catch {
            // Ignore errors for count
        }
    }, [])

    // Create new document request (admin only)
    const createRequest = useCallback(async (payload: CreateDocumentRequestPayload): Promise<DocumentRequest | null> => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await api.post<DocumentRequest>('/documents/requests/', payload)
            setRequests(prev => [data, ...prev])
            return data
        } catch (err: any) {
            setError(err.message || 'Ошибка создания запроса')
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Mark request as read
    const markAsRead = useCallback(async (requestId: number) => {
        try {
            const data = await api.post<DocumentRequest>(`/documents/requests/${requestId}/mark_read/`)
            setRequests(prev => prev.map(r => r.id === requestId ? data : r))
            setPendingCount(prev => Math.max(0, prev - 1))
        } catch {
            // Ignore errors
        }
    }, [])

    // Fulfill request with a document
    const fulfillRequest = useCallback(async (requestId: number, documentId: number): Promise<boolean> => {
        setIsLoading(true)
        try {
            const data = await api.post<DocumentRequest>(`/documents/requests/${requestId}/fulfill/`, {
                document_id: documentId
            })
            setRequests(prev => prev.map(r => r.id === requestId ? data : r))
            return true
        } catch (err: any) {
            setError(err.message || 'Ошибка выполнения запроса')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Cancel request (admin only)
    const cancelRequest = useCallback(async (requestId: number): Promise<boolean> => {
        setIsLoading(true)
        try {
            const data = await api.post<DocumentRequest>(`/documents/requests/${requestId}/cancel/`)
            setRequests(prev => prev.map(r => r.id === requestId ? data : r))
            return true
        } catch (err: any) {
            setError(err.message || 'Ошибка отмены запроса')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        requests,
        isLoading,
        error,
        pendingCount,
        fetchRequests,
        fetchPendingCount,
        createRequest,
        markAsRead,
        fulfillRequest,
        cancelRequest,
    }
}

/**
 * Hook for fetching documents by user (admin functionality)
 */
export interface UserDocument {
    id: number
    name: string
    file: string
    file_url: string
    document_type_id: number
    product_type: string
    type_display: string
    status: 'pending' | 'verified' | 'rejected' | 'not_allowed'
    status_display: string
    uploaded_at: string
    owner_email: string
    owner_id: number
}

export interface UserDocumentsResponse {
    documents: UserDocument[]
    stats: {
        total: number
        pending: number
        verified: number
        rejected: number
    }
}

export function useUserDocuments() {
    const [documents, setDocuments] = useState<UserDocument[]>([])
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch documents for specific user (admin only)
    const fetchUserDocuments = useCallback(async (userId: number) => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await api.get<UserDocumentsResponse>('/documents/by_user/', { user_id: userId.toString() })
            setDocuments(data.documents || [])
            setStats(data.stats || { total: 0, pending: 0, verified: 0, rejected: 0 })
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки документов')
            setDocuments([])
            setStats({ total: 0, pending: 0, verified: 0, rejected: 0 })
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Delete document (admin only)
    const deleteDocument = useCallback(async (docId: number): Promise<boolean> => {
        setIsLoading(true)
        try {
            await api.delete(`/documents/${docId}/`)
            setDocuments(prev => prev.filter(d => d.id !== docId))
            setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
            return true
        } catch (err: any) {
            setError(err.message || 'Ошибка удаления документа')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        documents,
        stats,
        isLoading,
        error,
        fetchUserDocuments,
        deleteDocument,
    }
}

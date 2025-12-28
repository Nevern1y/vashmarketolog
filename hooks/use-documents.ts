/**
 * API Hooks for Documents
 * 
 * Custom hooks for document library management.
 */
"use client"

import { useState, useEffect, useCallback } from 'react';
import api, { type ApiError } from '@/lib/api';

// Types matching backend
export interface Document {
    id: number;
    owner: number;
    owner_email: string;
    company: number | null;
    company_name: string | null;
    name: string;
    file: string;
    file_url: string;
    document_type: 'constituent' | 'financial' | 'tax' | 'permit' | 'other';
    type_display: string;
    status: 'pending' | 'verified' | 'rejected';
    status_display: string;
    rejection_reason: string;
    verified_at: string | null;
    verified_by: number | null;
    uploaded_at: string;
    updated_at: string;
}

export interface DocumentListItem {
    id: number;
    name: string;
    file: string;
    file_url: string;
    document_type: string;
    type_display: string;
    status: string;
    status_display: string;
    uploaded_at: string;
}

export interface UploadDocumentPayload {
    name: string;
    file: File;
    document_type: string;
    company?: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for listing documents
export function useDocuments(params?: { document_type?: string; status?: string }) {
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams: Record<string, string> = {};
            if (params?.document_type) queryParams.document_type = params.document_type;
            if (params?.status) queryParams.status = params.status;

            const response = await api.get<PaginatedResponse<DocumentListItem>>('/documents/', queryParams);
            setDocuments(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документов');
        } finally {
            setIsLoading(false);
        }
    }, [params?.document_type, params?.status]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    return {
        documents,
        isLoading,
        error,
        refetch: fetchDocuments,
    };
}

// Hook for verified documents (for application attachment)
export function useVerifiedDocuments() {
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<DocumentListItem[]>('/documents/verified/');
            setDocuments(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документов');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    return {
        documents,
        isLoading,
        error,
        refetch: fetchDocuments,
    };
}

// Hook for single document
export function useDocument(id: number | null) {
    const [document, setDocument] = useState<Document | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDocument = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Document>(`/documents/${id}/`);
            setDocument(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документа');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDocument();
    }, [fetchDocument]);

    return {
        document,
        isLoading,
        error,
        refetch: fetchDocument,
    };
}

// Hook for document mutations
export function useDocumentMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const uploadDocument = useCallback(async (payload: UploadDocumentPayload): Promise<Document | null> => {
        setIsLoading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('name', payload.name);
            formData.append('file', payload.file);
            formData.append('document_type', payload.document_type);
            if (payload.company) {
                formData.append('company', payload.company.toString());
            }

            const response = await api.uploadWithProgress<Document>(
                '/documents/',
                formData,
                (progress) => setUploadProgress(progress)
            );

            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документа');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteDocument = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await api.delete(`/documents/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления документа');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const verifyDocument = useCallback(async (
        id: number,
        status: 'verified' | 'rejected',
        rejectionReason?: string
    ): Promise<Document | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Document>(`/documents/${id}/verify/`, {
                status,
                rejection_reason: rejectionReason || '',
            });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка верификации документа');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        uploadProgress,
        uploadDocument,
        deleteDocument,
        verifyDocument,
        clearError: () => setError(null),
    };
}

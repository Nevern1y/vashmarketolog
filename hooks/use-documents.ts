/**
 * API Hooks for Documents
 * 
 * Custom hooks for document library management.
 * 
 * BREAKING CHANGE: Updated to use numeric document_type_id per Appendix B.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type ApiError } from '@/lib/api';
import { getDocumentTypeName } from '@/lib/document-types';
import { 
    matchDocumentsToRequirements, 
    autoSelectDocumentsForBanks,
    type DocumentMatchResult 
} from '@/lib/bank-document-requirements';

// Types matching backend (updated for numeric IDs)
export interface Document {
    id: number;
    owner: number;
    owner_email: string;
    company: number | null;
    company_name: string | null;
    name: string;
    file: string;
    file_url: string;
    document_type_id: number;    // NEW: Numeric ID from Appendix B
    product_type: string;         // NEW: Product context
    type_display: string;
    source_display?: string;      // NEW: Who uploads ("Агент", "Банк", "Автоматически")
    status: string;
    status_display: string;
    uploaded_at: string;
    updated_at: string;
}

export interface DocumentListItem {
    id: number;
    name: string;
    file: string;
    file_url: string;
    document_type_id: number;    // NEW: Numeric ID
    product_type: string;         // NEW: Product context
    type_display: string;
    status: string;
    status_display: string;
    uploaded_at: string;
    owner_email?: string;
    company?: number | null;
    company_name?: string | null;
}

export interface UploadDocumentPayload {
    name: string;
    file: File;
    document_type_id: number;    // NEW: Numeric ID
    product_type?: string;        // NEW: Product context (optional)
    company?: number | null;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for listing documents
export function useDocuments(params?: { document_type_id?: number; product_type?: string; status?: string; company?: number; includeUnassigned?: boolean }) {
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        if (params?.includeUnassigned && params?.company === undefined) {
            setDocuments([]);
            setIsLoading(false);
            return;
        }

        try {
            const queryParams: Record<string, string> = {};
            if (params?.document_type_id !== undefined) {
                queryParams.document_type_id = String(params.document_type_id);
            }
            if (params?.product_type) queryParams.product_type = params.product_type;
            if (params?.status) queryParams.status = params.status;
            const hasCompany = params?.company !== undefined;
            if (hasCompany) {
                queryParams.company = String(params.company);
            }
            // Pass includeUnassigned to backend for proper filtering
            if (params?.includeUnassigned) {
                queryParams.includeUnassigned = 'true';
            }

            const response = await api.get<PaginatedResponse<DocumentListItem>>('/documents/', queryParams);
            const results = response.results;
            if (hasCompany && params?.includeUnassigned) {
                const filtered = results.filter(
                    (doc) => doc.company === params.company || doc.company === null
                );
                setDocuments(filtered);
            } else {
                setDocuments(results);
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документов');
        } finally {
            setIsLoading(false);
        }
    }, [params?.document_type_id, params?.product_type, params?.status, params?.company, params?.includeUnassigned]);

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

// Hook for documents (for application attachment)
export function useVerifiedDocuments(productType?: string) {
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams: Record<string, string> = {};
            if (productType) {
                queryParams.product_type = productType;
            }

            const response = await api.get<PaginatedResponse<DocumentListItem>>('/documents/', queryParams);
            setDocuments(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки документов');
        } finally {
            setIsLoading(false);
        }
    }, [productType]);

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
export function useDocumentMutations(): {
    isLoading: boolean;
    error: string | null;
    uploadProgress: number;
    uploadDocument: (payload: UploadDocumentPayload) => Promise<Document | null>;
    deleteDocument: (id: number) => Promise<boolean>;
    clearError: () => void;
    getLastError: () => string | null;
} {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const lastErrorRef = useRef<string | null>(null);

    const uploadDocument = useCallback(async (payload: UploadDocumentPayload): Promise<Document | null> => {
        setIsLoading(true);
        setError(null);
        setUploadProgress(0);
        lastErrorRef.current = null;

        try {
            const formData = new FormData();
            formData.append('name', payload.name);
            formData.append('file', payload.file);
            formData.append('document_type_id', String(payload.document_type_id));
            if (payload.product_type) {
                formData.append('product_type', payload.product_type);
            }
            if (payload.company) {
                formData.append('company', payload.company.toString());
            }

            const response = await api.uploadWithProgress<Document>(
                '/documents/',
                formData,
                (progress) => setUploadProgress(progress)
            );

            return response;
        } catch (err: any) {
            const apiError = err as ApiError;
            
            // Format error message from field errors
            let message = apiError.message || 'Ошибка загрузки документа';
            if (apiError.errors && typeof apiError.errors === 'object') {
                const fieldErrors = Object.entries(apiError.errors)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('; ');
                if (fieldErrors) message = `${message} (${fieldErrors})`;
            }
            
            setError(message);
            lastErrorRef.current = message;
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteDocument = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        lastErrorRef.current = null;

        try {
            await api.delete(`/documents/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            const message = apiError.message || 'Ошибка удаления документа';
            setError(message);
            lastErrorRef.current = message;
            return false;
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
        clearError: () => {
            setError(null);
            lastErrorRef.current = null;
        },
        getLastError: () => lastErrorRef.current,
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get document type display name.
 * Uses the document-types library for resolution.
 */
export function formatDocumentType(doc: DocumentListItem | Document): string {
    // First try the server-provided display name
    if (doc.type_display && doc.type_display !== `Документ (ID: ${doc.document_type_id})`) {
        return doc.type_display;
    }
    // Fall back to client-side resolution
    return getDocumentTypeName(doc.document_type_id, doc.product_type || 'general');
}

// ============================================================================
// AUTO-MATCH DOCUMENTS HOOK
// ============================================================================

export interface UseAutoMatchDocumentsParams {
    companyId: number | null
    bankIds: string[]
    productType: string
}

export interface UseAutoMatchDocumentsResult {
    /** Documents automatically selected for the banks */
    selectedDocuments: DocumentListItem[]
    /** Coverage results per bank */
    bankCoverage: Map<string, DocumentMatchResult>
    /** Overall readiness (all banks have 100% coverage) */
    isFullyReady: boolean
    /** Minimum coverage across all banks */
    minCoveragePercent: number
    /** Loading state */
    isLoading: boolean
    /** Error message */
    error: string | null
    /** Refresh documents */
    refetch: () => void
}

/**
 * Hook for auto-matching company documents to bank requirements.
 * 
 * Usage:
 * ```tsx
 * const { selectedDocuments, bankCoverage, isFullyReady } = useAutoMatchDocuments({
 *   companyId: 123,
 *   bankIds: ['sber', 'vtb'],
 *   productType: 'bank_guarantee'
 * })
 * ```
 */
export function useAutoMatchDocuments({
    companyId,
    bankIds,
    productType,
}: UseAutoMatchDocumentsParams): UseAutoMatchDocumentsResult {
    const [selectedDocuments, setSelectedDocuments] = useState<DocumentListItem[]>([])
    const [bankCoverage, setBankCoverage] = useState<Map<string, DocumentMatchResult>>(new Map())
    const [isFullyReady, setIsFullyReady] = useState(false)
    const [minCoveragePercent, setMinCoveragePercent] = useState(0)

    // Fetch company documents
    const { documents, isLoading, error, refetch } = useDocuments(
        companyId ? { company: companyId } : undefined
    )

    // Auto-match when documents or bank selection changes
    useEffect(() => {
        if (!companyId || bankIds.length === 0 || documents.length === 0) {
            setSelectedDocuments([])
            setBankCoverage(new Map())
            setIsFullyReady(false)
            setMinCoveragePercent(0)
            return
        }

        const { selectedDocuments: matched, bankCoverage: coverage } = autoSelectDocumentsForBanks(
            documents,
            bankIds,
            productType
        )

        setSelectedDocuments(matched)
        setBankCoverage(coverage)

        // Calculate minimum coverage and readiness
        let minCoverage = 100
        let allReady = true

        coverage.forEach((result) => {
            if (result.coveragePercent < minCoverage) {
                minCoverage = result.coveragePercent
            }
            if (result.coveragePercent < 100) {
                allReady = false
            }
        })

        setMinCoveragePercent(minCoverage)
        setIsFullyReady(allReady)
    }, [companyId, bankIds, productType, documents])

    return {
        selectedDocuments,
        bankCoverage,
        isFullyReady,
        minCoveragePercent,
        isLoading,
        error,
        refetch,
    }
}

/**
 * Hook for checking single bank document requirements.
 * Simplified version for displaying coverage on bank cards.
 */
export function useBankDocumentCoverage(
    companyId: number | null,
    bankId: string,
    productType: string
): {
    coverage: DocumentMatchResult | null
    isLoading: boolean
    error: string | null
} {
    const [coverage, setCoverage] = useState<DocumentMatchResult | null>(null)

    const { documents, isLoading, error } = useDocuments(
        companyId ? { company: companyId } : undefined
    )

    useEffect(() => {
        if (!companyId || !bankId || documents.length === 0) {
            setCoverage(null)
            return
        }

        const result = matchDocumentsToRequirements(documents, bankId, productType)
        setCoverage(result)
    }, [companyId, bankId, productType, documents])

    return { coverage, isLoading, error }
}

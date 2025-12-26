/**
 * API Hooks for Applications
 * 
 * Custom hooks for fetching and managing applications data.
 */
"use client"

import { useState, useEffect, useCallback } from 'react';
import api, { type ApiError } from '@/lib/api';

// Types matching backend
export interface ApplicationDocument {
    id: number;
    name: string;
    file_url: string;
    document_type: string;
    type_display: string;
    status: string;
}

export interface Application {
    id: number;
    created_by: number;
    created_by_email: string;
    created_by_name?: string;
    company: number;
    company_name: string;
    company_inn: string;
    product_type: 'bank_guarantee' | 'tender_loan' | 'factoring' | 'leasing';
    product_type_display: string;
    amount: string;
    term_months: number;
    target_bank_name: string; // For Admin routing
    tender_number: string;
    tender_platform: string;
    tender_deadline: string | null;
    status: 'draft' | 'pending' | 'in_review' | 'info_requested' | 'approved' | 'rejected' | 'won' | 'lost';
    status_display: string;
    assigned_partner: number | null;
    partner_email: string | null;
    document_ids: number[];
    documents?: ApplicationDocument[];
    has_signature: boolean;
    notes: string;
    decisions_count: number;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
}

export interface ApplicationListItem {
    id: number;
    company_name: string;
    product_type: string;
    product_type_display: string;
    amount: string;
    term_months: number;
    target_bank_name: string; // For Admin Dashboard routing view
    status: string;
    status_display: string;
    created_at: string;
}

export interface CreateApplicationPayload {
    company: number;
    product_type: string;
    amount: string;
    term_months: number;
    target_bank_name?: string; // For Admin routing
    tender_number?: string;
    tender_platform?: string;
    tender_deadline?: string;
    notes?: string;
    document_ids?: number[];
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for listing applications
export function useApplications(statusFilter?: string) {
    const [applications, setApplications] = useState<ApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async (params?: Record<string, string>) => {
        setIsLoading(true);
        setError(null);

        try {
            const queryParams = { ...params };
            if (statusFilter) {
                queryParams.status = statusFilter;
            }
            const response = await api.get<PaginatedResponse<ApplicationListItem>>('/applications/', queryParams);
            setApplications(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки заявок');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    return {
        applications,
        isLoading,
        error,
        refetch: fetchApplications,
    };
}

// Client dashboard stats interface
export interface ClientStats {
    active_applications_count: number;
    won_applications_count: number;
    documents_count: number;
    accreditation_status: 'active' | 'not_accredited' | 'pending';
}

// Hook for client dashboard stats
export function useClientStats() {
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<ClientStats>('/applications/stats/client/');
            setStats(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки статистики');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        isLoading,
        error,
        refetch: fetchStats,
    };
}

// Hook for won applications (victories)
export function useWonApplications() {
    const [victories, setVictories] = useState<ApplicationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVictories = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch both approved and won applications
            const response = await api.get<PaginatedResponse<ApplicationListItem>>('/applications/');
            // Filter locally for approved or won status
            const wonApplications = response.results.filter(
                app => app.status === 'approved' || app.status === 'won'
            );
            setVictories(wonApplications);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки побед');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVictories();
    }, [fetchVictories]);

    return {
        victories,
        isLoading,
        error,
        refetch: fetchVictories,
    };
}

// Hook for single application
export function useApplication(id: number | string | null) {
    const [application, setApplication] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApplication = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Application>(`/applications/${id}/`);
            setApplication(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки заявки');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchApplication();
    }, [fetchApplication]);

    return {
        application,
        isLoading,
        error,
        refetch: fetchApplication,
    };
}

// Hook for creating/updating applications
export function useApplicationMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createApplication = useCallback(async (payload: CreateApplicationPayload): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>('/applications/', payload);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateApplication = useCallback(async (id: number, payload: Partial<CreateApplicationPayload>): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.patch<Application>(`/applications/${id}/`, payload);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitApplication = useCallback(async (id: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${id}/submit/`);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отправки заявки');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteApplication = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await api.delete(`/applications/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления заявки');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createApplication,
        updateApplication,
        submitApplication,
        deleteApplication,
        clearError: () => setError(null),
    };
}

// Hook for partner actions
export function usePartnerActions() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assignPartner = useCallback(async (applicationId: number, partnerId: number): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/assign/`, {
                partner_id: partnerId,
            });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка назначения партнёра');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const submitDecision = useCallback(async (
        applicationId: number,
        payload: {
            decision: 'approved' | 'rejected' | 'info_requested';
            comment?: string;
            offered_rate?: number;
            offered_amount?: number;
        }
    ): Promise<Application | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Application>(`/applications/${applicationId}/decision/`, {
                decision: payload.decision,
                comment: payload.comment || '',
                offered_rate: payload.offered_rate,
                offered_amount: payload.offered_amount,
            });
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка отправки решения');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        assignPartner,
        submitDecision,
        clearError: () => setError(null),
    };
}

/**
 * API Hooks for Companies (including CRM)
 * 
 * Custom hooks for company profile and CRM client management.
 * 
 * API-Ready Architecture: Includes types for future Bank API integrations
 * (founders_data, bank_accounts_data, passport fields from Realist Bank specs).
 */
"use client"

import { useState, useEffect, useCallback } from 'react';
import api, { type ApiError } from '@/lib/api';

// Founder data structure (for founders_data JSONField)
export interface FounderData {
    name: string;
    inn?: string;
    share?: number;
}

// Bank account data structure (for bank_accounts_data JSONField)
export interface BankAccountData {
    account: string;
    bic: string;
    bank_name: string;
}

// Types matching backend
export interface Company {
    id: number;
    owner: number;
    owner_email: string;
    is_crm_client: boolean;
    inn: string;
    kpp: string;
    ogrn: string;
    name: string;
    short_name: string;
    legal_address: string;
    actual_address: string;
    director_name: string;
    director_position: string;
    // Passport fields (API-Ready for Realist Bank)
    passport_series: string | null;
    passport_number: string | null;
    passport_issued_by: string | null;
    passport_date: string | null;
    passport_code: string | null;
    // JSONField data (API-Ready for future integrations)
    founders_data: FounderData[];
    bank_accounts_data: BankAccountData[];
    // Primary bank details
    bank_name: string;
    bank_bic: string;
    bank_account: string;
    bank_corr_account: string;
    // Contact info
    contact_person: string;
    contact_phone: string;
    contact_email: string;
    website: string;
    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface CompanyListItem {
    id: number;
    inn: string;
    name: string;
    short_name: string;
    is_crm_client: boolean;
    created_at: string;
}

export interface CreateCompanyPayload {
    inn: string;
    name: string;
    kpp?: string;
    ogrn?: string;
    short_name?: string;
    legal_address?: string;
    actual_address?: string;
    director_name?: string;
    director_position?: string;
    // Passport fields
    passport_series?: string;
    passport_number?: string;
    passport_issued_by?: string;
    passport_date?: string;
    passport_code?: string;
    // JSONField data
    founders_data?: FounderData[];
    bank_accounts_data?: BankAccountData[];
    // Bank details
    bank_name?: string;
    bank_bic?: string;
    bank_account?: string;
    bank_corr_account?: string;
    // Contact info
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    website?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Hook for current user's company
export function useMyCompany() {
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCompany = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Company>('/companies/me/');
            setCompany(response);
        } catch (err) {
            const apiError = err as ApiError;
            // 404 is expected when company doesn't exist yet
            if (apiError.status === 404) {
                setCompany(null);
            } else {
                setError(apiError.message || 'Ошибка загрузки профиля компании');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateCompany = useCallback(async (data: Partial<CreateCompanyPayload>): Promise<Company | null> => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await api.patch<Company>('/companies/me/', data);
            setCompany(response);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления профиля компании');
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    const createCompany = useCallback(async (data: CreateCompanyPayload): Promise<Company | null> => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await api.post<Company>('/companies/me/', data);
            setCompany(response);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания профиля компании');
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    useEffect(() => {
        fetchCompany();
    }, [fetchCompany]);

    return {
        company,
        isLoading,
        isSaving,
        error,
        refetch: fetchCompany,
        updateCompany,
        createCompany,
    };
}

// Hook for listing CRM clients (Agent only)
export function useCRMClients() {
    const [clients, setClients] = useState<CompanyListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<PaginatedResponse<CompanyListItem>>('/companies/crm/');
            setClients(response.results);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки клиентов');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return {
        clients,
        isLoading,
        error,
        refetch: fetchClients,
    };
}

// Hook for single CRM client
export function useCRMClient(id: number | null) {
    const [client, setClient] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClient = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.get<Company>(`/companies/crm/${id}/`);
            setClient(response);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки клиента');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    return {
        client,
        isLoading,
        error,
        refetch: fetchClient,
    };
}

// Hook for CRM client mutations
export function useCRMClientMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createClient = useCallback(async (data: CreateCompanyPayload): Promise<Company | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<Company>('/companies/crm/', data);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания клиента');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateClient = useCallback(async (id: number, data: Partial<CreateCompanyPayload>): Promise<Company | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.patch<Company>(`/companies/crm/${id}/`, data);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления клиента');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteClient = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            await api.delete(`/companies/crm/${id}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления клиента');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        isLoading,
        error,
        createClient,
        updateClient,
        deleteClient,
        clearError: () => setError(null),
    };
}

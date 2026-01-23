/**
 * API Hooks for Leads
 * 
 * Custom hooks for fetching and managing leads from public website.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type ApiError } from '@/lib/api';

// Lead types matching backend
export interface Lead {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    product_type: string;
    product_type_display: string;
    guarantee_type: string;
    guarantee_type_display: string;
    amount: string | null;
    term_months: number | null;
    source: string;
    source_display: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
    status_display: string;
    assigned_to: number | null;
    assigned_to_email: string | null;
    notes: string;
    converted_application: number | null;
    created_at: string;
    updated_at: string;
    contacted_at: string | null;
}

export interface LeadUpdate {
    status?: string;
    notes?: string;
    assigned_to?: number | null;
}

// Lead status config for UI
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    new: { label: "Новый", color: "text-[#3CE8D1]", bgColor: "bg-[#3CE8D1]/10" },
    contacted: { label: "Связались", color: "text-[#4F7DF3]", bgColor: "bg-[#4F7DF3]/10" },
    qualified: { label: "Квалифицирован", color: "text-[#FFD93D]", bgColor: "bg-[#FFD93D]/10" },
    converted: { label: "Конвертирован", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
    rejected: { label: "Отклонён", color: "text-[#E03E9D]", bgColor: "bg-[#E03E9D]/10" },
};

// Lead source config for UI
export const LEAD_SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
    website_calculator: { label: "Калькулятор", color: "text-[#3CE8D1]" },
    website_form: { label: "Форма на сайте", color: "text-[#4F7DF3]" },
    landing_page: { label: "Лендинг", color: "text-amber-400" },
    phone: { label: "Звонок", color: "text-emerald-400" },
    other: { label: "Другое", color: "text-slate-400" },
};

/**
 * Hook for fetching all leads (Admin only)
 */
export function useLeads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchLeads = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            // Handle both paginated response {results: Lead[]} and direct array Lead[]
            const response = await api.get<Lead[] | { results: Lead[] }>('/applications/admin/leads/');
            if (isMounted.current) {
                // Extract results from paginated response or use directly if array
                const leadsData = Array.isArray(response) ? response : (response?.results || []);
                setLeads(leadsData);
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка загрузки лидов');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchLeads();
        return () => {
            isMounted.current = false;
        };
    }, [fetchLeads]);

    return { leads, isLoading, error, refetch: fetchLeads };
}

/**
 * Hook for updating a lead
 */
export function useLeadActions() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateLead = useCallback(async (leadId: number, data: LeadUpdate): Promise<Lead | null> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.patch<Lead>(`/applications/admin/leads/${leadId}/`, data);
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка обновления лида');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const convertToApplication = useCallback(async (leadId: number): Promise<Lead | null> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post<Lead>(`/applications/admin/leads/${leadId}/convert/`, {});
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка конвертации лида');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteLead = useCallback(async (leadId: number): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);
            await api.delete(`/applications/admin/leads/${leadId}/`);
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка удаления лида');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { updateLead, convertToApplication, deleteLead, isLoading, error };
}

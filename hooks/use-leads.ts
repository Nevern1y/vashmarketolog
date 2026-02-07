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
    inn?: string;
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
    utm_term: string;
    utm_content: string;
    page_url: string;
    referrer: string;
    form_name: string;
    message: string;
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

/**
 * Data for converting a lead to application.
 * All fields are optional - if not provided, values from lead will be used.
 */
export interface LeadConvertData {
    amount?: string | number;
    term_months?: number;
    product_type?: string;
    guarantee_type?: string;
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
    const isFetching = useRef(false);

    const fetchLeads = useCallback(async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        if (isFetching.current) {
            return;
        }

        isFetching.current = true;

        try {
            if (!silent) {
                setIsLoading(true);
            }
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
            if (!silent && isMounted.current) {
                setIsLoading(false);
            }
            isFetching.current = false;
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchLeads();

        const intervalId = window.setInterval(() => {
            fetchLeads({ silent: true });
        }, 15000);

        return () => {
            isMounted.current = false;
            window.clearInterval(intervalId);
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

    const convertToApplication = useCallback(async (
        leadId: number, 
        data?: LeadConvertData
    ): Promise<{ data: Lead | null; error: string | null }> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post<Lead>(`/applications/admin/leads/${leadId}/convert/`, data || {});
            return { data: response, error: null };
        } catch (err) {
            const apiError = err as ApiError;
            // Extract detailed error message - include details if available
            let errorMessage = apiError.message || 'Ошибка конвертации лида';
            
            // Check if there are details in the errors object
            if (apiError.errors?.details && Array.isArray(apiError.errors.details)) {
                errorMessage += ': ' + apiError.errors.details.join(', ');
            }
            
            setError(errorMessage);
            return { data: null, error: errorMessage };
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

// Lead comment types
export interface LeadComment {
    id: number;
    lead: number;
    author: number;
    author_email: string;
    author_name: string;
    text: string;
    created_at: string;
}

/**
 * Hook for fetching and managing lead comments
 */
export function useLeadComments(leadId: number | null) {
    const [comments, setComments] = useState<LeadComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchComments = useCallback(async () => {
        if (!leadId) return;
        
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get<LeadComment[] | { results: LeadComment[] }>(
                `/applications/admin/leads/${leadId}/comments/`
            );
            if (isMounted.current) {
                const data = Array.isArray(response) ? response : (response?.results || []);
                setComments(data);
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка загрузки комментариев');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [leadId]);

    const addComment = useCallback(async (text: string): Promise<LeadComment | null> => {
        if (!leadId) return null;
        
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.post<LeadComment>(
                `/applications/admin/leads/${leadId}/comments/`,
                { text }
            );
            if (isMounted.current) {
                setComments(prev => [response, ...prev]);
            }
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка добавления комментария');
            }
            return null;
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [leadId]);

    const deleteComment = useCallback(async (commentId: number): Promise<boolean> => {
        if (!leadId) return false;
        
        try {
            setIsLoading(true);
            setError(null);
            await api.delete(`/applications/admin/leads/${leadId}/comments/${commentId}/`);
            if (isMounted.current) {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
            return true;
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка удаления комментария');
            }
            return false;
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, [leadId]);

    useEffect(() => {
        isMounted.current = true;
        if (leadId) {
            fetchComments();
        } else {
            setComments([]);
        }
        return () => {
            isMounted.current = false;
        };
    }, [leadId, fetchComments]);

    return { comments, isLoading, error, refetch: fetchComments, addComment, deleteComment };
}

// Lead notification settings types
export interface LeadNotificationSettings {
    email_enabled: boolean;
    recipient_emails: string[];
    updated_at: string;
    updated_by_email: string | null;
}

/**
 * Hook for managing lead notification settings (Admin only)
 */
export function useLeadNotificationSettings() {
    const [settings, setSettings] = useState<LeadNotificationSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.get<LeadNotificationSettings>(
                '/notifications/admin/settings/lead-notifications/'
            );
            if (isMounted.current) {
                setSettings(response);
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка загрузки настроек');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const updateSettings = useCallback(async (
        data: Partial<Pick<LeadNotificationSettings, 'email_enabled' | 'recipient_emails'>>
    ): Promise<LeadNotificationSettings | null> => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await api.put<LeadNotificationSettings>(
                '/notifications/admin/settings/lead-notifications/',
                data
            );
            if (isMounted.current) {
                setSettings(response);
            }
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка сохранения настроек');
            }
            return null;
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchSettings();
        return () => {
            isMounted.current = false;
        };
    }, [fetchSettings]);

    return { settings, isLoading, error, refetch: fetchSettings, updateSettings };
}

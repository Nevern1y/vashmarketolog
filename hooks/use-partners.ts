/**
 * API Hook for fetching Partners list (Admin only)
 * 
 * Used in Admin Dashboard for routing applications to bank partners.
 */
"use client"

import { useState, useEffect, useCallback } from 'react';
import api, { type ApiError } from '@/lib/api';

export interface Partner {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: 'partner';
    is_active: boolean;
    date_joined: string;
}

export interface InvitePartnerPayload {
    email: string;
    first_name: string;
    last_name: string;
    company_name: string;
}

export interface InviteResponse {
    message: string;
    partner: {
        id: number;
        email: string;
        invite_token: string;
    };
    invite_url: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Hook for fetching list of partners (bank users).
 * Uses GET /api/auth/admin/users/?role=partner endpoint.
 */
export function usePartners() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPartners = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // API returns paginated response for user list
            const response = await api.get<PaginatedResponse<Partner> | Partner[]>(
                '/auth/admin/users/',
                { role: 'partner' }
            );

            // Handle both paginated and non-paginated response
            if (Array.isArray(response)) {
                setPartners(response);
            } else if (response.results) {
                setPartners(response.results);
            } else {
                setPartners([]);
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка загрузки списка партнёров');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const invitePartner = useCallback(async (payload: InvitePartnerPayload): Promise<InviteResponse | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<InviteResponse>('/auth/admin/invite-partner/', payload);
            // Refetch partners list after invite
            await fetchPartners();
            return response;
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка создания приглашения');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchPartners]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    return {
        partners,
        isLoading,
        error,
        refetch: fetchPartners,
        invitePartner,
    };
}


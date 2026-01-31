/**
 * API Hook for fetching Admin users list
 * 
 * Used in Admin Dashboard for assigning leads to managers.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { type ApiError } from '@/lib/api';

export interface AdminUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: 'admin';
    is_active: boolean;
    date_joined: string;
}

interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

/**
 * Hook for fetching list of admin users.
 * Uses GET /api/auth/admin/users/?role=admin endpoint.
 */
export function useAdminUsers() {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const fetchAdmins = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // API returns paginated response for user list
            const response = await api.get<PaginatedResponse<AdminUser> | AdminUser[]>(
                '/auth/admin/users/',
                { role: 'admin' }
            );

            if (!isMounted.current) return;

            // Handle both paginated and non-paginated response
            if (Array.isArray(response)) {
                setAdmins(response);
            } else if (response.results) {
                setAdmins(response.results);
            } else {
                setAdmins([]);
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (isMounted.current) {
                setError(apiError.message || 'Ошибка загрузки списка администраторов');
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchAdmins();
        return () => {
            isMounted.current = false;
        };
    }, [fetchAdmins]);

    return { admins, isLoading, error, refetch: fetchAdmins };
}

/**
 * Get display name for admin user
 */
export function getAdminDisplayName(admin: AdminUser): string {
    if (admin.first_name && admin.last_name) {
        return `${admin.first_name} ${admin.last_name}`;
    }
    if (admin.first_name) {
        return admin.first_name;
    }
    return admin.email;
}

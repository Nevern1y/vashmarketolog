/**
 * Auth Context Provider
 * 
 * Manages authentication state across the application.
 * Provides user data, login/logout functions, and role-based access.
 * 
 * CRITICAL: Session persistence is handled here.
 * - On mount, checks localStorage for tokens
 * - If token exists, attempts to fetch user data
 * - isLoading starts TRUE to prevent premature redirect
 */
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authApi, tokenStorage, type User, type RegisterPayload, type ApiError } from './api';
import type { AppMode } from './types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    getAppModeForRole: () => AppMode;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // CRITICAL: isLoading MUST default to TRUE
    // This prevents the app from redirecting to login before hydration completes
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Prevent double initialization in React StrictMode
    const initialized = useRef(false);

    // Hydration: Check auth status on mount
    useEffect(() => {
        // Guard against double execution in development StrictMode
        if (initialized.current) {
            return;
        }
        initialized.current = true;

        const initAuth = async () => {
            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                setIsLoading(false);
                return;
            }

            // Step 1: Check if access token exists in localStorage
            const accessToken = tokenStorage.getAccessToken();
            const refreshToken = tokenStorage.getRefreshToken();

            // If no tokens at all, user is not authenticated
            if (!accessToken && !refreshToken) {
                setIsLoading(false);
                return;
            }

            // Step 2: If we have a token, try to fetch user data
            try {
                const userData = await authApi.getMe();
                setUser(userData);
            } catch (err) {
                const apiError = err as ApiError;

                // The API interceptor handles 401 and tries to refresh
                // If we still get an error after refresh attempt, clear tokens
                if (apiError.status === 401 || apiError.status === 403) {
                    tokenStorage.clearTokens();
                    setUser(null);
                } else {
                    // Network error or server error - don't clear tokens yet
                    // User might just be offline
                    setUser(null);
                }
            }

            // Step 3: ALWAYS set loading to false after check completes
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.login(email, password);
            setUser(response.user);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || 'Ошибка входа. Проверьте данные.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (payload: RegisterPayload) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await authApi.register(payload);
            setUser(response.user);
        } catch (err) {
            const apiError = err as ApiError;

            // Extract detailed validation errors from Django
            let errorMessage = apiError.message || 'Ошибка регистрации.';

            if (apiError.errors && typeof apiError.errors === 'object') {
                const fieldErrors: string[] = [];
                for (const [field, messages] of Object.entries(apiError.errors)) {
                    if (Array.isArray(messages)) {
                        fieldErrors.push(...messages);
                    } else if (typeof messages === 'string') {
                        fieldErrors.push(messages);
                    }
                }
                if (fieldErrors.length > 0) {
                    errorMessage = fieldErrors.join(' ');
                }
            }

            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);

        try {
            await authApi.logout();
        } catch (err) {
            // Ignore logout errors - we're logging out anyway
        } finally {
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Map user role to app mode
    const getAppModeForRole = useCallback((): AppMode => {
        if (!user) return 'auth';

        switch (user.role) {
            case 'client':
                return 'client-dashboard';
            case 'agent':
                return 'agent-dashboard';
            case 'partner':
                return 'partner-dashboard';
            case 'admin':
                return 'admin-dashboard';
            case 'seo':
                return 'seo-dashboard';
            default:
                return 'auth';
        }
    }, [user]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await authApi.getMe();
            setUser(userData);
        } catch (err) {
            // Failed to refresh — keep existing user state
        }
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        clearError,
        getAppModeForRole,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// Hook for role-based access
export function useRequireAuth(allowedRoles?: User['role'][]) {
    const { user, isLoading, isAuthenticated } = useAuth();

    const hasAccess = isAuthenticated && (
        !allowedRoles ||
        allowedRoles.includes(user?.role as User['role'])
    );

    return {
        user,
        isLoading,
        isAuthenticated,
        hasAccess,
        isClient: user?.role === 'client',
        isAgent: user?.role === 'agent',
        isPartner: user?.role === 'partner',
        isAdmin: user?.role === 'admin',
        isSeo: user?.role === 'seo',
        canAccessSeoAdmin: user?.role === 'admin' || user?.role === 'seo',
    };
}

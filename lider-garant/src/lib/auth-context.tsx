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
            console.log('[AUTH] Initializing auth context...');

            // Check if we're in a browser environment
            if (typeof window === 'undefined') {
                console.log('[AUTH] SSR detected, skipping hydration');
                setIsLoading(false);
                return;
            }

            // Step 1: Check if access token exists in localStorage
            const accessToken = tokenStorage.getAccessToken();
            const refreshToken = tokenStorage.getRefreshToken();

            console.log('[AUTH] Tokens in storage:', {
                hasAccess: !!accessToken,
                hasRefresh: !!refreshToken
            });

            // If no tokens at all, user is not authenticated
            if (!accessToken && !refreshToken) {
                console.log('[AUTH] No tokens found, user not authenticated');
                setIsLoading(false);
                return;
            }

            // Step 2: If we have a token, try to fetch user data
            try {
                console.log('[AUTH] Fetching user data...');
                const userData = await authApi.getMe();
                console.log('[AUTH] User data fetched:', { id: userData.id, email: userData.email, role: userData.role });
                setUser(userData);
            } catch (err) {
                const apiError = err as ApiError;
                console.log('[AUTH] Failed to fetch user:', apiError.status, apiError.message);

                // The API interceptor handles 401 and tries to refresh
                // If we still get an error after refresh attempt, clear tokens
                if (apiError.status === 401 || apiError.status === 403) {
                    console.log('[AUTH] Token invalid/expired, clearing tokens');
                    tokenStorage.clearTokens();
                    setUser(null);
                } else {
                    // Network error or server error - don't clear tokens yet
                    // User might just be offline
                    console.log('[AUTH] Non-auth error, keeping tokens:', apiError.message);
                    // Still set user to null since we couldn't fetch
                    setUser(null);
                }
            }

            // Step 3: ALWAYS set loading to false after check completes
            setIsLoading(false);
            console.log('[AUTH] Initialization complete');
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('[AUTH] Logging in...');
            const response = await authApi.login(email, password);
            console.log('[AUTH] Login successful:', { id: response.user.id, role: response.user.role });
            setUser(response.user);
        } catch (err) {
            const apiError = err as ApiError;
            console.log('[AUTH] Login failed:', apiError.message);
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
            console.log('[AUTH] Registering...');
            const response = await authApi.register(payload);
            console.log('[AUTH] Registration successful:', { id: response.user.id, role: response.user.role });
            setUser(response.user);
        } catch (err) {
            const apiError = err as ApiError;
            console.log('[AUTH] Registration failed:', apiError.message);

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
        console.log('[AUTH] Logging out...');
        setIsLoading(true);

        try {
            await authApi.logout();
        } catch (err) {
            // Ignore logout errors - we're logging out anyway
            console.log('[AUTH] Logout API call failed (ignored):', err);
        } finally {
            setUser(null);
            setIsLoading(false);
            console.log('[AUTH] Logged out');
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
            console.log('[AUTH] Refreshing user data...');
            const userData = await authApi.getMe();
            console.log('[AUTH] User data refreshed:', { id: userData.id, email: userData.email, role: userData.role });
            setUser(userData);
        } catch (err) {
            console.log('[AUTH] Failed to refresh user:', err);
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

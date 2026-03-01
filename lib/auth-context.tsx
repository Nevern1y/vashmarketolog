/**
 * Auth Context Provider
 * 
 * Manages authentication state across the application.
 * Provides user data, login/logout functions, and role-based access.
 * 
 * CRITICAL: Session persistence is handled here.
 * - On mount, checks localStorage for tokens
 * - If access token exists, attempts to fetch user data
 * - If only refresh token exists, attempts to refresh first
 * - isLoading starts TRUE to prevent premature redirect
 * 
 * AUTO-LOGOUT: Logs out user after 2 hours of inactivity.
 * Activity is detected via mouse movements, keyboard events, and clicks.
 */
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authApi, tokenStorage, refreshAccessToken, type User, type RegisterPayload, type ApiError } from '@/lib/api';
import type { AppMode } from '@/lib/types';

// Auto-logout after 2 hours of inactivity (in milliseconds)
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;  // Check every minute
const LAST_ACTIVITY_STORAGE_KEY = 'lider_garant_last_activity_ts'

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
    
    // Track last user activity for auto-logout
    const lastActivityRef = useRef<number>(Date.now());

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

            // Step 2: If we only have refresh token (no access), try to refresh first
            if (!accessToken && refreshToken) {
                try {
                    const newTokens = await refreshAccessToken();
                    if (!newTokens) {
                        setIsLoading(false);
                        return;
                    }
                } catch (err) {
                    setIsLoading(false);
                    return;
                }
            }

            // Step 3: Now we should have an access token, try to fetch user data
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
                    // Still set user to null since we couldn't fetch
                    setUser(null);
                }
            }

            // Step 4: ALWAYS set loading to false after check completes
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
            if (typeof window !== 'undefined') {
                localStorage.removeItem(LAST_ACTIVITY_STORAGE_KEY)
            }
            setIsLoading(false);
        }
    }, []);

    // AUTO-LOGOUT: Track user activity and logout after inactivity timeout
    useEffect(() => {
        // Only track activity when user is authenticated
        if (!user) return;

        const syncActivity = (timestamp: number = Date.now()) => {
            lastActivityRef.current = timestamp
            localStorage.setItem(LAST_ACTIVITY_STORAGE_KEY, String(timestamp))
        }

        const readStoredActivity = () => {
            const raw = localStorage.getItem(LAST_ACTIVITY_STORAGE_KEY)
            if (!raw) return null
            const parsed = Number(raw)
            return Number.isFinite(parsed) ? parsed : null
        }

        // Initialize/sync activity timestamp across tabs
        syncActivity(Date.now())
        
        // Reset activity timestamp on user actions
        const handleActivity = () => {
            syncActivity(Date.now())
        };

        const handleStorageSync = (event: StorageEvent) => {
            if (event.key !== LAST_ACTIVITY_STORAGE_KEY || !event.newValue) return
            const parsed = Number(event.newValue)
            if (Number.isFinite(parsed) && parsed > lastActivityRef.current) {
                lastActivityRef.current = parsed
            }
        }

        // Check for inactivity periodically
        const checkInactivity = () => {
            const now = Date.now();
            const storedActivity = readStoredActivity()
            if (storedActivity && storedActivity > lastActivityRef.current) {
                lastActivityRef.current = storedActivity
            }
            const timeSinceLastActivity = now - lastActivityRef.current;
            
            if (timeSinceLastActivity > INACTIVITY_TIMEOUT_MS) {
                logout();
            }
        };

        // Set up activity listeners
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        window.addEventListener('storage', handleStorageSync)

        // Check inactivity every minute
        const intervalId = setInterval(checkInactivity, ACTIVITY_CHECK_INTERVAL_MS);

        // Cleanup on unmount or when user changes
        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('storage', handleStorageSync)
            clearInterval(intervalId);
        };
    }, [user, logout]);

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
            // Silently fail - caller can handle if needed
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
    };
}

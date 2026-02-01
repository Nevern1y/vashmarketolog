"use client"

import { useCallback, useState, useEffect, useSyncExternalStore } from "react"

// Subscribe to URL changes (popstate events)
function subscribeToUrl(callback: () => void) {
    window.addEventListener('popstate', callback)
    return () => window.removeEventListener('popstate', callback)
}

// Get current URL search params snapshot
function getUrlSnapshot() {
    if (typeof window === 'undefined') return ''
    return window.location.search
}

function getServerSnapshot() {
    return ''
}

/**
 * Custom hook to sync view state with URL search parameters
 * Completely decoupled from Next.js router to avoid page reloads
 */
export function usePersistedView<T extends string>(
    paramName: string,
    defaultValue: T,
    validValues?: T[]
): [T, (value: T) => void] {
    // Use useSyncExternalStore for URL sync (handles popstate)
    const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot)

    // Parse value from URL
    const getValueFromUrl = useCallback((): T => {
        if (typeof window === 'undefined') return defaultValue
        const params = new URLSearchParams(urlSearch)
        const urlValue = params.get(paramName) as T | null
        if (urlValue && validValues) {
            return validValues.includes(urlValue) ? urlValue : defaultValue
        }
        return urlValue || defaultValue
    }, [urlSearch, paramName, defaultValue, validValues])

    // Local state - initialized from URL
    const [localValue, setLocalValue] = useState<T>(() => getValueFromUrl())

    // Sync when URL changes externally (browser back/forward)
    useEffect(() => {
        const urlValue = getValueFromUrl()
        setLocalValue(urlValue)
    }, [urlSearch, getValueFromUrl])

    // Update both local state and URL when value changes
    const setValue = useCallback((value: T) => {
        // Update local state immediately
        setLocalValue(value)

        // Update URL without triggering navigation
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            if (value === defaultValue) {
                url.searchParams.delete(paramName)
            } else {
                url.searchParams.set(paramName, value)
            }
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }, [paramName, defaultValue])

    return [localValue, setValue]
}

/**
 * Hook to manage application detail view state in URL
 */
export function usePersistedAppDetail(): {
    appId: string | null
    openDetail: (id: string) => void
    closeDetail: () => void
} {
    // Use useSyncExternalStore for URL sync
    const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot)

    // Get appId from URL
    const getAppIdFromUrl = useCallback((): string | null => {
        if (typeof window === 'undefined') return null
        const params = new URLSearchParams(urlSearch)
        return params.get("appId")
    }, [urlSearch])

    // Local state
    const [localAppId, setLocalAppId] = useState<string | null>(() => getAppIdFromUrl())

    // Sync when URL changes externally
    useEffect(() => {
        setLocalAppId(getAppIdFromUrl())
    }, [urlSearch, getAppIdFromUrl])

    const openDetail = useCallback((id: string) => {
        setLocalAppId(id)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set("appId", id)
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }, [])

    const closeDetail = useCallback(() => {
        setLocalAppId(null)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete("appId")
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }, [])

    return { appId: localAppId, openDetail, closeDetail }
}

/**
 * Hook to manage calculation session view state in URL
 */
export function usePersistedSession(): {
    sessionId: number | null
    openSession: (id: number) => void
    closeSession: () => void
} {
    // Use useSyncExternalStore for URL sync
    const urlSearch = useSyncExternalStore(subscribeToUrl, getUrlSnapshot, getServerSnapshot)

    // Get session from URL
    const getSessionFromUrl = useCallback((): number | null => {
        if (typeof window === 'undefined') return null
        const params = new URLSearchParams(urlSearch)
        const sessionStr = params.get("session")
        return sessionStr ? parseInt(sessionStr, 10) : null
    }, [urlSearch])

    // Local state
    const [localSessionId, setLocalSessionId] = useState<number | null>(() => getSessionFromUrl())

    // Sync when URL changes externally
    useEffect(() => {
        setLocalSessionId(getSessionFromUrl())
    }, [urlSearch, getSessionFromUrl])

    const openSession = useCallback((id: number) => {
        setLocalSessionId(id)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set("session", String(id))
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }, [])

    const closeSession = useCallback(() => {
        setLocalSessionId(null)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete("session")
            window.history.replaceState(window.history.state, '', url.toString())
        }
    }, [])

    return { sessionId: localSessionId, openSession, closeSession }
}

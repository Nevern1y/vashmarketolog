"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

/**
 * Hook for managing user avatar across the application
 * Uses localStorage for persistence until backend API is implemented
 */
export function useAvatar() {
    const { user } = useAuth()
    const [avatar, setAvatar] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Storage key based on user ID
    const storageKey = user?.id ? `avatar_${user.id}` : null

    // Load avatar on mount
    useEffect(() => {
        if (storageKey) {
            if (user?.avatar) {
                setAvatar(user.avatar)
            } else {
                const saved = localStorage.getItem(storageKey)
                if (saved) {
                    setAvatar(saved)
                } else if ((user as any)?.avatar_url) {
                    setAvatar((user as any).avatar_url)
                }
            }
        }
        setIsLoading(false)
    }, [storageKey, user])

    // Update avatar
    const updateAvatar = useCallback((base64: string) => {
        setAvatar(base64)
        if (storageKey) {
            localStorage.setItem(storageKey, base64)
        }
    }, [storageKey])

    // Remove avatar
    const removeAvatar = useCallback(() => {
        setAvatar(null)
        if (storageKey) {
            localStorage.removeItem(storageKey)
        }
    }, [storageKey])

    // Get user initials for fallback
    const getInitials = useCallback(() => {
        if ((user as any)?.full_name) {
            return (user as any).full_name.charAt(0).toUpperCase()
        }
        if (user?.first_name) {
            return user.first_name.charAt(0).toUpperCase()
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase()
        }
        return 'U'
    }, [user])

    return {
        avatar,
        isLoading,
        updateAvatar,
        removeAvatar,
        getInitials,
    }
}

/**
 * Form Utilities - Shared formatters and parsers
 * 
 * Extracted from edit-client-sheet.tsx and my-company-view.tsx
 * to eliminate code duplication.
 */

// =============================================================================
// VALIDATION REGEX
// =============================================================================

export const LATIN_REGEX = /^[\u0000-\u007F]*$/
export const LATIN_ERROR = "Только латинские символы"

// =============================================================================
// PHONE FORMATTING
// =============================================================================

/**
 * Format phone number as +7 (XXX) XXX XX XX
 * Handles 8 -> 7 conversion and enforces Russian format
 */
export const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "")
    if (!digits) return ""

    let processed = digits
    if (digits.length === 1 && digits === '8') {
        processed = '7'
    } else if (digits.startsWith('8')) {
        processed = '7' + digits.slice(1)
    } else if (digits.length > 0 && !digits.startsWith('7')) {
        processed = '7' + digits
    }

    const limited = processed.slice(0, 11)

    if (limited.length === 0) return ""
    if (limited.length <= 1) return `+${limited}`
    if (limited.length <= 4) return `+${limited.slice(0, 1)} (${limited.slice(1)}`
    if (limited.length <= 7) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4)}`
    if (limited.length <= 9) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7)}`
    return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7, 9)} ${limited.slice(9, 11)}`
}

/**
 * Parse formatted phone back to digits only
 */
export const parsePhoneNumber = (value: string): string => {
    return value.replace(/\D/g, "")
}

// =============================================================================
// NUMBER FORMATTING
// =============================================================================

/**
 * Format number with thousand separators (1000000 -> "1 000 000")
 * Supports decimals: 1000000.5 -> "1 000 000,5"
 */
export const formatInputNumber = (value: number | string | undefined): string => {
    if (!value && value !== 0) return ""
    
    let str = typeof value === 'number' ? value.toString() : value
    str = str.replace(/\s/g, '')
    
    const parts = str.split(/[.,]/)
    const integerPart = parts[0]
    const decimalPart = parts[1]
    
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    
    if (decimalPart !== undefined) {
        return `${formattedInteger},${decimalPart}`
    }
    
    if (str.endsWith(',') || str.endsWith('.')) {
        return `${formattedInteger},`
    }
    
    return formattedInteger
}

/**
 * Parse formatted string back to number ("1 000 000,50" -> 1000000.5)
 */
export const parseInputNumber = (value: string): number | undefined => {
    if (!value) return undefined
    const sanitized = value.replace(/[^\d\s,.]/g, '')
    const cleaned = sanitized.replace(/\s/g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? undefined : num
}

/**
 * Clean decimal value - convert empty strings to undefined and validate format
 * Used for authorized capital fields
 */
export const cleanDecimalValue = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === "") return undefined
    const cleaned = value.replace(/[^\d.]/g, "")
    const num = parseFloat(cleaned)
    if (isNaN(num)) return undefined
    // If number is too large (more than 13 digits before decimal), return undefined
    if (num >= 10000000000000) return undefined
    return cleaned
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Safe string converter - handles null/undefined
 */
export const safeString = (value: string | null | undefined): string => value ?? ""

/**
 * Format date string to Russian locale
 */
export const formatDate = (dateStr: string): string => {
    try {
        return new Date(dateStr).toLocaleDateString("ru-RU")
    } catch {
        return dateStr
    }
}

/**
 * Format date with time to Russian locale
 */
export const formatDateTime = (dateStr: string): string => {
    try {
        return new Date(dateStr).toLocaleString("ru-RU", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return dateStr
    }
}

// =============================================================================
// INPUT HANDLERS
// =============================================================================

/**
 * Create onChange handler that filters input to digits only
 */
export const digitsOnlyHandler = (maxLength?: number) => 
    (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        let value = e.target.value.replace(/\D/g, "")
        if (maxLength) {
            value = value.slice(0, maxLength)
        }
        onChange(value)
    }

/**
 * Create onChange handler that filters input to Latin characters only
 */
export const latinOnlyHandler = () =>
    (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, "")
        onChange(value)
    }

/**
 * Create onChange handler for URL fields
 */
export const urlHandler = () =>
    (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9.:/-]/g, "")
        onChange(value)
    }

/**
 * Ensure URL has protocol prefix
 */
export const ensureUrlProtocol = (url: string | undefined): string | undefined => {
    if (!url || !url.trim()) return undefined
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
    }
    return `https://${url}`
}

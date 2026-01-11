import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Format phone number as +7 (XXX) XXX XX XX
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")

  // Handle Russian phone numbers
  let normalized = digits
  if (digits.length === 1 && digits === '8') {
    normalized = '7';
  } else if (digits.startsWith("8") && digits.length > 1) {
    normalized = "7" + digits.slice(1)
  } else if (digits.length > 0 && !digits.startsWith("7")) {
    normalized = "7" + digits
  }

  // Limit to 11 digits
  const limited = normalized.slice(0, 11);

  // Format: +7 (XXX) XXX XX XX
  if (limited.length === 0) return ""
  if (limited.length <= 1) return `+${limited}`
  if (limited.length <= 4) return `+${limited.slice(0, 1)} (${limited.slice(1)}`
  if (limited.length <= 7) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4)}`
  if (limited.length <= 9) return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7)}`
  return `+${limited.slice(0, 1)} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7, 9)} ${limited.slice(9, 11)}`
}

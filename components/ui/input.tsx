import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles - VISIBLE BACKGROUND for better UX
        'h-10 w-full min-w-0 rounded-md px-3 py-2 text-base md:text-sm',
        // Background & Border - HIGHLY VISIBLE
        'bg-[#0d1526] border-2 border-[#3a4a6c] text-white',
        // Placeholder
        'placeholder:text-[#6b7a94]',
        // File input
        'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Focus state - CYAN GLOW
        'focus:border-[#3CE8D1] focus:ring-2 focus:ring-[#3CE8D1]/50 focus:outline-none transition-all duration-200',
        // Selection
        'selection:bg-primary selection:text-primary-foreground',
        // Transitions
        'transition-all duration-200',
        // Disabled state
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#1a2744]',
        // Invalid state
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

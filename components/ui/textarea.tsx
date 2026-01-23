import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base styles
        'flex field-sizing-content min-h-20 w-full rounded-md px-3 py-2 text-base md:text-sm',
        // Background & Border - HIGHLY VISIBLE
        'bg-input border-2 border-[#3a4a6c] text-white',
        // Placeholder
        'placeholder:text-[#6b7a94]',
        // Focus state - CYAN GLOW
        'focus:border-[#3CE8D1] focus:ring-2 focus:ring-[#3CE8D1]/30 focus:outline-none',
        // Transitions
        'transition-all duration-200',
        // Disabled & Invalid states
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-input',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

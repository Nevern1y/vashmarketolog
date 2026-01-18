import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-tight transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 focus-visible:ring-offset-background hover:-translate-y-0.5 active:translate-y-0 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.55)] hover:shadow-[0_25px_55px_-35px_rgba(15,23,42,0.65)]",
  {
    variants: {
      variant: {
        default:
          "text-white bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-[length:180%_180%] hover:bg-[length:220%_220%] active:scale-[0.97]",
        destructive:
          "text-white bg-gradient-to-r from-rose-500 via-orange-500 to-red-500 hover:brightness-110 active:scale-[0.97] focus-visible:ring-destructive/40",
        outline:
          "border border-foreground/15 bg-transparent text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-[0_20px_45px_-30px_rgba(59,130,246,0.75)]",
        secondary:
          "bg-slate-900/80 text-white hover:bg-slate-900/90 dark:bg-white/10 dark:text-white/90 dark:hover:bg-white/20 active:scale-[0.98]",
        ghost:
          "text-foreground hover:bg-foreground/5 hover:shadow-inner dark:text-white dark:hover:bg-white/10 active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline relative after:absolute after:inset-x-0 after:bottom-0 after:h-[1px] after:bg-primary/30 after:transition-all after:duration-300 hover:after:bg-primary after:scale-x-0 hover:after:scale-x-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

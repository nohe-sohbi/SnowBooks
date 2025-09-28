import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transform hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Winter Audio Studio Primary - Deep winter blue gradient
        default: "bg-gradient-to-r from-winter-blue-600 to-winter-blue-700 text-white shadow-lg hover:from-winter-blue-700 hover:to-winter-blue-800 hover:shadow-xl focus-visible:ring-winter-blue-500 active:shadow-md",

        // Winter Audio Studio Secondary - Ice blue gradient
        secondary: "bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 text-white shadow-md hover:from-winter-blue-600 hover:to-winter-blue-700 hover:shadow-lg focus-visible:ring-winter-blue-400",

        // Winter Audio Studio Accent - Warm amber gradient
        accent: "bg-gradient-to-r from-warm-amber-500 to-warm-amber-600 text-white shadow-md hover:from-warm-amber-600 hover:to-warm-amber-700 hover:shadow-lg focus-visible:ring-warm-amber-400",

        // Destructive with winter theme
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg focus-visible:ring-red-400",

        // Outline with winter theme
        outline: "border-2 border-winter-blue-300 bg-white text-winter-blue-700 shadow-sm hover:bg-winter-blue-50 hover:border-winter-blue-400 hover:shadow-md focus-visible:ring-winter-blue-400 dark:bg-ice-gray-900 dark:border-ice-gray-600 dark:text-ice-gray-100 dark:hover:bg-ice-gray-800",

        // Ghost with winter theme
        ghost: "text-winter-blue-700 hover:bg-winter-blue-100 hover:text-winter-blue-800 focus-visible:ring-winter-blue-400 dark:text-ice-gray-300 dark:hover:bg-ice-gray-800 dark:hover:text-ice-gray-100",

        // Link with winter theme
        link: "text-winter-blue-600 underline-offset-4 hover:underline hover:text-winter-blue-700 focus-visible:ring-winter-blue-400",

        // New winter-specific variants
        frost: "bg-gradient-to-r from-ice-gray-100 to-ice-gray-200 text-ice-gray-700 border border-ice-gray-300 shadow-sm hover:from-ice-gray-200 hover:to-ice-gray-300 hover:shadow-md focus-visible:ring-ice-gray-400",

        audio: "bg-gradient-to-r from-winter-blue-900 to-winter-blue-800 text-warm-amber-100 shadow-lg hover:from-winter-blue-800 hover:to-winter-blue-900 hover:shadow-xl focus-visible:ring-warm-amber-400 border border-warm-amber-500/20",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5 has-[>svg]:px-2.5",
        default: "h-10 px-4 py-2 text-sm rounded-lg has-[>svg]:px-3",
        lg: "h-12 px-6 text-base rounded-lg has-[>svg]:px-5",
        xl: "h-14 px-8 text-lg rounded-xl has-[>svg]:px-6",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",
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

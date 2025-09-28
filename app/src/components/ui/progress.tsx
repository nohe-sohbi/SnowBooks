import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        // Default winter audio theme
        default: "bg-winter-blue-100 dark:bg-ice-gray-800",

        // Audio waveform style
        audio: "bg-ice-gray-200 dark:bg-ice-gray-700 shadow-inner",

        // Success variant
        success: "bg-green-100 dark:bg-green-900/20",

        // Warning variant
        warning: "bg-warm-amber-100 dark:bg-warm-amber-900/20",

        // Error variant
        error: "bg-red-100 dark:bg-red-900/20",
      },
      size: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
        xl: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        // Winter blue gradient
        default: "bg-gradient-to-r from-winter-blue-500 to-winter-blue-600 shadow-sm",

        // Audio waveform with animated gradient
        audio: "bg-gradient-to-r from-winter-blue-600 via-winter-blue-500 to-warm-amber-500 shadow-md relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-pulse",

        // Success gradient
        success: "bg-gradient-to-r from-green-500 to-green-600",

        // Warning gradient
        warning: "bg-gradient-to-r from-warm-amber-500 to-warm-amber-600",

        // Error gradient
        error: "bg-gradient-to-r from-red-500 to-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorClassName?: string
  indeterminate?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, variant, size, value, indicatorClassName, indeterminate = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        progressIndicatorVariants({ variant }),
        indeterminate && "animate-[indeterminate_2s_ease-in-out_infinite]",
        indicatorClassName
      )}
      style={{
        transform: indeterminate
          ? "translateX(-100%)"
          : `translateX(-${100 - (value || 0)}%)`
      }}
    />

    {/* Audio waveform effect overlay */}
    {variant === "audio" && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-end gap-0.5 opacity-30">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-white animate-waveform"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${1000 + Math.random() * 500}ms`
              }}
            />
          ))}
        </div>
      </div>
    )}
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants }

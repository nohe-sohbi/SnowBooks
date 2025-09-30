import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        // Progress ring
        ring: "relative",
        // Simple spinner
        spinner: "text-winter-blue-600",
      },
      size: {
        sm: "w-4 h-4 text-sm",
        default: "w-6 h-6 text-base",
        lg: "w-8 h-8 text-lg",
        xl: "w-12 h-12 text-xl",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "default",
    },
  }
)

interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  progress?: number // For ring variant
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, progress, ...props }, ref) => {
    if (variant === "ring") {
      const circumference = 2 * Math.PI * 16 // radius of 16
      const strokeDasharray = circumference
      const strokeDashoffset = circumference - (progress || 0) * circumference / 100

      return (
        <div
          ref={ref}
          className={cn(loadingVariants({ variant, size }), className)}
          {...props}
        >
          <svg
            className={cn(
              "transform -rotate-90",
              size === "sm" && "w-8 h-8",
              size === "default" && "w-12 h-12",
              size === "lg" && "w-16 h-16",
              size === "xl" && "w-20 h-20"
            )}
            viewBox="0 0 40 40"
          >
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgb(226 232 240)" // ice-gray-200
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="url(#winterGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={progress !== undefined ? strokeDashoffset : 0}
              className={progress === undefined ? "animate-spin" : "transition-all duration-300"}
            />
            <defs>
              <linearGradient id="winterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(30 58 138)" /> {/* winter-blue-900 */}
                <stop offset="50%" stopColor="rgb(59 130 246)" /> {/* winter-blue-500 */}
                <stop offset="100%" stopColor="rgb(245 158 11)" /> {/* warm-amber-500 */}
              </linearGradient>
            </defs>
          </svg>
        </div>
      )
    }

    // Default spinner
    return (
      <div
        ref={ref}
        className={cn(loadingVariants({ variant, size }), className)}
        {...props}
      >
        <Loader2 className="animate-spin text-winter-blue-600" />
      </div>
    )
  }
)
Loading.displayName = "Loading"

const ProgressRing = React.forwardRef<
  HTMLDivElement,
  Omit<LoadingProps, "variant"> & { progress?: number }
>(({ className, progress, ...props }, ref) => (
  <Loading
    ref={ref}
    variant="ring"
    progress={progress}
    className={className}
    {...props}
  />
))
ProgressRing.displayName = "ProgressRing"

export {
  Loading,
  ProgressRing,
  loadingVariants,
}

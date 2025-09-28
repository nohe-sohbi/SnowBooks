import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2, Settings } from "lucide-react"

import { cn } from "@/lib/utils"

const loadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        // Spinning snowflake loader
        snowflake: "text-winter-blue-500",
        
        // Audio waveform pulse animation
        waveform: "gap-0.5",
        
        // Progress ring with winter gradient
        ring: "relative",
        
        // Simple spinner
        spinner: "text-winter-blue-600",
        
        // Processing gear animation
        processing: "gap-2",
        
        // Dots animation
        dots: "gap-1",
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
    if (variant === "snowflake") {
      return (
        <div
          ref={ref}
          className={cn(loadingVariants({ variant, size }), className)}
          {...props}
        >
          <div className="animate-spin text-winter-blue-500">
            ❄️
          </div>
        </div>
      )
    }

    if (variant === "waveform") {
      return (
        <div
          ref={ref}
          className={cn(loadingVariants({ variant, size }), className)}
          {...props}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-winter-blue-500 rounded-full animate-waveform",
                size === "sm" && "w-0.5 h-2",
                size === "default" && "w-1 h-4",
                size === "lg" && "w-1.5 h-6",
                size === "xl" && "w-2 h-8"
              )}
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      )
    }

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

    if (variant === "processing") {
      return (
        <div
          ref={ref}
          className={cn(loadingVariants({ variant, size }), className)}
          {...props}
        >
          <Settings className="animate-spin text-winter-blue-600" />
          <div className="flex items-end gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-warm-amber-500 rounded-full animate-pulse",
                  size === "sm" && "w-0.5 h-1",
                  size === "default" && "w-1 h-2",
                  size === "lg" && "w-1.5 h-3",
                  size === "xl" && "w-2 h-4"
                )}
                style={{
                  animationDelay: `${i * 200}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    if (variant === "dots") {
      return (
        <div
          ref={ref}
          className={cn(loadingVariants({ variant, size }), className)}
          {...props}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-winter-blue-500 rounded-full animate-bounce",
                size === "sm" && "w-1 h-1",
                size === "default" && "w-1.5 h-1.5",
                size === "lg" && "w-2 h-2",
                size === "xl" && "w-3 h-3"
              )}
              style={{
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
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

// Specialized loading components for audio studio use
const AudioProcessingLoader = React.forwardRef<
  HTMLDivElement,
  Omit<LoadingProps, "variant">
>(({ className, ...props }, ref) => (
  <Loading
    ref={ref}
    variant="waveform"
    className={cn("text-winter-blue-600", className)}
    {...props}
  />
))
AudioProcessingLoader.displayName = "AudioProcessingLoader"

const SnowflakeLoader = React.forwardRef<
  HTMLDivElement,
  Omit<LoadingProps, "variant">
>(({ className, ...props }, ref) => (
  <Loading
    ref={ref}
    variant="snowflake"
    className={cn("text-winter-blue-500", className)}
    {...props}
  />
))
SnowflakeLoader.displayName = "SnowflakeLoader"

const ProcessingLoader = React.forwardRef<
  HTMLDivElement,
  Omit<LoadingProps, "variant">
>(({ className, ...props }, ref) => (
  <Loading
    ref={ref}
    variant="processing"
    className={cn("text-winter-blue-600", className)}
    {...props}
  />
))
ProcessingLoader.displayName = "ProcessingLoader"

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
  AudioProcessingLoader,
  SnowflakeLoader,
  ProcessingLoader,
  ProgressRing,
  loadingVariants,
}

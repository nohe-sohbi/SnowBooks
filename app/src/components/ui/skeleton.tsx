import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "animate-pulse rounded-md bg-gradient-to-r from-ice-gray-200 via-ice-gray-100 to-ice-gray-200 dark:from-ice-gray-800 dark:via-ice-gray-700 dark:to-ice-gray-800 relative overflow-hidden",
  {
    variants: {
      variant: {
        // Default skeleton with shimmer
        default: "bg-ice-gray-200 dark:bg-ice-gray-800",
        
        // Winter themed with blue tint
        winter: "bg-gradient-to-r from-winter-blue-100 via-ice-gray-100 to-winter-blue-100 dark:from-winter-blue-900 dark:via-ice-gray-800 dark:to-winter-blue-900",
        
        // Audio themed with waveform pattern
        audio: "bg-gradient-to-r from-winter-blue-200 via-warm-amber-100 to-winter-blue-200 dark:from-winter-blue-800 dark:via-warm-amber-900 dark:to-winter-blue-800",
        
        // Text skeleton
        text: "bg-ice-gray-300 dark:bg-ice-gray-700 rounded-sm",
        
        // Card skeleton
        card: "bg-gradient-to-br from-ice-gray-100 to-ice-gray-200 dark:from-ice-gray-800 dark:to-ice-gray-900 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  shimmer?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, shimmer = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        skeletonVariants({ variant }),
        shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:before:via-white/10",
        className
      )}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

// Predefined skeleton components for common use cases
const TextSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant"> & { lines?: number; width?: string }
>(({ className, lines = 1, width = "100%", ...props }, ref) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        ref={i === 0 ? ref : undefined}
        variant="text"
        className={cn("h-4", className)}
        style={{ width: i === lines - 1 ? "75%" : width }}
        {...props}
      />
    ))}
  </div>
))
TextSkeleton.displayName = "TextSkeleton"

const ButtonSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant">
>(({ className, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="default"
    className={cn("h-10 w-24 rounded-lg", className)}
    {...props}
  />
))
ButtonSkeleton.displayName = "ButtonSkeleton"

const CardSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant"> & { showHeader?: boolean; showFooter?: boolean }
>(({ className, showHeader = true, showFooter = false, ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="card"
    className={cn("p-6 rounded-xl", className)}
    {...props}
  >
    {showHeader && (
      <div className="space-y-3 mb-6">
        <Skeleton variant="text" className="h-6 w-3/4" shimmer={false} />
        <Skeleton variant="text" className="h-4 w-full" shimmer={false} />
        <Skeleton variant="text" className="h-4 w-2/3" shimmer={false} />
      </div>
    )}
    
    <div className="space-y-4">
      <Skeleton variant="default" className="h-32 w-full rounded-lg" shimmer={false} />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-full" shimmer={false} />
        <Skeleton variant="text" className="h-4 w-5/6" shimmer={false} />
      </div>
    </div>
    
    {showFooter && (
      <div className="flex justify-between items-center mt-6">
        <Skeleton variant="default" className="h-8 w-20 rounded-md" shimmer={false} />
        <Skeleton variant="default" className="h-8 w-16 rounded-md" shimmer={false} />
      </div>
    )}
  </Skeleton>
))
CardSkeleton.displayName = "CardSkeleton"

const ImageSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant"> & { aspectRatio?: string }
>(({ className, aspectRatio = "aspect-video", ...props }, ref) => (
  <Skeleton
    ref={ref}
    variant="default"
    className={cn("w-full rounded-lg", aspectRatio, className)}
    {...props}
  />
))
ImageSkeleton.displayName = "ImageSkeleton"

// Audio-specific skeleton components
const AudioWaveformSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-end gap-1 h-16", className)}
    {...props}
  >
    {Array.from({ length: 20 }).map((_, i) => (
      <Skeleton
        key={i}
        variant="audio"
        className="w-1 rounded-full"
        style={{
          height: `${Math.random() * 60 + 20}%`,
          animationDelay: `${i * 50}ms`,
        }}
        shimmer={false}
      />
    ))}
  </div>
))
AudioWaveformSkeleton.displayName = "AudioWaveformSkeleton"

const StepWizardSkeleton = React.forwardRef<
  HTMLDivElement,
  Omit<SkeletonProps, "variant"> & { steps?: number }
>(({ className, steps = 5, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-8", className)}
    {...props}
  >
    {/* Step indicators */}
    <div className="flex items-center justify-between">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <Skeleton variant="winter" className="w-12 h-12 rounded-full" shimmer={false} />
          {i < steps - 1 && (
            <Skeleton variant="default" className="h-0.5 w-16 mx-2 rounded-full" shimmer={false} />
          )}
        </div>
      ))}
    </div>
    
    {/* Step labels */}
    <div className="flex items-start justify-between">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex flex-col items-center text-center max-w-[140px] px-2">
          <Skeleton variant="text" className="h-4 w-16 mb-2" shimmer={false} />
          <Skeleton variant="text" className="h-3 w-20" shimmer={false} />
        </div>
      ))}
    </div>
    
    {/* Content area */}
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <Skeleton variant="winter" className="h-8 w-48 mx-auto rounded-lg" shimmer={false} />
        <Skeleton variant="text" className="h-4 w-96 mx-auto" shimmer={false} />
      </div>
      <CardSkeleton showHeader={false} />
    </div>
  </div>
))
StepWizardSkeleton.displayName = "StepWizardSkeleton"

export {
  Skeleton,
  TextSkeleton,
  ButtonSkeleton,
  CardSkeleton,
  ImageSkeleton,
  AudioWaveformSkeleton,
  StepWizardSkeleton,
  skeletonVariants,
}

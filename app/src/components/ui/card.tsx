import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border transition-all duration-200",
  {
    variants: {
      variant: {
        // Default winter audio theme
        default: "bg-white border-ice-gray-200 shadow-sm hover:shadow-md dark:bg-ice-gray-900 dark:border-ice-gray-700",
        
        // Elevated card with gradient
        elevated: "bg-gradient-to-br from-white to-ice-gray-50 border-ice-gray-200 shadow-lg hover:shadow-xl dark:from-ice-gray-900 dark:to-ice-gray-800 dark:border-ice-gray-600",
        
        // Audio studio themed card
        audio: "bg-gradient-to-br from-winter-blue-50 to-ice-gray-50 border-winter-blue-200 shadow-md hover:shadow-lg hover:border-winter-blue-300 dark:from-winter-blue-950 dark:to-ice-gray-900 dark:border-winter-blue-800",
        
        // Accent card with warm amber
        accent: "bg-gradient-to-br from-warm-amber-50 to-orange-50 border-warm-amber-200 shadow-md hover:shadow-lg hover:border-warm-amber-300 dark:from-warm-amber-950 dark:to-orange-950 dark:border-warm-amber-800",
        
        // Glass effect card
        glass: "bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/90 dark:bg-ice-gray-900/80 dark:border-ice-gray-700/50",
        
        // Interactive card
        interactive: "bg-white border-ice-gray-200 shadow-sm hover:shadow-lg hover:border-winter-blue-300 hover:-translate-y-1 cursor-pointer dark:bg-ice-gray-900 dark:border-ice-gray-700 dark:hover:border-winter-blue-600",
        
        // Outline only
        outline: "bg-transparent border-ice-gray-300 hover:bg-ice-gray-50 dark:border-ice-gray-600 dark:hover:bg-ice-gray-800/50",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-winter-blue-900 dark:text-ice-gray-100",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm text-ice-gray-600 dark:text-ice-gray-400 leading-relaxed",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Winter Audio Studio specific card variants
const AudioCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="audio"
      className={cn(
        "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-winter-blue-500/5 before:to-warm-amber-500/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        className
      )}
      {...props}
    />
  )
)
AudioCard.displayName = "AudioCard"

const ProcessingCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="elevated"
      className={cn(
        "relative overflow-hidden border-winter-blue-200 dark:border-winter-blue-700",
        "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-winter-blue-500 before:to-warm-amber-500",
        className
      )}
      {...props}
    />
  )
)
ProcessingCard.displayName = "ProcessingCard"

const StepCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="interactive"
      className={cn(
        "group relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-winter-blue-500/10 before:to-warm-amber-500/10 before:opacity-0 group-hover:before:opacity-100 before:transition-all before:duration-300",
        className
      )}
      {...props}
    />
  )
)
StepCard.displayName = "StepCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  AudioCard,
  ProcessingCard,
  StepCard,
  cardVariants,
}

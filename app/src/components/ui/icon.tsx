import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
// Local SVG icon component type to avoid depending on lucide-react's types
// Accepts standard SVG props and may optionally forward refs via props.ref
export type SvgIconLike = (props: React.SVGProps<SVGSVGElement>) => React.ReactElement | null

import { cn } from "@/lib/utils"

const iconVariants = cva(
  "inline-flex shrink-0 transition-colors duration-200",
  {
    variants: {
      variant: {
        // Default winter theme
        default: "text-ice-gray-600 dark:text-ice-gray-400",
        
        // Primary winter blue
        primary: "text-winter-blue-600 dark:text-winter-blue-400",
        
        // Secondary ice blue
        secondary: "text-winter-blue-500 dark:text-winter-blue-300",
        
        // Accent warm amber
        accent: "text-warm-amber-600 dark:text-warm-amber-400",
        
        // Success green
        success: "text-green-600 dark:text-green-400",
        
        // Warning amber
        warning: "text-warm-amber-600 dark:text-warm-amber-400",
        
        // Error red
        destructive: "text-red-600 dark:text-red-400",
        
        // Muted gray
        muted: "text-ice-gray-400 dark:text-ice-gray-500",
        
        // Interactive states
        interactive: "text-ice-gray-600 hover:text-winter-blue-600 dark:text-ice-gray-400 dark:hover:text-winter-blue-400",
        
        // Current/active state
        current: "text-winter-blue-700 dark:text-winter-blue-300",
      },
      size: {
        xs: "w-3 h-3", // 12px
        sm: "w-4 h-4", // 16px
        default: "w-5 h-5", // 20px
        lg: "w-6 h-6", // 24px
        xl: "w-8 h-8", // 32px
        "2xl": "w-10 h-10", // 40px
      },
      state: {
        default: "",
        hover: "hover:scale-110",
        active: "active:scale-95",
        disabled: "opacity-50 cursor-not-allowed",
        loading: "animate-spin",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
)

interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, "size">,
    VariantProps<typeof iconVariants> {
  icon: SvgIconLike
  label?: string
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, variant, size, state, icon: IconComponent, label, ...props }, ref) => (
    <IconComponent
      ref={ref}
      className={cn(iconVariants({ variant, size, state }), className)}
      aria-label={label}
      {...props}
    />
  )
)
Icon.displayName = "Icon"

// Predefined icon components for common use cases
type CommonIconProps = Omit<IconProps, "icon">;

// Audio Studio Icons
export const AudioIcon = React.forwardRef<SVGSVGElement, CommonIconProps>(
  (props, ref) => {
    const AudioWaveIcon: SvgIconLike = ({ className, ...iconProps }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...iconProps}
      >
        <path d="M2 10v4" />
        <path d="M6 6v12" />
        <path d="M10 3v18" />
        <path d="M14 8v8" />
        <path d="M18 5v14" />
        <path d="M22 10v4" />
      </svg>
    )
    return <Icon ref={ref} icon={AudioWaveIcon} variant="primary" {...props} />
  }
)
AudioIcon.displayName = "AudioIcon"

export const SnowflakeIcon = React.forwardRef<SVGSVGElement, CommonIconProps>(
  (props, ref) => {
    const SnowflakeIconSvg: SvgIconLike = ({ className, ...iconProps }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...iconProps}
      >
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="m17 5-5 5-5-5" />
        <path d="m17 19-5-5-5 5" />
        <path d="M2 12h20" />
        <path d="m5 7 5 5-5 5" />
        <path d="m19 7-5 5 5 5" />
      </svg>
    )
    return <Icon ref={ref} icon={SnowflakeIconSvg} variant="accent" {...props} />
  }
)
SnowflakeIcon.displayName = "SnowflakeIcon"

// Status Icons with predefined variants
export const SuccessIcon = React.forwardRef<SVGSVGElement, CommonIconProps>(
  ({ variant = "success", ...props }, ref) => {
    const CheckCircleIcon: SvgIconLike = ({ className, ...iconProps }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...iconProps}
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    )
    return <Icon ref={ref} icon={CheckCircleIcon} variant={variant} {...props} />
  }
)
SuccessIcon.displayName = "SuccessIcon"

export const ErrorIcon = React.forwardRef<SVGSVGElement, CommonIconProps>(
  ({ variant = "destructive", ...props }, ref) => {
    const AlertCircleIcon: SvgIconLike = ({ className, ...iconProps }) => (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...iconProps}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    )
    return <Icon ref={ref} icon={AlertCircleIcon} variant={variant} {...props} />
  }
)
ErrorIcon.displayName = "ErrorIcon"



export { Icon, iconVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        // Error alerts with red gradients and winter styling
        destructive: "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-900 shadow-sm [&>svg]:text-red-600 dark:border-red-800 dark:from-red-950 dark:to-red-900 dark:text-red-100 dark:[&>svg]:text-red-400",
        
        // Success alerts with green gradients
        success: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-sm [&>svg]:text-green-600 dark:border-green-800 dark:from-green-950 dark:to-emerald-950 dark:text-green-100 dark:[&>svg]:text-green-400",
        
        // Default winter theme
        default: "border-ice-gray-200 bg-gradient-to-r from-ice-gray-50 to-white text-ice-gray-900 shadow-sm [&>svg]:text-ice-gray-600 dark:border-ice-gray-700 dark:from-ice-gray-900 dark:to-ice-gray-800 dark:text-ice-gray-100 dark:[&>svg]:text-ice-gray-400",
      },
      size: {
        sm: "px-3 py-2 text-xs",
        default: "px-4 py-3 text-sm",
        lg: "px-6 py-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const getAlertIcon = (variant: string) => {
  switch (variant) {
    case "destructive":
      return AlertCircle
    case "success":
      return CheckCircle
    default:
      return Info
  }
}

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean
  onDismiss?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, size, dismissible = false, onDismiss, icon, children, ...props }, ref) => {
    const IconComponent = icon || getAlertIcon(variant || "default")
    
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant, size }), className)}
        {...props}
      >
        <IconComponent className="h-4 w-4" />
        <div className="flex-1">
          {children}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm leading-relaxed [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Specialized alert components for audio studio use
const ErrorAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, "variant"> & { title?: string; retry?: () => void }
>(({ className, title, retry, children, ...props }, ref) => (
  <Alert
    ref={ref}
    variant="destructive"
    className={cn("border-l-4 border-l-red-500", className)}
    {...props}
  >
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      {children}
      {retry && (
        <button
          onClick={retry}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 underline underline-offset-2 dark:text-red-300 dark:hover:text-red-200"
        >
          Try again
        </button>
      )}
    </AlertDescription>
  </Alert>
))
ErrorAlert.displayName = "ErrorAlert"

const SuccessAlert = React.forwardRef<
  HTMLDivElement,
  Omit<AlertProps, "variant"> & { title?: string }
>(({ className, title, children, ...props }, ref) => (
  <Alert
    ref={ref}
    variant="success"
    className={cn("border-l-4 border-l-green-500", className)}
    {...props}
  >
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>{children}</AlertDescription>
  </Alert>
))
SuccessAlert.displayName = "SuccessAlert"

export {
  Alert,
  AlertTitle,
  AlertDescription,
  ErrorAlert,
  SuccessAlert,
  alertVariants,
}

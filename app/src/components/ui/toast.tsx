import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-lg border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        // Default winter theme
        default: "border-ice-gray-200 bg-gradient-to-r from-white to-ice-gray-50 text-ice-gray-900 shadow-md dark:border-ice-gray-700 dark:from-ice-gray-900 dark:to-ice-gray-800 dark:text-ice-gray-100",
        
        // Success with green gradient
        success: "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-md dark:border-green-800 dark:from-green-950 dark:to-emerald-950 dark:text-green-100",
        
        // Error with red gradient
        destructive: "border-red-200 bg-gradient-to-r from-red-50 to-red-100 text-red-900 shadow-md dark:border-red-800 dark:from-red-950 dark:to-red-900 dark:text-red-100",
        
        // Warning with warm amber
        warning: "border-warm-amber-200 bg-gradient-to-r from-warm-amber-50 to-orange-50 text-warm-amber-900 shadow-md dark:border-warm-amber-800 dark:from-warm-amber-950 dark:to-orange-950 dark:text-warm-amber-100",
        
        // Info with winter blue
        info: "border-winter-blue-200 bg-gradient-to-r from-winter-blue-50 to-ice-gray-50 text-winter-blue-900 shadow-md dark:border-winter-blue-800 dark:from-winter-blue-950 dark:to-ice-gray-950 dark:text-winter-blue-100",
        
        // Audio processing theme
        audio: "border-winter-blue-300 bg-gradient-to-r from-winter-blue-100 to-warm-amber-50 text-winter-blue-900 shadow-lg dark:border-winter-blue-700 dark:from-winter-blue-900 dark:to-warm-amber-950 dark:text-winter-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const getToastIcon = (variant: string) => {
  switch (variant) {
    case "success":
      return CheckCircle
    case "destructive":
      return AlertCircle
    case "warning":
      return AlertTriangle
    case "info":
    case "audio":
      return Info
    default:
      return Info
  }
}

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  duration?: number
  icon?: React.ComponentType<{ className?: string }>
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, action, onClose, icon, children, ...props }, ref) => {
    const IconComponent = icon || getToastIcon(variant || "default")
    
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start space-x-3">
          <IconComponent className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold leading-none">{title}</div>
            )}
            {description && (
              <div className="text-sm opacity-90 leading-relaxed">{description}</div>
            )}
            {children}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {action}
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close toast"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Toast.displayName = "Toast"

// Toast Provider Context
interface ToastContextType {
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, "id">) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastType extends ToastProps {
  id: string
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([])

  const addToast = React.useCallback((toast: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts)
      return updated
    })

    // Auto-remove toast after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }
  }, [maxToasts])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastType[]
  onRemove: (id: string) => void
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(({ id, onClose, ...toast }) => (
        <Toast
          key={id}
          {...toast}
          onClose={() => {
            onClose?.()
            onRemove(id)
          }}
          className="mb-2 last:mb-0"
        />
      ))}
    </div>
  )
}

// Specialized toast functions
export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastProps>) => ({
    variant: "success" as const,
    title,
    description,
    ...options,
  }),
  
  error: (title: string, description?: string, options?: Partial<ToastProps>) => ({
    variant: "destructive" as const,
    title,
    description,
    ...options,
  }),
  
  warning: (title: string, description?: string, options?: Partial<ToastProps>) => ({
    variant: "warning" as const,
    title,
    description,
    ...options,
  }),
  
  info: (title: string, description?: string, options?: Partial<ToastProps>) => ({
    variant: "info" as const,
    title,
    description,
    ...options,
  }),
  
  audio: (title: string, description?: string, options?: Partial<ToastProps>) => ({
    variant: "audio" as const,
    title,
    description,
    ...options,
  }),
}

// Audio processing specific toasts
export const audioToast = {
  processingStarted: (fileName?: string) => toast.audio(
    "Processing Started",
    fileName ? `Processing "${fileName}"...` : "Audio processing has begun...",
    { duration: 3000 }
  ),
  
  processingComplete: (fileName?: string) => toast.success(
    "Processing Complete",
    fileName ? `"${fileName}" has been processed successfully.` : "Audio processing completed successfully.",
    { duration: 5000 }
  ),
  
  processingError: (error?: string, onRetry?: () => void) => toast.error(
    "Processing Failed",
    error || "An error occurred during audio processing.",
    {
      duration: 0, // Don't auto-dismiss errors
      action: onRetry ? (
        <button
          onClick={onRetry}
          className="text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      ) : undefined,
    }
  ),
  
  uploadSuccess: (fileName: string) => toast.success(
    "Upload Complete",
    `"${fileName}" uploaded successfully.`,
    { duration: 3000 }
  ),
  
  uploadError: (fileName?: string, onRetry?: () => void) => toast.error(
    "Upload Failed",
    fileName ? `Failed to upload "${fileName}".` : "File upload failed.",
    {
      duration: 0,
      action: onRetry ? (
        <button
          onClick={onRetry}
          className="text-xs font-medium underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      ) : undefined,
    }
  ),
}

export { Toast, ToastProvider, toastVariants }

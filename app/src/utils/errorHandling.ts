// Error handling utilities for memory and performance issues
import { globalMemoryManager } from './memoryManager';

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackStrategy?: 'reduce-quality' | 'process-fewer' | 'abort';
  onRetry?: (attempt: number, error: Error) => void;
  onFallback?: (strategy: string) => void;
}

export class MemoryError extends Error {
  constructor(message: string, public memoryUsage?: number) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class ProcessingError extends Error {
  constructor(message: string, public fileName?: string) {
    super(message);
    this.name = 'ProcessingError';
  }
}

/**
 * Retry an operation with memory-aware error handling
 */
export async function retryWithMemoryHandling<T>(
  operation: () => Promise<T>,
  options: ErrorRecoveryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    fallbackStrategy = 'abort',
    onRetry,
    onFallback
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check memory before each attempt
      const memoryInfo = globalMemoryManager.getMemoryInfo();
      if (memoryInfo && memoryInfo.percentage > 90) {
        throw new MemoryError(`Critical memory usage: ${memoryInfo.percentage}%`, memoryInfo.used);
      }
      
      return await operation();
      
    } catch (error) {
      lastError = error as Error;
      
      // Handle memory-specific errors
      if (error instanceof MemoryError || isMemoryRelatedError(error)) {
        console.warn(`Memory error on attempt ${attempt}:`, error.message);
        
        // Perform emergency cleanup
        await globalMemoryManager.performEmergencyCleanup();
        
        // Wait longer for memory errors
        if (attempt < maxRetries) {
          onRetry?.(attempt, error as Error);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        // Apply fallback strategy if all retries failed
        return await applyFallbackStrategy(fallbackStrategy, error as Error, onFallback);
      }
      
      // Handle other errors with standard retry logic
      if (attempt < maxRetries) {
        onRetry?.(attempt, error as Error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is memory-related
 */
function isMemoryRelatedError(error: Error): boolean {
  const memoryKeywords = [
    'out of memory',
    'memory',
    'heap',
    'allocation failed',
    'cannot allocate',
    'insufficient memory'
  ];
  
  const message = error.message.toLowerCase();
  return memoryKeywords.some(keyword => message.includes(keyword));
}

/**
 * Apply fallback strategies when memory issues persist
 */
async function applyFallbackStrategy<T>(
  strategy: string,
  error: Error,
  onFallback?: (strategy: string) => void
): Promise<T> {
  onFallback?.(strategy);
  
  switch (strategy) {
    case 'reduce-quality':
      throw new Error(
        'Processing failed due to memory constraints. Try reducing the number of files or use smaller files.'
      );
      
    case 'process-fewer':
      throw new Error(
        'Processing failed due to memory constraints. Try processing fewer files at once (split into smaller batches).'
      );
      
    case 'abort':
    default:
      throw new Error(
        `Processing failed: ${error.message}. This may be due to insufficient memory. Try closing other applications and processing fewer files.`
      );
  }
}

/**
 * Wrap a function with comprehensive error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string = 'operation'
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      
      // Add context to error message
      if (error instanceof Error) {
        const contextualError = new Error(`${context} failed: ${error.message}`);
        contextualError.stack = error.stack;
        throw contextualError;
      }
      
      throw new Error(`${context} failed: ${String(error)}`);
    }
  };
}

/**
 * Create user-friendly error messages
 */
export function createUserFriendlyErrorMessage(error: Error): {
  title: string;
  message: string;
  suggestions: string[];
} {
  if (error instanceof MemoryError || isMemoryRelatedError(error)) {
    return {
      title: 'Memory Issue',
      message: 'The operation failed due to insufficient memory.',
      suggestions: [
        'Close other browser tabs and applications',
        'Process fewer files at once',
        'Try using smaller audio files',
        'Restart your browser to free up memory'
      ]
    };
  }
  
  if (error instanceof ProcessingError) {
    return {
      title: 'Processing Error',
      message: `Failed to process ${error.fileName || 'audio file'}.`,
      suggestions: [
        'Check that the file is a valid audio file',
        'Try processing the file individually',
        'Ensure the file is not corrupted'
      ]
    };
  }
  
  // Generic error handling
  if (error.message.includes('ZIP') || error.message.includes('zip')) {
    return {
      title: 'ZIP Creation Failed',
      message: 'Failed to create the ZIP file for download.',
      suggestions: [
        'Try downloading files individually',
        'Reduce the number of files being processed',
        'Check available disk space'
      ]
    };
  }
  
  return {
    title: 'Unexpected Error',
    message: error.message || 'An unexpected error occurred.',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ]
  };
}

/**
 * Monitor system resources and provide warnings
 */
export class ResourceMonitor {
  private warningThreshold = 80; // percentage
  private criticalThreshold = 90; // percentage
  
  constructor(
    private onWarning?: (usage: number) => void,
    private onCritical?: (usage: number) => void
  ) {}
  
  startMonitoring(intervalMs: number = 5000): () => void {
    const interval = setInterval(() => {
      const memoryInfo = globalMemoryManager.getMemoryInfo();
      if (!memoryInfo) return;
      
      if (memoryInfo.percentage >= this.criticalThreshold) {
        this.onCritical?.(memoryInfo.percentage);
      } else if (memoryInfo.percentage >= this.warningThreshold) {
        this.onWarning?.(memoryInfo.percentage);
      }
    }, intervalMs);
    
    return () => clearInterval(interval);
  }
}

/**
 * Utility to safely execute operations with automatic error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: string,
  options: ErrorRecoveryOptions = {}
): Promise<{ success: true; data: T } | { success: false; error: ReturnType<typeof createUserFriendlyErrorMessage> }> {
  try {
    const data = await retryWithMemoryHandling(operation, options);
    return { success: true, data };
  } catch (error) {
    const friendlyError = createUserFriendlyErrorMessage(error as Error);
    console.error(`Safe execution failed for ${context}:`, error);
    return { success: false, error: friendlyError };
  }
}

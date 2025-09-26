// Memory management utilities for audio processing and file operations
// Provides memory monitoring, cleanup, and pressure detection

export interface MemoryInfo {
  used: number; // MB
  total: number; // MB
  available: number; // MB
  percentage: number; // 0-100
}

export interface MemoryManagerOptions {
  warningThreshold?: number; // percentage (default: 80)
  criticalThreshold?: number; // percentage (default: 90)
  onWarning?: (info: MemoryInfo) => void;
  onCritical?: (info: MemoryInfo) => void;
  enableLogging?: boolean;
}

export class MemoryManager {
  private options: Required<MemoryManagerOptions>;
  private audioContexts: Set<AudioContext> = new Set();
  private cleanupTasks: Array<() => void> = [];

  constructor(options: MemoryManagerOptions = {}) {
    this.options = {
      warningThreshold: 80,
      criticalThreshold: 90,
      onWarning: () => {},
      onCritical: () => {},
      enableLogging: false,
      ...options
    };
  }

  /**
   * Get current memory information
   */
  getMemoryInfo(): MemoryInfo | null {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize / (1024 * 1024);
    const total = memory.totalJSHeapSize / (1024 * 1024);
    const limit = memory.jsHeapSizeLimit / (1024 * 1024);
    const percentage = (used / limit) * 100;

    return {
      used: Math.round(used * 100) / 100,
      total: Math.round(total * 100) / 100,
      available: Math.round((limit - used) * 100) / 100,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  /**
   * Check memory usage and trigger warnings if needed
   */
  checkMemoryPressure(): MemoryInfo | null {
    const info = this.getMemoryInfo();
    if (!info) return null;

    if (this.options.enableLogging) {
      console.log(`Memory usage: ${info.used}MB (${info.percentage}%)`);
    }

    if (info.percentage >= this.options.criticalThreshold) {
      this.options.onCritical(info);
      this.performEmergencyCleanup();
    } else if (info.percentage >= this.options.warningThreshold) {
      this.options.onWarning(info);
      this.performCleanup();
    }

    return info;
  }

  /**
   * Register an AudioContext for cleanup management
   */
  registerAudioContext(context: AudioContext): void {
    this.audioContexts.add(context);
  }

  /**
   * Clean up a specific AudioContext
   */
  async cleanupAudioContext(context: AudioContext): Promise<void> {
    try {
      if (context.state !== 'closed') {
        await context.close();
      }
      this.audioContexts.delete(context);
    } catch (error) {
      console.warn('Failed to close AudioContext:', error);
    }
  }

  /**
   * Clean up all registered AudioContexts
   */
  async cleanupAllAudioContexts(): Promise<void> {
    const contexts = Array.from(this.audioContexts);
    await Promise.all(contexts.map(context => this.cleanupAudioContext(context)));
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Perform standard cleanup
   */
  performCleanup(): void {
    // Run registered cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    });

    // Clear cleanup tasks
    this.cleanupTasks = [];

    // Suggest garbage collection
    this.suggestGarbageCollection();
  }

  /**
   * Perform emergency cleanup when memory is critically low
   */
  async performEmergencyCleanup(): Promise<void> {
    console.warn('Performing emergency memory cleanup');

    // Standard cleanup first
    this.performCleanup();

    // Close all AudioContexts
    await this.cleanupAllAudioContexts();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Suggest garbage collection (non-blocking)
   */
  suggestGarbageCollection(): void {
    if (window.gc) {
      // Use native GC asynchronously to avoid blocking
      setTimeout(() => window.gc(), 0);
    }
    // Remove the artificial memory pressure creation as it was causing performance issues
  }

  /**
   * Check if memory usage is safe for a large operation
   */
  isMemorySafeForOperation(estimatedSizeMB: number): boolean {
    const info = this.getMemoryInfo();
    if (!info) return true; // Assume safe if we can't check

    const projectedUsage = ((info.used + estimatedSizeMB) / (info.available + info.used)) * 100;
    return projectedUsage < this.options.warningThreshold;
  }

  /**
   * Wait for memory to be available (optimized with shorter intervals)
   */
  async waitForMemoryAvailable(requiredMB: number, timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    // Check immediately first
    if (this.isMemorySafeForOperation(requiredMB)) {
      return true;
    }

    // Perform one cleanup attempt
    this.performCleanup();

    // Wait a short time for cleanup to take effect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check again after cleanup
    return this.isMemorySafeForOperation(requiredMB);
  }
}

// Global memory manager instance
export const globalMemoryManager = new MemoryManager({
  enableLogging: process.env.NODE_ENV === 'development',
  onWarning: (info) => {
    console.warn(`Memory warning: ${info.percentage}% used (${info.used}MB)`);
  },
  onCritical: (info) => {
    console.error(`Critical memory usage: ${info.percentage}% used (${info.used}MB)`);
  }
});

/**
 * Utility function to create a memory-aware AudioContext
 */
export function createManagedAudioContext(): AudioContext {
  const context = new (window.AudioContext || (window as any).webkitAudioContext)();
  globalMemoryManager.registerAudioContext(context);
  return context;
}

/**
 * Utility function to safely process large operations with memory checks
 */
export async function withMemoryCheck<T>(
  operation: () => Promise<T>,
  estimatedSizeMB: number,
  operationName: string = 'operation'
): Promise<T> {
  // Check if we have enough memory
  if (!globalMemoryManager.isMemorySafeForOperation(estimatedSizeMB)) {
    throw new Error(`Insufficient memory for ${operationName}. Estimated: ${estimatedSizeMB}MB`);
  }

  try {
    const result = await operation();
    globalMemoryManager.checkMemoryPressure();
    return result;
  } catch (error) {
    // Cleanup on error
    globalMemoryManager.performCleanup();
    throw error;
  }
}

/**
 * Utility to monitor memory during a long-running operation
 */
export function createMemoryMonitor(intervalMs: number = 5000): () => void {
  const interval = setInterval(() => {
    globalMemoryManager.checkMemoryPressure();
  }, intervalMs);

  return () => clearInterval(interval);
}

// Add the missing createMemoryMonitor method to MemoryManager class
declare module './memoryManager' {
  interface MemoryManager {
    createMemoryMonitor(intervalMs?: number): () => void;
  }
}

// Extend the MemoryManager prototype
MemoryManager.prototype.createMemoryMonitor = function(intervalMs: number = 5000): () => void {
  const interval = setInterval(() => {
    this.checkMemoryPressure();
  }, intervalMs);

  return () => clearInterval(interval);
};

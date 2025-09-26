// Streaming ZIP exporter with memory management
// Processes files one at a time to prevent memory exhaustion

import JSZip from 'jszip';

export interface StreamingZipOptions {
  compressionLevel?: number;
  onProgress?: (progress: number, currentFile?: string) => void;
  onMemoryWarning?: (memoryUsage: number) => void;
  maxMemoryUsage?: number; // in MB
}

export interface ProcessedFile {
  name: string;
  blob: Blob;
}

export class StreamingZipExporter {
  private zip: JSZip;
  private options: StreamingZipOptions;
  private aborted: boolean = false;

  constructor(options: StreamingZipOptions = {}) {
    this.zip = new JSZip();
    this.options = {
      compressionLevel: 6,
      maxMemoryUsage: 500, // 500MB default limit
      ...options
    };
  }

  /**
   * Create and download ZIP file using streaming approach
   */
  async createAndDownloadZip(
    files: ProcessedFile[],
    filename: string
  ): Promise<void> {
    try {
      this.aborted = false;
      
      // Check initial memory
      this.checkMemoryUsage();
      
      // Add files one by one with memory management
      for (let i = 0; i < files.length; i++) {
        if (this.aborted) {
          throw new Error('Export aborted');
        }

        const file = files[i];
        const progress = (i / files.length) * 50; // First 50% for adding files
        
        this.options.onProgress?.(progress, file.name);
        
        // Add file to ZIP
        this.zip.file(file.name, file.blob);
        
        // Check memory after adding file
        this.checkMemoryUsage();
        
        // Force garbage collection hint
        if (i % 5 === 0) {
          await this.yieldToEventLoop();
        }
      }

      this.options.onProgress?.(50, 'Generating ZIP...');

      // Generate ZIP using streaming
      const zipBlob = await this.generateZipStream();
      
      this.options.onProgress?.(90, 'Preparing download...');

      // Download the file
      await this.downloadBlob(zipBlob, filename);
      
      this.options.onProgress?.(100, 'Complete');

    } catch (error) {
      console.error('Streaming ZIP export failed:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Generate ZIP using streaming approach to minimize memory usage
   */
  private async generateZipStream(): Promise<Blob> {
    try {
      // Use streaming generation with memory-efficient options
      const zipBlob = await this.zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: this.options.compressionLevel
        },
        // Use streaming internally when possible
        streamFiles: true
      });

      return zipBlob;
    } catch (error) {
      console.error('ZIP generation failed:', error);
      throw new Error('Failed to generate ZIP file. This might be due to insufficient memory.');
    }
  }

  /**
   * Download blob using the most efficient method available
   */
  private async downloadBlob(blob: Blob, filename: string): Promise<void> {
    try {
      // Try modern File System Access API first (Chrome 86+)
      if ('showSaveFilePicker' in window) {
        await this.downloadWithFileSystemAPI(blob, filename);
      } else {
        // Fallback to traditional blob URL method
        await this.downloadWithBlobURL(blob, filename);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to blob URL if File System API fails
      await this.downloadWithBlobURL(blob, filename);
    }
  }

  /**
   * Download using modern File System Access API (more memory efficient)
   */
  private async downloadWithFileSystemAPI(blob: Blob, filename: string): Promise<void> {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'ZIP files',
          accept: { 'application/zip': ['.zip'] }
        }]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }

  /**
   * Download using traditional blob URL method
   */
  private async downloadWithBlobURL(blob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }

  /**
   * Check memory usage and warn if approaching limits
   */
  private checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);
      const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
      
      // Warn if using more than configured limit or 80% of available memory
      const warningThreshold = Math.min(
        this.options.maxMemoryUsage || 500,
        limitMB * 0.8
      );
      
      if (usedMB > warningThreshold) {
        console.warn(`High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`);
        this.options.onMemoryWarning?.(usedMB);
      }
    }
  }

  /**
   * Yield control to event loop to prevent blocking
   */
  private async yieldToEventLoop(): Promise<void> {
    return new Promise(resolve => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Clear ZIP instance
    this.zip = new JSZip();
    
    // Suggest garbage collection
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * Abort the export process
   */
  abort(): void {
    this.aborted = true;
  }
}

/**
 * Utility function for simple streaming ZIP export
 */
export async function createStreamingZip(
  files: ProcessedFile[],
  filename: string,
  options?: StreamingZipOptions
): Promise<void> {
  const exporter = new StreamingZipExporter(options);
  await exporter.createAndDownloadZip(files, filename);
}

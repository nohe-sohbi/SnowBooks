// API service for communicating with SnowBooks NestJS backend
import { io, Socket } from 'socket.io-client';

// Types matching backend interfaces
export interface MP3FileInfo {
  name: string;
  size: number;
  duration?: number;
  path: string;
}

export interface JobData {
  id: string;
  originalZipName: string;
  mp3Files: MP3FileInfo[];
  whiteNoiseVolume: number;
  uploadPath: string;
  outputPath?: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  progress?: JobProgress;
  error?: string;
}

export interface JobProgress {
  currentFileIndex: number;
  currentFileName: string;
  fileProgress: number;
  totalProgress: number;
  estimatedTimeRemaining?: number;
  processedFiles: number;
  totalFiles: number;
}

// Plain const object (not a TS `enum`) so the file stays compatible with the
// `erasableSyntaxOnly` compiler option used by this project's bundler setup.
export const JobStatus = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export interface ProcessingConfig {
  whiteNoiseVolume: number;
  outputFormat?: 'mp3' | 'wav';
  quality?: 'low' | 'medium' | 'high';
}

export interface UploadResponse {
  jobId: string;
  originalZipName: string;
  fileCount: number;
  totalSize: number;
  status: string;
  createdAt: string;
}

export interface ProgressUpdate {
  jobId: string;
  progress: JobProgress;
  timestamp: string;
}

export interface JobCompletion {
  jobId: string;
  result: unknown;
  timestamp: string;
}

export interface JobError {
  jobId: string;
  error: string;
  timestamp: string;
}

class AudioProcessingAPI {
  private baseURL: string;
  private socket: Socket | null = null;
  private progressCallbacks = new Map<string, (progress: JobProgress) => void>();
  private completionCallbacks = new Map<string, (result: unknown) => void>();
  private errorCallbacks = new Map<string, (error: string) => void>();

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api';
  }

  // Upload ZIP file containing MP3s with automatic retry for network errors
  async uploadZip(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.attemptUpload(file, onProgress);
      } catch (err) {
        const isNetworkError = err instanceof Error && err.message.includes('Network error');
        const isTimeout = err instanceof Error && err.message.includes('timed out');
        const isRetryable = isNetworkError || isTimeout;

        if (!isRetryable || attempt === maxRetries) {
          throw err;
        }

        // Exponential backoff: 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Upload attempt ${attempt + 1} failed, retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Unreachable, but TypeScript needs it
    throw new Error('Upload failed after retries');
  }

  private attemptUpload(file: File, onProgress?: (percent: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const uploadURL = `${this.baseURL}/upload`;

    // Use XMLHttpRequest for upload progress tracking and better mobile support
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadURL);

      // 10 minute timeout for large files on mobile connections
      xhr.timeout = 600000;

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid server response'));
          }
        } else if (xhr.status === 0) {
          // Status 0 with onload is unusual but can indicate CORS or aborted request
          console.error('[Upload] Response with status 0 — likely CORS or connection issue', {
            url: uploadURL,
            readyState: xhr.readyState,
            responseText: xhr.responseText,
          });
          reject(new Error('Network error during upload. The server may be unreachable or blocking the request (CORS).'));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        // XHR onerror gives no detail — log everything we can to help diagnose
        const isCrossOrigin = !uploadURL.startsWith(window.location.origin);
        console.error('[Upload] XHR onerror fired', {
          url: uploadURL,
          origin: window.location.origin,
          isCrossOrigin,
          readyState: xhr.readyState,
          status: xhr.status,
          statusText: xhr.statusText,
          responseType: xhr.responseType,
          fileSize: file.size,
          fileName: file.name,
        });

        if (isCrossOrigin) {
          reject(new Error(
            `Network error during upload. The API URL (${this.baseURL}) does not match the app origin (${window.location.origin}) — this is likely a CORS misconfiguration.`
          ));
        } else {
          reject(new Error('Network error during upload. Check your connection and try again.'));
        }
      };

      xhr.ontimeout = () => {
        console.error('[Upload] XHR timeout after 10 minutes', {
          url: uploadURL,
          fileSize: file.size,
          fileName: file.name,
        });
        reject(new Error('Upload timed out. Try with a smaller file or a faster connection.'));
      };

      console.info('[Upload] Starting upload', {
        url: uploadURL,
        origin: window.location.origin,
        fileSize: file.size,
        fileName: file.name,
      });

      xhr.send(formData);
    });
  }

  // Get job status and metadata
  async getJobStatus(jobId: string): Promise<JobData> {
    const response = await fetch(`${this.baseURL}/jobs/${jobId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get job status' }));
      throw new Error(error.message || 'Failed to get job status');
    }

    return response.json();
  }

  // Start processing job
  async startProcessing(jobId: string, config: ProcessingConfig): Promise<void> {
    const response = await fetch(`${this.baseURL}/jobs/${jobId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to start processing' }));
      throw new Error(error.message || 'Failed to start processing');
    }
  }

  // Cancel job
  async cancelJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to cancel job' }));
      throw new Error(error.message || 'Failed to cancel job');
    }
  }

  // Delete job and cleanup files
  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete job' }));
      throw new Error(error.message || 'Failed to delete job');
    }
  }

  // Download processed ZIP file
  async downloadResult(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/download/${jobId}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || 'Download failed');
    }

    return response.blob();
  }

  // Get download file info
  async getDownloadInfo(jobId: string) {
    const response = await fetch(`${this.baseURL}/download/${jobId}/info`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get download info' }));
      throw new Error(error.message || 'Failed to get download info');
    }

    return response.json();
  }

  // WebSocket connection for real-time progress updates
  private connectWebSocket(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    const wsURL = import.meta.env.VITE_WS_URL || window.location.origin;
    this.socket = io(`${wsURL}/progress`, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to progress WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from progress WebSocket');
    });

    this.socket.on('progress-update', (data: ProgressUpdate) => {
      const callback = this.progressCallbacks.get(data.jobId);
      if (callback) {
        callback(data.progress);
      }
    });

    this.socket.on('job-completed', (data: JobCompletion) => {
      const callback = this.completionCallbacks.get(data.jobId);
      if (callback) {
        callback(data.result);
      }
    });

    this.socket.on('job-error', (data: JobError) => {
      const callback = this.errorCallbacks.get(data.jobId);
      if (callback) {
        callback(data.error);
      }
    });

    return this.socket;
  }

  // Subscribe to job progress updates
  subscribeToProgress(
    jobId: string,
    onProgress: (progress: JobProgress) => void,
    onCompletion?: (result: unknown) => void,
    onError?: (error: string) => void,
  ): () => void {
    const socket = this.connectWebSocket();

    // Store callbacks
    this.progressCallbacks.set(jobId, onProgress);
    if (onCompletion) {
      this.completionCallbacks.set(jobId, onCompletion);
    }
    if (onError) {
      this.errorCallbacks.set(jobId, onError);
    }

    // Subscribe to job updates
    socket.emit('subscribe-to-job', { jobId });

    // Return unsubscribe function
    return () => {
      socket.emit('unsubscribe-from-job', { jobId });
      this.progressCallbacks.delete(jobId);
      this.completionCallbacks.delete(jobId);
      this.errorCallbacks.delete(jobId);
    };
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.progressCallbacks.clear();
    this.completionCallbacks.clear();
    this.errorCallbacks.clear();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const audioProcessingAPI = new AudioProcessingAPI();
export default audioProcessingAPI;

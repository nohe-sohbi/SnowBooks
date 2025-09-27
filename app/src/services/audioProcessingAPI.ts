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

export enum JobStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

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
  result: any;
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
  private completionCallbacks = new Map<string, (result: any) => void>();
  private errorCallbacks = new Map<string, (error: string) => void>();

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  // Upload ZIP file containing MP3s
  async uploadZip(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
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

    const wsURL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
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
    onCompletion?: (result: any) => void,
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
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const audioProcessingAPI = new AudioProcessingAPI();
export default audioProcessingAPI;

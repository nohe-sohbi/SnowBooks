export interface MP3FileInfo {
  name: string;
  size: number;
  duration?: number;
  path: string;
  // 'audio' (mixed + re-encoded) or 'video' (stream copied, audio track mixed).
  type?: 'audio' | 'video';
}

export interface JobData {
  id: string;
  originalZipName: string;
  mp3Files: MP3FileInfo[];
  whiteNoiseVolume: number;
  uploadPath: string;
  outputPath?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  progress?: JobProgress;
  error?: string;
  // True when the upload was a ZIP/RAR archive. A single direct media file
  // (e.g. a film) is downloaded as-is instead of being re-zipped.
  isArchive?: boolean;
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

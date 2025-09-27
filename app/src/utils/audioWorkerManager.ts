// Audio Worker Manager for non-blocking audio processing
import type { 
  WorkerMessage, 
  WorkerResponse, 
  ProcessAudioMessage,
  ProgressMessage,
  CompleteMessage,
  ErrorMessage 
} from '../workers/audioProcessor.worker';

interface ProcessingTask {
  fileName: string;
  resolve: (buffer: ArrayBuffer) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

class AudioWorkerManager {
  private static instance: AudioWorkerManager;
  private worker: Worker | null = null;
  private currentTask: ProcessingTask | null = null;
  private isInitialized = false;

  static getInstance(): AudioWorkerManager {
    if (!AudioWorkerManager.instance) {
      AudioWorkerManager.instance = new AudioWorkerManager();
    }
    return AudioWorkerManager.instance;
  }

  private async initializeWorker(): Promise<void> {
    if (this.isInitialized && this.worker) return;

    try {
      // Create worker from the TypeScript file
      // Note: In production, you'd need to build the worker separately
      const workerUrl = new URL('../workers/audioProcessor.worker.ts', import.meta.url);
      this.worker = new Worker(workerUrl, { type: 'module' });
      
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        if (this.currentTask) {
          this.currentTask.reject(new Error('Worker error occurred'));
          this.currentTask = null;
        }
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio worker:', error);
      throw new Error('Audio worker initialization failed');
    }
  }

  private handleWorkerMessage(message: WorkerResponse): void {
    if (!this.currentTask) return;

    switch (message.type) {
      case 'PROGRESS':
        if (this.currentTask.onProgress) {
          this.currentTask.onProgress(message.progress);
        }
        break;

      case 'COMPLETE':
        this.currentTask.resolve(message.audioBuffer);
        this.currentTask = null;
        break;

      case 'ERROR':
        this.currentTask.reject(new Error(message.error));
        this.currentTask = null;
        break;
    }
  }

  async processAudio(
    mp3Buffer: ArrayBuffer,
    whiteNoiseBuffer: ArrayBuffer,
    whiteNoiseVolume: number,
    fileName: string,
    sampleRate: number,
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    await this.initializeWorker();

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (this.currentTask) {
      throw new Error('Another processing task is already running');
    }

    return new Promise<ArrayBuffer>((resolve, reject) => {
      this.currentTask = {
        fileName,
        resolve,
        reject,
        onProgress
      };

      const message: ProcessAudioMessage = {
        type: 'PROCESS_AUDIO',
        mp3Buffer,
        whiteNoiseBuffer,
        whiteNoiseVolume,
        fileName,
        sampleRate
      };

      this.worker!.postMessage(message);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
    
    if (this.currentTask) {
      this.currentTask.reject(new Error('Worker terminated'));
      this.currentTask = null;
    }
  }
}

// Export singleton instance
export const audioWorkerManager = AudioWorkerManager.getInstance();

// Utility function for easy access
export const processAudioWithWorker = async (
  mp3Blob: Blob,
  whiteNoiseBlob: Blob,
  whiteNoiseVolume: number,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  try {
    // Convert blobs to array buffers
    const [mp3Buffer, whiteNoiseBuffer] = await Promise.all([
      mp3Blob.arrayBuffer(),
      whiteNoiseBlob.arrayBuffer()
    ]);

    // Process in worker
    const processedBuffer = await audioWorkerManager.processAudio(
      mp3Buffer,
      whiteNoiseBuffer,
      whiteNoiseVolume,
      fileName,
      44100, // Default sample rate
      onProgress
    );

    // Convert back to blob
    return new Blob([processedBuffer], { type: 'audio/mpeg' });
    
  } catch (error) {
    console.error('Worker processing failed:', error);
    throw error;
  }
};

// Cleanup function
export const cleanupAudioWorker = (): void => {
  audioWorkerManager.terminate();
};
